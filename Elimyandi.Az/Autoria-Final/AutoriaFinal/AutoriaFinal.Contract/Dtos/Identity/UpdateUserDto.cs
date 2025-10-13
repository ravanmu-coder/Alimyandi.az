using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity
{
    public class UpdateUserDto
    {
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Ad 2-50 simvol arası olmalıdır")]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(50, MinimumLength = 2, ErrorMessage = "Soyad 2-50 simvol arası olmalıdır")]
        public string LastName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Düzgün telefon nömrəsi daxil edin")]
        [StringLength(20, ErrorMessage = "Telefon nömrəsi maksimum 20 simvol ola bilər")]
        public string? Phone { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DateOfBirth { get; set; }

        public string? ProfilePicture { get; set; }

        [StringLength(500, ErrorMessage = "Bio maksimum 500 simvol ola bilər")]
        public string? Bio { get; set; }

        [StringLength(50, ErrorMessage = "Şəhər adı maksimum 50 simvol ola bilər")]
        public string? City { get; set; }

        [StringLength(50, ErrorMessage = "Ölkə adı maksimum 50 simvol ola bilər")]
        public string? Country { get; set; }
    }
}
