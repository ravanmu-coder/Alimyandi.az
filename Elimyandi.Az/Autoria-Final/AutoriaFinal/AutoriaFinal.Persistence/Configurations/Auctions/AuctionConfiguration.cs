using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoriaFinal.Persistence.Configurations;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{
    public class AuctionConfiguration : BaseEntityConfiguration<Auction>
    {
        public override void Configure(EntityTypeBuilder<Auction> builder)
        {
            base.Configure(builder);

            // Əsas property-lər
            builder.Property(a => a.Name)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(a => a.MinBidIncrement)
                   .HasColumnType("decimal(18,2)")
                   .HasDefaultValue(100);

            builder.Property(a => a.StartPrice)
                   .HasColumnType("decimal(18,2)");

            builder.Property(a => a.TimerSeconds)
                   .HasDefaultValue(10);

            builder.Property(a => a.CreatedByUserId)
                   .IsRequired(false);

            builder.Property(a => a.Status)
                   .HasConversion<int>();

            builder.Property(a => a.CurrentCarLotNumber)
                   .HasMaxLength(50)
                   .IsRequired(false);

            builder.Property(a => a.IsLive)
                   .HasDefaultValue(false);

            builder.Property(a => a.ExtendedCount)
                   .HasDefaultValue(0);

            builder.Property(a => a.MaxCarDurationMinutes)
                   .HasDefaultValue(30);

            builder.Property(a => a.CurrentCarStartTime)
                   .IsRequired(false);

            builder.Property(a => a.PreBidStartTimeUtc)
           .IsRequired(false);

            builder.Property(a => a.PreBidEndTimeUtc)
                   .IsRequired(false);

            builder.Property(a => a.TotalCarsCount)
                   .HasDefaultValue(0);

            builder.Property(a => a.CarsWithPreBidsCount)
                   .HasDefaultValue(0);

            builder.Property(a => a.AutoStart)
                   .HasDefaultValue(true);

            // ✅ Index-lər əlavə et
            builder.HasIndex(a => a.PreBidStartTimeUtc);
            builder.HasIndex(a => a.AutoStart);
            builder.HasIndex(a => new { a.Status, a.AutoStart });
            // Relationships
            builder.HasOne(a => a.Location)
                   .WithMany()
                   .HasForeignKey(a => a.LocationId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(a => a.AuctionCars)
                   .WithOne(ac => ac.Auction)
                   .HasForeignKey(ac => ac.AuctionId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(a => a.Status);
            builder.HasIndex(a => a.StartTimeUtc);
            builder.HasIndex(a => a.IsLive);
            builder.HasIndex(a => new { a.LocationId, a.Status });
        }
  
    }
}
