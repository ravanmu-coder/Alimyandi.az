using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using AutoriaFinal.Domain.Enums.AuctionEnums;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{
    /// <summary>
    /// AUCTION WINNER CONFIGURATION
    /// Bu configuration yeni entity property-lərini və index-lərini dəstəkləyir.
    /// 
    /// ƏSAS ƏLAVƏLƏR:
    /// - Yeni property-lər üçün column mapping-lər
    /// - Performance üçün əlavə index-lər  
    /// - Search və filtering üçün composite index-lər
    /// - Audit trail dəstəyi üçün məhdudiyyətlər
    /// </summary>
    public class AuctionWinnerConfiguration : BaseEntityConfiguration<AuctionWinner>
    {
        public override void Configure(EntityTypeBuilder<AuctionWinner> builder)
        {
            base.Configure(builder);

            // ========== ƏSAS PROPERTY-LƏR ==========

            builder.Property(x => x.Amount)
                   .IsRequired()
                   .HasColumnType("decimal(18,2)");

            builder.Property(x => x.PaidAmount)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired(false);

            builder.Property(x => x.PaymentStatus)
                   .HasConversion<int>()
                   .HasDefaultValue(PaymentStatus.Pending);

            builder.Property(x => x.AssignedAt)
                   .IsRequired()
                   .HasDefaultValue(DateTime.UtcNow);


            builder.Property(x => x.WinnerConfirmedAt)
                   .IsRequired(false)
                   .HasComment("Seller tərəfindən təsdiq edildiyi tarix");

            builder.Property(x => x.PaymentDueDate)
                   .IsRequired(false)
                   .HasComment("Ödəniş son tarixi");

            builder.Property(x => x.Notes)
                   .HasMaxLength(2000) // Daha uzun audit trail üçün 
                   .IsRequired(false)
                   .HasComment("Audit trail və əlavə qeydlər");

            builder.Property(x => x.PaymentReference)
                   .HasMaxLength(100)
                   .IsRequired(false)
                   .HasComment("Bank reference, transaction ID");

            builder.Property(x => x.ConfirmedByUserId)
                   .IsRequired(false)
                   .HasComment("Seller user ID - kim təsdiqləyib");

            builder.Property(x => x.RejectionReason)
                   .HasMaxLength(500)
                   .IsRequired(false)
                   .HasComment("Winner rədd edilmə səbəbi");

            builder.Property(x => x.LastPaymentReminderSent)
                   .IsRequired(false)
                   .HasComment("Son payment reminder tarixi");

            builder.Property(x => x.PaymentReminderCount)
                   .HasDefaultValue(0)
                   .HasComment("Göndərilmiş reminder sayı");

            builder.Property(x => x.IsSecondChanceWinner)
                   .HasDefaultValue(false)
                   .HasComment("İkinci şans winner-idir");

            builder.Property(x => x.OriginalWinnerId)
                   .IsRequired(false)
                   .HasComment("Əvvəlki winner ID (second chance üçün)");

            // ========== PERFORMANS ÜÇÜN INDEX-LƏR ==========

            // Unique constraint - hər AuctionCar üçün yalnız bir aktiv winner
            builder.HasIndex(x => x.AuctionCarId)
                   .IsUnique()
                   .HasDatabaseName("IX_AuctionWinner_AuctionCarId_Unique");

            // User-ə görə axtarış
            builder.HasIndex(x => x.UserId)
                   .HasDatabaseName("IX_AuctionWinner_UserId");

            // Payment status filtering üçün
            builder.HasIndex(x => x.PaymentStatus)
                   .HasDatabaseName("IX_AuctionWinner_PaymentStatus");

            // Payment due date sorting üçün
            builder.HasIndex(x => x.PaymentDueDate)
                   .HasDatabaseName("IX_AuctionWinner_PaymentDueDate");

            // ========== ƏLAVƏ PERFORMANS INDEX-LƏRİ ==========

            // Overdue payment sorğuları üçün composite index
            builder.HasIndex(x => new { x.PaymentStatus, x.PaymentDueDate })
                   .HasDatabaseName("IX_AuctionWinner_PaymentStatus_DueDate")
                   .HasFilter($"PaymentStatus IN ({(int)PaymentStatus.Pending}, {(int)PaymentStatus.PartiallyPaid})");

            // User performance analysis üçün
            builder.HasIndex(x => new { x.UserId, x.PaymentStatus, x.AssignedAt })
                   .HasDatabaseName("IX_AuctionWinner_User_Status_Date");

            // Confirmed winners üçün
            builder.HasIndex(x => x.WinnerConfirmedAt)
                   .HasDatabaseName("IX_AuctionWinner_ConfirmedAt")
                   .HasFilter("WinnerConfirmedAt IS NOT NULL");

            // Payment reminder system üçün
            builder.HasIndex(x => new { x.PaymentStatus, x.LastPaymentReminderSent })
                   .HasDatabaseName("IX_AuctionWinner_Reminder_System")
                   .HasFilter($"PaymentStatus IN ({(int)PaymentStatus.Pending}, {(int)PaymentStatus.PartiallyPaid})");

            // Second chance winner sorğuları üçün
            builder.HasIndex(x => new { x.IsSecondChanceWinner, x.OriginalWinnerId })
                   .HasDatabaseName("IX_AuctionWinner_SecondChance")
                   .HasFilter("IsSecondChanceWinner = 1");

            // Amount range analysis üçün
            builder.HasIndex(x => new { x.Amount, x.PaymentStatus })
                   .HasDatabaseName("IX_AuctionWinner_Amount_Status");

            // ========== RELATIONSHIPS ==========

            // AuctionCar ilə One-to-One relationship
            builder.HasOne(x => x.AuctionCar)
                   .WithOne(ac => ac.AuctionWinner)
                   .HasForeignKey<AuctionWinner>(x => x.AuctionCarId)
                   .OnDelete(DeleteBehavior.Restrict) // Cascade yox - data integrity üçün
                   .HasConstraintName("FK_AuctionWinner_AuctionCar");

            // WinningBid ilə relationship
            builder.HasOne(x => x.WinningBid)
                   .WithMany()
                   .HasForeignKey(x => x.WinningBidId)
                   .OnDelete(DeleteBehavior.Restrict) // Bid silinərsə winner silinməsin
                   .HasConstraintName("FK_AuctionWinner_Bid");

            // ========== TABLE CONFIGURATION ==========

            builder.ToTable("AuctionWinners", t =>
            {
                t.HasComment("Auction qaliblərinin məlumatları və payment tracking");

                // Check constraints
                t.HasCheckConstraint("CK_AuctionWinner_Amount_Positive", "Amount > 0");
                t.HasCheckConstraint("CK_AuctionWinner_PaidAmount_Valid",
                    "PaidAmount IS NULL OR (PaidAmount >= 0 AND PaidAmount <= Amount)");
                t.HasCheckConstraint("CK_AuctionWinner_PaymentReminderCount_Valid",
                    "PaymentReminderCount >= 0");

                // Business rule constraints
                t.HasCheckConstraint("CK_AuctionWinner_ConfirmedDate_Valid",
                    "WinnerConfirmedAt IS NULL OR WinnerConfirmedAt >= AssignedAt");
                t.HasCheckConstraint("CK_AuctionWinner_PaymentDueDate_Valid",
                    "PaymentDueDate IS NULL OR PaymentDueDate >= AssignedAt");
            });

            // ========== QUERY FİLTER-LƏR ==========

            // Soft delete pattern (əgər lazımdırsa)
             builder.HasQueryFilter(x => !x.IsDeleted);

            // ========== VALUE CONVERTERS ==========

            // PaymentStatus enum üçün additional validation
            builder.Property(x => x.PaymentStatus)
                   .HasConversion<int>()
                   .HasDefaultValue(PaymentStatus.Pending);

            // ========== SEED DATA (əgər lazımdırsa) ==========
            // Test data üçün
            /*
            builder.HasData(
                // Sample data buraya əlavə edilə bilər
            );
            */
        }
    }
}