using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace AutoriaFinal.Infrastructure.Services.Token
{
    public class CustomPasswordResetTokenProvider : IUserTwoFactorTokenProvider<ApplicationUser>
    {
        private readonly ILogger<CustomPasswordResetTokenProvider> _logger;

        public CustomPasswordResetTokenProvider(ILogger<CustomPasswordResetTokenProvider> logger)
        {
            _logger = logger;
        }

        public Task<bool> CanGenerateTwoFactorTokenAsync(UserManager<ApplicationUser> manager, ApplicationUser user)
        {
            return Task.FromResult(true);
        }

        public async Task<string> GenerateAsync(string purpose, UserManager<ApplicationUser> manager, ApplicationUser user)
        {
            _logger.LogInformation("🔐 Generating custom password reset token for user: {UserId}", user.Id);

            // ✅ GUID + Timestamp + User ID combination
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var randomGuid = Guid.NewGuid().ToString("N");
            var userIdHash = ComputeHash(user.Id);

            var tokenData = $"{timestamp}:{randomGuid}:{userIdHash}";
            var tokenBytes = Encoding.UTF8.GetBytes(tokenData);

            // ✅ Base64 encode (URL safe)
            var token = Convert.ToBase64String(tokenBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');

            _logger.LogDebug("Token generated: Length={Length}, Timestamp={Timestamp}", token.Length, timestamp);
            return token;
        }

        public async Task<bool> ValidateAsync(string purpose, string token, UserManager<ApplicationUser> manager, ApplicationUser user)
        {
            _logger.LogInformation("🔍 Validating custom password reset token for user: {UserId}", user.Id);

            try
            {
                // ✅ URL safe Base64 decode
                var normalizedToken = token.Replace('-', '+').Replace('_', '/');
                switch (normalizedToken.Length % 4)
                {
                    case 2: normalizedToken += "=="; break;
                    case 3: normalizedToken += "="; break;
                }

                var tokenBytes = Convert.FromBase64String(normalizedToken);
                var tokenData = Encoding.UTF8.GetString(tokenBytes);

                var parts = tokenData.Split(':');
                if (parts.Length != 3)
                {
                    _logger.LogWarning("❌ Invalid token format");
                    return false;
                }

                // ✅ Parse components
                if (!long.TryParse(parts[0], out var timestamp))
                {
                    _logger.LogWarning("❌ Invalid timestamp in token");
                    return false;
                }

                var userIdHash = parts[2];
                var expectedHash = ComputeHash(user.Id);

                // ✅ Validate user ID hash
                if (userIdHash != expectedHash)
                {
                    _logger.LogWarning("❌ Token user ID mismatch");
                    return false;
                }

                // ✅ Check expiration (24 hours)
                var tokenTime = DateTimeOffset.FromUnixTimeSeconds(timestamp);
                var now = DateTimeOffset.UtcNow;
                var tokenAge = now - tokenTime;

                if (tokenAge.TotalHours > 24)
                {
                    _logger.LogWarning("❌ Token expired: Age={Hours} hours", tokenAge.TotalHours);
                    return false;
                }

                _logger.LogInformation("✅ Token validation successful");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Token validation error");
                return false;
            }
        }

        private static string ComputeHash(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes)[..16]; // First 16 chars
        }
    }

    public class CustomPasswordResetTokenProviderOptions : DataProtectionTokenProviderOptions
    {
        public CustomPasswordResetTokenProviderOptions()
        {
            Name = "CustomPasswordResetTokenProvider";
            TokenLifespan = TimeSpan.FromHours(24);
        }
    }
}