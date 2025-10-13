using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
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
    public class AuctionRepository : GenericRepository<Auction>, IAuctionRepository
    {
        private readonly ILogger<AuctionRepository> _logger;
        public AuctionRepository(AppDbContext context, ILogger<AuctionRepository> logger) : base(context)
        {
            _logger = logger;
        }

        public async Task<IEnumerable<Auction>> GetActiveAuctionsAsync()
        {
            return await _context.Auctions
                .Where(a => a.Status == AuctionStatus.Running || a.Status == AuctionStatus.Scheduled)
                .Include(a => a.AuctionCars)
                .OrderBy(a => a.StartTimeUtc)
                .ToListAsync();
        }

        public async Task<IEnumerable<Auction>> GetAuctionsByLocationAsync(Guid locationId)
        {
            return await _context.Auctions
                .Where(a => a.LocationId == locationId)
                .Include(a => a.AuctionCars)
                .OrderByDescending(a => a.StartTimeUtc)
                .ToListAsync();
        }

        public async Task<decimal?> GetAuctionStartPriceAsync(Guid auctionId)
        {
            var highestPreBid = await _context.Bids
               .Where(b => b.AuctionCar.AuctionId == auctionId && b.IsPreBid)
               .OrderByDescending(b => b.Amount)
               .FirstOrDefaultAsync();

            return highestPreBid?.Amount;
        }

        public async Task<Auction?> GetAuctionWithCarsAsync(Guid auctionId)
        {
            return await _context.Auctions
                 .Include(a => a.AuctionCars)
                     .ThenInclude(ac => ac.Bids.OrderByDescending(b => b.Amount)) //  Bid-ləri sıralı gətir
                 .Include(a => a.AuctionCars)
                     .ThenInclude(ac => ac.AuctionWinner)
                 .FirstOrDefaultAsync(a => a.Id == auctionId);
        }

        public async Task<IEnumerable<Auction>> GetUpcomingAuctionsAsync(DateTime from, DateTime to)
        {
            return await _context.Auctions
                .Where(a => a.StartTimeUtc >= from && a.StartTimeUtc <= to)
                .Include(a => a.AuctionCars)
                .OrderBy(a => a.StartTimeUtc)
                .ToListAsync();
        }

        public async Task<Auction?> GetLiveAuctionAsync()
        {
            return await _context.Auctions
                .Include(a => a.AuctionCars)
                    .ThenInclude(ac => ac.Bids)
                .Where(a => a.IsLive && a.Status == AuctionStatus.Running)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Auction>> GetLiveAuctionsAsync()
        {
            return await _context.Auctions
                .Include(a => a.AuctionCars)
                    .ThenInclude(ac => ac.Bids)
                .Where(a => a.IsLive && a.Status == AuctionStatus.Running)
                .OrderBy(a => a.StartTimeUtc)
                .ToListAsync();
        }

        public async Task<Auction?> GetAuctionByCurrentCarAsync(string lotNumber)
        {
            return await _context.Auctions
                .Include(a => a.AuctionCars)
                    .ThenInclude(ac => ac.Bids)
                .Where(a => a.CurrentCarLotNumber == lotNumber && a.Status == AuctionStatus.Running)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Auction>> GetScheduledAuctionsReadyToStartAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.Auctions
                .Include(a => a.AuctionCars)
                    .ThenInclude(ac => ac.Bids.Where(b => b.IsPreBid))
                .Where(a => a.Status == AuctionStatus.Scheduled &&
                           a.StartTimeUtc <= now &&
                           a.AuctionCars.Any(ac => ac.Bids.Any(b => b.IsPreBid)))
                .OrderBy(a => a.StartTimeUtc)
                .ToListAsync();
        }

        public async Task<Auction?> GetNextScheduledAuctionAsync()
        {
            return await _context.Auctions
                .Include(a => a.AuctionCars)
                .Where(a => a.Status == AuctionStatus.Scheduled)
                .OrderBy(a => a.StartTimeUtc)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Auction>> GetAuctionsByStatusAsync(AuctionStatus status)
        {
            return await _context.Auctions
                .Where(a => a.Status == status)
                .Include(a => a.AuctionCars)
                    .ThenInclude(ac => ac.Bids)
                .Include(a => a.Location)
                .OrderBy(a => a.StartTimeUtc)
                .ToListAsync();
        }

        // Atomic update already present in your codebase (kept as-is)
        public async Task<bool> TryTransitionAuctionStatusAsync(Guid auctionId, AuctionStatus fromStatus, AuctionStatus toStatus, CancellationToken cancellationToken = default)
        {
            try
            {
                // ✅ 1. EF Core ilə safe update (raw SQL-siz)
                var auction = await _context.Auctions
                    .Where(a => a.Id == auctionId && a.Status == fromStatus)
                    .FirstOrDefaultAsync(cancellationToken);

                if (auction == null)
                {
                    _logger.LogWarning("Auction {AuctionId} not found or status mismatch for transition {FromStatus}→{ToStatus}",
                        auctionId, fromStatus, toStatus);
                    return false;
                }

                auction.Status = toStatus;
                auction.MarkUpdated(); // BaseEntity method istifadə edir

                var result = await _context.SaveChangesAsync(cancellationToken);
                return result > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to transition auction {AuctionId} from {FromStatus} to {ToStatus}",
                    auctionId, fromStatus, toStatus);
                return false;
            }
        }


        // <-- NEW: DB-side filter: get running auctions whose EndTimeUtc <= asOfUtc
        public async Task<IEnumerable<Auction>> GetActiveAuctionsReadyToEndAsync(DateTime asOfUtc, int limit = 100)
        {
            return await _context.Auctions
                .Where(a => a.Status == AuctionStatus.Running && a.EndTimeUtc <= asOfUtc)
                .Include(a => a.AuctionCars)
                .OrderBy(a => a.EndTimeUtc)
                .Take(limit)
                .ToListAsync();
        }
        public async Task<IEnumerable<Auction>> GetAuctionsReadyToMakeReadyAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.Auctions
                .Where(a => a.Status == AuctionStatus.Scheduled)
                .Where(a => a.PreBidStartTimeUtc.HasValue && a.PreBidStartTimeUtc.Value <= now)
                //.Where(a => a.AuctionCars.Any())
                .Include(a => a.AuctionCars)
                .ToListAsync();
        }

        public async Task<IEnumerable<Auction>> GetAuctionsReadyToStartAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.Auctions
                .Where(a => a.Status == AuctionStatus.Ready)
                .Where(a => a.StartTimeUtc <= now && a.AutoStart)
                .Include(a => a.AuctionCars)
                    .ThenInclude(ac => ac.Bids)
                .ToListAsync();
        }

        public async Task<IEnumerable<Auction>> GetExpiredRunningAuctionsAsync()
        {
            var currentTime = DateTime.UtcNow; 
            return await _context.Auctions
                .Where(a => a.Status == AuctionStatus.Running)
                .Where(a => a.EndTimeUtc <= currentTime)
                .Include(a => a.AuctionCars)
                .ToListAsync();
        }
        public async Task<IEnumerable<AuctionCar>> GetCarsNeedingConditionUpdateAsync()
        {
            return await _context.AuctionCars
                .Include(ac => ac.Auction)
                .Where(ac =>
                    // PreAuction cars in Ready auctions should become ReadyForAuction
                    (ac.AuctionCondition == AuctionCarCondition.PreAuction &&
                     ac.Auction.Status == AuctionStatus.Ready) ||
                    // ReadyForAuction cars should become LiveAuction when they're current
                    (ac.AuctionCondition == AuctionCarCondition.ReadyForAuction &&
                     ac.Auction.Status == AuctionStatus.Running &&
                     ac.Auction.CurrentCarLotNumber == ac.LotNumber &&
                     !ac.IsActive))
                .ToListAsync();
        }
    }
}