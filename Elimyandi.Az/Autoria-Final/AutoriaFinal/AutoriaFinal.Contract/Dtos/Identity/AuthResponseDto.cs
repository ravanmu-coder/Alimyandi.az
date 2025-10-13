using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity
{
    public class AuthResponseDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserDto? User { get; set; }
        public LoginInfoDto? LoginInfo { get; set; }
        public string? RefreshToken { get; set; }
        public List<string> Errors { get; set; } = new();
        public int ExpiresInMinutes => (int)(ExpiresAt - DateTime.UtcNow).TotalMinutes;
        public bool IsTokenExpired => ExpiresAt <= DateTime.UtcNow;
    }
}
