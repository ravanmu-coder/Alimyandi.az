using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{
    public class CarConfiguration : BaseEntityConfiguration<Car>
    {
        public override void Configure(EntityTypeBuilder<Car> builder)
        {
            base.Configure(builder);

            // Basic properties
            builder.Property(x => x.Vin)
                .IsRequired()
                .HasMaxLength(17);
            builder.HasIndex(x => x.Vin).IsUnique();

            builder.Property(x => x.Year).IsRequired();

            builder.Property(x => x.Make)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(x => x.Model)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(x => x.BodyStyle)
                .HasMaxLength(64);

            builder.Property(x => x.Color)
                .HasMaxLength(64);

            // ✅ Yeni field konfiqurasiyaları
            builder.Property(x => x.Mileage)
                .IsRequired();

            builder.Property(x => x.MileageUnit)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("km");

            // ✅ Price konfiqurasiyaları
            builder.Property(x => x.Price)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(x => x.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasDefaultValue("AZN");

            // ✅ Enum konfiqurasiyaları - yenilənmiş field names
            builder.Property(x => x.FuelType).HasConversion<int>();
            builder.Property(x => x.Transmission).HasConversion<int>();
            builder.Property(x => x.DriveTrain).HasConversion<int>();
            builder.Property(x => x.CarCondition).HasConversion<int>();
            builder.Property(x => x.DamageType).HasConversion<int>();
            builder.Property(x => x.SecondaryDamage).HasConversion<int?>();
            builder.Property(x => x.TitleType).HasConversion<int>();

            builder.Property(x => x.HasKeys)
                .HasDefaultValue(true);

            builder.Property(x => x.TitleState)
                .HasMaxLength(10);

            builder.Property(x => x.EstimatedRetailValue)
                .HasColumnType("decimal(18,2)");

            // ✅ String properties üçün konfiqurasiya
            builder.Property(x => x.PhotoUrls)
                .HasDefaultValue("")
                .HasMaxLength(4000); // URL-lər üçün kifayət qədər yer

            builder.Property(x => x.VideoUrls)
                .HasDefaultValue("")
                .HasMaxLength(4000);

            // ✅ Relationships
            builder.HasOne(c => c.Location)
                   .WithMany(l => l.Cars)
                   .HasForeignKey(c => c.LocationId)
                   .OnDelete(DeleteBehavior.Restrict)
                   .IsRequired(false);

            builder.HasOne(c => c.Owner)
                   .WithMany(u => u.Cars)
                   .HasForeignKey(c => c.OwnerId)
                   .OnDelete(DeleteBehavior.Cascade)
                   .IsRequired();

            // ✅ Indexes
            builder.HasIndex(x => x.OwnerId);
            builder.HasIndex(x => x.LocationId);
            builder.HasIndex(x => new { x.Make, x.Model });
            builder.HasIndex(x => x.Year);
            builder.HasIndex(x => x.Price);
            builder.HasIndex(x => x.FuelType);
            builder.HasIndex(x => x.CarCondition);
        }
    }
}   