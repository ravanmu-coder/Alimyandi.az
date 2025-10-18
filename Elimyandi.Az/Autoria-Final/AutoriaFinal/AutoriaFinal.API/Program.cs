using AutoriaFinal.Application.Extensions;
using AutoriaFinal.Application.Profiles;
using AutoriaFinal.Domain.Entities.Identity;
using AutoriaFinal.Infrastructure.DependencyInjection;
using AutoriaFinal.Persistence.Data;
using AutoriaFinal.Persistence.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.Tasks;
using Serilog;
using AutoriaFinal.API.ExceptionHandler;
using AutoriaFinal.Infrastructure.Services.Token;
using AutoriaFinal.Infrastructure.Services.Email;
using Microsoft.AspNetCore.Http.Features;
using AutoriaFinal.Infrastructure.Hubs;
using AutoriaFinal.Domain.Entities.Options;
using AutoriaFinal.Infrastructure.Services;
using AutoriaFinal.Infrastructure.Services.AiServices.InitialEstimate;
using System;
using Microsoft.AspNetCore.Authentication.Google;
using AutoriaFinal.Infrastructure.Services.Background;

namespace AutoriaFinal.API
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Read environment variables too
            builder.Configuration.AddEnvironmentVariables();

            // ✅ CORS - DEVELOPMENT ÜÇÜN TAM AÇIQ
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.SetIsOriginAllowed(origin => true) // İstənilən origin-ə icazə
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            // ✅ Controllers
            builder.Services.AddControllers();

            // ✅ SignalR - JWT dəstəyi ilə
            builder.Services.AddSignalR(options =>
            {
                options.EnableDetailedErrors = true;
            });

            // ✅ AutoMapper
            builder.Services.AddAutoMapper(opt =>
            {
                opt.AddProfile(new CustomProfile());
            });

            // ✅ Serilog
            builder.Host.UseSerilog((context, configuration) =>
            {
                configuration
                    .ReadFrom.Configuration(context.Configuration)
                    .WriteTo.Console()
                    .WriteTo.File(
                        path: Path.Combine(Directory.GetCurrentDirectory(), "logs", "log-.txt"),
                        rollingInterval: RollingInterval.Day,
                        shared: true,
                        retainedFileCountLimit: 30
                    );
            });

            // ✅ Exception Handlers
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddExceptionHandler<AppExceptionHandler>();
            builder.Services.AddExceptionHandler<BadRequestExceptionHandler>();
            builder.Services.AddExceptionHandler<NotFoundExceptionHandler>();
            builder.Services.AddExceptionHandler<ConflictExceptionHandler>();
            builder.Services.AddExceptionHandler<UnauthorizedExceptionHandler>();

            // ✅ DbContext
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("AutoriaDbContext")));

            // ✅ Repository & Application services
            builder.Services.AddRepositoriesRegistration();
            builder.Services.AddServiceRegistration();

            // --- ADD GEMINI REST DI ---
            builder.Services.AddHttpClient<RestGeminiClient>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("AutoriaFinal/1.0 (GeminiDevApiClient)");
            });

            builder.Services.AddSingleton<GeminiVehicleValuationServiceRest>();


            // ✅ Multipart limits
            builder.Services.Configure<FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = 1024L * 1024L * 1024L; // 1 GB
            });

            // ✅ Email Service
            builder.Services.Configure<EmailSettings>(
                builder.Configuration.GetSection("Email"));
            builder.Services.AddInfrastructureServices();
            
            builder.Services.Configure<AuctionSchedulerOptions>(
    builder.Configuration.GetSection("AuctionScheduler"));

            // Register the background scheduler service (it will start with the app)
            builder.Services.AddHostedService<AuctionSchedulerService>();
            builder.Services.AddHostedService<AuctionTimerBackgroundService>();

            builder.Services.AddLogging(logging =>
            {
                if (builder.Environment.IsDevelopment())
                {
                    logging.AddConsole(options =>
                    {
                        options.IncludeScopes = true;
                        options.TimestampFormat = "yyyy-MM-dd HH:mm:ss.fff ";
                    });
                }
            });

            // ✅ Identity
            builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = false;
                options.Lockout.AllowedForNewUsers = false;
                options.Tokens.PasswordResetTokenProvider = "CustomPasswordReset";
                options.Tokens.EmailConfirmationTokenProvider = "CustomEmailConfirmation";
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders()
            .AddTokenProvider<CustomPasswordResetTokenProvider>("CustomPasswordReset")
            .AddTokenProvider<CustomEmailConfirmationTokenProvider>("CustomEmailConfirmation");

            // ✅ JWT Authentication
            var jwtSettings = builder.Configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false; // Development üçün
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    RequireExpirationTime = true
                };

                // ✅ SignalR üçün JWT dəstəyi
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) &&
                            (path.StartsWithSegments("/auctionHub") || path.StartsWithSegments("/bidHub")))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
            // ✅ SignalR - Enhanced configuration
            builder.Services.AddSignalR(options =>
            {
                options.EnableDetailedErrors = true;
                options.KeepAliveInterval = TimeSpan.FromSeconds(15);
                options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
                options.HandshakeTimeout = TimeSpan.FromSeconds(15);
                options.MaximumReceiveMessageSize = 32768;
            });
            // ✅ Authorization
            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
                options.AddPolicy("RequireSellerRole", policy => policy.RequireRole("Seller", "Admin"));
                options.AddPolicy("RequireAuctionManagerRole", policy => policy.RequireRole("AuctionManager", "Admin"));
            });

            // ✅ Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Autoria Auction API",
                    Version = "v1",
                    Description = "API for auction management system"
                });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme.",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            // ✅ Database initialization
            using (var scope = app.Services.CreateScope())
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                await RoleSeeder.SeedRolesAsync(roleManager);
                await RoleSeeder.AssignUserToRoleAsync(userManager, "9f8bbe66-5499-4790-8e3e-011a4cbda67d", "Admin");
                await RoleSeeder.AssignUserToRoleAsync(userManager, "9f8bbe66-5499-4790-8e3e-011a4cbda67d", "Seller");
            }

            // ✅ Exception Handling
            app.UseExceptionHandler(_ => { });

            // ✅ Development pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Autoria Auction API v1");
                    c.RoutePrefix = string.Empty;
                });
            }

            // ✅ MIDDLEWARE ORDER - ÇOX VACİBDİR!
            // 1. CORS - ən əvvəldə
            app.UseCors();

            // 2. HTTPS Redirection (development-də disabled)
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            // 3. Static Files
            app.UseStaticFiles();

            // 4. Routing
            app.UseRouting();

            // 5. Authentication
            app.UseAuthentication();

            // 6. Authorization
            app.UseAuthorization();

            // 7. Controllers
            app.MapControllers();

            // ✅ SignalR Hubs
            app.MapHub<AuctionHub>("/auctionHub");
            app.MapHub<BidHub>("/bidHub");

            // ✅ Health Check endpoint
            app.MapGet("/health", () => Results.Ok(new
            {
                Status = "✅ Healthy",
                Timestamp = DateTime.UtcNow,
                Environment = app.Environment.EnvironmentName,
                Version = "1.0.0"
            }));

            // ✅ API Info endpoint
            app.MapGet("/api/info", () => Results.Ok(new
            {
                ApplicationName = "🏆 Autoria Auction API",
                Version = "1.0.0",
                Author = "ravanmu-coder",
                Timestamp = DateTime.UtcNow,
                CorsEnabled = true,
                Endpoints = new[] {
                    "GET /api/auction - Get all auctions",
                    "POST /api/auction - Create auction",
                    "GET /health - Health check",
                    "GET /auctionHub - SignalR Hub"
                }
            }));

            // ✅ Console mesajları
            var logger = app.Services.GetRequiredService<ILogger<Program>>();

            app.Lifetime.ApplicationStarted.Register(() =>
            {
                logger.LogInformation("🎯 === AUTORIA AUCTION API STARTED ===");
                logger.LogInformation("🌐 Swagger UI: https://localhost:7249");
                logger.LogInformation("📡 SignalR Hub: https://localhost:7249/auctionHub");
                logger.LogInformation("💚 Health Check: https://localhost:7249/health");
                logger.LogInformation("📊 API Info: https://localhost:7249/api/info");
                logger.LogInformation("🔓 CORS: Enabled for all origins (Development)");
                logger.LogInformation("👨‍💻 Developer: ravanmu-coder");
            });

            app.Run();
        }
    }
}
