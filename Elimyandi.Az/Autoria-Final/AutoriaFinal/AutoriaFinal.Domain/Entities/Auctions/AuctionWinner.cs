using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class AuctionWinner : BaseEntity
    {
        public Guid AuctionCarId { get; set; }
        public Guid UserId { get; set; }
        public Guid WinningBidId { get; set; }
        public decimal Amount { get; set; }

        public decimal? PaidAmount { get; set; }
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime? WinnerConfirmedAt { get; set; }        // Seller tərəfindən təsdiq tarixi
        public DateTime? PaymentDueDate { get; set; }           // Ödəniş son tarixi
        public string? Notes { get; set; }                      // Audit trail üçün qeydlər
        public string? PaymentReference { get; set; }           // Bank reference, transaction ID
        public Guid? ConfirmedByUserId { get; set; }            // Seller user ID (kim təsdiqləyib)
        public string? RejectionReason { get; set; }            // Rədd edilmə səbəbi
        public DateTime? LastPaymentReminderSent { get; set; }  // Son reminder tarixi
        public int PaymentReminderCount { get; set; } = 0;      // Neçə reminder göndərilib
        public bool IsSecondChanceWinner { get; set; } = false; // İkinci şans winner-idir
        public Guid? OriginalWinnerId { get; set; }             // Əgər ikinci şansırsa, əvvəlki winner ID

        // Navigation Properties
        public AuctionCar AuctionCar { get; set; } = default!;
        public Bid WinningBid { get; set; } = default!;
        public AuctionWinner() { }

        //Regular winner yaratmaq üçün
        public static AuctionWinner Create(
            Guid auctionCarId,
            Guid userId,
            Guid winningBidId,
            decimal amount,
            int paymentDueDays = 7)
        {
            if (amount <= 0)
                throw new ArgumentException("Winner amount sıfırdan böyük olmalıdır", nameof(amount));

            if (paymentDueDays <= 0 || paymentDueDays > 30)
                throw new ArgumentException("Payment due days 1-30 arasında olmalıdır", nameof(paymentDueDays));

            var winner = new AuctionWinner
            {
                Id = Guid.NewGuid(),
                AuctionCarId = auctionCarId,
                UserId = userId,
                WinningBidId = winningBidId,
                Amount = amount,
                AssignedAt = DateTime.UtcNow,
                PaymentDueDate = DateTime.UtcNow.AddDays(paymentDueDays),
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            return winner;
        }

        //Factory method - Second chance winner yaratmaq üçün
        public static AuctionWinner CreateSecondChance(
            Guid auctionCarId,
            Guid userId,
            Guid winningBidId,
            decimal amount,
            Guid originalWinnerId,
            int paymentDueDays = 5) // Second chance üçün daha qısa müddət
        {
            var winner = Create(auctionCarId, userId, winningBidId, amount, paymentDueDays);
            winner.IsSecondChanceWinner = true;
            winner.OriginalWinnerId = originalWinnerId;
            winner.Notes = $"Second chance winner. Original winner: {originalWinnerId}";

            return winner;
        }

        // ========== BUSINESS MƏNTİQİ METODLARI ==========

        /// Ödənişi qeyd edir
        public void MarkPaid(decimal amount, string? paymentReference = null, string? notes = null)
        {
            if (amount <= 0)
                throw new ArgumentException("Ödəniş məbləği sıfırdan böyük olmalıdır", nameof(amount));

            if (PaymentStatus == PaymentStatus.Cancelled)
                throw new InvalidOperationException("Cancelled winner üçün ödəniş qəbul edilmir");

            var previousPaidAmount = PaidAmount ?? 0;
            var newTotalPaid = previousPaidAmount + amount;

            if (newTotalPaid > Amount)
                throw new InvalidOperationException($"Ümumi ödəniş ({newTotalPaid}) winner məbləğindən ({Amount}) böyük ola bilməz");

            PaidAmount = newTotalPaid;
            PaymentReference = paymentReference;

            // Payment status təyin et
            if (newTotalPaid >= Amount)
            {
                PaymentStatus = PaymentStatus.Paid;
                Notes = AppendNote($"Fully paid {amount:C} at {DateTime.UtcNow}. Total: {newTotalPaid:C}. {notes}");
            }
            else
            {
                PaymentStatus = PaymentStatus.PartiallyPaid;
                Notes = AppendNote($"Partial payment {amount:C} at {DateTime.UtcNow}. Total: {newTotalPaid:C}/{Amount:C}. {notes}");
            }

            MarkUpdated();
        }

        /// Winner-i ləğv edir
        public void Cancel(string? reason = null, Guid? cancelledByUserId = null)
        {
            if (PaymentStatus == PaymentStatus.Paid)
                throw new InvalidOperationException("Tam ödənmiş winner ləğv edilə bilməz");

            var previousStatus = PaymentStatus;
            PaymentStatus = PaymentStatus.Cancelled;
            RejectionReason = reason;

            var cancelNote = $"Winner cancelled at {DateTime.UtcNow}";
            if (cancelledByUserId.HasValue)
                cancelNote += $" by user {cancelledByUserId.Value}";
            if (!string.IsNullOrEmpty(reason))
                cancelNote += $". Reason: {reason}";
            if (previousStatus == PaymentStatus.PartiallyPaid && PaidAmount.HasValue)
                cancelNote += $". Partial payment {PaidAmount.Value:C} needs to be refunded.";

            Notes = AppendNote(cancelNote);
            MarkUpdated();
        }

        /// Winner-i təsdiq edir (seller tərəfindən)
        public void Confirm(Guid confirmedByUserId, string? confirmationNotes = null)
        {
            if (PaymentStatus == PaymentStatus.Cancelled)
                throw new InvalidOperationException("Cancelled winner təsdiqlənə bilməz");

            if (WinnerConfirmedAt.HasValue)
                throw new InvalidOperationException("Winner artıq təsdiqlənib");

            WinnerConfirmedAt = DateTime.UtcNow;
            ConfirmedByUserId = confirmedByUserId;

            var confirmNote = $"Winner confirmed at {DateTime.UtcNow} by user {confirmedByUserId}";
            if (!string.IsNullOrEmpty(confirmationNotes))
                confirmNote += $". Notes: {confirmationNotes}";

            Notes = AppendNote(confirmNote);
            MarkUpdated();
        }

        /// Winner-i rədd edir (seller tərəfindən)
        public void Reject(Guid rejectedByUserId, string rejectionReason)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
                throw new ArgumentException("Rejection reason mütləqdir", nameof(rejectionReason));

            if (PaymentStatus == PaymentStatus.Paid)
                throw new InvalidOperationException("Tam ödənmiş winner rədd edilə bilməz");

            PaymentStatus = PaymentStatus.Cancelled;
            RejectionReason = rejectionReason;
            ConfirmedByUserId = rejectedByUserId;

            var rejectNote = $"Winner rejected at {DateTime.UtcNow} by user {rejectedByUserId}. Reason: {rejectionReason}";
            if (PaidAmount.HasValue && PaidAmount.Value > 0)
                rejectNote += $". Refund required: {PaidAmount.Value:C}";

            Notes = AppendNote(rejectNote);
            MarkUpdated();
        }

        /// Payment reminder göndərmə qeydiyyatı
        public void RecordPaymentReminderSent()
        {
            LastPaymentReminderSent = DateTime.UtcNow;
            PaymentReminderCount++;
            Notes = AppendNote($"Payment reminder #{PaymentReminderCount} sent at {DateTime.UtcNow}");
            MarkUpdated();
        }

        /// Payment due date uzatma
        public void ExtendPaymentDueDate(int additionalDays, string reason, Guid extendedByUserId)
        {
            if (additionalDays <= 0)
                throw new ArgumentException("Additional days müsbət olmalıdır", nameof(additionalDays));

            if (PaymentStatus != PaymentStatus.Pending && PaymentStatus != PaymentStatus.PartiallyPaid)
                throw new InvalidOperationException("Yalnız pending/partial winner-lər üçün müddət uzadıla bilər");

            var oldDate = PaymentDueDate;
            PaymentDueDate = (PaymentDueDate ?? DateTime.UtcNow).AddDays(additionalDays);

            var extendNote = $"Payment due date extended by {additionalDays} days at {DateTime.UtcNow} by user {extendedByUserId}";
            extendNote += $". Old date: {oldDate}, New date: {PaymentDueDate}. Reason: {reason}";

            Notes = AppendNote(extendNote);
            MarkUpdated();
        }

        // ========== SORĞU METODLArI ==========

        /// Ödəniş vaxtının keçib-keçmədiyini yoxlayır
        public bool IsPaymentOverdue()
        {
            return PaymentDueDate.HasValue &&
                   DateTime.UtcNow > PaymentDueDate.Value &&
                   (PaymentStatus == PaymentStatus.Pending || PaymentStatus == PaymentStatus.PartiallyPaid);
        }

        /// Tam ödənib-ödənməyəndiyini yoxlayır
      
        public bool IsFullyPaid()
        {
            return PaymentStatus == PaymentStatus.Paid && PaidAmount >= Amount;
        }

        
        /// Qalan ödəniş məbləği
      
        public decimal GetRemainingAmount()
        {
            return Amount - (PaidAmount ?? 0);
        }

        /// Ödəniş faizi
        public decimal GetPaymentProgress()
        {
            if (Amount == 0) return 0;
            return ((PaidAmount ?? 0) / Amount) * 100;
        }

        /// Overdüə günlərinin sayı
        public int GetOverdueDays()
        {
            if (!IsPaymentOverdue()) return 0;
            return (DateTime.UtcNow - PaymentDueDate!.Value).Days;
        }

        /// Payment reminder göndərmək olarmı yoxlayır
        public bool CanSendPaymentReminder()
        {
            // Pending və ya partial paid olmalıdır
            if (PaymentStatus != PaymentStatus.Pending && PaymentStatus != PaymentStatus.PartiallyPaid)
                return false;

            // Əgər heç reminder göndərilməyibsə, göndər
            if (!LastPaymentReminderSent.HasValue)
                return true;

            // Son reminder 24 saatdan çox əvvəl göndərilib
            return DateTime.UtcNow - LastPaymentReminderSent.Value > TimeSpan.FromHours(24);
        }

        /// Re-auction üçün uyğundur
        public bool IsEligibleForReAuction()
        {
            return PaymentStatus == PaymentStatus.Cancelled ||
                   PaymentStatus == PaymentStatus.Failed ||
                   (IsPaymentOverdue() && GetOverdueDays() > 7); // 7 gün overdüə-dan sonra
        }

        // ========== HELPER METODLARI ==========

        /// Note-lara əlavə mətn əlavə edir
        private string AppendNote(string newNote)
        {
            if (string.IsNullOrEmpty(newNote)) return Notes ?? string.Empty;

            return string.IsNullOrEmpty(Notes)
                ? newNote
                : $"{Notes}\n{newNote}";
        }
    }
}