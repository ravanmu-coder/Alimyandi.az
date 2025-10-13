using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Auctions
{
    public class AuctionCarRepository : GenericRepository<AuctionCar>, IAuctionCarRepository
    {
        public AuctionCarRepository(AppDbContext context) : base(context) { }

        #region Basic Queries
        public async Task<AuctionCar?> GetByLotNumberAsync(string lotNumber)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Bids.OrderByDescending(b => b.PlacedAtUtc))
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Include(ac => ac.AuctionWinner)
                .FirstOrDefaultAsync(ac => ac.LotNumber == lotNumber);
        }

        public async Task<IEnumerable<AuctionCar>> GetByAuctionIdAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId)
                .Include(ac => ac.Bids.OrderByDescending(b => b.Amount))
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .OrderBy(ac => ac.LaneNumber)
                .ThenBy(ac => ac.RunOrder)
                .ThenBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        public async Task<AuctionCar?> GetAuctionCarWithBidsAsync(Guid auctionCarId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Bids.OrderByDescending(b => b.PlacedAtUtc))
                .Include(ac => ac.AuctionWinner)
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .FirstOrDefaultAsync(ac => ac.Id == auctionCarId);
        }
        
        public async Task<AuctionCar?> GetAuctionCarWithFullDetailsAsync(Guid auctionCarId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Bids.OrderByDescending(b => b.PlacedAtUtc))
                // ✅ FİX: .ThenInclude(b => b.UserId) SİL - UserId navigation property deyil
                .Include(ac => ac.AuctionWinner)
                    .ThenInclude(aw => aw!.WinningBid)
                .Include(ac => ac.Car)
                    .ThenInclude(c => c.Owner)
                .Include(ac => ac.Car)
                    .ThenInclude(c => c.Location)
                .Include(ac => ac.Auction)
                    .ThenInclude(a => a.Location)
                .FirstOrDefaultAsync(ac => ac.Id == auctionCarId);
        }
        #endregion

        #region Real Business Logic
        public async Task<IEnumerable<AuctionCar>> GetCarsReadyForAuctionAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.AuctionCondition == AuctionCarCondition.ReadyForAuction ||
                            (ac.AuctionCondition == AuctionCarCondition.PreAuction &&
                             (ac.Bids.Any(b => b.IsPreBid) || ac.StartPrice > 0)))
                .Include(ac => ac.Bids.Where(b => b.IsPreBid))
                .Include(ac => ac.Car)
                .OrderBy(ac => ac.LaneNumber)
                .ThenBy(ac => ac.RunOrder)
                .ThenBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsByConditionAsync(Guid auctionId, AuctionCarCondition condition)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId && ac.AuctionCondition == condition)
                .Include(ac => ac.Bids)
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .OrderBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsByWinnerStatusAsync(Guid auctionId, AuctionWinnerStatus status)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId && ac.WinnerStatus == status)
                .Include(ac => ac.Bids)
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .OrderBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        // ✅ YENİ METHOD - SCHEDULER ÜÇÜN ƏN VACİB
        public async Task<IEnumerable<AuctionCar>> GetCarsNeedingConditionUpdateAsync()
        {
            return await _context.AuctionCars
                .Include(ac => ac.Auction)
                .Where(ac => 
                    // PreAuction car-ları Ready auction-larda ReadyForAuction-a keçir
                    (ac.AuctionCondition == AuctionCarCondition.PreAuction && 
                     ac.Auction.Status == AuctionStatus.Ready) ||
                    
                    // ReadyForAuction car-ları Running auction-da current car olarsa LiveAuction-a keçir
                    (ac.AuctionCondition == AuctionCarCondition.ReadyForAuction && 
                     ac.Auction.Status == AuctionStatus.Running &&
                     ac.Auction.CurrentCarLotNumber == ac.LotNumber &&
                     !ac.IsActive))
                .OrderBy(ac => ac.Auction.Status)
                .ThenBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        public async Task<AuctionCar?> GetActiveAuctionCarAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Bids.OrderByDescending(b => b.PlacedAtUtc))
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Where(ac => ac.AuctionId == auctionId && ac.IsActive)
                .FirstOrDefaultAsync();
        }

        public async Task<AuctionCar?> GetNextAuctionCarAsync(Guid auctionId, string currentLotNumber)
        {
            // Next car prioritization
            var readyCars = await _context.AuctionCars
                .Include(ac => ac.Bids.Where(b => b.IsPreBid))
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.AuctionCondition == AuctionCarCondition.ReadyForAuction ||
                            ac.AuctionCondition == AuctionCarCondition.PreAuction)
                .Where(ac => string.Compare(ac.LotNumber, currentLotNumber) > 0)
                .ToListAsync();

            // Priority 1: Cars with pre-bids
            var carsWithPreBids = readyCars
                .Where(ac => ac.Bids.Any(b => b.IsPreBid))
                .OrderBy(ac => ac.LaneNumber)
                .ThenBy(ac => ac.RunOrder)
                .ThenBy(ac => ac.LotNumber)
                .FirstOrDefault();

            if (carsWithPreBids != null)
                return carsWithPreBids;

            // Priority 2: Cars with start price set
            return readyCars
                .Where(ac => ac.StartPrice > 0)
                .OrderBy(ac => ac.LaneNumber)
                .ThenBy(ac => ac.RunOrder)
                .ThenBy(ac => ac.LotNumber)
                .FirstOrDefault();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsWithExpiredTimerAsync(Guid auctionId, int timerSeconds)
        {
            var cutoffTime = DateTime.UtcNow.AddSeconds(-timerSeconds);

            return await _context.AuctionCars
                .Include(ac => ac.Bids)
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.IsActive)
                .Where(ac => ac.AuctionCondition == AuctionCarCondition.LiveAuction)
                .Where(ac => (ac.LastBidTime.HasValue && ac.LastBidTime < cutoffTime) ||
                            (!ac.LastBidTime.HasValue && ac.ActiveStartTime.HasValue && ac.ActiveStartTime < cutoffTime))
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsByLaneAsync(int laneNumber, DateTime? scheduleDate = null)
        {
            var query = _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Where(ac => ac.LaneNumber == laneNumber);

            if (scheduleDate.HasValue)
            {
                var startOfDay = scheduleDate.Value.Date;
                var endOfDay = startOfDay.AddDays(1);
                query = query.Where(ac => ac.ScheduledTime >= startOfDay && ac.ScheduledTime < endOfDay);
            }

            return await query
                .OrderBy(ac => ac.RunOrder)
                .ThenBy(ac => ac.ScheduledTime)
                .ThenBy(ac => ac.LotNumber)
                .ToListAsync();
        }
        #endregion

        #region Post-Auction Phase
        public async Task<IEnumerable<AuctionCar>> GetUnsoldAuctionCarsAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Bids)
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.Unsold ||
                            ac.WinnerStatus == AuctionWinnerStatus.SellerRejected)
                .OrderBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetSoldCarsAwaitingApprovalAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Bids)
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.AwaitingSellerApproval)
                .OrderBy(ac => ac.WinnerNotifiedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsAwaitingPaymentAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.SellerApproved ||
                            ac.WinnerStatus == AuctionWinnerStatus.DepositPaid)
                .OrderBy(ac => ac.PaymentDueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetOverduePaymentCarsAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .Include(ac => ac.Auction)
                .Where(ac => ac.PaymentDueDate.HasValue && ac.PaymentDueDate < now)
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.SellerApproved ||
                            ac.WinnerStatus == AuctionWinnerStatus.DepositPaid)
                .OrderBy(ac => ac.PaymentDueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsReadyForPickupAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.PaymentComplete)
                .Where(ac => ac.AuctionCondition == AuctionCarCondition.ReadyForPickup)
                .OrderBy(ac => ac.DepositPaidAt)
                .ToListAsync();
        }
        #endregion

        #region Pricing & Financial
        public async Task<decimal?> GetCurrentPriceAsync(Guid auctionCarId)
        {
            return await _context.AuctionCars
                .Where(ac => ac.Id == auctionCarId)
                .Select(ac => (decimal?)ac.CurrentPrice)
                .FirstOrDefaultAsync();
        }

        public async Task<decimal> GetTotalSalesAmountAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.HammerPrice.HasValue)
                .SumAsync(ac => ac.HammerPrice!.Value);
        }

        public async Task<decimal> GetAverageHammerPriceAsync(Guid auctionId)
        {
            var prices = await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.HammerPrice.HasValue)
                .Select(ac => ac.HammerPrice!.Value)
                .ToListAsync();

            return prices.Any() ? prices.Average() : 0;
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsByPriceRangeAsync(Guid auctionId, decimal minPrice, decimal maxPrice)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.CurrentPrice >= minPrice && ac.CurrentPrice <= maxPrice)
                .OrderBy(ac => ac.CurrentPrice)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsAboveReserveAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.IsReserveMet)
                .OrderByDescending(ac => ac.CurrentPrice)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsBelowReserveAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => !ac.IsReserveMet && ac.ReservePrice.HasValue)
                .OrderBy(ac => ac.CurrentPrice)
                .ToListAsync();
        }
        #endregion

        #region Bid & User Management
        public async Task<bool> HasUserPreBidAsync(Guid auctionCarId, Guid userId)
        {
            return await _context.Bids
                .AnyAsync(b => b.AuctionCarId == auctionCarId &&
                              b.UserId == userId &&
                              b.IsPreBid &&
                              b.Status == BidStatus.Placed);
        }

        public async Task<int> GetTotalPreBidCountAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsPreBid &&
                           b.Status == BidStatus.Placed)
                .CountAsync();
        }

        public async Task<decimal> GetHighestPreBidAmountAsync(Guid auctionCarId)
        {
            var highestBid = await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsPreBid &&
                           b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .FirstOrDefaultAsync();

            return highestBid?.Amount ?? 0;
        }

        public async Task<int> GetUniqueBiddersCountAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .Select(b => b.UserId)
                .Distinct()
                .CountAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetUserWonCarsAsync(Guid userId, Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.AuctionWinner != null && ac.AuctionWinner.UserId == userId)
                .OrderBy(ac => ac.LotNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetUserBiddingCarsAsync(Guid userId, Guid auctionId)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.Bids.Where(b => b.UserId == userId))
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.Bids.Any(b => b.UserId == userId && b.Status == BidStatus.Placed))
                .OrderBy(ac => ac.LotNumber)
                .ToListAsync();
        }
        #endregion

        #region Scheduling & Lane Management
        public async Task<IEnumerable<AuctionCar>> GetScheduledCarsAsync(DateTime fromTime, DateTime toTime)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Where(ac => ac.ScheduledTime >= fromTime && ac.ScheduledTime <= toTime)
                .OrderBy(ac => ac.ScheduledTime)
                .ThenBy(ac => ac.LaneNumber)
                .ThenBy(ac => ac.RunOrder)
                .ToListAsync();
        }

        public async Task<bool> IsLaneSlotAvailableAsync(int laneNumber, DateTime scheduledTime, int runOrder)
        {
            var existingCar = await _context.AuctionCars
                .FirstOrDefaultAsync(ac => ac.LaneNumber == laneNumber &&
                                          ac.RunOrder == runOrder &&
                                          ac.ScheduledTime.HasValue &&
                                          Math.Abs((ac.ScheduledTime.Value - scheduledTime).TotalMinutes) < 30);

            return existingCar == null;
        }

        public async Task<int> GetNextRunOrderAsync(int laneNumber, DateTime scheduleDate)
        {
            var startOfDay = scheduleDate.Date;
            var endOfDay = startOfDay.AddDays(1);

            var maxRunOrder = await _context.AuctionCars
                .Where(ac => ac.LaneNumber == laneNumber)
                .Where(ac => ac.ScheduledTime >= startOfDay && ac.ScheduledTime < endOfDay)
                .MaxAsync(ac => (int?)ac.RunOrder);

            return (maxRunOrder ?? 0) + 1;
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsRunningLateAsync(DateTime currentTime)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Where(ac => ac.ScheduledTime.HasValue &&
                            ac.ScheduledTime < currentTime &&
                            ac.AuctionCondition == AuctionCarCondition.ReadyForAuction)
                .OrderBy(ac => ac.ScheduledTime)
                .ToListAsync();
        }
        #endregion

        #region Analytics & Reporting
        public async Task<Dictionary<AuctionWinnerStatus, int>> GetStatusBreakdownAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId)
                .GroupBy(ac => ac.WinnerStatus)
                .ToDictionaryAsync(g => g.Key, g => g.Count());
        }

        public async Task<Dictionary<AuctionCarCondition, int>> GetConditionBreakdownAsync(Guid auctionId)
        {
            return await _context.AuctionCars
                .Where(ac => ac.AuctionId == auctionId)
                .GroupBy(ac => ac.AuctionCondition)
                .ToDictionaryAsync(g => g.Key, g => g.Count());
        }

        public async Task<IEnumerable<AuctionCar>> GetTopSellingCarsAsync(Guid auctionId, int count = 10)
        {
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.HammerPrice.HasValue)
                .OrderByDescending(ac => ac.HammerPrice)
                .Take(count)
                .ToListAsync();
        }

        public async Task<decimal> GetSellThroughRateAsync(Guid auctionId)
        {
            var totalCars = await _context.AuctionCars
                .CountAsync(ac => ac.AuctionId == auctionId);

            if (totalCars == 0) return 0;

            var soldCars = await _context.AuctionCars
                .CountAsync(ac => ac.AuctionId == auctionId &&
                                 (ac.WinnerStatus == AuctionWinnerStatus.Won ||
                                  ac.WinnerStatus == AuctionWinnerStatus.SellerApproved ||
                                  ac.WinnerStatus == AuctionWinnerStatus.DepositPaid ||
                                  ac.WinnerStatus == AuctionWinnerStatus.PaymentComplete ||
                                  ac.WinnerStatus == AuctionWinnerStatus.Completed));

            return (decimal)soldCars / totalCars * 100;
        }

        public async Task<decimal> GetReserveAchievementRateAsync(Guid auctionId)
        {
            var carsWithReserve = await _context.AuctionCars
                .CountAsync(ac => ac.AuctionId == auctionId && ac.ReservePrice.HasValue);

            if (carsWithReserve == 0) return 0;

            var reserveMetCars = await _context.AuctionCars
                .CountAsync(ac => ac.AuctionId == auctionId && ac.IsReserveMet);

            return (decimal)reserveMetCars / carsWithReserve * 100;
        }
        #endregion

        #region Batch Operations
        public async Task<int> BulkUpdateConditionAsync(IEnumerable<Guid> auctionCarIds, AuctionCarCondition condition)
        {
            var cars = await _context.AuctionCars
                .Where(ac => auctionCarIds.Contains(ac.Id))
                .ToListAsync();

            foreach (var car in cars)
            {
                car.AuctionCondition = condition;
                car.MarkUpdated();
            }

            return await _context.SaveChangesAsync();
        }

        public async Task<int> MarkOverduePaymentsAsync()
        {
            var now = DateTime.UtcNow;
            var overdueCars = await _context.AuctionCars
                .Where(ac => ac.PaymentDueDate.HasValue && ac.PaymentDueDate < now)
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.SellerApproved ||
                            ac.WinnerStatus == AuctionWinnerStatus.DepositPaid)
                .ToListAsync();

            foreach (var car in overdueCars)
            {
                car.WinnerStatus = AuctionWinnerStatus.PaymentOverdue;
                car.MarkUpdated();
            }

            return await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetCarsRequiringActionAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Include(ac => ac.AuctionWinner)
                .Where(ac =>
                    // Awaiting seller approval for more than 24 hours
                    (ac.WinnerStatus == AuctionWinnerStatus.AwaitingSellerApproval &&
                     ac.WinnerNotifiedAt.HasValue &&
                     ac.WinnerNotifiedAt < now.AddHours(-24)) ||

                    // Payment overdue
                    (ac.PaymentDueDate.HasValue && ac.PaymentDueDate < now &&
                     (ac.WinnerStatus == AuctionWinnerStatus.SellerApproved ||
                      ac.WinnerStatus == AuctionWinnerStatus.DepositPaid)) ||

                    // Ready for pickup for more than 30 days
                    (ac.AuctionCondition == AuctionCarCondition.ReadyForPickup &&
                     ac.DepositPaidAt.HasValue &&
                     ac.DepositPaidAt < now.AddDays(-30)))
                .OrderBy(ac => ac.PaymentDueDate)
                .ToListAsync();
        }
        #endregion

        #region Search & Filtering
        public async Task<IEnumerable<AuctionCar>> SearchCarsAsync(AuctionCarSearchCriteria criteria)
        {
            var query = _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.AuctionWinner)
                .AsQueryable();

            // Apply filters
            if (criteria.AuctionId.HasValue)
                query = query.Where(ac => ac.AuctionId == criteria.AuctionId.Value);

            if (!string.IsNullOrEmpty(criteria.LotNumber))
                query = query.Where(ac => ac.LotNumber.Contains(criteria.LotNumber));

            if (!string.IsNullOrEmpty(criteria.Make))
                query = query.Where(ac => ac.Car.Make.Contains(criteria.Make));

            if (!string.IsNullOrEmpty(criteria.Model))
                query = query.Where(ac => ac.Car.Model.Contains(criteria.Model));

            if (criteria.YearFrom.HasValue)
                query = query.Where(ac => ac.Car.Year >= criteria.YearFrom.Value);

            if (criteria.YearTo.HasValue)
                query = query.Where(ac => ac.Car.Year <= criteria.YearTo.Value);

            if (criteria.PriceFrom.HasValue)
                query = query.Where(ac => ac.CurrentPrice >= criteria.PriceFrom.Value);

            if (criteria.PriceTo.HasValue)
                query = query.Where(ac => ac.CurrentPrice <= criteria.PriceTo.Value);

            if (criteria.WinnerStatus.HasValue)
                query = query.Where(ac => ac.WinnerStatus == criteria.WinnerStatus.Value);

            if (criteria.Condition.HasValue)
                query = query.Where(ac => ac.AuctionCondition == criteria.Condition.Value);

            if (criteria.IsReserveMet.HasValue)
                query = query.Where(ac => ac.IsReserveMet == criteria.IsReserveMet.Value);

            if (criteria.HasPreBids.HasValue)
                query = criteria.HasPreBids.Value
                    ? query.Where(ac => ac.Bids.Any(b => b.IsPreBid))
                    : query.Where(ac => !ac.Bids.Any(b => b.IsPreBid));

            if (criteria.LaneNumber.HasValue)
                query = query.Where(ac => ac.LaneNumber == criteria.LaneNumber.Value);

            if (criteria.ScheduledFrom.HasValue)
                query = query.Where(ac => ac.ScheduledTime >= criteria.ScheduledFrom.Value);

            if (criteria.ScheduledTo.HasValue)
                query = query.Where(ac => ac.ScheduledTime <= criteria.ScheduledTo.Value);

            // Apply sorting
            query = criteria.SortBy.ToLower() switch
            {
                "lotnumber" => criteria.SortDirection.ToUpper() == "DESC"
                    ? query.OrderByDescending(ac => ac.LotNumber)
                    : query.OrderBy(ac => ac.LotNumber),
                "currentprice" => criteria.SortDirection.ToUpper() == "DESC"
                    ? query.OrderByDescending(ac => ac.CurrentPrice)
                    : query.OrderBy(ac => ac.CurrentPrice),
                "scheduledtime" => criteria.SortDirection.ToUpper() == "DESC"
                    ? query.OrderByDescending(ac => ac.ScheduledTime)
                    : query.OrderBy(ac => ac.ScheduledTime),
                _ => query.OrderBy(ac => ac.LotNumber)
            };

            // Apply pagination
            return await query
                .Skip((criteria.Page - 1) * criteria.PageSize)
                .Take(criteria.PageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetRecentlyAddedCarsAsync(Guid auctionId, int hours = 24)
        {
            var cutoffTime = DateTime.UtcNow.AddHours(-hours);

            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.CreatedAt >= cutoffTime)
                .OrderByDescending(ac => ac.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionCar>> GetFeaturedCarsAsync(Guid auctionId)
        {
            // Featured cars logic: High value, lots of pre-bids, or special vehicles
            return await _context.AuctionCars
                .Include(ac => ac.Car)
                .Include(ac => ac.Bids.Where(b => b.IsPreBid))
                .Where(ac => ac.AuctionId == auctionId)
                .Where(ac => ac.CurrentPrice >= 10000 || // High value
                            ac.Bids.Count(b => b.IsPreBid) >= 5 || // Lots of pre-bids
                            ac.Car.Year >= DateTime.Now.Year - 5) // Recent model
                .OrderByDescending(ac => ac.Bids.Count(b => b.IsPreBid))
                .ThenByDescending(ac => ac.CurrentPrice)
                .Take(10)
                .ToListAsync();
        }
        public async Task<IEnumerable<AuctionCar>> GetActiveAuctionCarsByCarIdsAsync(IEnumerable<Guid> carIds)
        {
            if (carIds == null) return Enumerable.Empty<AuctionCar>();

            var ids = carIds.Distinct().ToList();
            if (!ids.Any()) return Enumerable.Empty<AuctionCar>();

            // Business rule: auctioncar should be active/live and parent auction running/live
            return await _context.AuctionCars
                .AsNoTracking()
                .Include(ac => ac.Car)
                .Include(ac => ac.Auction)
                .Where(ac => ids.Contains(ac.CarId)
                             && ac.IsActive // car marked active in auction
                             && ac.Auction != null
                             && ac.Auction.Status == AuctionStatus.Running
                             && ac.AuctionCondition == AuctionCarCondition.LiveAuction)
                .ToListAsync();
        }

        #endregion
    }
}