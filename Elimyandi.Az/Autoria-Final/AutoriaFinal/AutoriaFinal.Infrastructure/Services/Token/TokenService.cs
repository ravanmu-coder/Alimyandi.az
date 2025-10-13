
using AutoriaFinal.Contract.Dtos.Identity.Token;
using AutoriaFinal.Contract.Services.Token;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace AutoriaFinal.Infrastructure.Services.Token
{
    public class TokenService : ITokenService
    {
        #region FIELDS & CONSTRUCTOR
        private readonly IConfiguration _configuration;
        private readonly ILogger<TokenService> _logger;
        private string _secretKey;
        private string _issuer;
        private string _audience;
        private int _tokenExpiryMinutes;
        private static readonly ConcurrentDictionary<string, DateTime> _revokedTokens = new();
        private static readonly ConcurrentDictionary<string, HashSet<string>> _userTokens = new();
        public TokenService(IConfiguration configuration, ILogger<TokenService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _secretKey = _configuration["Jwt:Key"] ?? throw new Exception("JWT Key konfiqurasiya edilməyib");
            _issuer = _configuration["Jwt:Issuer"] ?? throw new Exception("JWT Issuer konfiqurasiya edilməyib");
            _audience = _configuration["Jwt:Audience"] ?? throw new Exception("JWT Audience konfiqurasiya edilməyib");

            if (!int.TryParse(_configuration["Jwt:ExpireMinutes"], out _tokenExpiryMinutes))
            {
                _tokenExpiryMinutes = 1440; // Default 24 hours
            }

            if (_secretKey.Length < 32)
            {
                throw new Exception("JWT Key minimum 32 simvol güclü olmalıdır");
            }

            _logger.LogInformation("TokenService initialized - Expiry: {ExpiryMinutes} minutes", _tokenExpiryMinutes);
        }
        #endregion
        #region Token Generation
        public async Task<(string Token, DateTime Expires)> GenerateTokenAsync(TokenGenerationRequest request)
        {
            _logger.LogInformation("Generating JWT token for user: {UserId} ({Email})", request.UserId, request.Email);

            if (string.IsNullOrWhiteSpace(request.UserId))
                throw new Exception("User ID tələb olunur");

            if (string.IsNullOrWhiteSpace(request.Email))
                throw new Exception("Email tələb olunur");

            if (request.ExpiresAt <= DateTime.UtcNow)
                throw new Exception("Token bitmə tarixi gələcəkdə olmalıdır");

            var jti = Guid.NewGuid().ToString();
            var issuedAt = DateTime.UtcNow;
            var expiresAt = request.ExpiresAt != default ? request.ExpiresAt : issuedAt.AddMinutes(_tokenExpiryMinutes);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, request.UserId),
                new(JwtRegisteredClaimNames.Email, request.Email),
                new(JwtRegisteredClaimNames.Jti, jti),
                new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(issuedAt).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new(JwtRegisteredClaimNames.Iss, _issuer),
                new(JwtRegisteredClaimNames.Aud, _audience),
                
                new(ClaimTypes.NameIdentifier, request.UserId),
                new(ClaimTypes.Email, request.Email),
                new(ClaimTypes.Name, request.UserName ?? request.Email.Split('@')[0])
            };

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, request.Role));
                _logger.LogDebug("Added primary role: {Role}", request.Role);
            }

            var addedRoles = new HashSet<string>();
            foreach (var role in request.Roles.Where(r => !string.IsNullOrWhiteSpace(r)))
            {
                if (addedRoles.Add(role)) // Avoid duplicates
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                    _logger.LogDebug("Added role: {Role}", role);
                }
            }

            foreach (var customClaim in request.AdditionalClaims)
            {
                if (!string.IsNullOrWhiteSpace(customClaim.Key) && !string.IsNullOrWhiteSpace(customClaim.Value))
                {
                    claims.Add(new Claim(customClaim.Key, customClaim.Value));
                }
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expiresAt,
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = credentials,
                NotBefore = issuedAt,
                IssuedAt = issuedAt
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(securityToken);

            if (!_userTokens.ContainsKey(request.UserId))
            {
                _userTokens[request.UserId] = new HashSet<string>();
            }
            _userTokens[request.UserId].Add(jti);

            _logger.LogInformation("JWT token generated successfully for user {UserId} - JTI: {JTI}, Claims: {ClaimsCount}, Expires: {ExpiresAt}",
                request.UserId, jti, claims.Count, expiresAt);

            return (tokenString, expiresAt);
        }

        public async Task<string> GenerateRefreshTokenAsync()
        {
            _logger.LogDebug("Generating refresh token");

            var randomBytes = new byte[64]; // 512 bits
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);

            var refreshToken = Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');

            if (string.IsNullOrWhiteSpace(refreshToken))
                throw new Exception("Refresh token yaradıla bilmədi");

            _logger.LogDebug("Refresh token generated - Length: {Length}", refreshToken.Length);
            return refreshToken;
        }

        public async Task<string> GenerateEmailConfirmationTokenAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new Exception("User ID tələb olunur");

            var tokenBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(tokenBytes);

            var token = Convert.ToBase64String(tokenBytes).Replace("/", "_").Replace("+", "-").TrimEnd('=');

            _logger.LogDebug("Email confirmation token generated for user: {UserId}", userId);
            return token;
        }

        public async Task<string> GeneratePasswordResetTokenAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new Exception("User ID tələb olunur");

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var tokenBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(tokenBytes);

            var randomPart = Convert.ToBase64String(tokenBytes).Replace("/", "_").Replace("+", "-").TrimEnd('=');
            var token = $"{timestamp}:{randomPart}";

            _logger.LogDebug("Password reset token generated for user: {UserId}", userId);
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(token));
        }
        #endregion
        #region TOKEN VALIDATION
        public async Task<bool> ValidateTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("Token validation failed: Empty token");
                throw new Exception("Token boş ola bilməz");
            }
            if (await IsTokenRevokedAsync(token))
            {
                _logger.LogWarning("Token validation failed: Token is revoked");
                throw new   Exception("Token ləğv edilib");
            }

            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(token))
            {
                _logger.LogWarning("Token validation failed: Invalid format");
                throw new Exception("Token formatı səhvdir");
            }

            var validationParameters = CreateTokenValidationParameters();

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken)
                throw new Exception("Token JWT formatında deyil");

            if (!jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256Signature, StringComparison.InvariantCultureIgnoreCase))
                throw new Exception("Token algoritmi dəstəklənmir");

            ValidateRequiredClaims(principal);

            _logger.LogDebug("Token validation successful");
            return true;
        }

        public async Task<ValidateTokenResponse> ValidateTokenDetailedAsync(ValidateTokenRequest request)
        {
            var response = new ValidateTokenResponse();

            if (string.IsNullOrWhiteSpace(request.Token))
            {
                response.IsValid = false;
                response.Message = "Token boş ola bilməz";
                return response;
            }

            // ✅ Check if revoked
            if (await IsTokenRevokedAsync(request.Token))
            {
                response.IsValid = false;
                response.Message = "Token ləğv edilib";
                return response;
            }

            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(request.Token))
            {
                response.IsValid = false;
                response.Message = "Token formatı səhvdir";
                return response;
            }

            var validationParameters = CreateTokenValidationParameters();

            var principal = tokenHandler.ValidateToken(request.Token, validationParameters, out var validatedToken);
            var jwtToken = validatedToken as JwtSecurityToken;

            response.IsValid = true;
            response.Message = "Token etibarlıdır";

            if (request.IncludeRemainingTime && jwtToken != null)
            {
                response.RemainingTime = jwtToken.ValidTo > DateTime.UtcNow
                    ? jwtToken.ValidTo - DateTime.UtcNow
                    : TimeSpan.Zero;

                response.ShouldRefresh = response.RemainingTime < TimeSpan.FromMinutes(30);
            }

            // ✅ Include claims if requested
            if (request.IncludeClaims)
            {
                response.Claims = principal.Claims
                    .Where(c => !string.IsNullOrWhiteSpace(c.Value))
                    .ToDictionary(c => c.Type, c => c.Value);
            }

            return response;
        }
        #endregion

        #region TOKEN INFORMATION
        public async Task<ClaimsPrincipal?> GetClaimsFromTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new Exception("Token boş ola bilməz");

            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(token))
                throw new Exception("Token formatı səhvdir");

            var validationParameters = CreateTokenValidationParameters(validateLifetime: false); // Allow expired tokens for claim extraction

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken)
                throw new Exception("Token JWT formatında deyil");

            return principal;
        }

        public async Task<TimeSpan?> GetTokenRemainingTimeAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new Exception("Token boş ola bilməz");

            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(token))
                throw new Exception("Token formatı səhvdir");

            var jwtToken = tokenHandler.ReadJwtToken(token);

            if (jwtToken.ValidTo <= DateTime.UtcNow)
                return TimeSpan.Zero; // Expired

            return jwtToken.ValidTo - DateTime.UtcNow;
        }

        public async Task<string> GetUserIdFromTokenAsync(string token)
        {
            var principal = await GetClaimsFromTokenAsync(token);

            var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)
                            ?? principal?.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim == null || string.IsNullOrWhiteSpace(userIdClaim.Value))
                throw new Exception("Token-də istifadəçi ID tapılmadı");

            return userIdClaim.Value;
        }

        public async Task<string> GetEmailFromTokenAsync(string token)
        {
            var principal = await GetClaimsFromTokenAsync(token);

            var emailClaim = principal?.FindFirst(ClaimTypes.Email)
                          ?? principal?.FindFirst(JwtRegisteredClaimNames.Email);

            if (emailClaim == null || string.IsNullOrWhiteSpace(emailClaim.Value))
                throw new Exception("Token-də email tapılmadı");

            return emailClaim.Value;
        }

        public async Task<List<string>> GetRolesFromTokenAsync(string token)
        {
            var principal = await GetClaimsFromTokenAsync(token);

            return principal?.FindAll(ClaimTypes.Role)
                          .Select(c => c.Value)
                          .Where(r => !string.IsNullOrWhiteSpace(r))
                          .ToList() ?? new List<string>();
        }
        #endregion

        #region TOKEN MANAGEMENT
        public async Task<bool> RevokeTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new Exception("Token boş ola bilməz");

            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(token))
                throw new Exception("Token formatı səhvdir");

            var jwtToken = tokenHandler.ReadJwtToken(token);
            var jti = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

            if (string.IsNullOrWhiteSpace(jti))
            {
                _logger.LogWarning("Token revocation failed: JTI not found");
                return false;
            }

            _revokedTokens[jti] = jwtToken.ValidTo;

            _logger.LogInformation("Token revoked successfully - JTI: {JTI}", jti);
            return true;
        }

        public async Task<bool> IsTokenRevokedAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return false;

            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(token))
                return false;

            var jwtToken = tokenHandler.ReadJwtToken(token);
            var jti = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

            if (string.IsNullOrWhiteSpace(jti))
                return false;

            if (_revokedTokens.TryGetValue(jti, out var revokedExpiry))
            {
                if (revokedExpiry <= DateTime.UtcNow)
                {
                    _revokedTokens.TryRemove(jti, out _);
                    return false;
                }
                return true;
            }

            return false;
        }

        public async Task<int> RevokeAllUserTokensAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new Exception("User ID tələb olunur");

            if (!_userTokens.TryGetValue(userId, out var userTokens))
            {
                return 0; // No tokens found for user
            }

            var revokedCount = 0;
            var currentTime = DateTime.UtcNow.AddDays(1); // Revoke until tomorrow

            foreach (var jti in userTokens)
            {
                _revokedTokens[jti] = currentTime;
                revokedCount++;
            }

            _userTokens.TryRemove(userId, out _);

            _logger.LogInformation("Revoked {Count} tokens for user: {UserId}", revokedCount, userId);
            return revokedCount;
        }
        #endregion

        #region PRIVATE HELPERS
        private TokenValidationParameters CreateTokenValidationParameters(bool validateLifetime = true)
        {
            return new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = validateLifetime,
                RequireExpirationTime = true,
                RequireSignedTokens = true,
                ClockSkew = TimeSpan.FromMinutes(5), // 5 minute tolerance
                RequireAudience = true
            };
        }

        private void ValidateRequiredClaims(ClaimsPrincipal principal)
        {
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrWhiteSpace(userIdClaim.Value))
                throw new Exception("Token-də istifadəçi ID tapılmadı");

            var emailClaim = principal.FindFirst(ClaimTypes.Email);
            if (emailClaim == null || string.IsNullOrWhiteSpace(emailClaim.Value))
                throw new Exception("Token-də email tapılmadı");
        }

        public async Task CleanupExpiredRevokedTokensAsync()
        {
            var now = DateTime.UtcNow;
            var expiredTokens = _revokedTokens
                .Where(kvp => kvp.Value <= now)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var jti in expiredTokens)
            {
                _revokedTokens.TryRemove(jti, out _);
            }

            if (expiredTokens.Count > 0)
            {
                _logger.LogInformation("Cleaned up {Count} expired revoked tokens", expiredTokens.Count);
            }
        }
        #endregion
    }
}