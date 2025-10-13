using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Infrastructure.Services.Email
{
    public class CustomEmailConfirmationTokenProvider : IUserTwoFactorTokenProvider<ApplicationUser>
    {
        private readonly ILogger<CustomEmailConfirmationTokenProvider> _logger;

        public CustomEmailConfirmationTokenProvider(ILogger<CustomEmailConfirmationTokenProvider> logger)
        {
            _logger = logger;
        }

        public Task<bool> CanGenerateTwoFactorTokenAsync(UserManager<ApplicationUser> manager, ApplicationUser user)
        {
            return Task.FromResult(true);
        }

        public async Task<string> GenerateAsync(string purpose, UserManager<ApplicationUser> manager, ApplicationUser user)
        {
            _logger.LogInformation("🔐 Generating custom email confirmation token for user: {UserId}", user.Id);

            // ✅ URL-SAFE TOKEN GENERATION
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var randomBytes = RandomNumberGenerator.GetBytes(32);
            var userIdHash = ComputeHash(user.Id + user.Email);

            var tokenData = $"{timestamp}:{Convert.ToBase64String(randomBytes)}:{userIdHash}";
            var tokenBytes = Encoding.UTF8.GetBytes(tokenData);

            // ✅ URL-SAFE BASE64 ENCODING
            var token = Convert.ToBase64String(tokenBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');

            _logger.LogDebug("Email confirmation token generated: Length={Length}", token.Length);
            return token;
        }

        public async Task<bool> ValidateAsync(string purpose, string token, UserManager<ApplicationUser> manager, ApplicationUser user)
        {
            _logger.LogInformation("🔍 Validating custom email confirmation token for user: {UserId}", user.Id);

            try
            {
                // ✅ URL-SAFE BASE64 DECODE
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

                // ✅ VALIDATE TIMESTAMP (48 hours)
                if (!long.TryParse(parts[0], out var timestamp))
                {
                    _logger.LogWarning("❌ Invalid timestamp in token");
                    return false;
                }

                var tokenTime = DateTimeOffset.FromUnixTimeSeconds(timestamp);
                var now = DateTimeOffset.UtcNow;
                var tokenAge = now - tokenTime;

                if (tokenAge.TotalHours > 48)
                {
                    _logger.LogWarning("❌ Token expired: Age={Hours} hours", tokenAge.TotalHours);
                    return false;
                }

                // ✅ VALIDATE USER HASH
                var userIdHash = parts[2];
                var expectedHash = ComputeHash(user.Id + user.Email);

                if (userIdHash != expectedHash)
                {
                    _logger.LogWarning("❌ Token user hash mismatch");
                    return false;
                }

                _logger.LogInformation("✅ Email confirmation token validation successful");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Email confirmation token validation error");
                return false;
            }
        }

        private static string ComputeHash(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes)[..16];
        }
    }
}
