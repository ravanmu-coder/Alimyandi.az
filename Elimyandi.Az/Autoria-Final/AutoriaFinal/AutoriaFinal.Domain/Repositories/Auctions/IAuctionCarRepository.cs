using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Auctions
{
    public interface IAuctionCarRepository : IGenericRepository<AuctionCar>
    {
        #region Basic Queries
        Task<AuctionCar?> GetByLotNumberAsync(string lotNumber);
        Task<IEnumerable<AuctionCar>> GetByAuctionIdAsync(Guid auctionId);
        Task<AuctionCar?> GetAuctionCarWithBidsAsync(Guid auctionCarId);
        Task<AuctionCar?> GetAuctionCarWithFullDetailsAsync(Guid auctionCarId);
        #endregion

        #region Real Business Logic
        // ✅ Pre-Auction Phase
        Task<IEnumerable<AuctionCar>> GetCarsReadyForAuctionAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetCarsByConditionAsync(Guid auctionId, AuctionCarCondition condition);
        Task<IEnumerable<AuctionCar>> GetCarsByWinnerStatusAsync(Guid auctionId, AuctionWinnerStatus status);

        // ✅ YENİ METHOD - SCHEDULER ÜÇÜN ƏN VACİB
        Task<IEnumerable<AuctionCar>> GetCarsNeedingConditionUpdateAsync();

        // ✅ Live Auction Phase
        Task<AuctionCar?> GetActiveAuctionCarAsync(Guid auctionId);
        Task<AuctionCar?> GetNextAuctionCarAsync(Guid auctionId, string currentLotNumber);
        Task<IEnumerable<AuctionCar>> GetCarsWithExpiredTimerAsync(Guid auctionId, int timerSeconds);
        Task<IEnumerable<AuctionCar>> GetCarsByLaneAsync(int laneNumber, DateTime? scheduleDate = null);

        // ✅ Post-Auction Phase
        Task<IEnumerable<AuctionCar>> GetUnsoldAuctionCarsAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetSoldCarsAwaitingApprovalAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetCarsAwaitingPaymentAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetOverduePaymentCarsAsync();
        Task<IEnumerable<AuctionCar>> GetCarsReadyForPickupAsync(Guid auctionId);
        #endregion

        #region Pricing & Financial
        Task<decimal?> GetCurrentPriceAsync(Guid auctionCarId);
        Task<decimal> GetTotalSalesAmountAsync(Guid auctionId);
        Task<decimal> GetAverageHammerPriceAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetCarsByPriceRangeAsync(Guid auctionId, decimal minPrice, decimal maxPrice);
        Task<IEnumerable<AuctionCar>> GetCarsAboveReserveAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetCarsBelowReserveAsync(Guid auctionId);
        #endregion

        #region Bid & User Management
        Task<bool> HasUserPreBidAsync(Guid auctionCarId, Guid userId);
        Task<int> GetTotalPreBidCountAsync(Guid auctionCarId);
        Task<decimal> GetHighestPreBidAmountAsync(Guid auctionCarId);
        Task<int> GetUniqueBiddersCountAsync(Guid auctionCarId);
        Task<IEnumerable<AuctionCar>> GetUserWonCarsAsync(Guid userId, Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetUserBiddingCarsAsync(Guid userId, Guid auctionId);
        #endregion

        #region Scheduling & Lane Management
        Task<IEnumerable<AuctionCar>> GetScheduledCarsAsync(DateTime fromTime, DateTime toTime);
        Task<bool> IsLaneSlotAvailableAsync(int laneNumber, DateTime scheduledTime, int runOrder);
        Task<int> GetNextRunOrderAsync(int laneNumber, DateTime scheduleDate);
        Task<IEnumerable<AuctionCar>> GetCarsRunningLateAsync(DateTime currentTime);
        #endregion

        #region Analytics & Reporting
        Task<Dictionary<AuctionWinnerStatus, int>> GetStatusBreakdownAsync(Guid auctionId);
        Task<Dictionary<AuctionCarCondition, int>> GetConditionBreakdownAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetTopSellingCarsAsync(Guid auctionId, int count = 10);
        Task<decimal> GetSellThroughRateAsync(Guid auctionId);
        Task<decimal> GetReserveAchievementRateAsync(Guid auctionId);
        #endregion

        #region Batch Operations
        Task<int> BulkUpdateConditionAsync(IEnumerable<Guid> auctionCarIds, AuctionCarCondition condition);
        Task<int> MarkOverduePaymentsAsync();
        Task<IEnumerable<AuctionCar>> GetCarsRequiringActionAsync();
        #endregion

        #region Search & Filtering
        Task<IEnumerable<AuctionCar>> SearchCarsAsync(AuctionCarSearchCriteria criteria);
        Task<IEnumerable<AuctionCar>> GetRecentlyAddedCarsAsync(Guid auctionId, int hours = 24);
        Task<IEnumerable<AuctionCar>> GetFeaturedCarsAsync(Guid auctionId);
        Task<IEnumerable<AuctionCar>> GetActiveAuctionCarsByCarIdsAsync(IEnumerable<Guid> carIds);
        #endregion
    }

    #region Helper Classes
    public class AuctionCarSearchCriteria
    {
        public Guid? AuctionId { get; set; }
        public string? LotNumber { get; set; }
        public string? Make { get; set; }
        public string? Model { get; set; }
        public int? YearFrom { get; set; }
        public int? YearTo { get; set; }
        public decimal? PriceFrom { get; set; }
        public decimal? PriceTo { get; set; }
        public AuctionWinnerStatus? WinnerStatus { get; set; }
        public AuctionCarCondition? Condition { get; set; }
        public bool? IsReserveMet { get; set; }
        public bool? HasPreBids { get; set; }
        public int? LaneNumber { get; set; }
        public DateTime? ScheduledFrom { get; set; }
        public DateTime? ScheduledTo { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortBy { get; set; } = "LotNumber";
        public string SortDirection { get; set; } = "ASC";
    }
    #endregion
}