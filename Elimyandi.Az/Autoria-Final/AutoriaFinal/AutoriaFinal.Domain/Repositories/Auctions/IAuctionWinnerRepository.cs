using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Auctions
{
    public interface IAuctionWinnerRepository : IGenericRepository<AuctionWinner>
    {
        #region Basic Winner Queries

        Task<AuctionWinner?> GetByAuctionCarIdAsync(Guid auctionCarId);
        Task<AuctionWinner?> GetWinnerWithFullDetailsAsync(Guid winnerId);
        Task<IEnumerable<AuctionWinner>> GetByUserIdAsync(Guid userId);
        Task<IEnumerable<AuctionWinner>> GetWinnersByAuctionAsync(Guid auctionId);

        #endregion

        #region Payment Tracking & Management

        Task<IEnumerable<AuctionWinner>> GetWinnersByPaymentStatusAsync(PaymentStatus paymentStatus);
        Task<IEnumerable<AuctionWinner>> GetOverduePaymentsAsync();
        Task<IEnumerable<AuctionWinner>> GetUnpaidWinnersAsync(Guid userId);
        Task<IEnumerable<AuctionWinner>> GetPaidWinnersInPeriodAsync(DateTime fromDate, DateTime toDate);
        Task<IEnumerable<AuctionWinner>> GetPartiallyPaidWinnersAsync();
        Task<IEnumerable<AuctionWinner>> GetFailedPaymentWinnersAsync();
        Task<IEnumerable<AuctionWinner>> GetWinnersForPaymentReminderAsync(int daysBefore = 2);

        #endregion

        #region Seller Operations

        Task<IEnumerable<AuctionWinner>> GetSellerSalesAsync(Guid sellerId);
        Task<IEnumerable<AuctionWinner>> GetPendingConfirmationsBySellerAsync(Guid sellerId);
        Task<IEnumerable<AuctionWinner>> GetConfirmedWinnersBySellerAsync(Guid sellerId);
        Task<IEnumerable<AuctionWinner>> GetRejectedWinnersBySellerAsync(Guid sellerId);

        #endregion

        #region Analytics & Statistics

        Task<decimal> GetUserSuccessRateAsync(Guid userId);
        Task<TimeSpan> GetUserAveragePaymentTimeAsync(Guid userId);
        Task<decimal> GetTotalSalesAmountAsync(Guid auctionId);
        Task<decimal> GetOverallCollectionRateAsync();
        Task<IEnumerable<TopBuyerData>> GetTopBuyersDataAsync(int count = 10);
        Task<WinnerStatisticsData> GetWinnerStatisticsDataAsync(Guid? auctionId, DateTime? fromDate, DateTime? toDate);

        #endregion

        #region Re-auction & Second Chance

        Task<IEnumerable<AuctionWinner>> GetCandidatesForReAuctionAsync();
        Task<AuctionWinner?> GetSecondChanceCandidateAsync(Guid auctionCarId);
        Task<bool> HasActiveWinnerAsync(Guid auctionCarId);

        #endregion

        #region Search & Filtering

        Task<IEnumerable<AuctionWinner>> SearchWinnersAsync(WinnerSearchCriteria criteria);
        Task<IEnumerable<AuctionWinner>> GetWinnersByAmountRangeAsync(decimal minAmount, decimal maxAmount);

        #endregion

        #region Bulk Operations

        Task<int> MarkOverduePaymentsAsync();
        Task<int> ArchiveCompletedWinnersAsync(DateTime cutoffDate);
        Task<IEnumerable<AuctionWinner>> GetWinnersRequiringActionAsync();

        #endregion
    }

    #region Helper Classes

    public class WinnerSearchCriteria
    {
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public Guid? AuctionId { get; set; }
        public string? AuctionName { get; set; }
        public Guid? AuctionCarId { get; set; }
        public string? LotNumber { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public int? CarYear { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public PaymentStatus? PaymentStatus { get; set; }
        public bool? IsConfirmed { get; set; }
        public bool? IsOverdue { get; set; }
        public bool? IsSecondChance { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortBy { get; set; } = "AssignedAt";
        public string SortDirection { get; set; } = "DESC";
    }

    public class TopBuyerData
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = default!;
        public string? UserEmail { get; set; }
        public int TotalWins { get; set; }
        public decimal TotalPurchaseAmount { get; set; }
        public decimal AveragePurchaseAmount { get; set; }
        public decimal SuccessRate { get; set; }
        public DateTime FirstWinDate { get; set; }
        public DateTime LastWinDate { get; set; }
        public TimeSpan AveragePaymentTime { get; set; }
        public int OverdueCount { get; set; }
        public int CompletedCount { get; set; }
        public string ReliabilityScore { get; set; } = default!;
    }

    public class WinnerStatisticsData
    {
        public int TotalWinners { get; set; }
        public int CompletedSales { get; set; }
        public int PendingPayments { get; set; }
        public int OverduePayments { get; set; }
        public int CancelledWinners { get; set; }
        public decimal TotalWinAmount { get; set; }
        public decimal TotalPaidAmount { get; set; }
        public decimal TotalOutstandingAmount { get; set; }
        public decimal CollectionRate { get; set; }
        public decimal AverageWinAmount { get; set; }
        public decimal CompletionRate { get; set; }
        public Dictionary<string, int> StatusBreakdown { get; set; } = new();
        public Dictionary<string, decimal> AmountBreakdown { get; set; } = new();
    }

    #endregion
}
