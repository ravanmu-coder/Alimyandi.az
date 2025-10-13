using AutoriaFinal.Contract.Dtos.Identity.Token;
using AutoriaFinal.Contract.Services.Identity;
using AutoriaFinal.Contract.Services.Token;
using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Identity
{
    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly ILogger<GoogleAuthService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public GoogleAuthService(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            ILogger<GoogleAuthService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<string> HandleGoogleLoginAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var result = await httpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
            if (!result.Succeeded || result.Principal == null)
                throw new Exception("Google authentication failed.");
            var claims = result.Principal.Identities.FirstOrDefault()?.Claims;
            var email = claims?.FirstOrDefault(c => c.Type.Contains("email"))?.Value;
            var name = claims?.FirstOrDefault(c => c.Type.Contains("name"))?.Value ?? "GoogleUser";

            if (string.IsNullOrEmpty(email))
                throw new Exception("Google email tapılmadı.");


            return await GoogleSignInAsync(email, name);
        }
        private async Task<string> GoogleSignInAsync(string email, string fullName)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email.Contains("@") ? email.Split('@')[0] : email,
                    Email = email,
                    EmailConfirmed = true
                };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    throw new Exception("Google ilə qeydiyyat uğursuz oldu: " + string.Join(", ", createResult.Errors.Select(e => e.Description)));
                await _userManager.AddToRoleAsync(user, "User");
                _logger.LogInformation($"Yeni Google istifadəçisi yaradıldı: {user.Email}");
            }
            else
            {
                _logger.LogInformation($"Google ilə login oldu: {user.Email}");
            }

            var roles = (await _userManager.GetRolesAsync(user)).ToList();

            var tokenRequest = new TokenGenerationRequest
            {
                UserId = user.Id,
                Email = user.Email ?? email,
                UserName = user.UserName ?? (email.Contains("@") ? email.Split('@')[0] : email),
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                Role = roles.FirstOrDefault() ?? "User",
                Roles = roles,
                AdditionalClaims = new Dictionary<string, string>
        {
            { "fullName", fullName ?? string.Empty }
        }
            };

            var (accessToken, expiresAt) = await _tokenService.GenerateTokenAsync(tokenRequest);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync();

            var response = new
            {
                accessToken,
                expiresAt,
                refreshToken,
                tokenType = "Bearer"
            };

            return System.Text.Json.JsonSerializer.Serialize(response);
        }

    }
}
