using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Entities.Identity;
using AutoriaFinal.Domain.Enums.VehicleEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class Car : BaseEntity
    {
        public string OwnerId { get; set; } = default!;
        public ApplicationUser Owner { get; set; } = default!;

        public string Vin { get; set; } = default!;
        public int Year { get; set; }
        public string Make { get; set; } = default!;
        public string Model { get; set; } = default!;
        public string? BodyStyle { get; set; }
        public string? Color { get; set; }
        public int Mileage { get; set; }  
        public string MileageUnit { get; set; } = "km"; 
        public decimal Price { get; set; }
        public string Currency { get; set; } = "AZN";
        public FuelType FuelType { get; set; } = FuelType.Unknown; 
        public Transmission Transmission { get; set; } = Transmission.Unknown;
        public DriveTrain DriveTrain { get; set; } = DriveTrain.Unknown;
        public CarCondition CarCondition { get; set; } = CarCondition.Unknown; 
        public bool HasKeys { get; set; }
        public DamageType DamageType { get; set; } = DamageType.Unknown; 
        public DamageType? SecondaryDamage { get; set; } = DamageType.Unknown;

        public TitleType TitleType { get; set; } = TitleType.Unknown;
        public string? TitleState { get; set; }
        public decimal? EstimatedRetailValue { get; set; }

        public string PhotoUrls { get; set; } = new string("");
        public string VideoUrls { get; set; } = new string("");
        public Guid? LocationId { get; set; }
        public Location? Location { get; set; } = default!;

        public ICollection<Support.Document> Documents { get; set; } = new List<Support.Document>();

        #region Rich Data Model
        public void SetMileage(int value, string unit)
        {
            Mileage = value;
            MileageUnit = unit;
            MarkUpdated();
        }

        public void SetSpecs(FuelType fuelType, Transmission transmission, DriveTrain driveTrain)
        {
            FuelType = fuelType;
            Transmission = transmission;
            DriveTrain = driveTrain;
            MarkUpdated();
        }

        public void SetCondition(CarCondition carCondition, bool hasKeys)
        {
            CarCondition = carCondition;
            HasKeys = hasKeys;
            MarkUpdated();
        }

        public void SetDamage(DamageType primary, DamageType? secondary = null)
        {
            DamageType = primary;
            SecondaryDamage = secondary;
            MarkUpdated();
        }

        public void SetTitle(TitleType type, string? state)
        {
            TitleType = type;
            TitleState = state;
            MarkUpdated();
        }

        public void SetPrice(decimal price, string currency = "AZN")
        {
            Price = price;
            Currency = currency;
            MarkUpdated();
        }

        public void SetErv(decimal? value)
        {
            EstimatedRetailValue = value;
            MarkUpdated();
        }
        #endregion
    }
}