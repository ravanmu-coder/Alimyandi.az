using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "İstifadəçi adı tələb olunur")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "İstifadəçi adı 3-50 simvol arası olmalıdır")]
        [RegularExpression(@"^[a-zA-Z0-9_.-]+$", ErrorMessage = "İstifadəçi adı yalnız hərf, rəqəm, _, -, . simvollarını ehtiva edə bilər")]
        public string UserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email tələb olunur")]
        [EmailAddress(ErrorMessage = "Düzgün email formatı daxil edin")]
        [StringLength(100, ErrorMessage = "Email maksimum 100 simvol ola bilər")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Parol tələb olunur")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Parol 6-100 simvol arası olmalıdır")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Parol təkrarı tələb olunur")]
        [Compare("Password", ErrorMessage = "Parollar uyğun gəlmir")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ad tələb olunur")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Ad 2-50 simvol arası olmalıdır")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Soyad tələb olunur")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Soyad 2-50 simvol arası olmalıdır")]
        public string LastName { get; set; } = string.Empty;

        // ✅ ROL SEÇİMİ - Frontend dropdown üçün
        [Required(ErrorMessage = "Rol seçimi tələb olunur")]
        public string Role { get; set; } = "User";

        // ✅ TERMS & CONDITIONS - Məcburi
        [Required(ErrorMessage = "Şərtləri qəbul etməlisiniz")]
        [Range(typeof(bool), "true", "true", ErrorMessage = "Istifadə şərtlərini qəbul etməlisiniz")]
        public bool AcceptTerms { get; set; }

        // ✅ OPTIONAL FIELDS
        [Phone(ErrorMessage = "Düzgün telefon nömrəsi daxil edin")]
        [StringLength(20, ErrorMessage = "Telefon nömrəsi maksimum 20 simvol ola bilər")]
        public string Phone { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DateOfBirth { get; set; }

        // ✅ MARKETING CONSENT
        public bool AllowMarketing { get; set; } = false;

        // ✅ Validation method
        public bool IsValidAge()
        {
            if (DateOfBirth == null) return true;
            var age = DateTime.UtcNow.Year - DateOfBirth.Value.Year;
            return age >= 18; // 18 yaşından kiçik qəbul etmə
        }
    }
}
