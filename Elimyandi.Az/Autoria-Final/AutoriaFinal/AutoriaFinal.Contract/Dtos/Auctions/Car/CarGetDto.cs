using AutoriaFinal.Domain.Enums.VehicleEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Car
{
    public class CarGetDto
    {
        public Guid Id { get; set; }
        public string Vin { get; set; }
        public string VinMasked { get; set; }     // display üçün (məs: 1HGCM...4352 => 1HGCM****4352)
        public int Year { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public string? BodyStyle { get; set; }
        public string? Color { get; set; }

        public int Mileage { get; set; }                    // Odometer → Mileage
        public string MileageUnit { get; set; } = "km";     // OdometerUnit → MileageUnit
        public decimal Price { get; set; }                  // Yeni sahə
        public string Currency { get; set; } = "AZN";       // Yeni sahə

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

        // Media
        public string ImagePath { get; set; }
        public string ThumbnailUrl { get; set; }
        public string[] Images { get; set; } = Array.Empty<string>();

        // Owner & Location
        public string OwnerId { get; set; }
        public string OwnerName { get; set; }
        public string OwnerContact { get; set; }
        public Guid? LocationId { get; set; }
        public string LocationName { get; set; }
        public string LocationAddress { get; set; }

        // Status
        public string Status { get; set; } = "Available";
        public bool IsAvailableForAuction { get; set; } = true;

        // Dates
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAtUtc { get; set; }

        // Auction related (if exists)
        public int? LotNumber { get; set; }
        public decimal? ReservePrice { get; set; }
        public decimal? StartPrice { get; set; }
    }
}