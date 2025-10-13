using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity
{
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Email tələb olunur")]
        [EmailAddress(ErrorMessage = "Düzgün email formatı daxil edin")]
        public string Email { get; set; } = string.Empty;
        public string? CallbackUrl { get; set; }
        public string? IpAddress { get; set; }
        /// İstifadəçinin User Agent məlumatları (təhlükəsizlik üçün)
        public string? UserAgent { get; set; }
    }
}
