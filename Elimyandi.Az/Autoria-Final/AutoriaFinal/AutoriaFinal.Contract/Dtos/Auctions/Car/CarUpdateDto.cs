using AutoriaFinal.Domain.Enums.VehicleEnums;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Car
{
    public class CarUpdateDto
    {
        public string Vin { get; set; } = default!;
        public int Year { get; set; }
        public string Make { get; set; } = default!;
        public string Model { get; set; } = default!;
        public string? BodyStyle { get; set; }
        public string? Color { get; set; }
        public Guid LocationId { get; set; }

        // ✅ Entity ilə uyğun field names  
        public int Mileage { get; set; }                    // Odometer → Mileage
        public string MileageUnit { get; set; } = "km";     // OdometerUnit → MileageUnit
        public decimal Price { get; set; }                  // Yeni sahə
        public string Currency { get; set; } = "AZN";       // Yeni sahə

        // ✅ Enum fields - entity ilə uyğun names
        public FuelType FuelType { get; set; }              // Fuel → FuelType
        public DamageType DamageType { get; set; }          // PrimaryDamage → DamageType
        public Transmission Transmission { get; set; }      // Yeni sahə
        public DriveTrain DriveTrain { get; set; }          // Yeni sahə
        public CarCondition CarCondition { get; set; }     // Condition → CarCondition
        public TitleType TitleType { get; set; }            // Yeni sahə
        public DamageType? SecondaryDamage { get; set; }    // Yeni sahə
        public bool HasKeys { get; set; }
        public string? TitleState { get; set; }
        public decimal? EstimatedRetailValue { get; set; }

        public IFormFile? ImageCar { get; set; }
    }
}