using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using AutoriaFinal.Domain.Enums.AuctionEnums;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{
    public class AuctionCarConfiguration : BaseEntityConfiguration<AuctionCar>
    {
        public override void Configure(EntityTypeBuilder<AuctionCar> builder)
        {
            base.Configure(builder);

            // ✅ Basic Properties
            builder.Property(x => x.LotNumber)
                   .IsRequired()
                   .HasMaxLength(50);

            builder.Property(x => x.ItemNumber)
                   .IsRequired(false);

            // ✅ REAL COPART PRICING
            builder.Property(x => x.StartPrice)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired();

            builder.Property(x => x.ReservePrice)
                   .HasColumnType("decimal(18,2)");

            builder.Property(x => x.CurrentPrice)
                   .HasColumnType("decimal(18,2)")
                   .HasDefaultValue(0);

            builder.Property(x => x.HammerPrice)
                   .HasColumnType("decimal(18,2)");

            builder.Property(x => x.BuyersPremium)
                   .HasColumnType("decimal(18,2)");

            builder.Property(x => x.TotalPrice)
                   .HasColumnType("decimal(18,2)");

            builder.Property(x => x.SoldPrice)
                   .HasColumnType("decimal(18,2)");

            builder.Property(x => x.MinPreBid)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired();

            // ✅ Status Properties
            builder.Property(x => x.IsReserveMet)
                   .HasDefaultValue(false);

            builder.Property(x => x.WinnerStatus)
                   .HasConversion<int>()
                   .HasDefaultValue(AuctionWinnerStatus.Pending);

            builder.Property(x => x.AuctionCondition)
                   .HasConversion<int>()
                   .HasDefaultValue(AuctionCarCondition.PreAuction);

            // ✅ Count Properties
            builder.Property(x => x.BidCount)
                   .HasDefaultValue(0);

            builder.Property(x => x.PreBidCount)
                   .HasDefaultValue(0);

            // ✅ Active Status
            builder.Property(x => x.IsActive)
                   .HasDefaultValue(false);

            // ✅ Lane & Scheduling
            builder.Property(x => x.LaneNumber);
            builder.Property(x => x.RunOrder);
            builder.Property(x => x.ScheduledTime);

            // ✅ Business Logic
            builder.Property(x => x.RequiresSellerApproval)
                   .HasDefaultValue(true);

            // ✅ Post-Auction Dates
            builder.Property(x => x.WinnerNotifiedAt);
            builder.Property(x => x.DepositPaidAt);
            builder.Property(x => x.PaymentDueDate);

            // ✅ Notes
            builder.Property(x => x.UnsoldReason)
                   .HasMaxLength(500);

            builder.Property(x => x.SellerNotes)
                   .HasMaxLength(1000);

            // ✅ PERFORMANCE INDEXES
            builder.HasIndex(x => new { x.AuctionId, x.CarId })
                   .IsUnique()
                   .HasDatabaseName("IX_AuctionCar_AuctionId_CarId");

            builder.HasIndex(x => new { x.AuctionId, x.LotNumber })
                   .IsUnique()
                   .HasDatabaseName("IX_AuctionCar_AuctionId_LotNumber");

            builder.HasIndex(x => x.IsActive)
                   .HasDatabaseName("IX_AuctionCar_IsActive");

            builder.HasIndex(x => x.WinnerStatus)
                   .HasDatabaseName("IX_AuctionCar_WinnerStatus");

            builder.HasIndex(x => x.AuctionCondition)
                   .HasDatabaseName("IX_AuctionCar_AuctionCondition");

            builder.HasIndex(x => x.LastBidTime)
                   .HasDatabaseName("IX_AuctionCar_LastBidTime");

            builder.HasIndex(x => x.PaymentDueDate)
                   .HasDatabaseName("IX_AuctionCar_PaymentDueDate");

            builder.HasIndex(x => new { x.LaneNumber, x.RunOrder })
                   .HasDatabaseName("IX_AuctionCar_Lane_RunOrder");

            // ✅ RELATIONSHIPS
            builder.HasMany(x => x.Bids)
                   .WithOne(b => b.AuctionCar)
                   .HasForeignKey(b => b.AuctionCarId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.AuctionWinner)
                   .WithOne(aw => aw.AuctionCar)
                   .HasForeignKey<AuctionWinner>(aw => aw.AuctionCarId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Car)
                   .WithMany()
                   .HasForeignKey(x => x.CarId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Auction)
                   .WithMany(a => a.AuctionCars)
                   .HasForeignKey(x => x.AuctionId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}