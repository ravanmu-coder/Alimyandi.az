using AutoriaFinal.Domain.Enums.VehicleEnums;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Car
{
    public class CarCreateDto
    {
        [Required(ErrorMessage = "VIN nömrəsi tələb olunur")]
        [StringLength(17, MinimumLength = 17, ErrorMessage = "VIN nömrəsi tam 17 simvol olmalıdır")]
        [RegularExpression(@"^[A-HJ-NPR-Z0-9]{17}$", ErrorMessage = "VIN nömrəsi düzgün formatda olmalıdır")]
        public string Vin { get; set; } = default!;

        [Required(ErrorMessage = "İl tələb olunur")]
        [Range(1900, 2030, ErrorMessage = "İl 1900-2030 arasında olmalıdır")]
        public int Year { get; set; }

        [Required(ErrorMessage = "Marka tələb olunur")]
        [StringLength(100, ErrorMessage = "Marka maksimum 100 simvol ola bilər")]
        public string Make { get; set; } = default!;

        [Required(ErrorMessage = "Model tələb olunur")]
        [StringLength(100, ErrorMessage = "Model maksimum 100 simvol ola bilər")]
        public string Model { get; set; } = default!;

        [StringLength(64, ErrorMessage = "Gövdə tipi maksimum 64 simvol ola bilər")]
        public string? BodyStyle { get; set; }

        [StringLength(64, ErrorMessage = "Rəng maksimum 64 simvol ola bilər")]
        public string? Color { get; set; }

        [Required(ErrorMessage = "Qiymət tələb olunur")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Qiymət 0-dan böyük olmalıdır")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Valyuta tələb olunur")]
        [StringLength(3, ErrorMessage = "Valyuta kodu maksimum 3 simvol ola bilər")]
        public string Currency { get; set; } = "AZN";

        [Required(ErrorMessage = "Yürüş məsafəsi tələb olunur")]
        [Range(0, int.MaxValue, ErrorMessage = "Yürüş məsafəsi 0 və ya daha böyük olmalıdır")]
        public int Mileage { get; set; }

        [Required(ErrorMessage = "Yürüş vahidi tələb olunur")]
        [StringLength(10, ErrorMessage = "Yürüş vahidi maksimum 10 simvol ola bilər")]
        public string MileageUnit { get; set; } = "km";

        [Required(ErrorMessage = "Yanacaq növü tələb olunur")]
        public FuelType FuelType { get; set; }

        [Required(ErrorMessage = "Zədə növü tələb olunur")]
        public DamageType DamageType { get; set; }

        [Required(ErrorMessage = "Ötürücü növü tələb olunur")]
        public Transmission Transmission { get; set; }

        [Required(ErrorMessage = "Ötürücü sistemi tələb olunur")]
        public DriveTrain DriveTrain { get; set; }

        [Required(ErrorMessage = "Avtomobil vəziyyəti tələb olunur")]
        public CarCondition CarCondition { get; set; }

        [Required(ErrorMessage = "Sənəd növü tələb olunur")]
        public TitleType TitleType { get; set; }

        public DamageType? SecondaryDamage { get; set; }

        public bool HasKeys { get; set; } = true;

        public string? TitleState { get; set; }

        public decimal? EstimatedRetailValue { get; set; }

        [Required(ErrorMessage = "Məkan tələb olunur")]
        public Guid LocationId { get; set; }

        public IFormFile? Image { get; set; }
        public string? ImagePath { get; set; }
        public IFormFile? Video { get; set; }
        public string? VideoPath { get; set; }
        public string? OwnerId { get; set; }
    }
}