using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.Bids;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Auctions
{
    public class BidRepository : GenericRepository<Bid>, IBidRepository
    {
        public BidRepository(AppDbContext context) : base(context) { }

        #region Methods
        public async Task<Bid?> GetHighestBidAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc) // Eyni məbləğdə tarixə görə
                .FirstOrDefaultAsync();
        }

        public async Task<Bid?> GetHighestPreBidAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsPreBid &&
                           b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Bid>> GetPreBidsAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsPreBid &&
                           b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetUserBidsAsync(Guid userId, Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.UserId == userId && b.AuctionCarId == auctionCarId)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }
        public async Task<IEnumerable<Bid>> GetBidsAboveAmountAsync(Guid auctionCarId, decimal amount)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.Amount > amount &&
                           b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetBidsByStatusAsync(Guid auctionCarId, BidStatus status)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == status)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetBidsByTypeAsync(Guid auctionCarId, BidType bidType)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId && b.BidType == bidType)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }
        #endregion
        #region BidHistory,Statistics

        public async Task<IEnumerable<Bid>> GetBidHistoryAsync(Guid auctionCarId, int pageSize = 50)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId)
                .OrderByDescending(b => b.PlacedAtUtc)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetRecentBidsAsync(Guid auctionCarId, int count = 10)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.PlacedAtUtc)
                .Take(count)
                .ToListAsync();
        }

        public async Task<int> GetTotalBidCountAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId)
                .CountAsync();
        }

        public async Task<int> GetActiveBidCountAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .CountAsync();
        }

        public async Task<decimal> GetTotalBidVolumeAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .SumAsync(b => b.Amount);
        }
        #endregion
        #region Reasonable Inquiry//Əsaslı sorğu

        public async Task<IEnumerable<Bid>> GetUserAllBidsAsync(Guid userId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                    .ThenInclude(ac => ac.Car)
                .Include(b => b.AuctionCar)
                    .ThenInclude(ac => ac.Auction)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetUserBidsForAuctionAsync(Guid userId, Guid auctionId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.UserId == userId && b.AuctionCar.AuctionId == auctionId)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetUserWinningBidsAsync(Guid userId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                    .ThenInclude(ac => ac.AuctionWinner)
                .Where(b => b.UserId == userId &&
                           b.AuctionCar.AuctionWinner != null &&
                           b.AuctionCar.AuctionWinner.UserId == userId)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<bool> HasUserBidAsync(Guid userId, Guid auctionCarId)
        {
            return await _context.Bids
                .AnyAsync(b => b.UserId == userId &&
                              b.AuctionCarId == auctionCarId &&
                              b.Status == BidStatus.Placed);
        }

        public async Task<bool> HasUserPreBidAsync(Guid userId, Guid auctionCarId)
        {
            return await _context.Bids
                .AnyAsync(b => b.UserId == userId &&
                              b.AuctionCarId == auctionCarId &&
                              b.IsPreBid &&
                              b.Status == BidStatus.Placed);
        }

        public async Task<Bid?> GetUserHighestBidAsync(Guid userId, Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.UserId == userId &&
                           b.AuctionCarId == auctionCarId &&
                           b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc)
                .FirstOrDefaultAsync();
        }
        #endregion
        #region Proxy Bid Control
        public async Task<IEnumerable<Bid>> GetActiveProxyBidsAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsProxy &&
                           b.Status == BidStatus.Placed &&
                           (b.ValidUntil == null || b.ValidUntil > DateTime.UtcNow))
                .OrderByDescending(b => b.ProxyMax)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetUserProxyBidsAsync(Guid userId, Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.UserId == userId &&
                           b.AuctionCarId == auctionCarId &&
                           b.IsProxy)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetExpiredProxyBidsAsync()
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.IsProxy &&
                           b.Status == BidStatus.Placed &&
                           b.ValidUntil.HasValue &&
                           b.ValidUntil < DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetProxyBidsForProcessingAsync(Guid auctionCarId, decimal currentAmount)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsProxy &&
                           b.Status == BidStatus.Placed &&
                           b.ProxyMax > currentAmount &&
                           (b.ValidUntil == null || b.ValidUntil > DateTime.UtcNow))
                .OrderByDescending(b => b.ProxyMax)
                .ToListAsync();
        }

        public async Task<IEnumerable<Bid>> GetChildBidsAsync(Guid parentBidId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.ParentBidId == parentBidId)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }
        public async Task<int> GetMaxSequenceNumberAsync(Guid auctionCarId)
        {
            var maxSequence = await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId)
                .MaxAsync(b => (int?)b.SequenceNumber);

            return maxSequence ?? 0;
        }

        public async Task<bool> HasActiveProxyBidAsync(Guid userId, Guid auctionCarId)
        {
            return await _context.Bids
                .AnyAsync(b => b.UserId == userId &&
                              b.AuctionCarId == auctionCarId &&
                              b.IsProxy &&
                              b.Status == BidStatus.Placed &&
                              (b.ValidUntil == null || b.ValidUntil > DateTime.UtcNow));
        }

        public async Task<IEnumerable<Bid>> GetProxyBidsAboveAmountAsync(Guid auctionCarId, decimal amount)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.IsProxy &&
                           b.Status == BidStatus.Placed &&
                           b.ProxyMax.HasValue &&
                           b.ProxyMax.Value > amount &&
                           (b.ValidUntil == null || b.ValidUntil > DateTime.UtcNow))
                .OrderByDescending(b => b.ProxyMax)
                .ToListAsync();
        }
        public async Task<IEnumerable<Bid>> GetByAuctionCarIdAsync(Guid auctionCarId)
        {
            try
            {
                return await _context.Bids
                    .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                    .Include(b => b.AuctionCar)
                    .OrderByDescending(b => b.PlacedAtUtc)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                return new List<Bid>();
            }
        }
        public async Task<AuctionCar?> GetAuctionCarWithBidsAsync(Guid auctionCarId)
        {
            try
            {
                return await _context.AuctionCars
                    .Where(ac => ac.Id == auctionCarId)
                    .Include(ac => ac.Bids.Where(b => b.Status == BidStatus.Placed))
                    .Include(ac => ac.Car)
                    .Include(ac => ac.Auction)
                    .Include(ac => ac.AuctionWinner)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<IEnumerable<Bid>> GetBidsForCarAsync(Guid auctionCarId, int pageSize)
        {
            try
            {
                return await _context.Bids
                    .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                    .OrderByDescending(b => b.PlacedAtUtc)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                return new List<Bid>();
            }
        }
        #endregion
        #region Statistics and Analysis
        public async Task<IEnumerable<Bid>> GetTopBiddersAsync(Guid auctionId, int count = 10)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCar.AuctionId == auctionId && b.Status == BidStatus.Placed)
                .GroupBy(b => b.UserId)
                .Select(g => new { UserId = g.Key, TotalAmount = g.Sum(b => b.Amount), LastBid = g.OrderByDescending(b => b.PlacedAtUtc).First() })
                .OrderByDescending(x => x.TotalAmount)
                .Take(count)
                .Select(x => x.LastBid)
                .ToListAsync();
        }

        public async Task<decimal> GetAverageBidAmountAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .AverageAsync(b => b.Amount);
        }

        public async Task<IEnumerable<Bid>> GetBidsInTimeRangeAsync(Guid auctionCarId, DateTime from, DateTime to)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.PlacedAtUtc >= from &&
                           b.PlacedAtUtc <= to)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<int> GetUniqueBiddersCountAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .Select(b => b.UserId)
                .Distinct()
                .CountAsync();
        }
        #endregion
        #region Auction Timer Support
        public async Task<Bid?> GetLastActiveBidAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.PlacedAtUtc)
                .FirstOrDefaultAsync();
        }

        public async Task<DateTime?> GetLastBidTimeAsync(Guid auctionCarId)
        {
            return await _context.Bids
                .Where(b => b.AuctionCarId == auctionCarId && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.PlacedAtUtc)
                .Select(b => (DateTime?)b.PlacedAtUtc)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Bid>> GetBidsAfterTimeAsync(Guid auctionCarId, DateTime afterTime)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.AuctionCarId == auctionCarId &&
                           b.PlacedAtUtc > afterTime &&
                           b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.PlacedAtUtc)
                .ToListAsync();
        }

        public async Task<bool> HasBidsInLastSecondsAsync(Guid auctionCarId, int seconds)
        {
            var cutoffTime = DateTime.UtcNow.AddSeconds(-seconds);
            return await _context.Bids
                .AnyAsync(b => b.AuctionCarId == auctionCarId &&
                              b.Status == BidStatus.Placed &&
                              b.PlacedAtUtc >= cutoffTime);
        }
        #endregion
        #region Batch Operations
        public async Task<IEnumerable<Bid>> GetBidsForProcessingAsync(int batchSize = 100)
        {
            return await _context.Bids
                .Include(b => b.AuctionCar)
                .Where(b => b.ProcessedAt == null && b.Status == BidStatus.Placed)
                .OrderBy(b => b.PlacedAtUtc)
                .Take(batchSize)
                .ToListAsync();
        }

        public async Task<int> UpdateExpiredBidsAsync()
        {
            var expiredBids = await _context.Bids
                .Where(b => b.IsProxy &&
                           b.Status == BidStatus.Placed &&
                           b.ValidUntil.HasValue &&
                           b.ValidUntil < DateTime.UtcNow)
                .ToListAsync();

            foreach (var bid in expiredBids)
            {
                bid.Invalidate("Proxy bid müddəti bitib");
            }

            return await _context.SaveChangesAsync();
        }

        public async Task<int> MarkBidsAsProcessedAsync(IEnumerable<Guid> bidIds)
        {
            var bids = await _context.Bids
                .Where(b => bidIds.Contains(b.Id))
                .ToListAsync();

            foreach (var bid in bids)
            {
                bid.MarkAsProcessed();
            }

            return await _context.SaveChangesAsync();
        }
        #endregion
    }
}