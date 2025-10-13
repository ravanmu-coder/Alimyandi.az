using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Identity;
using AutoriaFinal.Contract.Dtos.Identity.Token;
using AutoriaFinal.Contract.Services.Email;
using AutoriaFinal.Contract.Services.Identity;
using AutoriaFinal.Contract.Services.Token;
using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace AutoriaFinal.Application.Services.Identity
{
    public class AuthService : IAuthService
    {
        #region FIELDS & CONSTRUCTOR
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IEmailService _emailService;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IEmailService emailService,
            ITokenService tokenService,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
            _tokenService = tokenService;
            _configuration = configuration;
            _logger = logger;
        }
        #endregion
        #region AUTHENTICATION OPERATIONS

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            _logger.LogInformation("🚀 Registration attempt for email: {Email} with role: {Role}", dto.Email, dto.Role);

            //  Email mövcudluq yoxlaması
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("❌ Registration failed: Email already exists - {Email}", dto.Email);
                throw new ConflictException($"Bu email artıq qeydiyyatda mövcuddur: {dto.Email}");
            }

            //  Username mövcudluq yoxlaması
            var existingUsername = await _userManager.FindByNameAsync(dto.UserName);
            if (existingUsername != null)
            {
                _logger.LogWarning("❌ Registration failed: Username already taken - {UserName}", dto.UserName);
                throw new ConflictException($"Bu istifadəçi adı artıq götürülüb: {dto.UserName}");
            }

            //  Yaş yoxlaması
            if (dto.DateOfBirth.HasValue && !dto.IsValidAge())
            {
                throw new BadRequestException("Qeydiyyat üçün minimum 18 yaş tələb olunur");
            }

            //  Rol etibarlılıq yoxlaması
            var availableRoles = await GetAvailableRolesAsync();
            if (!availableRoles.Contains(dto.Role))
            {
                _logger.LogWarning("❌ Invalid role selected during registration: {Role}", dto.Role);
                throw new BadRequestException($"Seçdiyiniz rol mövcud deyil: {dto.Role}. Mövcud rollar: {string.Join(", ", availableRoles)}");
            }

            //  Yeni istifadəçi yaratma
            var newUser = new ApplicationUser
            {
                UserName = dto.UserName,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = dto.Phone,
                DateOfBirth = dto.DateOfBirth,
                EmailConfirmed = false, // Email təsdiqi gözləyir
                IsActive = false, // Email təsdiq edilənə qədər deaktiv
                CreatedAt = DateTime.UtcNow,
                AllowMarketing = dto.AllowMarketing
            };

            //  İstifadəçi yaratma
            var createResult = await _userManager.CreateAsync(newUser, dto.Password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                _logger.LogError("❌ User creation failed for {Email}: {Errors}", dto.Email, errors);
                throw new BadRequestException($"İstifadəçi yaradılarkən xəta: {errors}");
            }

            //  Rol təyin etmə
            await EnsureRoleExistsAsync(dto.Role);
            var roleResult = await _userManager.AddToRoleAsync(newUser, dto.Role);
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(newUser);
                var roleErrors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
                _logger.LogError("❌ Role assignment failed, user deleted: {UserId}, Errors: {Errors}", newUser.Id, roleErrors);
                throw new BadRequestException($"Rol təyin edilərkən xəta, qeydiyyat ləğv edildi: {roleErrors}");
            }

            // Email təsdiqi göndər
            await SendEmailConfirmationAsync(newUser);

            _logger.LogInformation("✅ User registered successfully: {UserId} ({Email}) with role: {Role}",
                newUser.Id, newUser.Email, dto.Role);

            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = $"Qeydiyyat uğurludur! {dto.Email} ünvanına email təsdiqi göndərildi.",
                User = await MapToUserDtoAsync(newUser, new List<string> { dto.Role })
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            _logger.LogInformation("🔑 Login attempt for email: {Email}", dto.Email);

            // ✅ 1. USER TAPMA
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                _logger.LogWarning("❌ Login failed: User not found - {Email}", dto.Email);
                throw new UnauthorizedException("Email və ya parol səhvdir");
            }

            // ✅ 2. PAROL YOXLAMASI
            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid)
            {
                user.IncrementFailedLogin();
                await _userManager.UpdateAsync(user);

                _logger.LogWarning("❌ Login failed: Wrong password for user: {UserId}, Failed attempts: {FailedAttempts}",
                    user.Id, user.FailedLoginAttempts);

                // ✅ 5 səhv cəhd sonra hesab blok et
                if (user.FailedLoginAttempts >= 5)
                {
                    user.Deactivate();
                    await _userManager.UpdateAsync(user);
                    throw new UnauthorizedException("Çox səhv giriş cəhdi səbəbindən hesab bloklanıb. Administrator ilə əlaqə saxlayın.");
                }

                throw new UnauthorizedException("Email və ya parol səhvdir");
            }

            // ✅ 3. EMAIL TƏSDİQİ YOXLAMASI (DEVELOPMENT-də avtomatik təsdiqlə)
            if (!user.EmailConfirmed)
            {
                _logger.LogWarning("❌ Login failed: Email not confirmed - {UserId}", user.Id);

                // ✅ DEVELOPMENT environment-də avtomatik təsdiqlə
                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (environment == "Development")
                {
                    user.EmailConfirmed = true;
                    await _userManager.UpdateAsync(user);
                    _logger.LogInformation("🔧 DEV MODE: Auto-confirmed email for user: {UserId}", user.Id);
                }
                else
                {
                    throw new BadRequestException("Email təsdiqi tamamlanmamış. Email-nizi yoxlayıb təsdiqlə linkini kliklənyin.");
                }
            }

            // ✅ 4. HESAB AKTİVLİYİ YOXLAMASI (DEVELOPMENT-də avtomatik aktivləşdir)
            if (!user.IsActive)
            {
                _logger.LogWarning("❌ Login failed: Account inactive - {UserId}", user.Id);

                // ✅ DEVELOPMENT environment-də avtomatik aktivləşdir
                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (environment == "Development")
                {
                    user.Activate();
                    await _userManager.UpdateAsync(user);
                    _logger.LogInformation("🔧 DEV MODE: Auto-activated user: {UserId}", user.Id);
                }
                else
                {
                    throw new UnauthorizedException("Hesabınız deaktivdir. Administrator ilə əlaqə saxlayın.");
                }
            }

            // ✅ 5. USER ROLES TAPMA VƏ DEFAULT ROL TƏYİN ETMƏ
            var userRoles = await _userManager.GetRolesAsync(user);
            if (!userRoles.Any())
            {
                // Default rol əlavə et
                await _userManager.AddToRoleAsync(user, "Member");
                userRoles = await _userManager.GetRolesAsync(user);
                _logger.LogInformation("✅ Default 'Member' role assigned to: {UserId}", user.Id);
            }

            // ✅ 6. JWT TOKEN GENERASIYASI
            var tokenResult = await GenerateJwtTokenAsync(user, userRoles);
            var token = tokenResult.Token;
            var expiresAt = tokenResult.Expires;

            // ✅ 7. LOGIN STATISTICS YENİLƏNMƏSİ
            user.ResetFailedLogin();
            user.UpdateLastLogin();
            user.MarkAsUpdated("Login");
            await _userManager.UpdateAsync(user);

            // ✅ 8. SUCCESS LOGGING
            _logger.LogInformation("✅ LOGIN SUCCESS: {UserId} ({Email}) with roles: [{Roles}] at {LoginTime}",
                user.Id, user.Email, string.Join(", ", userRoles), DateTime.UtcNow);

            // ✅ 9. RESPONSE QAYTARMA
            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = $"Xoş gəlmisiniz, {user.FullName}! 🎉",
                Token = token,
                ExpiresAt = expiresAt,
                User = await MapToUserDtoAsync(user, userRoles.ToList()),
                LoginInfo = new LoginInfoDto
                {
                    LoginTime = DateTime.UtcNow,
                    ExpiresAt = expiresAt,
                    TokenType = "Bearer",
                    RemainingMinutes = (int)(expiresAt - DateTime.UtcNow).TotalMinutes,
                    Roles = userRoles.ToList(),
                    Permissions = GetUserPermissions(userRoles.ToList())
                }
            };
        }


        public async Task<AuthResponseDto> LogoutAsync(string userId)
        {
            _logger.LogInformation("🚪 Logout requested for user: {UserId}", userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            //  İstifadəçinin bütün token-lərini ləğv et
            var revokedCount = await _tokenService.RevokeAllUserTokensAsync(userId);

            _logger.LogInformation("✅ User logged out successfully: {UserId}, Revoked tokens: {RevokedCount}", userId, revokedCount);

            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = $"Çıxış uğurludur. {revokedCount} aktiv token ləğv edildi."
            };
        }
        #endregion

        #region EMAIL CONFIRMATION
        public async Task<bool> ConfirmEmailAsync(string userId, string token)
        {
            _logger.LogInformation("📧 Email confirmation attempt for user: {UserId}", userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("❌ Email confirmation failed: User not found - {UserId}", userId);
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            if (user.EmailConfirmed)
            {
                _logger.LogInformation("ℹ️ Email already confirmed for user: {UserId}", userId);
                return true;
            }

            // ✅ CUSTOM EMAIL CONFIRMATION TOKEN PROVIDER İLƏ VALIDATE ET
            var isTokenValid = await _userManager.VerifyUserTokenAsync(
                user,
                "CustomEmailConfirmation",  // Custom provider name
                "EmailConfirmation",        // Purpose  
                token                      // Raw token (no decoding needed)
            );

            if (!isTokenValid)
            {
                _logger.LogWarning("❌ Invalid email confirmation token for user: {UserId}", userId);

                // ✅ FALLBACK - TRADITIONAL METHOD TRY ET
                _logger.LogInformation("🔄 Trying fallback email confirmation methods for user: {UserId}", userId);

                var tokenStrategies = new[]
                {
            token, // Original token
            HttpUtility.UrlDecode(token), // Single decode
            HttpUtility.UrlDecode(HttpUtility.UrlDecode(token)), // Double decode
            Uri.UnescapeDataString(token), // Alternative decode
            token.Replace(' ', '+') // Space to + replacement
        };

                IdentityResult? result = null;
                string? successfulToken = null;

                foreach (var (tokenStrategy, index) in tokenStrategies.Select((t, i) => (t, i)))
                {
                    try
                    {
                        _logger.LogDebug("Trying email confirmation strategy {Index}: {TokenPreview}",
                            index, tokenStrategy?.Length > 20 ? tokenStrategy[..20] + "..." : tokenStrategy);

                        result = await _userManager.ConfirmEmailAsync(user, tokenStrategy);

                        if (result.Succeeded)
                        {
                            successfulToken = tokenStrategy;
                            _logger.LogInformation("✅ Email confirmation strategy {Index} SUCCESS", index);
                            break;
                        }
                        else
                        {
                            _logger.LogWarning("❌ Email confirmation strategy {Index} failed: {Errors}",
                                index, string.Join(", ", result.Errors.Select(e => e.Description)));
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Email confirmation strategy {Index} exception", index);
                    }
                }

                if (result == null || !result.Succeeded)
                {
                    var errors = result?.Errors?.Any() == true
                        ? string.Join("; ", result.Errors.Select(e => e.Description))
                        : "Token keçərsizdir";

                    _logger.LogError("❌ All email confirmation strategies failed for {UserId}: {Errors}", userId, errors);
                    throw new BadRequestException($"Email təsdiqi uğursuz: {errors}. Yeni təsdiqlə linki tələb edin.");
                }
            }
            if (isTokenValid)
            {
                user.EmailConfirmed = true;
            }

            // ✅ HESAB AKTİVLƏŞDİRMƏ
            user.Activate();
            user.MarkAsUpdated("EmailConfirmation");
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("✅ Email confirmed successfully for user: {UserId}", userId);

            return true;
        }

        public async Task<bool> ResendEmailConfirmationAsync(string email)
        {
            _logger.LogInformation("🔄 Resend email confirmation for: {Email}", email);

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("❌ Resend confirmation failed: User not found - {Email}", email);
                throw new BadRequestException($"İstifadəçi tapılmadı: {email}");
            }

            if (user.EmailConfirmed)
            {
                _logger.LogWarning("⚠️ Email already confirmed, resend not needed: {Email}", email);
                throw new BadRequestException("Email artıq təsdiqlənib");
            }

            await SendEmailConfirmationAsync(user);

            _logger.LogInformation("✅ Email confirmation resent to: {Email}", email);
            return true;
        }
        #endregion

        #region PASSWORD RESET

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            _logger.LogInformation("🔑 Password reset requested for: {Email}", dto.Email);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !user.EmailConfirmed)
            {
                _logger.LogWarning("⚠️ Password reset requested for non-existent/unconfirmed email: {Email}", dto.Email);
                return true;
            }

            // ✅ CUSTOM TOKEN PROVIDER İSTİFADƏ EDİN
            var resetToken = await _userManager.GenerateUserTokenAsync(
                user,
                "CustomPasswordReset",  // Custom provider name
                "ResetPassword"         // Purpose
            );

            _logger.LogInformation("✅ Custom token generated for {Email}: Length={Length}", dto.Email, resetToken.Length);

            // ✅ NO ADDITIONAL ENCODING - Token artıq URL safe-dir
            var baseUrl = _configuration["App:FrontendUrl"] ?? "http://localhost:5173";
            var callbackUrl = !string.IsNullOrEmpty(dto.CallbackUrl) ? dto.CallbackUrl : $"{baseUrl}/reset-password";

            var resetUrl = $"{callbackUrl}?email={Uri.EscapeDataString(dto.Email)}&token={resetToken}";

            var emailSubject = "Parol Sıfırlama - Autoria";
            var emailBody = GeneratePasswordResetEmailBody(user.FullName, resetUrl);

            await _emailService.SendEmailAsync(user.Email, emailSubject, emailBody);

            _logger.LogInformation("✅ Password reset email sent to: {Email}", dto.Email);
            return true;
        }

        public async Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto dto)
        {
            _logger.LogInformation("🔄 Password reset attempt for: {Email}", dto.Email);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                throw new NotFoundException("User", dto.Email);
            }

            // ✅ CUSTOM TOKEN PROVIDER İLE VALIDATE ET
            var isTokenValid = await _userManager.VerifyUserTokenAsync(
                user,
                "CustomPasswordReset",  // Custom provider name
                "ResetPassword",        // Purpose
                dto.Token              // Raw token (no decoding needed)
            );

            if (!isTokenValid)
            {
                _logger.LogWarning("❌ Invalid password reset token for user: {Email}", dto.Email);
                throw new BadRequestException("Parol sıfırlama linki köhnə və ya səhvdir. Yeni parol sıfırlama tələb edin.");
            }

            // ✅ MANUAL PASSWORD RESET (bypass token)
            var passwordHasher = new PasswordHasher<ApplicationUser>();
            user.PasswordHash = passwordHasher.HashPassword(user, dto.Password);
            user.SecurityStamp = Guid.NewGuid().ToString(); // ✅ Security stamp refresh

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {                
                var errors = string.Join("; ", updateResult.Errors.Select(e => e.Description));
                throw new BadRequestException($"Parol yenilənmə xətası: {errors}");
            }

            // ✅ UPDATE ADDITIONAL FIELDS
            user.PasswordChangedAt = DateTime.UtcNow;
            user.ResetFailedLogin();
            user.MarkAsUpdated("PasswordReset");
            await _userManager.UpdateAsync(user);

            // ✅ REVOKE ALL TOKENS
            await _tokenService.RevokeAllUserTokensAsync(user.Id);

            _logger.LogInformation("✅ Password reset successful for: {Email}", dto.Email);

            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = "Parol uğurla sıfırlandı. Təhlükəsizlik üçün bütün aktiv sessionlar sonlandırıldı."
            };
        }
        #endregion

        #region USER MANAGEMENT

        public async Task<UserDto?> GetUserProfileAsync(string userId)
        {
            _logger.LogDebug("👤 Getting profile for user: {UserId}", userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("❌ Profile request failed: User not found - {UserId}", userId);
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            var roles = await _userManager.GetRolesAsync(user);
            return await MapToUserDtoAsync(user, roles.ToList());
        }

        public async Task<bool> UpdateUserProfileAsync(string userId, UpdateUserDto dto)
        {
            _logger.LogInformation("✏️ Profile update request for user: {UserId}", userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("❌ Profile update failed: User not found - {UserId}", userId);
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            //  Update user properties
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.Phone;
            user.DateOfBirth = dto.DateOfBirth;
            user.ProfilePicture = dto.ProfilePicture;
            user.Bio = dto.Bio;
            user.City = dto.City;
            user.Country = dto.Country;
            user.MarkAsUpdated(userId);

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                _logger.LogError("❌ Profile update failed for {UserId}: {Errors}", userId, errors);
                throw new BadRequestException($"Profil yenilənməsi uğursuz: {errors}");
            }

            _logger.LogInformation("✅ Profile updated successfully for user: {UserId}", userId);
            return true;
        }

        public async Task<List<string>> GetAvailableRolesAsync()
        {
            _logger.LogDebug("📋 Getting available roles");

            var allRoles = await _roleManager.Roles
                .Where(r => r.Name != "SuperAdmin") // Hide SuperAdmin role
                .Select(r => r.Name)
                .ToListAsync();

            return allRoles.Where(r => !string.IsNullOrWhiteSpace(r)).ToList();
        }

        public async Task<bool> AssignRoleAsync(string userId, string role)
        {
            _logger.LogInformation("🔐 Assigning role {Role} to user: {UserId}", role, userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            await EnsureRoleExistsAsync(role);

            if (await _userManager.IsInRoleAsync(user, role))
            {
                _logger.LogInformation("ℹ️ User {UserId} already has role: {Role}", userId, role);
                return true; // Already has the role
            }

            var result = await _userManager.AddToRoleAsync(user, role);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"Rol təyin edilərkən xəta: {errors}");
            }

            _logger.LogInformation("✅ Role {Role} assigned to user: {UserId}", role, userId);
            return true;
        }

        public async Task<bool> RemoveRoleAsync(string userId, string role)
        {
            _logger.LogInformation("🗑️ Removing role {Role} from user: {UserId}", role, userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            if (!await _userManager.IsInRoleAsync(user, role))
            {
                _logger.LogInformation("ℹ️ User {UserId} doesn't have role: {Role}", userId, role);
                return true; // Doesn't have the role anyway
            }

            var result = await _userManager.RemoveFromRoleAsync(user, role);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"Rol silinərkən xəta: {errors}");
            }

            _logger.LogInformation("✅ Role {Role} removed from user: {UserId}", role, userId);
            return true;
        }
        #endregion

        #region TOKEN MANAGEMENT

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            _logger.LogInformation("🔄 Token refresh requested");
            throw new NotImplementedException("Refresh token funksionallığı hələ tətbiq edilməyib");
        }

        public async Task<bool> RevokeTokenAsync(string token)
        {
            _logger.LogInformation("🗑️ Token revocation requested");

            return await _tokenService.RevokeTokenAsync(token);
        }

        public async Task<bool> IsTokenValidAsync(string token)
        {
            return await _tokenService.ValidateTokenAsync(token);
        }

        public async Task<UserDto?> GetUserFromTokenAsync(string token)
        {
            var userId = await _tokenService.GetUserIdFromTokenAsync(token);
            return await GetUserProfileAsync(userId);
        }

        public async Task<TimeSpan?> GetTokenRemainingTimeAsync(string token)
        {
            return await _tokenService.GetTokenRemainingTimeAsync(token);
        }

        public async Task<bool> ShouldRefreshTokenAsync(string token)
        {
            var remainingTime = await GetTokenRemainingTimeAsync(token);

            if (remainingTime == null || remainingTime <= TimeSpan.Zero)
                return true; // Expired

            // Refresh if less than 30 minutes remaining
            return remainingTime < TimeSpan.FromMinutes(30);
        }
        #endregion

        #region ADMIN OPERATIONS

        public async Task<List<UserDto>> GetAllUsersAsync(int page = 1, int pageSize = 10)
        {
            _logger.LogInformation("📋 Getting users list - Page: {Page}, Size: {PageSize}", page, pageSize);

            var users = await _userManager.Users
                .Where(u => !u.IsDeleted)
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(await MapToUserDtoAsync(user, roles.ToList()));
            }

            return userDtos;
        }

        public async Task<List<UserDto>> SearchUsersAsync(string searchTerm)
        {
            _logger.LogInformation("🔍 Searching users with term: {SearchTerm}", searchTerm);

            if (string.IsNullOrWhiteSpace(searchTerm))
                return new List<UserDto>();

            var users = await _userManager.Users
                .Where(u => !u.IsDeleted && (
                    u.FirstName.Contains(searchTerm) ||
                    u.LastName.Contains(searchTerm) ||
                    u.Email.Contains(searchTerm) ||
                    u.UserName.Contains(searchTerm)
                ))
                .OrderBy(u => u.FirstName)
                .Take(50) // Limit results
                .ToListAsync();

            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(await MapToUserDtoAsync(user, roles.ToList()));
            }

            return userDtos;
        }

        public async Task<bool> ToggleUserStatusAsync(string userId, bool isActive)
        {
            _logger.LogInformation("🔄 Toggling user status: {UserId} -> {Status}", userId, isActive ? "Active" : "Inactive");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new BadRequestException($"İstifadəçi tapılmadı: {userId}");
            }

            if (isActive)
                user.Activate();
            else
                user.Deactivate();

            user.MarkAsUpdated("StatusToggle");
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"Status dəyişdirilərkən xəta: {errors}");
            }
            if (!isActive)
            {
                await _tokenService.RevokeAllUserTokensAsync(userId);
            }

            _logger.LogInformation("✅ User status changed: {UserId} -> {Status}", userId, isActive ? "Active" : "Inactive");
            return true;
        }
        #endregion

        #region PRIVATE HELPER METHODS

        private async Task<(string Token, DateTime Expires)> GenerateJwtTokenAsync(ApplicationUser user, IList<string> roles)
        {
            var expires = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpireMinutes"] ?? "1440"));

            var request = new TokenGenerationRequest
            {
                UserId = user.Id,
                Email = user.Email!,
                UserName = user.UserName ?? user.Email!.Split('@')[0],
                Role = roles.FirstOrDefault() ?? "User",
                Roles = roles.Where(r => !string.IsNullOrWhiteSpace(r)).ToList(),
                AdditionalClaims = new Dictionary<string, string>
                {
                    ["full_name"] = user.FullName,
                    ["email_confirmed"] = user.EmailConfirmed.ToString(),
                    ["is_active"] = user.IsActive.ToString()
                },
                IssuedAt = DateTime.UtcNow,
                ExpiresAt = expires
            };

            var tokenResult = await _tokenService.GenerateTokenAsync(request);
            return (tokenResult.Token, tokenResult.Expires);
        }

        private async Task EnsureRoleExistsAsync(string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var role = new ApplicationRole { Name = roleName };
                var result = await _roleManager.CreateAsync(role);

                if (result.Succeeded)
                {
                    _logger.LogInformation("✅ Role created: {RoleName}", roleName);
                }
                else
                {
                    var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                    _logger.LogError("❌ Role creation failed for {RoleName}: {Errors}", roleName, errors);
                }
            }
        }

        private async Task SendEmailConfirmationAsync(ApplicationUser user)
        {
            // ✅ CUSTOM EMAIL CONFIRMATION TOKEN PROVIDER İSTİFADƏ EDİN
            var token = await _userManager.GenerateUserTokenAsync(
                user,
                "CustomEmailConfirmation",  // Custom provider name
                "EmailConfirmation"         // Purpose
            );

            _logger.LogDebug("Email confirmation token generated for {Email}: Length={Length}",
                user.Email, token.Length);

            var baseUrl = _configuration["App:BaseUrl"];
            var frontendUrl = _configuration["App:FrontendUrl"] ?? "http://localhost:3000";

            // ✅ NO ADDITIONAL ENCODING - Token artıq URL safe-dir
            var confirmUrl = $"{baseUrl}/api/auth/confirmemail?userId={user.Id}&token={token}&redirect={Uri.EscapeDataString(frontendUrl + "/email-confirmed")}";

            var emailSubject = "Email Təsdiqi - Autoria Hesabınız";
            var emailBody = GenerateEmailConfirmationBody(user.FullName, confirmUrl);

            await _emailService.SendEmailAsync(user.Email!, emailSubject, emailBody);

            _logger.LogInformation("✅ Email confirmation sent to: {Email}", user.Email);
        }
        // İstifadəçi icazələrini rol əsasında müəyyən edir
        private List<string> GetUserPermissions(List<string> roles)
        {
            var permissions = new List<string>();

            foreach (var role in roles)
            {
                switch (role)
                {
                    case "Admin":
                        permissions.AddRange(new[] { "ManageUsers", "ManageAuctions", "ViewReports", "ManageSystem" });
                        break;
                    case "Seller":
                        permissions.AddRange(new[] { "CreateAuction", "ManageOwnAuctions", "ViewSalesReports" });
                        break;
                    case "Member":
                        permissions.AddRange(new[] { "PlaceBids", "ViewAuctions", "ManageProfile" });
                        break;
                    case "AuctionManager":
                        permissions.AddRange(new[] { "ManageAuctions", "ViewAuctionReports", "ModerateContent" });
                        break;
                }
            }

            return permissions.Distinct().ToList();
        }
        private async Task<UserDto> MapToUserDtoAsync(ApplicationUser user, List<string> roles)
        {
            return new UserDto
            {
                Id = Guid.Parse(user.Id),
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                EmailConfirmed = user.EmailConfirmed,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                ProfilePicture = user.ProfilePicture,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive,
                Roles = roles
            };
        }

        private string GenerateEmailConfirmationBody(string userName, string confirmUrl)
        {
            return $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Email Təsdiqi - Autoria</title>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 28px;'>🏆 Autoria-ya Xoş Gəlmisiniz!</h1>
                        <p style='color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;'>Premium avtomobil hərracı platforması</p>
                    </div>
                    
                    <div style='background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                        <h2 style='color: #333; margin-top: 0; font-size: 24px;'>Salam {userName}! 👋</h2>
                        
                        <p style='color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;'>
                            Autoria hərraca qeydiyyatınız uğurla tamamlandı! Hesabınızı aktivləşdirmək və bütün funksiyalardan istifadə etmək üçün email ünvanınızı təsdiqləyin.
                        </p>

                        <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;'>
                            <h3 style='color: #667eea; margin: 0 0 10px 0; font-size: 18px;'>📋 Növbəti addımlar:</h3>
                            <ul style='color: #666; margin: 0; padding-left: 20px;'>
                                <li>Email təsdiqini tamamlayın</li>
                                <li>Profil məlumatlarınızı tamamlayın</li>
                                <li>Hərraca iştirak etməyə başlayın</li>
                            </ul>
                        </div>
                        
                        <div style='text-align: center; margin: 40px 0;'>
                            <a href='{confirmUrl}' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;'>
                                ✉️ Email-i Təsdiqlə
                            </a>
                        </div>

                        <div style='background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;'>
                            <p style='color: #856404; margin: 0; font-size: 14px;'>
                                ⏰ <strong>Vacibdir:</strong> Bu təsdiqlə linki 24 saat ərzində keçərli olacaq.
                            </p>
                        </div>
                        
                        <p style='color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;'>
                            Əgər düymə işləmirsə, bu linki kopyalayıb brauzer-də açın:<br>
                            <span style='word-break: break-all; color: #667eea; background: #f8f9fa; padding: 5px; border-radius: 4px; display: inline-block; margin-top: 5px;'>{confirmUrl}</span>
                        </p>

                        <div style='background: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;'>
                            <h4 style='color: #333; margin: 0 0 15px 0;'>🤝 Autoria Komandası</h4>
                            <p style='color: #666; margin: 0; font-size: 14px;'>
                                Sualınız varmı? <a href='mailto:support@autoria.az' style='color: #667eea;'>support@autoria.az</a> ünvanına yazın.
                            </p>
                        </div>
                    </div>
                    
                    <div style='text-align: center; padding: 20px; color: #999; font-size: 12px;'>
                        <p>© 2025 Autoria. Bütün hüquqlar qorunur.</p>
                        <p>Bu email avtomatik göndərilib, cavab verməyin.</p>
                    </div>
                </body>
                </html>";
        }

        private string GeneratePasswordResetEmailBody(string userName, string resetUrl)
        {
            return $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Parol Sıfırlama - Autoria</title>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;'>
                    <div style='background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 28px;'>🔐 Parol Sıfırlama</h1>
                        <p style='color: #ffe0e0; margin: 10px 0 0 0; font-size: 16px;'>Autoria Hesab Təhlükəsizliyi</p>
                    </div>
                    
                    <div style='background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                        <h2 style='color: #333; margin-top: 0; font-size: 24px;'>Salam {userName}! 👋</h2>
                        
                        <p style='color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;'>
                            Hesabınız üçün parol sıfırlama tələbi aldıq. Yeni parol yaratmaq üçün aşağıdakı düyməni kliklənyin:
                        </p>
                        
                        <div style='text-align: center; margin: 40px 0;'>
                            <a href='{resetUrl}' style='background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);'>
                                🔓 Parolu Sıfırla
                            </a>
                        </div>

                        <div style='background: #ffe6e6; border: 1px solid #ff9999; border-radius: 8px; padding: 20px; margin: 25px 0;'>
                            <h3 style='color: #cc0000; margin: 0 0 10px 0; font-size: 16px;'>⚠️ Təhlükəsizlik məlumatı:</h3>
                            <ul style='color: #666; margin: 0; padding-left: 20px; font-size: 14px;'>
                                <li>Bu link yalnız <strong>1 saat</strong> keçərlidir</li>
                                <li>Link yalnız bir dəfə istifadə oluna bilər</li>
                                <li>Parol dəyişdikdən sonra bütün sessionlar sonlanacaq</li>
                            </ul>
                        </div>
                        
                        <p style='color: #666; font-size: 14px; line-height: 1.6;'>
                            <strong>Bu tələbi siz etməmisinizsə:</strong><br>
                            Heç bir şey etməyin. Parolunuz təhlükəsizdir və bu email-i nəzərə almayın.
                        </p>
                        
                        <p style='color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;'>
                            Əgər düymə işləmirsə, bu linki kopyalayıb brauzer-də açın:<br>
                            <span style='word-break: break-all; color: #ff6b6b; background: #f8f9fa; padding: 5px; border-radius: 4px; display: inline-block; margin-top: 5px;'>{resetUrl}</span>
                        </p>
                    </div>
                    
                    <div style='text-align: center; padding: 20px; color: #999; font-size: 12px;'>
                        <p>© 2025 Autoria. Bütün hüquqlar qorunur.</p>
                        <p>Təhlükəsizlik səbəbindən bu email-ə cavab verməyin.</p>
                    </div>
                </body>
                </html>";
        }
        #endregion
    }
}
