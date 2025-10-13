using AutoriaFinal.Domain.Enums.VehicleEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Car
{
    public class CarDetailDto
    {
        public Guid Id { get; set; }
        public string Vin { get; set; }
        public int Year { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public string? BodyStyle { get; set; }
        public string? Color { get; set; }

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

        // Media - detailed
        public string PhotoUrls { get; set; } = "";
        public string[] Images { get; set; } = Array.Empty<string>();
        public string VideoUrls { get; set; } = "";
        public string[] Videos { get; set; } = Array.Empty<string>();

        // Owner / Location - detailed
        public string OwnerId { get; set; }
        public string OwnerName { get; set; }
        public string OwnerContact { get; set; }
        public Guid? LocationId { get; set; }
        public string LocationName { get; set; }
        public string LocationAddress { get; set; }

        // Dates
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAtUtc { get; set; }

        // Auction info - if the car already assigned to an auction
        public int? LotNumber { get; set; }
        public decimal? ReservePrice { get; set; }
        public decimal? StartPrice { get; set; }
    }
}