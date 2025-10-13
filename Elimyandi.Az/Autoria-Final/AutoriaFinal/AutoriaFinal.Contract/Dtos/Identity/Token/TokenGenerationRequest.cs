using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity.Token
{
    public class TokenGenerationRequest
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string UserName { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public List<string> Roles { get; set; } = new();
        public Dictionary<string, string> AdditionalClaims { get; set; } = new();
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(1);
        public bool GenerateRefreshToken { get; set; } = true;
    }
}
