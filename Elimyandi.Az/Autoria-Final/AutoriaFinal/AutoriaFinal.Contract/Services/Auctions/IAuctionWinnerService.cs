using AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories.Auctions;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Auctions
{
    public interface IAuctionWinnerService : IGenericService<
        AuctionWinner,
        AuctionWinnerGetDto,
        AuctionWinnerDetailDto,
        AuctionWinnerCreateDto,
        AuctionWinnerUpdateDto>
    {
        #region Winner Assignment & Management

        Task<AuctionWinnerDetailDto> AssignWinnerAsync(Guid auctionCarId);
        Task<AuctionWinnerDetailDto> AssignWinnerManuallyAsync(Guid auctionCarId, Guid userId, Guid winningBidId, decimal amount);
        Task<AuctionWinnerDetailDto?> AssignSecondChanceWinnerAsync(Guid auctionCarId, Guid originalWinnerId);
        Task<AuctionWinnerDetailDto?> GetWinnerByIdAsync(Guid winnerId);
        Task<AuctionWinnerDetailDto?> GetWinnerByAuctionCarIdAsync(Guid auctionCarId);
        Task<IEnumerable<AuctionWinnerGetDto>> GetUserWinnersAsync(Guid userId);
        Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersByAuctionAsync(Guid auctionId);

        #endregion

        #region Payment Processing & Tracking

        Task<AuctionWinnerDetailDto> RecordPaymentAsync(Guid winnerId, decimal amount, string? paymentReference = null, string? notes = null);
        Task<AuctionWinnerDetailDto> RecordPartialPaymentAsync(Guid winnerId, decimal amount, string? paymentReference = null, string? notes = null);
        Task<bool> IsPaymentOverdueAsync(Guid winnerId);
        Task<decimal> GetRemainingPaymentAmountAsync(Guid winnerId);
        Task<decimal> GetPaymentProgressAsync(Guid winnerId);
        Task<AuctionWinnerDetailDto> ExtendPaymentDueDateAsync(Guid winnerId, int additionalDays, string reason, Guid extendedByUserId);
        Task<IEnumerable<AuctionWinnerGetDto>> GetOverduePaymentsAsync();
        Task<IEnumerable<AuctionWinnerGetDto>> GetUnpaidWinnersAsync(Guid userId);
        Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersByPaymentStatusAsync(PaymentStatus paymentStatus);

        #endregion

        #region Seller Confirmation Process

        Task<AuctionWinnerDetailDto> ConfirmWinnerAsync(Guid winnerId, Guid confirmedByUserId, string? confirmationNotes = null);
        Task<AuctionWinnerDetailDto> RejectWinnerAsync(Guid winnerId, Guid rejectedByUserId, string rejectionReason);
        Task<AuctionWinnerDetailDto> CancelWinnerAsync(Guid winnerId, string? reason = null, Guid? cancelledByUserId = null);
        Task<IEnumerable<AuctionWinnerGetDto>> GetPendingConfirmationsBySellerAsync(Guid sellerId);
        Task<IEnumerable<AuctionWinnerGetDto>> GetRejectedWinnersBySellerAsync(Guid sellerId);
        Task<IEnumerable<AuctionWinnerGetDto>> GetSellerSalesAsync(Guid sellerId);

        #endregion

        #region Notification & Reminder Management

        Task<bool> SendPaymentReminderAsync(Guid winnerId);
        Task<int> SendBulkPaymentRemindersAsync(int daysBefore = 2);
        Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersForPaymentReminderAsync(int daysBefore = 2);
        Task RecordPaymentReminderSentAsync(Guid winnerId);

        #endregion

        #region Business Analytics & Statistics

        Task<decimal> GetUserSuccessRateAsync(Guid userId);
        Task<TimeSpan> GetUserAveragePaymentTimeAsync(Guid userId);
        Task<decimal> GetTotalSalesAmountAsync(Guid auctionId);
        Task<decimal> GetOverallCollectionRateAsync();
        Task<IEnumerable<TopBuyerDto>> GetTopBuyersAsync(int count = 10);
        Task<WinnerStatisticsDto> GetWinnerStatisticsAsync(Guid? auctionId = null, DateTime? fromDate = null, DateTime? toDate = null);

        #endregion

        #region Re-auction & Second Chance Management

        Task<IEnumerable<AuctionWinnerGetDto>> GetCandidatesForReAuctionAsync();
        Task<AuctionWinnerDetailDto?> GetSecondChanceCandidateAsync(Guid auctionCarId);
        Task<bool> InitiateReAuctionAsync(Guid auctionCarId, string reason);
        Task<bool> IsEligibleForReAuctionAsync(Guid winnerId);

        #endregion

        #region Search & Filter Operations

        Task<IEnumerable<AuctionWinnerGetDto>> SearchWinnersAsync(WinnerSearchCriteriaDto criteria);
        Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersByAmountRangeAsync(decimal minAmount, decimal maxAmount);
        Task<IEnumerable<AuctionWinnerGetDto>> GetPaidWinnersInPeriodAsync(DateTime fromDate, DateTime toDate);
        Task<IEnumerable<AuctionWinnerGetDto>> GetPartiallyPaidWinnersAsync();
        Task<IEnumerable<AuctionWinnerGetDto>> GetFailedPaymentWinnersAsync();

        #endregion

        #region Bulk Operations & Maintenance

        Task<int> MarkOverduePaymentsAsync();
        Task<int> ArchiveCompletedWinnersAsync(DateTime cutoffDate);
        Task<WinnerIntegrityReportDto> ValidateWinnerDataIntegrityAsync();

        #endregion
    }
}