using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Email tələb olunur")]
        [EmailAddress(ErrorMessage = "Düzgün email formatı daxil edin")]
        [StringLength(100, ErrorMessage = "Email maksimum 100 simvol ola bilər")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Parol tələb olunur")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Parol boş ola bilməz")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
    }
}
