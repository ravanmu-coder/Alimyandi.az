using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity.Token
{
    public class ValidateTokenRequest
    {
        [Required(ErrorMessage = "Token tələb olunur")]
        public string Token { get; set; } = string.Empty;
        public bool IncludeRemainingTime { get; set; } = true;
        public bool IncludeClaims { get; set; } = false;
    }
    public class ValidateTokenResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public TimeSpan? RemainingTime { get; set; }
        public Dictionary<string, string> Claims { get; set; } = new();
        public bool ShouldRefresh { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
