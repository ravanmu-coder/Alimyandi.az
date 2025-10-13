using AutoriaFinal.Contract.Dtos.Identity.Token;
using System.Security.Claims;

namespace AutoriaFinal.Contract.Services.Token
{
    public interface ITokenService
    {
        #region TOKEN GENERATION
        /// JWT Access Token yaradır
        Task<(string Token, DateTime Expires)> GenerateTokenAsync(TokenGenerationRequest request);
        /// Refresh Token yaradır (Crypto-secure)
        Task<string> GenerateRefreshTokenAsync();
        /// Email confirmation token yaradır
        Task<string> GenerateEmailConfirmationTokenAsync(string userId);
        /// Password reset token yaradır
        Task<string> GeneratePasswordResetTokenAsync(string userId);
        #endregion

        #region TOKEN VALIDATION
        /// Token-in etibarlılığını yoxlayır
        Task<bool> ValidateTokenAsync(string token);
        /// Token-in detallı təsdiqləməsi
        Task<ValidateTokenResponse> ValidateTokenDetailedAsync(ValidateTokenRequest request);
        #endregion

        #region TOKEN INFORMATION
        /// Token-dən Claims-ləri çıxarır
        Task<ClaimsPrincipal?> GetClaimsFromTokenAsync(string token);

        /// Token-in qalan müddətini hesablayır
        Task<TimeSpan?> GetTokenRemainingTimeAsync(string token);
        /// Token-dən istifadəçi ID-sini alır
        Task<string> GetUserIdFromTokenAsync(string token);
        /// Token-dən email ünvanını alır
        Task<string> GetEmailFromTokenAsync(string token);
        /// Token-dən rolları alır
        Task<List<string>> GetRolesFromTokenAsync(string token);
        #endregion

        #region TOKEN MANAGEMENT
        /// Token blacklist-ə əlavə edir (Revoke)
        Task<bool> RevokeTokenAsync(string token);
        /// Token blacklist-də varmı yoxlayır
        Task<bool> IsTokenRevokedAsync(string token);
        /// İstifadəçinin bütün token-lərini ləğv edir
        Task<int> RevokeAllUserTokensAsync(string userId);
        #endregion
    }
}