using AutoriaFinal.Contract.Dtos.Admin;
using AutoriaFinal.Contract.Dtos.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Admin
{
    public interface IAdminService
    {
        #region USER MANAGEMENT
        /// Filtrlənmiş və səhifələnmiş user siyahısı
        Task<AdminPagedResponseDto<AdminUserListDto>> GetUsersAsync(AdminUserFilterDto filter);
        /// User-in tam detalları
        Task<AdminResponseDto<AdminUserDetailDto>> GetUserDetailAsync(Guid userId);
        Task<AdminResponseDto<List<AdminUserListDto>>> SearchUsersAsync(string searchTerm, int limit = 10);
        /// User statusunu dəyişmə
        Task<AdminResponseDto<bool>> ToggleUserStatusAsync(Guid userId, bool isActive, string reason, Guid adminUserId);
        /// User-ə rol təyin etmə
        Task<AdminResponseDto<bool>> AssignRoleToUserAsync(Guid userId, string role, Guid adminUserId);
        /// User-dən rol silmə
        Task<AdminResponseDto<bool>> RemoveRoleFromUserAsync(Guid userId, string role, Guid adminUserId);
        /// User profil yenilənməsi (admin tərəfindən)
        Task<AdminResponseDto<AdminUserDetailDto>> UpdateUserProfileAsync(Guid userId, UpdateUserDto updateDto, Guid adminUserId);
        /// User hesabını soft delete
        Task<AdminResponseDto<bool>> SoftDeleteUserAsync(Guid userId, string reason, Guid adminUserId);
        /// User hesabını restore etmə
        Task<AdminResponseDto<bool>> RestoreUserAsync(Guid userId, Guid adminUserId);

        #endregion

        #region BULK OPERATIONS
        /// Bulk user əməliyyatları
        Task<AdminResponseDto<AdminBulkOperationResultDto>> BulkUserOperationAsync(AdminBulkActionDto bulkAction, Guid adminUserId);
        /// Bulk email göndərmə
        Task<AdminResponseDto<AdminBulkOperationResultDto>> BulkSendEmailAsync(List<Guid> userIds, string subject, string message, Guid adminUserId);
        /// Bulk rol təyin etmə
        Task<AdminResponseDto<AdminBulkOperationResultDto>> BulkAssignRoleAsync(List<Guid> userIds, string role, Guid adminUserId);

        #endregion

        #region DASHBOARD & STATISTICS
        /// Admin dashboard məlumatları
        Task<AdminResponseDto<AdminDashboardDto>> GetDashboardAsync();
        /// User statistikları
        Task<AdminResponseDto<AdminUserStatsOverview>> GetUserStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
        /// System health check
        Task<AdminResponseDto<AdminSystemStatsOverview>> GetSystemHealthAsync();
        /// Recent admin activities
        Task<AdminResponseDto<List<AdminRecentActivityDto>>> GetRecentActivitiesAsync(int limit = 50);

        #endregion

        #region EXPORT & REPORTING
        /// User məlumatlarını export etmə
        Task<AdminResponseDto<byte[]>> ExportUsersAsync(AdminUserExportDto exportDto, Guid adminUserId);
        /// Dashboard reportunu export etmə
        Task<AdminResponseDto<byte[]>> ExportDashboardReportAsync(string format, DateTime? fromDate, DateTime? toDate, Guid adminUserId);

        #endregion

        #region AUDIT & LOGGING
        /// User audit log
        Task<AdminResponseDto<List<AdminUserActivityDto>>> GetUserAuditLogAsync(Guid userId, int page = 1, int pageSize = 50);
        /// Admin activity log
        Task<AdminResponseDto<List<AdminRecentActivityDto>>> GetAdminActivityLogAsync(Guid? adminUserId = null, int page = 1, int pageSize = 50);
        /// System alerts
        Task<AdminResponseDto<List<AdminAlertDto>>> GetSystemAlertsAsync(bool unreadOnly = true);
        /// Alert-i oxunmuş kimi işarələ
        Task<AdminResponseDto<bool>> MarkAlertAsReadAsync(string alertId, Guid adminUserId);

        #endregion

        #region SYSTEM MANAGEMENT
        /// Cache temizləmə
        Task<AdminResponseDto<bool>> ClearCacheAsync(string? cacheKey = null, Guid adminUserId = default);
        /// Database maintenance
        Task<AdminResponseDto<string>> RunDatabaseMaintenanceAsync(Guid adminUserId);
        /// System backup
        Task<AdminResponseDto<string>> CreateSystemBackupAsync(Guid adminUserId);

        #endregion

        #region NOTIFICATIONS
        /// User-ə notification göndərmə
        Task<AdminResponseDto<bool>> SendNotificationToUserAsync(Guid userId, string title, string message, string type, Guid adminUserId);
        /// Bütün user-lərə broadcast notification
        Task<AdminResponseDto<AdminBulkOperationResultDto>> BroadcastNotificationAsync(string title, string message, string type, List<string>? targetRoles, Guid adminUserId);

        #endregion

        #region ANALYTICS
        /// User behavior analytics
        Task<AdminResponseDto<object>> GetUserBehaviorAnalyticsAsync(DateTime fromDate, DateTime toDate);
        /// Popular content analytics
        Task<AdminResponseDto<object>> GetPopularContentAnalyticsAsync(int topCount = 10);
        /// Performance metrics
        Task<AdminResponseDto<object>> GetPerformanceMetricsAsync(DateTime fromDate, DateTime toDate);

        #endregion
    }
}
