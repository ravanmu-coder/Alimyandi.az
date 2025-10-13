using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.Bids;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{   
    public class BidConfiguration : BaseEntityConfiguration<Bid>
    {
        public override void Configure(EntityTypeBuilder<Bid> builder)
        {
            base.Configure(builder);

            builder.ToTable("Bids");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.Amount)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired();

            builder.Property(b => b.PlacedAtUtc)
                   .IsRequired();

            builder.Property(b => b.IsProxy)
                   .HasDefaultValue(false);

            builder.Property(b => b.ProxyMax)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired(false);

            builder.Property(b => b.IsPreBid)
                   .HasDefaultValue(false);

            builder.Property(b => b.Status)
                   .HasConversion<int>()
                   .HasDefaultValue(BidStatus.Placed);

            builder.Property(b => b.BidType)
                   .HasConversion<int>()
                   .HasDefaultValue(BidType.Regular);

            builder.Property(b => b.Notes)
                   .HasMaxLength(1000)
                   .IsRequired(false);

            builder.Property(b => b.ValidUntil)
                   .IsRequired(false);

            builder.Property(b => b.ProcessedAt)
                   .IsRequired(false);

            builder.Property(b => b.IPAddress)
                   .HasMaxLength(45) 
                   .IsRequired(false);

            builder.Property(b => b.UserAgent)
                   .HasMaxLength(500)
                   .IsRequired(false);

            builder.Property(b => b.SequenceNumber)
                   .HasDefaultValue(0);

            builder.Property(b => b.IsAutoBid)
                   .HasDefaultValue(false);

            builder.Property(b => b.ParentBidId)
                   .IsRequired(false);

            // RELATIONSHIPS
            builder.HasOne(b => b.AuctionCar)
                   .WithMany(ac => ac.Bids)
                   .HasForeignKey(b => b.AuctionCarId)
                   .OnDelete(DeleteBehavior.Cascade);

            //  Self-referencing relationship
            builder.HasOne(b => b.ParentBid)
                   .WithMany(b => b.ChildBids)
                   .HasForeignKey(b => b.ParentBidId)
                   .OnDelete(DeleteBehavior.Restrict);

            //  INDEX-LƏR
            builder.HasIndex(b => b.AuctionCarId);
            builder.HasIndex(b => b.UserId);
            builder.HasIndex(b => new { b.AuctionCarId, b.Amount }); // Ən yüksək bid-i tapmaq üçün
            builder.HasIndex(b => new { b.AuctionCarId, b.IsPreBid }); // Pre-bid-ləri tapmaq üçün
            builder.HasIndex(b => new { b.AuctionCarId, b.PlacedAtUtc }); // Tarixə görə sıralama üçün
            builder.HasIndex(b => b.Status); // Status-a görə filter üçün
            builder.HasIndex((System.Linq.Expressions.Expression<Func<Bid, object?>>)(b => b.BidType)); // Bid növünə görə filter üçün
            builder.HasIndex(b => new { b.UserId, b.PlacedAtUtc }); // İstifadəçinin bid tarixçəsi üçün
            builder.HasIndex(b => b.ValidUntil); // Proxy bid-lərin etibarlılığı üçün
            builder.HasIndex(b => b.ParentBidId); // Child bid-ləri tapmaq üçün

            // COMPOSITE INDEX-LƏR - sorğu performansı üçün çox vacibdir
            builder.HasIndex(b => new { b.AuctionCarId, b.Status, b.Amount }); // Aktiv bid-lər arasında ən yükşəyi tapmaq
            builder.HasIndex(b => new { b.UserId, b.AuctionCarId, b.Status }); // İstifadəçinin müəyyən maşındakı aktiv bid-ləri
        }
    }
}