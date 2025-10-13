using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Auctions
{
    public class AuctionWinnerRepository : GenericRepository<AuctionWinner>, IAuctionWinnerRepository
    {
        private readonly ILogger<AuctionWinnerRepository> _logger;

        public AuctionWinnerRepository(AppDbContext context, ILogger<AuctionWinnerRepository> logger)
            : base(context)
        {
            _logger = logger;
        }

        #region Basic Winner Queries

        public async Task<AuctionWinner?> GetByAuctionCarIdAsync(Guid auctionCarId)
        {
            _logger.LogDebug("Getting winner by auction car ID: {AuctionCarId}", auctionCarId);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Include(aw => aw.WinningBid)
                .FirstOrDefaultAsync(aw => aw.AuctionCarId == auctionCarId &&
                                          aw.PaymentStatus != PaymentStatus.Cancelled);
        }

        public async Task<AuctionWinner?> GetWinnerWithFullDetailsAsync(Guid winnerId)
        {
            _logger.LogDebug("Getting winner with full details: {WinnerId}", winnerId);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                        .ThenInclude(a => a.Location)
                .Include(aw => aw.WinningBid)
                .FirstOrDefaultAsync(aw => aw.Id == winnerId);
        }

        public async Task<IEnumerable<AuctionWinner>> GetByUserIdAsync(Guid userId)
        {
            _logger.LogDebug("Getting winners by user ID: {UserId}", userId);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.UserId == userId)
                .OrderByDescending(aw => aw.AssignedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetWinnersByAuctionAsync(Guid auctionId)
        {
            _logger.LogDebug("Getting winners by auction ID: {AuctionId}", auctionId);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.AuctionCar.AuctionId == auctionId)
                .OrderBy(aw => aw.AuctionCar.LotNumber)
                .ToListAsync();
        }

        #endregion

        #region Payment Tracking & Management

        public async Task<IEnumerable<AuctionWinner>> GetWinnersByPaymentStatusAsync(PaymentStatus paymentStatus)
        {
            _logger.LogDebug("Getting winners by payment status: {Status}", paymentStatus);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.PaymentStatus == paymentStatus)
                .OrderByDescending(aw => aw.AssignedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetOverduePaymentsAsync()
        {
            var now = DateTime.UtcNow;
            _logger.LogDebug("Getting overdue payments as of: {CurrentTime}", now);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Include(aw => aw.WinningBid)
                .Where(aw => (aw.PaymentStatus == PaymentStatus.Pending ||
                             aw.PaymentStatus == PaymentStatus.PartiallyPaid) &&
                            aw.PaymentDueDate.HasValue &&
                            aw.PaymentDueDate.Value < now)
                .OrderBy(aw => aw.PaymentDueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetUnpaidWinnersAsync(Guid userId)
        {
            _logger.LogDebug("Getting unpaid winners for user: {UserId}", userId);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.UserId == userId &&
                            (aw.PaymentStatus == PaymentStatus.Pending ||
                             aw.PaymentStatus == PaymentStatus.PartiallyPaid))
                .OrderBy(aw => aw.PaymentDueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetPaidWinnersInPeriodAsync(DateTime fromDate, DateTime toDate)
        {
            _logger.LogDebug("Getting paid winners from {From} to {To}", fromDate, toDate);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.PaymentStatus == PaymentStatus.Paid &&
                            aw. UpdatedAtUtc >= fromDate &&
                            aw.UpdatedAtUtc <= toDate)
                .OrderByDescending(aw => aw.UpdatedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetPartiallyPaidWinnersAsync()
        {
            _logger.LogDebug("Getting partially paid winners");

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.PaymentStatus == PaymentStatus.PartiallyPaid)
                .OrderByDescending(aw => aw.UpdatedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetFailedPaymentWinnersAsync()
        {
            _logger.LogDebug("Getting failed payment winners");

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.PaymentStatus == PaymentStatus.Failed)
                .OrderByDescending(aw => aw.UpdatedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetWinnersForPaymentReminderAsync(int daysBefore = 2)
        {
            var targetDate = DateTime.UtcNow.AddDays(daysBefore).Date;
            _logger.LogDebug("Getting winners for payment reminder {Days} days before: {TargetDate}", daysBefore, targetDate);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => (aw.PaymentStatus == PaymentStatus.Pending ||
                             aw.PaymentStatus == PaymentStatus.PartiallyPaid) &&
                            aw.PaymentDueDate.HasValue &&
                            aw.PaymentDueDate.Value.Date <= targetDate &&
                            (!aw.LastPaymentReminderSent.HasValue ||
                             aw.LastPaymentReminderSent.Value.Date < DateTime.UtcNow.Date))
                .OrderBy(aw => aw.PaymentDueDate)
                .ToListAsync();
        }

        #endregion

        #region Seller Operations

        public async Task<IEnumerable<AuctionWinner>> GetSellerSalesAsync(Guid sellerId)
        {
            _logger.LogDebug("Getting seller sales for: {SellerId}", sellerId);
            var sellerIdString = sellerId.ToString();
         
            var results = await _context.AuctionWinners
               .Include(aw => aw.AuctionCar).ThenInclude(ac => ac.Car)
               .Include(aw => aw.WinningBid)
               .Where(aw => aw.AuctionCar.Car.OwnerId == sellerIdString)
               .OrderByDescending(aw => aw.AssignedAt)
               .ToListAsync();
            return results;
        }

        public async Task<IEnumerable<AuctionWinner>> GetPendingConfirmationsBySellerAsync(Guid sellerId)
        {
            _logger.LogDebug("Getting pending confirmations for seller: {SellerId}", sellerId);
            var sellerIdString = sellerId.ToString();

            var result = await  _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.AuctionCar.Car.OwnerId == sellerIdString &&
                            !aw.WinnerConfirmedAt.HasValue &&
                            aw.PaymentStatus != PaymentStatus.Cancelled)
                .OrderBy(aw => aw.AssignedAt)
                .ToListAsync();
            return  result;
        }

        public async Task<IEnumerable<AuctionWinner>> GetConfirmedWinnersBySellerAsync(Guid sellerId)
        {
            _logger.LogDebug("Getting confirmed winners for seller: {SellerId}", sellerId);
            var sellerIdString = sellerId.ToString();

            var result =  await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.AuctionCar.Car.OwnerId == sellerIdString &&
                            aw.WinnerConfirmedAt.HasValue)
                .OrderByDescending(aw => aw.WinnerConfirmedAt)
                .ToListAsync();
            return result;
        }

        public async Task<IEnumerable<AuctionWinner>> GetRejectedWinnersBySellerAsync(Guid sellerId)
        {
            _logger.LogDebug("Getting rejected winners for seller: {SellerId}", sellerId);
            var sellerIdString = sellerId.ToString();
            var result =  await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.AuctionCar.Car.OwnerId == sellerIdString &&
                            !string.IsNullOrEmpty(aw.RejectionReason))
                .OrderByDescending(aw => aw.UpdatedAtUtc)
                .ToListAsync();
            return result;
        }

        #endregion

        #region Analytics & Statistics

        public async Task<decimal> GetUserSuccessRateAsync(Guid userId)
        {
            _logger.LogDebug("Calculating user success rate for: {UserId}", userId);

            var totalWins = await _context.AuctionWinners
                .CountAsync(aw => aw.UserId == userId);

            if (totalWins == 0) return 0;

            var successfulWins = await _context.AuctionWinners
                .CountAsync(aw => aw.UserId == userId &&
                                 aw.PaymentStatus == PaymentStatus.Paid);

            return Math.Round((decimal)successfulWins / totalWins * 100, 2);
        }

        public async Task<TimeSpan> GetUserAveragePaymentTimeAsync(Guid userId)
        {
            _logger.LogDebug("Calculating user average payment time for: {UserId}", userId);

            var paidWinners = await _context.AuctionWinners
                .Where(aw => aw.UserId == userId &&
                            aw.PaymentStatus == PaymentStatus.Paid &&
                            aw.WinnerConfirmedAt.HasValue)
                .Select(aw => new {
                    AssignedAt = aw.AssignedAt,
                    PaidAt = aw.UpdatedAtUtc ?? aw.CreatedAt
                })
                .ToListAsync();

            if (!paidWinners.Any()) return TimeSpan.Zero;

            var totalHours = paidWinners
                .Select(pw => (pw.PaidAt - pw.AssignedAt).TotalHours)
                .Average();

            return TimeSpan.FromHours(totalHours);
        }

        public async Task<decimal> GetTotalSalesAmountAsync(Guid auctionId)
        {
            _logger.LogDebug("Calculating total sales amount for auction: {AuctionId}", auctionId);

            return await _context.AuctionWinners
                .Where(aw => aw.AuctionCar.AuctionId == auctionId &&
                            aw.PaymentStatus != PaymentStatus.Cancelled)
                .SumAsync(aw => aw.Amount);
        }

        public async Task<decimal> GetOverallCollectionRateAsync()
        {
            _logger.LogDebug("Calculating overall collection rate");

            var totalAmount = await _context.AuctionWinners
                .Where(aw => aw.PaymentStatus != PaymentStatus.Cancelled)
                .SumAsync(aw => aw.Amount);

            if (totalAmount == 0) return 0;

            var collectedAmount = await _context.AuctionWinners
                .Where(aw => aw.PaymentStatus == PaymentStatus.Paid)
                .SumAsync(aw => aw.PaidAmount ?? 0);

            return Math.Round(collectedAmount / totalAmount * 100, 2);
        }

        public async Task<IEnumerable<TopBuyerData>> GetTopBuyersDataAsync(int count = 10)
        {
            _logger.LogDebug("Getting top {Count} buyers data", count);

            var buyerStats = await _context.AuctionWinners
                .Where(aw => aw.PaymentStatus != PaymentStatus.Cancelled)
                .GroupBy(aw => aw.UserId)
                .Select(g => new TopBuyerData
                {
                    UserId = g.Key,
                    TotalWins = g.Count(),
                    TotalPurchaseAmount = g.Sum(aw => aw.Amount),
                    AveragePurchaseAmount = g.Average(aw => aw.Amount),
                    FirstWinDate = g.Min(aw => aw.AssignedAt),
                    LastWinDate = g.Max(aw => aw.AssignedAt),
                    CompletedCount = g.Count(aw => aw.PaymentStatus == PaymentStatus.Paid),
                    OverdueCount = g.Count(aw => aw.PaymentStatus == PaymentStatus.Pending &&
                                                 aw.PaymentDueDate.HasValue &&
                                                 aw.PaymentDueDate.Value < DateTime.UtcNow)
                })
                .OrderByDescending(x => x.TotalPurchaseAmount)
                .Take(count)
                .ToListAsync();

            foreach (var buyer in buyerStats)
            {
                buyer.SuccessRate = buyer.TotalWins > 0 ?
                    Math.Round((decimal)buyer.CompletedCount / buyer.TotalWins * 100, 2) : 0;

                buyer.ReliabilityScore = buyer.SuccessRate switch
                {
                    >= 95 => "A+",
                    >= 85 => "A",
                    >= 75 => "B",
                    >= 60 => "C",
                    _ => "D"
                };

                buyer.AveragePaymentTime = await GetUserAveragePaymentTimeAsync(buyer.UserId);
            }

            return buyerStats;
        }

        public async Task<WinnerStatisticsData> GetWinnerStatisticsDataAsync(Guid? auctionId, DateTime? fromDate, DateTime? toDate)
        {
            _logger.LogDebug("Getting winner statistics data for auction: {AuctionId}, from: {From}, to: {To}",
                auctionId, fromDate, toDate);

            var query = _context.AuctionWinners.AsQueryable();

            if (auctionId.HasValue)
                query = query.Where(aw => aw.AuctionCar.AuctionId == auctionId.Value);

            if (fromDate.HasValue)
                query = query.Where(aw => aw.AssignedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(aw => aw.AssignedAt <= toDate.Value);

            var winners = await query.ToListAsync();

            var statistics = new WinnerStatisticsData
            {
                TotalWinners = winners.Count,
                CompletedSales = winners.Count(w => w.PaymentStatus == PaymentStatus.Paid),
                PendingPayments = winners.Count(w => w.PaymentStatus == PaymentStatus.Pending),
                OverduePayments = winners.Count(w => w.IsPaymentOverdue()),
                CancelledWinners = winners.Count(w => w.PaymentStatus == PaymentStatus.Cancelled),
                TotalWinAmount = winners.Sum(w => w.Amount),
                TotalPaidAmount = winners.Sum(w => w.PaidAmount ?? 0),
                TotalOutstandingAmount = winners.Sum(w => w.GetRemainingAmount()),
                CollectionRate = winners.Any() ?
                    Math.Round(winners.Sum(w => w.PaidAmount ?? 0) / winners.Sum(w => w.Amount) * 100, 2) : 0,
                AverageWinAmount = winners.Any() ? Math.Round(winners.Average(w => w.Amount), 2) : 0,
                CompletionRate = winners.Any() ?
                    Math.Round((decimal)winners.Count(w => w.PaymentStatus == PaymentStatus.Paid) / winners.Count * 100, 2) : 0
            };

            statistics.StatusBreakdown = winners
                .GroupBy(w => w.PaymentStatus.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            statistics.AmountBreakdown = winners
                .GroupBy(w => w.PaymentStatus.ToString())
                .ToDictionary(g => g.Key, g => g.Sum(w => w.Amount));

            return statistics;
        }

        #endregion

        #region Re-auction & Second Chance

        public async Task<IEnumerable<AuctionWinner>> GetCandidatesForReAuctionAsync()
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-7);
            _logger.LogDebug("Getting re-auction candidates with cutoff date: {CutoffDate}", cutoffDate);

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.PaymentStatus == PaymentStatus.Failed ||
                            aw.PaymentStatus == PaymentStatus.Cancelled ||
                            (aw.PaymentStatus == PaymentStatus.Pending &&
                             aw.PaymentDueDate.HasValue &&
                             aw.PaymentDueDate.Value < cutoffDate))
                .OrderBy(aw => aw.AssignedAt)
                .ToListAsync();
        }

        public async Task<AuctionWinner?> GetSecondChanceCandidateAsync(Guid auctionCarId)
        {
            _logger.LogDebug("Finding second chance candidate for auction car: {AuctionCarId}", auctionCarId);

            var currentWinner = await GetByAuctionCarIdAsync(auctionCarId);
            if (currentWinner?.WinningBid == null) return null;

            var nextHighestBid = await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.Id != currentWinner.WinningBidId &&
                           b.Status == Domain.Enums.AuctionEnums.BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc)
                .FirstOrDefaultAsync();

            if (nextHighestBid == null) return null;

            return AuctionWinner.CreateSecondChance(
                auctionCarId,
                nextHighestBid.UserId,
                nextHighestBid.Id,
                nextHighestBid.Amount,
                currentWinner.Id);
        }

        public async Task<bool> HasActiveWinnerAsync(Guid auctionCarId)
        {
            _logger.LogDebug("Checking if auction car has active winner: {AuctionCarId}", auctionCarId);

            return await _context.AuctionWinners
                .AnyAsync(aw => aw.AuctionCarId == auctionCarId &&
                               aw.PaymentStatus != PaymentStatus.Cancelled &&
                               aw.PaymentStatus != PaymentStatus.Failed);
        }

        #endregion

        #region Search & Filtering

        public async Task<IEnumerable<AuctionWinner>> SearchWinnersAsync(WinnerSearchCriteria criteria)
        {
            _logger.LogDebug("Searching winners with criteria - Page: {Page}, Size: {PageSize}",
                criteria.Page, criteria.PageSize);

            var query = _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Include(aw => aw.WinningBid)
                .AsQueryable();

            if (criteria.UserId.HasValue)
                query = query.Where(aw => aw.UserId == criteria.UserId.Value);

            if (criteria.AuctionId.HasValue)
                query = query.Where(aw => aw.AuctionCar.AuctionId == criteria.AuctionId.Value);

            if (criteria.AuctionCarId.HasValue)
                query = query.Where(aw => aw.AuctionCarId == criteria.AuctionCarId.Value);

            if (!string.IsNullOrEmpty(criteria.LotNumber))
                query = query.Where(aw => aw.AuctionCar.LotNumber.Contains(criteria.LotNumber));

            if (criteria.PaymentStatus.HasValue)
                query = query.Where(aw => aw.PaymentStatus == criteria.PaymentStatus.Value);

            if (criteria.FromDate.HasValue)
                query = query.Where(aw => aw.AssignedAt >= criteria.FromDate.Value);

            if (criteria.ToDate.HasValue)
                query = query.Where(aw => aw.AssignedAt <= criteria.ToDate.Value);

            if (criteria.MinAmount.HasValue)
                query = query.Where(aw => aw.Amount >= criteria.MinAmount.Value);

            if (criteria.MaxAmount.HasValue)
                query = query.Where(aw => aw.Amount <= criteria.MaxAmount.Value);

            if (criteria.IsConfirmed.HasValue)
                query = criteria.IsConfirmed.Value
                    ? query.Where(aw => aw.WinnerConfirmedAt.HasValue)
                    : query.Where(aw => !aw.WinnerConfirmedAt.HasValue);

            if (criteria.IsOverdue.HasValue)
            {
                var now = DateTime.UtcNow;
                query = criteria.IsOverdue.Value
                    ? query.Where(aw => aw.PaymentDueDate.HasValue && aw.PaymentDueDate.Value < now)
                    : query.Where(aw => !aw.PaymentDueDate.HasValue || aw.PaymentDueDate.Value >= now);
            }

            if (criteria.IsSecondChance.HasValue)
                query = query.Where(aw => aw.IsSecondChanceWinner == criteria.IsSecondChance.Value);

            if (!string.IsNullOrEmpty(criteria.CarMake))
                query = query.Where(aw => aw.AuctionCar.Car.Make.Contains(criteria.CarMake));

            if (!string.IsNullOrEmpty(criteria.CarModel))
                query = query.Where(aw => aw.AuctionCar.Car.Model.Contains(criteria.CarModel));

            if (criteria.CarYear.HasValue)
                query = query.Where(aw => aw.AuctionCar.Car.Year == criteria.CarYear.Value);

            // Sorting
            query = criteria.SortBy.ToLower() switch
            {
                "assignedat" => criteria.SortDirection == "ASC"
                    ? query.OrderBy(aw => aw.AssignedAt)
                    : query.OrderByDescending(aw => aw.AssignedAt),
                "amount" => criteria.SortDirection == "ASC"
                    ? query.OrderBy(aw => aw.Amount)
                    : query.OrderByDescending(aw => aw.Amount),
                "paymentduedate" => criteria.SortDirection == "ASC"
                    ? query.OrderBy(aw => aw.PaymentDueDate)
                    : query.OrderByDescending(aw => aw.PaymentDueDate),
                _ => query.OrderByDescending(aw => aw.AssignedAt)
            };

            // Pagination
            var skip = (criteria.Page - 1) * criteria.PageSize;
            return await query.Skip(skip).Take(criteria.PageSize).ToListAsync();
        }

        public async Task<IEnumerable<AuctionWinner>> GetWinnersByAmountRangeAsync(decimal minAmount, decimal maxAmount)
        {
            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw => aw.Amount >= minAmount && aw.Amount <= maxAmount)
                .OrderByDescending(aw => aw.Amount)
                .ToListAsync();
        }

        #endregion

        #region Bulk Operations

        public async Task<int> MarkOverduePaymentsAsync()
        {
            var overdueWinners = await GetOverduePaymentsAsync();
            int updatedCount = 0;

            foreach (var winner in overdueWinners)
            {
                winner.Notes = $"Payment overdue since {winner.PaymentDueDate}. " + winner.Notes;
                updatedCount++;
            }

            if (updatedCount > 0)
                await _context.SaveChangesAsync();

            return updatedCount;
        }

        public async Task<int> ArchiveCompletedWinnersAsync(DateTime cutoffDate)
        {
            var completedWinners = await _context.AuctionWinners
                .Where(aw => aw.PaymentStatus == PaymentStatus.Paid &&
                            aw.UpdatedAtUtc < cutoffDate)
                .ToListAsync();

            return completedWinners.Count;
        }

        public async Task<IEnumerable<AuctionWinner>> GetWinnersRequiringActionAsync()
        {
            var now = DateTime.UtcNow;

            return await _context.AuctionWinners
                .Include(aw => aw.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(aw => aw.WinningBid)
                .Where(aw =>
                    // Unconfirmed winners
                    !aw.WinnerConfirmedAt.HasValue ||
                    // Overdue payments
                    (aw.PaymentStatus == PaymentStatus.Pending &&
                     aw.PaymentDueDate.HasValue &&
                     aw.PaymentDueDate.Value < now) ||
                    // Partial payments needing follow-up
                    aw.PaymentStatus == PaymentStatus.PartiallyPaid)
                .OrderBy(aw => aw.PaymentDueDate)
                .ToListAsync();
        }

        #endregion
    }
}