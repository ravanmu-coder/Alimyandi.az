using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Ai.InitialEstimate
{
    public class VehicleDetailsDto
    {
        [Required]
        public string Make { get; set; } = "";

        [Required]
        public string Model { get; set; } = "";

        [Range(1886, 2100)]
        public int Year { get; set; }

        [Range(0, int.MaxValue)]
        public int Mileage { get; set; }

        public string? Region { get; set; }

        [StringLength(2000)]
        public string? DamageDescription { get; set; }

        [StringLength(2000)]
        public string? ConditionDescription { get; set; }
    }
}
