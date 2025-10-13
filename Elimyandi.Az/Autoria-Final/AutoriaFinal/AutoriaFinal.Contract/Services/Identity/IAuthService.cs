using AutoriaFinal.Contract.Dtos.Identity;
using System.Security.Claims;

namespace AutoriaFinal.Contract.Services.Identity
{
    public interface IAuthService
    {
        #region AUTHENTICATION
        /// Yeni istifadəçi qeydiyyatı
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        /// İstifadəçi girişi
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        /// İstifadəçi çıxışı
        Task<AuthResponseDto> LogoutAsync(string userId);
        #endregion
        #region EMAIL CONFIRMATION
        /// Email təsdiqi
        Task<bool> ConfirmEmailAsync(string userId, string token);
        /// Email təsdiqini yenidən göndər
        Task<bool> ResendEmailConfirmationAsync(string email);
        #endregion
        #region PASSWORD RESET
        /// Parol unutma tələbi
        Task<bool> ForgotPasswordAsync(ForgotPasswordDto dto);
        /// Parol sıfırlama
        Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto dto);
        #endregion

        #region USER MANAGEMENT
        /// İstifadəçi profili məlumatları
        Task<UserDto?> GetUserProfileAsync(string userId);
        /// İstifadəçi profil yenilənməsi
        Task<bool> UpdateUserProfileAsync(string userId, UpdateUserDto dto);
        /// Mövcud rolların siyahısı
        Task<List<string>> GetAvailableRolesAsync();
        /// İstifadəçiyə rol təyin etmə
        Task<bool> AssignRoleAsync(string userId, string role);
        /// İstifadəçidən rol silmə
        Task<bool> RemoveRoleAsync(string userId, string role);
        #endregion

        #region TOKEN MANAGEMENT
        /// Token yenilənməsi
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        /// Token ləğvi
        Task<bool> RevokeTokenAsync(string token);
        /// Token etibarlılıq yoxlaması
        Task<bool> IsTokenValidAsync(string token);
        /// Token-dən istifadəçi məlumatları
        Task<UserDto?> GetUserFromTokenAsync(string token);
        /// Token-in qalan müddəti
        Task<TimeSpan?> GetTokenRemainingTimeAsync(string token);
        /// Token yenilənməyə ehtiyacı varmı
        Task<bool> ShouldRefreshTokenAsync(string token);
        #endregion

        #region ADMIN OPERATIONS
        /// Bütün istifadəçilərin siyahısı (Admin üçün)
        Task<List<UserDto>> GetAllUsersAsync(int page = 1, int pageSize = 10);
        /// İstifadəçi axtarışı
        Task<List<UserDto>> SearchUsersAsync(string searchTerm);
        /// İstifadəçi aktivləşdirmə/deaktivləşdirmə
        Task<bool> ToggleUserStatusAsync(string userId, bool isActive);
        #endregion
    }
}