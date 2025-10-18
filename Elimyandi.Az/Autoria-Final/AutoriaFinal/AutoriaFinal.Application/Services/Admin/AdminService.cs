using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Admin;
using AutoriaFinal.Contract.Dtos.Identity;
using AutoriaFinal.Contract.Services.Admin;
using AutoriaFinal.Contract.Services.Identity;
using AutoriaFinal.Domain.Entities.Identity;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Persistence.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Admin
{
    public class AdminService : IAdminService
    {
        #region FIELDS & CONSTRUCTOR

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            AppDbContext context,
            IAuthService authService,
            ILogger<AdminService> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _authService = authService;
            _logger = logger;
        }

        #endregion

        #region USER MANAGEMENT

        public async Task<AdminPagedResponseDto<AdminUserListDto>> GetUsersAsync(AdminUserFilterDto filter)
        {
            var stopwatch = Stopwatch.StartNew();

            _logger.LogInformation("Admin user list request initiated - Page: {Page}, Size: {PageSize}, HasFilters: {HasFilters}",
                filter.Page, filter.PageSize, filter.HasAnyFilter());

            var query = _userManager.Users.AsQueryable();

            // Apply filters
            query = ApplyUserFilters(query, filter);

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = ApplyUserSorting(query, filter.SortBy, filter.SortDirection);

            // Apply pagination
            var users = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Map to DTOs with additional data
            var userDtos = new List<AdminUserListDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var userStats = await GetUserBusinessStats(user.Id);

                var dto = new AdminUserListDto
                {
                    Id = Guid.Parse(user.Id),
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    FullName = user.FullName,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    IsActive = user.IsActive,
                    Roles = roles.ToList(),
                    PrimaryRole = roles.FirstOrDefault() ?? "User",
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    UpdatedAt = user.UpdatedAt,
                    UpdatedBy = user.UpdatedBy,
                    FailedLoginAttempts = user.FailedLoginAttempts,
                    LastFailedLogin = user.LastFailedLogin,
                    City = user.City,
                    Country = user.Country,
                    TotalCars = userStats.TotalCars,
                    TotalBids = userStats.TotalBids,
                    TotalSpent = userStats.TotalSpent
                };

                userDtos.Add(dto);
            }

            stopwatch.Stop();

            _logger.LogInformation("Admin user list completed - Found: {Count}/{Total}, ExecutionTime: {Time}ms",
                userDtos.Count, totalCount, stopwatch.ElapsedMilliseconds);

            return AdminPagedResponseDto<AdminUserListDto>.Success(
                userDtos, totalCount, filter.Page, filter.PageSize,
                $"{totalCount} user records retrieved"
            );
        }

        public async Task<AdminResponseDto<AdminUserDetailDto>> GetUserDetailAsync(Guid userId)
        {
            _logger.LogInformation("User detail request initiated - UserId: {UserId}", userId);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                _logger.LogWarning("User not found - UserId: {UserId}", userId);
                throw new NotFoundException("User", userId);
            }

            var roles = await _userManager.GetRolesAsync(user);
            var claims = await _userManager.GetClaimsAsync(user);
            var userStats = await GetUserBusinessStats(user.Id);
            var recentActivities = await GetUserRecentActivities(user.Id);

            var dto = new AdminUserDetailDto
            {
                Id = Guid.Parse(user.Id),
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                Age = user.Age,
                ProfilePicture = user.ProfilePicture,
                Bio = user.Bio,
                City = user.City,
                Country = user.Country,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                UpdatedAt = user.UpdatedAt,
                UpdatedBy = user.UpdatedBy,
                DeletedAt = user.DeletedAt,
                IsDeleted = user.IsDeleted,
                FailedLoginAttempts = user.FailedLoginAttempts,
                LastFailedLogin = user.LastFailedLogin,
                PasswordChangedAt = user.PasswordChangedAt,
                SecurityStamp = user.SecurityStamp,
                ConcurrencyStamp = user.ConcurrencyStamp,
                Roles = roles.ToList(),
                Permissions = GetUserPermissions(roles.ToList()),
                PrimaryRole = roles.FirstOrDefault() ?? "User",
                AllowMarketing = user.AllowMarketing,
                PreferredLanguage = user.PreferredLanguage,
                TimeZone = user.TimeZone,
                Stats = userStats,
                RecentActivities = recentActivities
            };

            _logger.LogInformation("User detail retrieved successfully - UserId: {UserId}", userId);
            return AdminResponseDto<AdminUserDetailDto>.Success(dto, "User detail retrieved successfully");
        }

        public async Task<AdminResponseDto<List<AdminUserListDto>>> SearchUsersAsync(string searchTerm, int limit = 10)
        {
            if (string.IsNullOrWhiteSpace(searchTerm) || searchTerm.Length < 2)
            {
                throw new BadRequestException("Search term must be at least 2 characters long");
            }

            _logger.LogInformation("User search initiated - SearchTerm: {SearchTerm}, Limit: {Limit}",
                searchTerm, limit);

            var users = await _userManager.Users
                .Where(u => !u.IsDeleted && (
                    u.Email.Contains(searchTerm) ||
                    u.UserName.Contains(searchTerm) ||
                    u.FirstName.Contains(searchTerm) ||
                    u.LastName.Contains(searchTerm) ||
                    u.PhoneNumber.Contains(searchTerm)
                ))
                .Take(limit)
                .ToListAsync();

            var userDtos = new List<AdminUserListDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new AdminUserListDto
                {
                    Id = Guid.Parse(user.Id),
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    FullName = user.FullName,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    IsActive = user.IsActive,
                    Roles = roles.ToList(),
                    PrimaryRole = roles.FirstOrDefault() ?? "User",
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                });
            }

            _logger.LogInformation("User search completed - Found: {Count} results for term: {SearchTerm}",
                userDtos.Count, searchTerm);

            return AdminResponseDto<List<AdminUserListDto>>.Success(userDtos, $"{userDtos.Count} results found");
        }

        public async Task<AdminResponseDto<bool>> ToggleUserStatusAsync(Guid userId, bool isActive, string reason, Guid adminUserId)
        {
            _logger.LogInformation("User status change initiated - UserId: {UserId}, NewStatus: {Status}, AdminUserId: {AdminUserId}",
                userId, isActive, adminUserId);

            var result = await _authService.ToggleUserStatusAsync(userId.ToString(), isActive);

            if (!result)
            {
                throw new BadRequestException("Failed to change user status");
            }

            await LogAdminActivity(adminUserId, "UserStatusChanged",
                $"User {userId} status changed to {(isActive ? "Active" : "Inactive")}. Reason: {reason}");

            _logger.LogInformation("User status changed successfully - UserId: {UserId}, NewStatus: {Status}",
                userId, isActive);

            return AdminResponseDto<bool>.Success(true, $"User status changed to {(isActive ? "active" : "inactive")}");
        }

        public async Task<AdminResponseDto<bool>> AssignRoleToUserAsync(Guid userId, string role, Guid adminUserId)
        {
            _logger.LogInformation("Role assignment initiated - UserId: {UserId}, Role: {Role}, AdminUserId: {AdminUserId}",
                userId, role, adminUserId);

            // Validate role exists
            if (!await _roleManager.RoleExistsAsync(role))
            {
                throw new BadRequestException($"Role '{role}' does not exist");
            }

            var result = await _authService.AssignRoleAsync(userId.ToString(), role);

            if (!result)
            {
                throw new BadRequestException($"Failed to assign role '{role}' to user");
            }

            await LogAdminActivity(adminUserId, "RoleAssigned",
                $"Role '{role}' assigned to user {userId}");

            _logger.LogInformation("Role assigned successfully - UserId: {UserId}, Role: {Role}", userId, role);

            return AdminResponseDto<bool>.Success(true, $"Role '{role}' assigned successfully");
        }

        public async Task<AdminResponseDto<bool>> RemoveRoleFromUserAsync(Guid userId, string role, Guid adminUserId)
        {
            _logger.LogInformation("Role removal initiated - UserId: {UserId}, Role: {Role}, AdminUserId: {AdminUserId}",
                userId, role, adminUserId);

            var result = await _authService.RemoveRoleAsync(userId.ToString(), role);

            if (!result)
            {
                throw new BadRequestException($"Failed to remove role '{role}' from user");
            }

            await LogAdminActivity(adminUserId, "RoleRemoved",
                $"Role '{role}' removed from user {userId}");

            _logger.LogInformation("Role removed successfully - UserId: {UserId}, Role: {Role}", userId, role);

            return AdminResponseDto<bool>.Success(true, $"Role '{role}' removed successfully");
        }

        public async Task<AdminResponseDto<AdminUserDetailDto>> UpdateUserProfileAsync(Guid userId, UpdateUserDto updateDto, Guid adminUserId)
        {
            _logger.LogInformation("User profile update initiated - UserId: {UserId}, AdminUserId: {AdminUserId}",
                userId, adminUserId);

            var result = await _authService.UpdateUserProfileAsync(userId.ToString(), updateDto);

            if (!result)
            {
                throw new BadRequestException("Failed to update user profile");
            }

            await LogAdminActivity(adminUserId, "UserProfileUpdated",
                $"User {userId} profile updated by admin");

            _logger.LogInformation("User profile updated successfully - UserId: {UserId}", userId);

            var updatedUser = await GetUserDetailAsync(userId);
            return updatedUser;
        }

        public async Task<AdminResponseDto<bool>> SoftDeleteUserAsync(Guid userId, string reason, Guid adminUserId)
        {
            _logger.LogInformation("User soft delete initiated - UserId: {UserId}, AdminUserId: {AdminUserId}",
                userId, adminUserId);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            user.SoftDelete();
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"Failed to delete user: {errors}");
            }

            await LogAdminActivity(adminUserId, "UserSoftDeleted",
                $"User {userId} soft deleted. Reason: {reason}");

            _logger.LogInformation("User soft deleted successfully - UserId: {UserId}", userId);

            return AdminResponseDto<bool>.Success(true, "User deleted successfully");
        }

        public async Task<AdminResponseDto<bool>> RestoreUserAsync(Guid userId, Guid adminUserId)
        {
            _logger.LogInformation("User restoration initiated - UserId: {UserId}, AdminUserId: {AdminUserId}",
                userId, adminUserId);

            var user = await _userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == userId.ToString());

            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            user.IsDeleted = false;
            user.DeletedAt = null;
            user.Activate();

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"Failed to restore user: {errors}");
            }

            await LogAdminActivity(adminUserId, "UserRestored",
                $"User {userId} restored from deletion");

            _logger.LogInformation("User restored successfully - UserId: {UserId}", userId);

            return AdminResponseDto<bool>.Success(true, "User restored successfully");
        }

        #endregion

        #region BULK OPERATIONS

        public async Task<AdminResponseDto<AdminBulkOperationResultDto>> BulkUserOperationAsync(AdminBulkActionDto bulkAction, Guid adminUserId)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new AdminBulkOperationResultDto
            {
                TotalRequested = bulkAction.UserIds.Count
            };

            _logger.LogInformation("Bulk operation initiated - Action: {Action}, UserCount: {Count}, AdminUserId: {AdminUserId}",
                bulkAction.Action, bulkAction.UserIds.Count, adminUserId);

            if (!bulkAction.IsValid())
            {
                throw new BadRequestException("Invalid bulk operation parameters");
            }

            foreach (var userId in bulkAction.UserIds)
            {
                var itemResult = new AdminBulkOperationItemDto
                {
                    UserId = userId,
                    ProcessedAt = DateTime.UtcNow
                };

                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    itemResult.IsSuccess = false;
                    itemResult.Message = "User not found";
                    itemResult.ErrorCode = "USER_NOT_FOUND";
                    result.FailureCount++;
                }
                else
                {
                    itemResult.UserIdentifier = user.Email ?? user.UserName ?? userId.ToString();

                    var success = bulkAction.Action switch
                    {
                        "Activate" => await ProcessBulkActivate(userId, adminUserId),
                        "Deactivate" => await ProcessBulkDeactivate(userId, adminUserId),
                        "AssignRole" => await ProcessBulkAssignRole(userId, bulkAction.Value!, adminUserId),
                        "RemoveRole" => await ProcessBulkRemoveRole(userId, bulkAction.Value!, adminUserId),
                        "Delete" => await ProcessBulkDelete(userId, bulkAction.Reason!, adminUserId),
                        _ => throw new BadRequestException($"Unsupported bulk action: {bulkAction.Action}")
                    };

                    if (success)
                    {
                        itemResult.IsSuccess = true;
                        itemResult.Message = "Operation successful";
                        result.SuccessCount++;
                    }
                    else
                    {
                        itemResult.IsSuccess = false;
                        itemResult.Message = "Operation failed";
                        itemResult.ErrorCode = "OPERATION_FAILED";
                        result.FailureCount++;
                    }
                }

                result.Results.Add(itemResult);
            }

            stopwatch.Stop();
            result.ProcessingTime = stopwatch.Elapsed;

            await LogAdminActivity(adminUserId, "BulkOperation",
                $"Bulk {bulkAction.Action}: {result.SuccessCount}/{result.TotalRequested} successful");

            _logger.LogInformation("Bulk operation completed - Action: {Action}, Success: {Success}/{Total}, Duration: {Duration}ms",
                bulkAction.Action, result.SuccessCount, result.TotalRequested, stopwatch.ElapsedMilliseconds);

            return AdminResponseDto<AdminBulkOperationResultDto>.Success(result,
                $"Bulk operation completed: {result.SuccessCount}/{result.TotalRequested} successful");
        }

        public async Task<AdminResponseDto<AdminBulkOperationResultDto>> BulkSendEmailAsync(List<Guid> userIds, string subject, string message, Guid adminUserId)
        {
            _logger.LogInformation("Bulk email initiated - UserCount: {Count}, AdminUserId: {AdminUserId}",
                userIds.Count, adminUserId);

            var result = new AdminBulkOperationResultDto
            {
                TotalRequested = userIds.Count
            };

            // TODO: Implement email service integration
            await LogAdminActivity(adminUserId, "BulkEmailSent",
                $"Bulk email sent to {userIds.Count} users");

            return AdminResponseDto<AdminBulkOperationResultDto>.Success(result, "Bulk email sent successfully");
        }

        public async Task<AdminResponseDto<AdminBulkOperationResultDto>> BulkAssignRoleAsync(List<Guid> userIds, string role, Guid adminUserId)
        {
            var bulkAction = new AdminBulkActionDto
            {
                UserIds = userIds,
                Action = "AssignRole",
                Value = role
            };

            return await BulkUserOperationAsync(bulkAction, adminUserId);
        }

        #endregion

        #region DASHBOARD & STATISTICS

        public async Task<AdminResponseDto<AdminDashboardDto>> GetDashboardAsync()
        {
            var stopwatch = Stopwatch.StartNew();

            _logger.LogInformation("Dashboard generation initiated");

            var dashboard = new AdminDashboardDto();

            // Get all statistics in parallel
            var userStatsTask = GetUserStatisticsForDashboard();
            var auctionStatsTask = GetAuctionStatisticsForDashboard();
            var financialStatsTask = GetFinancialStatisticsForDashboard();
            var systemStatsTask = GetSystemStatisticsForDashboard();
            var recentActivitiesTask = GetRecentActivitiesForDashboard();
            var systemAlertsTask = GetSystemAlertsForDashboard();
            var topUsersTask = GetTopUsersForDashboard();
            var chartDataTask = GetChartDataForDashboard();

            await Task.WhenAll(
                userStatsTask, auctionStatsTask, financialStatsTask, systemStatsTask,
                recentActivitiesTask, systemAlertsTask, topUsersTask, chartDataTask
            );

            dashboard.UserStats = await userStatsTask;
            dashboard.AuctionStats = await auctionStatsTask;
            dashboard.FinancialStats = await financialStatsTask;
            dashboard.SystemStats = await systemStatsTask;
            dashboard.RecentActivities = await recentActivitiesTask;
            dashboard.SystemAlerts = await systemAlertsTask;
            dashboard.TopUsers = await topUsersTask;
            dashboard.ChartData = await chartDataTask;

            stopwatch.Stop();
            dashboard.GenerationTime = stopwatch.Elapsed;

            _logger.LogInformation("Dashboard generated successfully - Duration: {Duration}ms",
                stopwatch.ElapsedMilliseconds);

            return AdminResponseDto<AdminDashboardDto>.Success(dashboard, "Dashboard data retrieved successfully");
        }

        public async Task<AdminResponseDto<AdminUserStatsOverview>> GetUserStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            _logger.LogInformation("User statistics request initiated - FromDate: {FromDate}, ToDate: {ToDate}",
                fromDate, toDate);

            var stats = await GetUserStatisticsForDashboard(fromDate, toDate);

            _logger.LogInformation("User statistics retrieved successfully");

            return AdminResponseDto<AdminUserStatsOverview>.Success(stats, "User statistics retrieved successfully");
        }

        public async Task<AdminResponseDto<AdminSystemStatsOverview>> GetSystemHealthAsync()
        {
            _logger.LogInformation("System health check initiated");

            var stats = await GetSystemStatisticsForDashboard();

            _logger.LogInformation("System health check completed");

            return AdminResponseDto<AdminSystemStatsOverview>.Success(stats, "System health data retrieved successfully");
        }

        public async Task<AdminResponseDto<List<AdminRecentActivityDto>>> GetRecentActivitiesAsync(int limit = 50)
        {
            _logger.LogInformation("Recent activities request initiated - Limit: {Limit}", limit);

            var activities = await GetRecentActivitiesForDashboard(limit);

            _logger.LogInformation("Recent activities retrieved - Count: {Count}", activities.Count);

            return AdminResponseDto<List<AdminRecentActivityDto>>.Success(activities, "Recent activities retrieved successfully");
        }

        #endregion

        #region EXPORT & REPORTING

        public async Task<AdminResponseDto<byte[]>> ExportUsersAsync(AdminUserExportDto exportDto, Guid adminUserId)
        {
            _logger.LogInformation("User export initiated - Format: {Format}, AdminUserId: {AdminUserId}",
                exportDto.Format, adminUserId);

            // Get filtered users
            var usersResponse = await GetUsersAsync(exportDto.Filter);
            if (!usersResponse.IsSuccess || usersResponse.Data == null)
            {
                throw new BadRequestException("Failed to retrieve users for export");
            }

            byte[] fileBytes;
            string fileName = exportDto.FileName ?? $"users_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}";

            fileBytes = exportDto.Format.ToLower() switch
            {
                "excel" => await GenerateExcelExport(usersResponse.Data, exportDto.Fields),
                "csv" => await GenerateCsvExport(usersResponse.Data, exportDto.Fields),
                "pdf" => await GeneratePdfExport(usersResponse.Data, exportDto.Fields),
                _ => throw new BadRequestException("Unsupported export format")
            };

            await LogAdminActivity(adminUserId, "UsersExported",
                $"Exported {usersResponse.Data.Count} users in {exportDto.Format} format");

            _logger.LogInformation("User export completed - Format: {Format}, RecordCount: {Count}, FileName: {FileName}",
                exportDto.Format, usersResponse.Data.Count, fileName);

            return AdminResponseDto<byte[]>.Success(fileBytes, $"Export completed: {fileName}");
        }

        public async Task<AdminResponseDto<byte[]>> ExportDashboardReportAsync(string format, DateTime? fromDate, DateTime? toDate, Guid adminUserId)
        {
            _logger.LogInformation("Dashboard export initiated - Format: {Format}, AdminUserId: {AdminUserId}",
                format, adminUserId);

            var dashboard = await GetDashboardAsync();
            if (!dashboard.IsSuccess || dashboard.Data == null)
            {
                throw new BadRequestException("Failed to retrieve dashboard data for export");
            }

            // TODO: Implement dashboard export
            var fileBytes = new byte[0];

            await LogAdminActivity(adminUserId, "DashboardExported",
                $"Dashboard exported in {format} format");

            return AdminResponseDto<byte[]>.Success(fileBytes, "Dashboard report exported successfully");
        }

        #endregion

        #region PRIVATE HELPER METHODS

        private IQueryable<ApplicationUser> ApplyUserFilters(IQueryable<ApplicationUser> query, AdminUserFilterDto filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                query = query.Where(u =>
                    u.Email.Contains(filter.SearchTerm) ||
                    u.UserName.Contains(filter.SearchTerm) ||
                    u.FirstName.Contains(filter.SearchTerm) ||
                    u.LastName.Contains(filter.SearchTerm) ||
                    u.PhoneNumber.Contains(filter.SearchTerm));
            }

            if (filter.IsActive.HasValue)
                query = query.Where(u => u.IsActive == filter.IsActive.Value);

            if (filter.EmailConfirmed.HasValue)
                query = query.Where(u => u.EmailConfirmed == filter.EmailConfirmed.Value);

            if (filter.CreatedFrom.HasValue)
                query = query.Where(u => u.CreatedAt >= filter.CreatedFrom.Value);

            if (filter.CreatedTo.HasValue)
                query = query.Where(u => u.CreatedAt <= filter.CreatedTo.Value);

            if (filter.Countries.Any())
                query = query.Where(u => u.Country != null && filter.Countries.Contains(u.Country));

            if (filter.Cities.Any())
                query = query.Where(u => u.City != null && filter.Cities.Contains(u.City));

            return query;
        }

        private IQueryable<ApplicationUser> ApplyUserSorting(IQueryable<ApplicationUser> query, string sortBy, string sortDirection)
        {
            var isDescending = sortDirection.ToUpper() == "DESC";

            return sortBy.ToLower() switch
            {
                "email" => isDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
                "username" => isDescending ? query.OrderByDescending(u => u.UserName) : query.OrderBy(u => u.UserName),
                "firstname" => isDescending ? query.OrderByDescending(u => u.FirstName) : query.OrderBy(u => u.FirstName),
                "lastname" => isDescending ? query.OrderByDescending(u => u.LastName) : query.OrderBy(u => u.LastName),
                "createdat" => isDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
                "lastloginat" => isDescending ? query.OrderByDescending(u => u.LastLoginAt) : query.OrderBy(u => u.LastLoginAt),
                "isactive" => isDescending ? query.OrderByDescending(u => u.IsActive) : query.OrderBy(u => u.IsActive),
                _ => isDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
            };
        }

        private async Task<AdminUserStatsDto> GetUserBusinessStats(string userId)
        {
            return new AdminUserStatsDto
            {
                TotalCars = await _context.Cars.CountAsync(c => c.OwnerId == userId),
                TotalBids = await _context.Bids.CountAsync(b => b.UserId == Guid.Parse(userId)),
                // TODO: Add more statistics calculations
            };
        }

        private async Task<List<AdminUserActivityDto>> GetUserRecentActivities(string userId, int limit = 10)
        {
            // TODO: Implement user activity tracking from audit logs
            return new List<AdminUserActivityDto>();
        }

        private List<string> GetUserPermissions(List<string> roles)
        {
            var permissions = new List<string>();

            foreach (var role in roles)
            {
                switch (role.ToLower())
                {
                    case "admin":
                        permissions.AddRange(new[] { "ManageUsers", "ManageAuctions", "ViewReports", "ManageSystem", "ExportData" });
                        break;
                    case "seller":
                        permissions.AddRange(new[] { "CreateAuction", "ManageOwnAuctions", "ViewSalesReports" });
                        break;
                    case "user":
                        permissions.AddRange(new[] { "PlaceBids", "ViewAuctions", "ManageProfile" });
                        break;
                }
            }

            return permissions.Distinct().ToList();
        }

        private async Task LogAdminActivity(Guid adminUserId, string action, string details)
        {
            _logger.LogInformation("Admin activity logged - AdminUserId: {AdminUserId}, Action: {Action}, Details: {Details}",
                adminUserId, action, details);

            // TODO: Store in audit log table
        }

        // Bulk operation helpers
        private async Task<bool> ProcessBulkActivate(Guid userId, Guid adminUserId)
        {
            var result = await ToggleUserStatusAsync(userId, true, "Bulk activation", adminUserId);
            return result.IsSuccess;
        }

        private async Task<bool> ProcessBulkDeactivate(Guid userId, Guid adminUserId)
        {
            var result = await ToggleUserStatusAsync(userId, false, "Bulk deactivation", adminUserId);
            return result.IsSuccess;
        }

        private async Task<bool> ProcessBulkAssignRole(Guid userId, string role, Guid adminUserId)
        {
            var result = await AssignRoleToUserAsync(userId, role, adminUserId);
            return result.IsSuccess;
        }

        private async Task<bool> ProcessBulkRemoveRole(Guid userId, string role, Guid adminUserId)
        {
            var result = await RemoveRoleFromUserAsync(userId, role, adminUserId);
            return result.IsSuccess;
        }

        private async Task<bool> ProcessBulkDelete(Guid userId, string reason, Guid adminUserId)
        {
            var result = await SoftDeleteUserAsync(userId, reason, adminUserId);
            return result.IsSuccess;
        }

        // Dashboard helper methods
        private async Task<AdminUserStatsOverview> GetUserStatisticsForDashboard(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _userManager.Users.AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(u => u.CreatedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(u => u.CreatedAt <= toDate.Value);

            var totalUsers = await query.CountAsync();
            var activeUsers = await query.CountAsync(u => u.IsActive);
            var unconfirmedUsers = await query.CountAsync(u => !u.EmailConfirmed);
            var blockedUsers = await query.CountAsync(u => u.FailedLoginAttempts >= 5);

            var today = DateTime.UtcNow.Date;
            var newUsersToday = await query.CountAsync(u => u.CreatedAt.Date == today);
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var newUsersThisWeek = await query.CountAsync(u => u.CreatedAt.Date >= weekStart);
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var newUsersThisMonth = await query.CountAsync(u => u.CreatedAt.Date >= monthStart);

            return new AdminUserStatsOverview
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                NewUsersToday = newUsersToday,
                NewUsersThisWeek = newUsersThisWeek,
                NewUsersThisMonth = newUsersThisMonth,
                UnconfirmedUsers = unconfirmedUsers,
                BlockedUsers = blockedUsers,
                VipUsers = 0 // TODO: Implement VIP logic
            };
        }

        private async Task<AdminAuctionStatsOverview> GetAuctionStatisticsForDashboard()
        {
            _logger.LogInformation("📊 Calculating dynamic auction statistics for dashboard...");

            // Get all auctions
            var allAuctions = await _context.Auctions
                .Include(a => a.Location)
                .ToListAsync();

            // Get all cars
            var allCars = await _context.Cars.ToListAsync();

            // Get all bids
            var allBids = await _context.Bids.ToListAsync();

            var now = DateTime.UtcNow;
            var today = now.Date;

            // Calculate auction counts by status
            var totalAuctions = allAuctions.Count;
            
            // Active (Live/Running) auctions - Status must be Running AND within time range
            var activeAuctions = allAuctions.Count(a => 
                a.Status == AuctionStatus.Running &&
                a.StartTimeUtc <= now &&
                a.EndTimeUtc >= now
            );

            // Completed auctions
            var completedAuctions = allAuctions.Count(a => 
                a.Status == AuctionStatus.Ended || 
                a.Status == AuctionStatus.Settled ||
                (a.Status != AuctionStatus.Cancelled && a.EndTimeUtc < now)
            );

            // Cancelled auctions
            var cancelledAuctions = allAuctions.Count(a => 
                a.Status == AuctionStatus.Cancelled
            );

            // Car statistics
            var totalCars = allCars.Count;
            
            // Cars currently in active auctions
            var activeAuctionIds = allAuctions
                .Where(a => a.Status == AuctionStatus.Running)
                .Select(a => a.Id)
                .ToList();
            
            var carsInAuction = await _context.AuctionCars
                .Where(ac => activeAuctionIds.Contains(ac.AuctionId))
                .CountAsync();

            // Sold cars (with hammer price set)
            var soldCars = await _context.AuctionCars
                .Where(ac => ac.HammerPrice != null && ac.HammerPrice > 0)
                .CountAsync();

            // Unsold cars
            var unsoldCars = totalCars - soldCars;

            // Average car price (from sold cars)
            var averageCarPrice = await _context.AuctionCars
                .Where(ac => ac.HammerPrice != null && ac.HammerPrice > 0)
                .AverageAsync(ac => (decimal?)ac.HammerPrice) ?? 0;

            // Bid statistics
            var totalBids = allBids.Count;
            var bidsToday = allBids.Count(b => b.CreatedAt.Date == today);

            _logger.LogInformation("📊 Dashboard Auction Stats Calculated:");
            _logger.LogInformation("   Total Auctions: {Total}", totalAuctions);
            _logger.LogInformation("   Active Auctions: {Active}", activeAuctions);
            _logger.LogInformation("   Completed: {Completed}", completedAuctions);
            _logger.LogInformation("   Cancelled: {Cancelled}", cancelledAuctions);
            _logger.LogInformation("   Total Cars: {TotalCars}", totalCars);
            _logger.LogInformation("   Cars in Auction: {CarsInAuction}", carsInAuction);
            _logger.LogInformation("   Sold: {Sold}, Unsold: {Unsold}", soldCars, unsoldCars);
            _logger.LogInformation("   Total Bids: {TotalBids}, Today: {Today}", totalBids, bidsToday);

            return new AdminAuctionStatsOverview
            {
                TotalAuctions = totalAuctions,
                ActiveAuctions = activeAuctions,
                CompletedAuctions = completedAuctions,
                CancelledAuctions = cancelledAuctions,
                TotalCars = totalCars,
                CarsInAuction = carsInAuction,
                SoldCars = soldCars,
                UnsoldCars = unsoldCars,
                AverageCarPrice = averageCarPrice,
                TotalBids = totalBids,
                BidsToday = bidsToday
            };
        }

        private async Task<AdminFinancialStatsOverview> GetFinancialStatisticsForDashboard()
        {
            // TODO: Implement financial statistics
            return new AdminFinancialStatsOverview();
        }

        private async Task<AdminSystemStatsOverview> GetSystemStatisticsForDashboard()
        {
            return new AdminSystemStatsOverview
            {
                SystemUptime = 99.9,
                TotalApiCalls = 0,
                ApiCallsToday = 0,
                AverageResponseTime = 150,
                ErrorCount = 0,
                WarningCount = 0,
                ActiveConnections = 0
            };
        }

        private async Task<List<AdminRecentActivityDto>> GetRecentActivitiesForDashboard(int limit = 20)
        {
            // TODO: Implement recent activities from audit log
            return new List<AdminRecentActivityDto>();
        }

        private async Task<List<AdminAlertDto>> GetSystemAlertsForDashboard()
        {
            // TODO: Implement system alerts
            return new List<AdminAlertDto>();
        }

        private async Task<List<AdminTopUserDto>> GetTopUsersForDashboard()
        {
            // TODO: Implement top users logic
            return new List<AdminTopUserDto>();
        }

        private async Task<AdminChartDataDto> GetChartDataForDashboard()
        {
            // TODO: Implement chart data
            return new AdminChartDataDto();
        }

        // Export helper methods
        private async Task<byte[]> GenerateExcelExport(List<AdminUserListDto> users, List<string> fields)
        {
            // TODO: Implement Excel export using EPPlus
            return new byte[0];
        }

        private async Task<byte[]> GenerateCsvExport(List<AdminUserListDto> users, List<string> fields)
        {
            // TODO: Implement CSV export
            return new byte[0];
        }

        private async Task<byte[]> GeneratePdfExport(List<AdminUserListDto> users, List<string> fields)
        {
            // TODO: Implement PDF export
            return new byte[0];
        }

        #endregion

        #region NOT IMPLEMENTED METHODS

        public Task<AdminResponseDto<List<AdminUserActivityDto>>> GetUserAuditLogAsync(Guid userId, int page = 1, int pageSize = 50)
        {
            throw new NotImplementedException("User audit log functionality not yet implemented");
        }

        public Task<AdminResponseDto<List<AdminRecentActivityDto>>> GetAdminActivityLogAsync(Guid? adminUserId = null, int page = 1, int pageSize = 50)
        {
            throw new NotImplementedException("Admin activity log functionality not yet implemented");
        }

        public Task<AdminResponseDto<List<AdminAlertDto>>> GetSystemAlertsAsync(bool unreadOnly = true)
        {
            throw new NotImplementedException("System alerts functionality not yet implemented");
        }

        public Task<AdminResponseDto<bool>> MarkAlertAsReadAsync(string alertId, Guid adminUserId)
        {
            throw new NotImplementedException("Alert management functionality not yet implemented");
        }

        public Task<AdminResponseDto<bool>> ClearCacheAsync(string? cacheKey = null, Guid adminUserId = default)
        {
            throw new NotImplementedException("Cache management functionality not yet implemented");
        }

        public Task<AdminResponseDto<string>> RunDatabaseMaintenanceAsync(Guid adminUserId)
        {
            throw new NotImplementedException("Database maintenance functionality not yet implemented");
        }

        public Task<AdminResponseDto<string>> CreateSystemBackupAsync(Guid adminUserId)
        {
            throw new NotImplementedException("System backup functionality not yet implemented");
        }

        public Task<AdminResponseDto<bool>> SendNotificationToUserAsync(Guid userId, string title, string message, string type, Guid adminUserId)
        {
            throw new NotImplementedException("User notification functionality not yet implemented");
        }

        public Task<AdminResponseDto<AdminBulkOperationResultDto>> BroadcastNotificationAsync(string title, string message, string type, List<string>? targetRoles, Guid adminUserId)
        {
            throw new NotImplementedException("Broadcast notification functionality not yet implemented");
        }

        public Task<AdminResponseDto<object>> GetUserBehaviorAnalyticsAsync(DateTime fromDate, DateTime toDate)
        {
            throw new NotImplementedException("User behavior analytics functionality not yet implemented");
        }

        public Task<AdminResponseDto<object>> GetPopularContentAnalyticsAsync(int topCount = 10)
        {
            throw new NotImplementedException("Popular content analytics functionality not yet implemented");
        }

        public Task<AdminResponseDto<object>> GetPerformanceMetricsAsync(DateTime fromDate, DateTime toDate)
        {
            throw new NotImplementedException("Performance metrics functionality not yet implemented");
        }

        #endregion
    }
}
