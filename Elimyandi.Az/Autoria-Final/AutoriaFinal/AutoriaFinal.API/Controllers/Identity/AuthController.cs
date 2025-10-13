using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Application.Services.Identity;
using AutoriaFinal.Contract.Dtos.Identity;
using AutoriaFinal.Contract.Services.Identity;
using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoriaFinal.API.Controllers.Identity
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
       private readonly IAuthService _authService;
        private readonly IGoogleAuthService _googleAuthService;
        private readonly ILogger<AuthController> _logger;
        public AuthController(
            IAuthService authService,
            IGoogleAuthService googleAuthService,
            ILogger<AuthController> logger)
        {
            _authService = authService;
            _googleAuthService = googleAuthService;
            _logger = logger;
        }
        #region AUTHENTICATION ENDPOINTS
        // İstifadəçi qeydiyyatı - Rol seçimi ilə
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            _logger.LogInformation("🚀 Registration request received for: {Email}", dto.Email);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("❌ Registration validation failed for: {Email}", dto.Email);
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(dto);

            _logger.LogInformation("✅ Registration successful for: {Email} with role: {Role}", dto.Email, dto.Role);
            return Ok(result);
        }
        // İstifadəçi girişi
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            _logger.LogInformation("🔑 Login request received for: {Email}", dto.Email);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("❌ Login validation failed for: {Email}", dto.Email);
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(dto);

            _logger.LogInformation("✅ Login successful for: {Email}", dto.Email);
            return Ok(result);
        }
        // İstifadəçi çıxışı(Token ləğvi)
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Logout()
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("🚪 Logout request for user: {UserId}", userId);

            var result = await _authService.LogoutAsync(userId);

            _logger.LogInformation("✅ Logout successful for user: {UserId}", userId);
            return Ok(result);
        }
        #endregion

        #region Google AUTHENTICATION
        [HttpGet("login-google")]
        public IActionResult LoginGoogle()
        {
            var redirectUrl = Url.Action(nameof(GoogleResponse), "Authorization");
            var properties = new AuthenticationProperties
            {
                RedirectUri = redirectUrl
            };
            return Challenge(properties, "Google");
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            var jwt = await _googleAuthService.HandleGoogleLoginAsync();


            var script = $@"
                <script>
                    window.opener.postMessage({{ token: '{jwt}' }}, 'https://localhost:7249');
                    window.close();
                </script>";
            return Content(script, "text/html");
        }
        #endregion

        #region EMAIL CONFIRMATION
        /// Email təsdiqi (Email-dən gələn linkdən)
        [HttpGet("confirmemail")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status302Found)] // Redirect response
        public async Task<ActionResult> ConfirmEmail(
    [FromQuery] string userId,
    [FromQuery] string token,
    [FromQuery] string? redirect = null)
        {
            _logger.LogInformation("📧 Email confirmation attempt for user: {UserId}", userId);

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("❌ Invalid email confirmation parameters");

                if (!string.IsNullOrEmpty(redirect))
                {
                    return Redirect($"{redirect}?status=error&message={Uri.EscapeDataString("Səhv parametrlər")}");
                }

                return BadRequest(new
                {
                    Success = false,
                    Message = "Email təsdiqi parametrləri səhvdir",
                    Error = "INVALID_PARAMETERS"
                });
            }

            try
            {
                var result = await _authService.ConfirmEmailAsync(userId, token);

                if (result)
                {
                    _logger.LogInformation("✅ Email confirmed successfully for user: {UserId}", userId);

                    //  Frontend-ə redirect (prioritet)
                    if (!string.IsNullOrEmpty(redirect))
                    {
                        return Redirect($"{redirect}?status=success&message={Uri.EscapeDataString("Email uğurla təsdiqləndi")}");
                    }

                    //  API response (redirect olmadıqda)
                    return Ok(new
                    {
                        Success = true,
                        Message = "✅ Email uğurla təsdiqləndi! İndi giriş edə bilərsiniz.",
                        RedirectUrl = "/login",
                        Actions = new[]
                        {
                    new { Text = "Giriş et", Url = "/login" },
                    new { Text = "Ana səhifə", Url = "/" }
                }
                    });
                }
                else
                {
                    if (!string.IsNullOrEmpty(redirect))
                    {
                        return Redirect($"{redirect}?status=error&message={Uri.EscapeDataString("Email təsdiqi uğursuz")}");
                    }

                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Email təsdiqi uğursuz",
                        Error = "CONFIRMATION_FAILED"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Email confirmation error for user: {UserId}", userId);

                if (!string.IsNullOrEmpty(redirect))
                {
                    return Redirect($"{redirect}?status=error&message={Uri.EscapeDataString("Email təsdiqi xətası")}");
                }

                return BadRequest(new
                {
                    Success = false,
                    Message = "Email təsdiqi zamanı xəta baş verdi",
                    Error = "CONFIRMATION_ERROR",
                    Details = ex.Message
                });
            }
        }
        /// Email təsdiqi yenidən göndər
        [HttpPost("resend-confirmation")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> ResendEmailConfirmation([FromBody] ResendConfirmationDto dto)
        {
            _logger.LogInformation("🔄 Resend confirmation request for: {Email}", dto.Email);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            await _authService.ResendEmailConfirmationAsync(dto.Email);

            return Ok(new
            {
                Success = true,
                Message = "📧 Email təsdiqi yenidən göndərildi. Email-nizi yoxlayın.",
                Instructions = new[]
                {
                    "Email-inizi yoxlayın (spam qovluğunu da)",
                    "Təsdiqləmə linkini kliklənyin",
                    "Əgər link işləmirsə, səhifəni yenilənyin"
                }
            });
        }

        #endregion

        #region PASSWORD MANAGEMENT
        /// Parol unutma tələbi (Email göndərimi)
        [HttpPost("forgot-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            _logger.LogInformation("🔑 Password reset request for: {Email}", dto.Email);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            dto.IpAddress = GetClientIpAddress();
            dto.UserAgent = Request.Headers.UserAgent.ToString();

            await _authService.ForgotPasswordAsync(dto);

            // Təhlükəsizlik: həmişə success message (email enumeration prevention)
            return Ok(new
            {
                Success = true,
                Message = "🔐 Əgər bu email qeydiyyatdadırsa, parol sıfırlama təlimatları göndəriləcək.",
                Instructions = new[]
                {
                    "Email-inizi yoxlayın (5-10 dəqiqə ərzində gəlməlidir)",
                    "Spam/Junk qovluğunu da yoxlayın",
                    "Parol sıfırlama linkini kliklənyin",
                    "Yeni güclü parol yaradın"
                },
                EstimatedDelivery = "5-10 dəqiqə",
                ValidFor = "1 saat"
            });
        }
        /// Parol sıfırlama (Token ilə yeni parol təyin etmə)
        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuthResponseDto>> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            _logger.LogInformation("🔄 Password reset attempt for: {Email}", dto.Email);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.ResetPasswordAsync(dto);

            _logger.LogInformation("✅ Password reset successful for: {Email}", dto.Email);
            return Ok(result);
        }

        #endregion

        #region USER PROFILE MANAGEMENT
        /// Hazırkı istifadəçinin profil məlumatları
        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();
            _logger.LogDebug("👤 Profile request for user: {UserId}", userId);

            var user = await _authService.GetUserProfileAsync(userId);

            return Ok(new
            {
                Success = true,
                Data = user,
                Message = "Profil məlumatları uğurla alındı"
            });
        }

        /// İstifadəçi profil yenilənməsi
        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("✏️ Profile update request for user: {UserId}", userId);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            await _authService.UpdateUserProfileAsync(userId, dto);

            //  Updated profile məlumatlarını qaytır
            var updatedUser = await _authService.GetUserProfileAsync(userId);

            return Ok(new
            {
                Success = true,
                Data = updatedUser,
                Message = "✅ Profil uğurla yeniləndi",
                UpdatedFields = GetUpdatedFields(dto)
            });
        }
        /// Hazırkı istifadəçinin token məlumatları
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            var userEmail = GetCurrentUserEmail();
            var userRoles = GetCurrentUserRoles();

            _logger.LogDebug("👤 Current user token info: {UserId}", userId);

            var user = await _authService.GetUserProfileAsync(userId);
            var token = GetBearerToken();
            TimeSpan? remainingTime = null;
            if (!string.IsNullOrEmpty(token))
            {
                remainingTime = await _authService.GetTokenRemainingTimeAsync(token);
            }

            return Ok(new
            {
                Success = true,
                Data = user,
                TokenInfo = new
                {
                    UserId = userId,
                    Email = userEmail,
                    Roles = userRoles,
                    IsAuthenticated = true,
                    RemainingTime = remainingTime,
                    RemainingMinutes = remainingTime?.TotalMinutes,
                    ShouldRefresh = remainingTime?.TotalMinutes <= 30
                },
                Permissions = new
                {
                    CanCreateAuction = userRoles.Contains("Seller") || userRoles.Contains("Admin"),
                    CanManageUsers = userRoles.Contains("Admin"),
                    CanViewReports = userRoles.Contains("Admin") || userRoles.Contains("Seller"),
                    IsAdmin = userRoles.Contains("Admin") || userRoles.Contains("SuperAdmin")
                },
                Message = "İstifadəçi məlumatları və icazələr"
            });
        }

        #endregion

        #region SYSTEM INFO ENDPOINTS
        /// Mövcud rolların siyahısı (Qeydiyyat səhifəsində dropdown üçün)
        [HttpGet("roles")]
        [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetAvailableRoles()
        {
            _logger.LogDebug("📋 Available roles request");

            var roles = await _authService.GetAvailableRolesAsync();

            return Ok(new
            {
                Success = true,
                Data = roles.Select(role => new {
                    Value = role,
                    Label = GetRoleDisplayName(role),
                    Description = GetRoleDescription(role)
                }),
                Message = "Mövcud rollar",
                Count = roles.Count
            });
        }

        /// API sağlamlıq yoxlaması
        [HttpGet("health")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult GetHealth()
        {
            return Ok(new
            {
                Success = true,
                Status = "🟢 Healthy",
                Service = "AuthController",
                Version = "1.0.0",
                Timestamp = DateTime.UtcNow,
                Features = new[]
                {
                    "✅ User Registration with Role Selection",
                    "✅ Email Confirmation",
                    "✅ JWT Authentication",
                    "✅ Password Reset",
                    "✅ Profile Management",
                    "✅ Token Validation"
                }
            });
        }

        #endregion

        #region PRIVATE HELPER METHODS

        /// JWT token-dən istifadəçi ID-sini alır
        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedException("Token-də istifadəçi ID tapılmadı");
        }
        /// JWT token-dən email alır
        private string GetCurrentUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value
                ?? "N/A";
        }
        /// JWT token-dən rolları alır
        private List<string> GetCurrentUserRoles()
        {
            return User.FindAll(ClaimTypes.Role)
                      .Select(c => c.Value)
                      .Where(role => !string.IsNullOrWhiteSpace(role))
                      .ToList();
        }
        /// Authorization header-dən Bearer token alır
        private string GetBearerToken()
        {
            var authHeader = Request.Headers.Authorization.ToString();
            if (authHeader.StartsWith("Bearer "))
            {
                return authHeader.Replace("Bearer ", "");
            }
            return string.Empty;
        }
        /// Client IP ünvanını alır (proxy dəstəyi ilə)
        private string GetClientIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            // ✅ Direct connection IP
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        /// Rol adının görünən versiyasını qaytarır (UI üçün)
        private string GetRoleDisplayName(string role)
        {
            return role switch
            {
                "User" => "İstifadəçi",
                "Seller" => "Satıcı",
                "Admin" => "Administrator",
                "AuctionManager" => "Hərrac Meneceri",
                _ => role
            };
        }
        /// Rol təsvirini qaytarır
        private string GetRoleDescription(string role)
        {
            return role switch
            {
                "User" => "Hərraca iştirak edə bilər, bid verə bilər",
                "Seller" => "Avtomobil satışa çıxara bilər, hərrac yarada bilər",
                "Admin" => "Sistemin tam idarəçiliyi, bütün icazələr",
                "AuctionManager" => "Hərracları idarə edə bilər, qaydaları tənzimlənir",
                _ => "Standart icazələr"
            };
        }

        /// Yenilənən fieldlərin siyahısını qaytarır (logging üçün)
        private List<string> GetUpdatedFields(UpdateUserDto dto)
        {
            var updatedFields = new List<string>();

            if (!string.IsNullOrWhiteSpace(dto.FirstName)) updatedFields.Add("FirstName");
            if (!string.IsNullOrWhiteSpace(dto.LastName)) updatedFields.Add("LastName");
            if (!string.IsNullOrWhiteSpace(dto.Phone)) updatedFields.Add("Phone");
            if (dto.DateOfBirth.HasValue) updatedFields.Add("DateOfBirth");
            if (!string.IsNullOrWhiteSpace(dto.ProfilePicture)) updatedFields.Add("ProfilePicture");
            if (!string.IsNullOrWhiteSpace(dto.Bio)) updatedFields.Add("Bio");
            if (!string.IsNullOrWhiteSpace(dto.City)) updatedFields.Add("City");
            if (!string.IsNullOrWhiteSpace(dto.Country)) updatedFields.Add("Country");

            return updatedFields;
        }

        #endregion
    }
}
