using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Admin;
using AutoriaFinal.Contract.Dtos.Identity;
using AutoriaFinal.Contract.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoriaFinal.API.Controllers.Admin
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        #region FIELDS & CONSTRUCTOR

        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IAdminService adminService,
            ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        #endregion

        #region DASHBOARD ENDPOINTS

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminDashboardDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<AdminResponseDto<AdminDashboardDto>>> GetDashboard()
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Dashboard request initiated - AdminUserId: {AdminUserId}", adminUserId);

            var result = await _adminService.GetDashboardAsync();

            _logger.LogInformation("Dashboard request completed - AdminUserId: {AdminUserId}", adminUserId);
            return Ok(result);
        }

        [HttpGet("statistics/users")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminUserStatsOverview>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetUserStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            _logger.LogInformation("User statistics request - FromDate: {FromDate}, ToDate: {ToDate}", fromDate, toDate);

            var result = await _adminService.GetUserStatisticsAsync(fromDate, toDate);
            return Ok(result);
        }

        [HttpGet("system/health")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminSystemStatsOverview>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetSystemHealth()
        {
            _logger.LogInformation("System health check request initiated");

            var result = await _adminService.GetSystemHealthAsync();
            return Ok(result);
        }

        [HttpGet("activities/recent")]
        [ProducesResponseType(typeof(AdminResponseDto<List<AdminRecentActivityDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetRecentActivities([FromQuery] int limit = 50)
        {
            _logger.LogInformation("Recent activities request - Limit: {Limit}", limit);

            var result = await _adminService.GetRecentActivitiesAsync(limit);
            return Ok(result);
        }

        #endregion

        #region USER MANAGEMENT ENDPOINTS

        [HttpGet("users")]
        [ProducesResponseType(typeof(AdminPagedResponseDto<AdminUserListDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AdminPagedResponseDto<AdminUserListDto>>> GetUsers([FromQuery] AdminUserFilterDto filter)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Users list request - AdminUserId: {AdminUserId}, Page: {Page}, Size: {PageSize}",
                adminUserId, filter.Page, filter.PageSize);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state in users list request - AdminUserId: {AdminUserId}", adminUserId);
                return BadRequest(ModelState);
            }

            if (!filter.IsValid())
            {
                _logger.LogWarning("Invalid filter parameters in users list request - AdminUserId: {AdminUserId}", adminUserId);
                throw new BadRequestException("Filter parameters are invalid");
            }

            var result = await _adminService.GetUsersAsync(filter);

            if (result.IsSuccess)
            {
                var responseHeaders = new Dictionary<string, string>
                {
                    { "X-Total-Count", result.Pagination.TotalItems.ToString() },
                    { "X-Total-Pages", result.Pagination.TotalPages.ToString() },
                    { "X-Current-Page", result.Pagination.CurrentPage.ToString() },
                    { "X-Page-Size", result.Pagination.PageSize.ToString() }
                };

                foreach (var header in responseHeaders)
                {
                    Response.Headers.TryAdd(header.Key, header.Value);
                }

                _logger.LogInformation("Users list request completed - AdminUserId: {AdminUserId}, ResultCount: {Count}/{Total}",
                    adminUserId, result.Data?.Count ?? 0, result.Pagination.TotalItems);
            }

            return Ok(result);
        }

        [HttpGet("users/{userId:guid}")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminUserDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AdminResponseDto<AdminUserDetailDto>>> GetUser(Guid userId)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User detail request - UserId: {UserId}, AdminUserId: {AdminUserId}", userId, adminUserId);

            var result = await _adminService.GetUserDetailAsync(userId);

            _logger.LogInformation("User detail request completed - UserId: {UserId}, AdminUserId: {AdminUserId}", userId, adminUserId);
            return Ok(result);
        }

        [HttpGet("users/search")]
        [ProducesResponseType(typeof(AdminResponseDto<List<AdminUserListDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> SearchUsers(
            [FromQuery] string searchTerm,
            [FromQuery] int limit = 10)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User search request - SearchTerm: {SearchTerm}, AdminUserId: {AdminUserId}", searchTerm, adminUserId);

            var result = await _adminService.SearchUsersAsync(searchTerm, limit);
            return Ok(result);
        }

        [HttpPut("users/{userId:guid}/status")]
        [ProducesResponseType(typeof(AdminResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> ToggleUserStatus(
            Guid userId,
            [FromBody] AdminUserStatusChangeDto statusChange)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User status change request - UserId: {UserId}, NewStatus: {Status}, AdminUserId: {AdminUserId}",
                userId, statusChange.IsActive, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.ToggleUserStatusAsync(userId, statusChange.IsActive, statusChange.Reason, adminUserId);
            return Ok(result);
        }

        [HttpPost("users/{userId:guid}/roles")]
        [ProducesResponseType(typeof(AdminResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> AssignRole(
            Guid userId,
            [FromBody] AdminAssignRoleDto assignRole)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Role assignment request - UserId: {UserId}, Role: {Role}, AdminUserId: {AdminUserId}",
                userId, assignRole.Role, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.AssignRoleToUserAsync(userId, assignRole.Role, adminUserId);
            return Ok(result);
        }

        [HttpDelete("users/{userId:guid}/roles/{role}")]
        [ProducesResponseType(typeof(AdminResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> RemoveRole(Guid userId, string role)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Role removal request - UserId: {UserId}, Role: {Role}, AdminUserId: {AdminUserId}",
                userId, role, adminUserId);

            var result = await _adminService.RemoveRoleFromUserAsync(userId, role, adminUserId);
            return Ok(result);
        }

        [HttpPut("users/{userId:guid}/profile")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminUserDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> UpdateUserProfile(
            Guid userId,
            [FromBody] UpdateUserDto updateDto)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User profile update request - UserId: {UserId}, AdminUserId: {AdminUserId}",
                userId, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.UpdateUserProfileAsync(userId, updateDto, adminUserId);
            return Ok(result);
        }

        [HttpDelete("users/{userId:guid}")]
        [ProducesResponseType(typeof(AdminResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> DeleteUser(
            Guid userId,
            [FromBody] AdminDeleteUserDto deleteDto)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User deletion request - UserId: {UserId}, AdminUserId: {AdminUserId}",
                userId, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.SoftDeleteUserAsync(userId, deleteDto.Reason, adminUserId);
            return Ok(result);
        }

        [HttpPost("users/{userId:guid}/restore")]
        [ProducesResponseType(typeof(AdminResponseDto<bool>), StatusCodes.Status200OK)]
        public async Task<ActionResult> RestoreUser(Guid userId)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User restoration request - UserId: {UserId}, AdminUserId: {AdminUserId}",
                userId, adminUserId);

            var result = await _adminService.RestoreUserAsync(userId, adminUserId);
            return Ok(result);
        }

        #endregion

        #region BULK OPERATIONS ENDPOINTS

        [HttpPost("users/bulk")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminBulkOperationResultDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> BulkUserOperation([FromBody] AdminBulkActionDto bulkAction)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Bulk operation request - Action: {Action}, UserCount: {Count}, AdminUserId: {AdminUserId}",
                bulkAction.Action, bulkAction.UserIds.Count, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.BulkUserOperationAsync(bulkAction, adminUserId);
            return Ok(result);
        }

        [HttpPost("users/bulk/email")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminBulkOperationResultDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> BulkSendEmail([FromBody] AdminBulkEmailDto bulkEmail)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Bulk email request - UserCount: {Count}, AdminUserId: {AdminUserId}",
                bulkEmail.UserIds.Count, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.BulkSendEmailAsync(bulkEmail.UserIds, bulkEmail.Subject, bulkEmail.Message, adminUserId);
            return Ok(result);
        }

        [HttpPost("users/bulk/roles")]
        [ProducesResponseType(typeof(AdminResponseDto<AdminBulkOperationResultDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> BulkAssignRole([FromBody] AdminBulkRoleDto bulkRole)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Bulk role assignment request - Role: {Role}, UserCount: {Count}, AdminUserId: {AdminUserId}",
                bulkRole.Role, bulkRole.UserIds.Count, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.BulkAssignRoleAsync(bulkRole.UserIds, bulkRole.Role, adminUserId);
            return Ok(result);
        }

        #endregion

        #region EXPORT & REPORTING ENDPOINTS

        [HttpPost("users/export")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> ExportUsers([FromBody] AdminUserExportDto exportDto)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("User export request - Format: {Format}, AdminUserId: {AdminUserId}",
                exportDto.Format, adminUserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _adminService.ExportUsersAsync(exportDto, adminUserId);

            if (result.IsSuccess && result.Data != null)
            {
                var contentType = exportDto.Format.ToLower() switch
                {
                    "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "csv" => "text/csv",
                    "pdf" => "application/pdf",
                    _ => "application/octet-stream"
                };

                var fileName = exportDto.FileName ?? $"users_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
                var fileExtension = exportDto.Format.ToLower() switch
                {
                    "excel" => ".xlsx",
                    "csv" => ".csv",
                    "pdf" => ".pdf",
                    _ => ".dat"
                };

                _logger.LogInformation("User export completed - FileName: {FileName}, AdminUserId: {AdminUserId}",
                    fileName + fileExtension, adminUserId);

                return File(result.Data, contentType, fileName + fileExtension);
            }

            return BadRequest(result);
        }

        [HttpGet("dashboard/export")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        public async Task<ActionResult> ExportDashboardReport(
            [FromQuery] string format = "Excel",
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var adminUserId = GetCurrentUserId();
            _logger.LogInformation("Dashboard export request - Format: {Format}, AdminUserId: {AdminUserId}",
                format, adminUserId);

            var result = await _adminService.ExportDashboardReportAsync(format, fromDate, toDate, adminUserId);

            if (result.IsSuccess && result.Data != null)
            {
                var contentType = format.ToLower() switch
                {
                    "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "pdf" => "application/pdf",
                    _ => "application/octet-stream"
                };

                var fileName = $"dashboard_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
                var fileExtension = format.ToLower() == "excel" ? ".xlsx" : ".pdf";

                return File(result.Data, contentType, fileName + fileExtension);
            }

            return BadRequest(result);
        }

        #endregion

        #region HEALTH CHECK ENDPOINTS

        [HttpGet("health")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult GetHealth()
        {
            _logger.LogDebug("Admin API health check request");

            return Ok(new
            {
                Status = "Healthy",
                Service = "AdminController",
                Version = "1.0.0",
                Timestamp = DateTime.UtcNow,
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_Environment") ?? "Unknown",
                Features = new[]
                {
                    "User Management with Advanced Filtering",
                    "Dashboard with Real-time Statistics",
                    "Bulk Operations Support",
                    "Export Functionality",
                    "Audit Logging & Activity Tracking",
                    "System Management Tools",
                    "Real-time Notifications",
                    "Advanced Analytics",
                    "Role-based Access Control"
                }
            });
        }

        [HttpGet("info")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult GetInfo()
        {
            return Ok(new
            {
                ApplicationName = "Autoria Admin Panel API",
                Version = "1.0.0",
                BuildDate = "2025-01-08",
                Description = "Professional Enterprise-Level Admin Panel for Autoria Auction Platform",
                Documentation = new
                {
                    Swagger = "/swagger",
                    Endpoints = new[]
                    {
                        "GET /api/admin/dashboard - Admin Dashboard",
                        "GET /api/admin/users - User Management",
                        "POST /api/admin/users/bulk - Bulk Operations",
                        "POST /api/admin/users/export - Data Export",
                        "GET /api/admin/analytics/* - Analytics",
                        "POST /api/admin/notifications/* - Notifications"
                    }
                },
                Security = new
                {
                    Authentication = "JWT Bearer Token",
                    Authorization = "Role-based (Admin, SuperAdmin)",
                    AuditLogging = "Enabled",
                    RateLimiting = "Enabled"
                }
            });
        }

        #endregion

        #region PRIVATE HELPER METHODS

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim))
            {
                _logger.LogError("No user ID found in JWT token");
                throw new UnauthorizedException("User ID not found in token");
            }

            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                _logger.LogError("Invalid user ID format in JWT token - UserIdClaim: {UserIdClaim}", userIdClaim);
                throw new UnauthorizedException("Invalid user ID format in token");
            }

            return userId;
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown";
        }

        private List<string> GetCurrentUserRoles()
        {
            return User.FindAll(ClaimTypes.Role)
                      .Select(c => c.Value)
                      .Where(role => !string.IsNullOrWhiteSpace(role))
                      .ToList();
        }

        private bool IsSuperAdmin()
        {
            return User.IsInRole("SuperAdmin");
        }

        #endregion
    }

    #region ADDITIONAL DTO MODELS FOR CONTROLLER

    public class AdminUserStatusChangeDto
    {
        public bool IsActive { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class AdminAssignRoleDto
    {
        public string Role { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    public class AdminDeleteUserDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class AdminBulkEmailDto
    {
        public List<Guid> UserIds { get; set; } = new();
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class AdminBulkRoleDto
    {
        public List<Guid> UserIds { get; set; } = new();
        public string Role { get; set; } = string.Empty;
    }

    public class AdminSendNotificationDto
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "Info";
    }

    public class AdminBroadcastNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "Info";
        public List<string>? TargetRoles { get; set; }
    }

    #endregion
}
