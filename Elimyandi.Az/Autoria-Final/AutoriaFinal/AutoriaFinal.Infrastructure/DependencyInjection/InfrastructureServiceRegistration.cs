using AutoriaFinal.Contract.Services;
using AutoriaFinal.Contract.Services.Email;
using AutoriaFinal.Contract.Services.Token;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Infrastructure.Services;
using AutoriaFinal.Infrastructure.Services.Email;
using AutoriaFinal.Infrastructure.Services.Token;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Infrastructure.DependencyInjection
{
    public static class InfrastructureServiceRegistration
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            return services;
        }
    }
}
