using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.Bids;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Auctions
{
    public interface IBidRepository : IGenericRepository<Bid>
    {
        
        Task<Bid?> GetHighestBidAsync(Guid auctionCarId);
        Task<IEnumerable<Bid>> GetPreBidsAsync(Guid auctionCarId);
        Task<Bid?> GetHighestPreBidAsync(Guid auctionCarId);
        Task<IEnumerable<Bid>> GetUserBidsAsync(Guid userId, Guid auctionCarId);

        
        // BID TARİXÇƏSİ VƏ STATİSTİKA
        Task<IEnumerable<Bid>> GetBidHistoryAsync(Guid auctionCarId, int pageSize = 50);
        Task<IEnumerable<Bid>> GetRecentBidsAsync(Guid auctionCarId, int count = 10);
        Task<int> GetTotalBidCountAsync(Guid auctionCarId);
        Task<int> GetActiveBidCountAsync(Guid auctionCarId);
        Task<decimal> GetTotalBidVolumeAsync(Guid auctionCarId);

        // İSTİFADƏÇİ ƏSASLI SORĞULAR
        Task<IEnumerable<Bid>> GetUserAllBidsAsync(Guid userId);
        Task<IEnumerable<Bid>> GetUserBidsForAuctionAsync(Guid userId, Guid auctionId);
        Task<IEnumerable<Bid>> GetUserWinningBidsAsync(Guid userId);
        Task<bool> HasUserBidAsync(Guid userId, Guid auctionCarId);
        Task<bool> HasUserPreBidAsync(Guid userId, Guid auctionCarId);
        Task<Bid?> GetUserHighestBidAsync(Guid userId, Guid auctionCarId);
        Task<IEnumerable<Bid>> GetByAuctionCarIdAsync(Guid auctionCarId);
        Task<AuctionCar?> GetAuctionCarWithBidsAsync(Guid auctionCarId);
        Task<IEnumerable<Bid>> GetBidsForCarAsync(Guid auctionCarId, int pageSize);

        // PROXY BID İDARƏETMƏSİ
        Task<IEnumerable<Bid>> GetActiveProxyBidsAsync(Guid auctionCarId);
        Task<IEnumerable<Bid>> GetUserProxyBidsAsync(Guid userId, Guid auctionCarId);
        Task<IEnumerable<Bid>> GetExpiredProxyBidsAsync();
        Task<IEnumerable<Bid>> GetProxyBidsForProcessingAsync(Guid auctionCarId, decimal currentAmount);
        Task<IEnumerable<Bid>> GetChildBidsAsync(Guid parentBidId);
        Task<int> GetMaxSequenceNumberAsync(Guid auctionCarId);
        Task<bool> HasActiveProxyBidAsync(Guid userId, Guid auctionCarId);
        Task<IEnumerable<Bid>> GetProxyBidsAboveAmountAsync(Guid auctionCarId, decimal amount);
        // STATİSTİKA VƏ ANALİZ
        Task<IEnumerable<Bid>> GetTopBiddersAsync(Guid auctionId, int count = 10);
        Task<decimal> GetAverageBidAmountAsync(Guid auctionCarId);
        Task<IEnumerable<Bid>> GetBidsInTimeRangeAsync(Guid auctionCarId, DateTime from, DateTime to);
        Task<int> GetUniqueBiddersCountAsync(Guid auctionCarId);

        // AUCTION TİMER DƏSTƏYİ
        Task<Bid?> GetLastActiveBidAsync(Guid auctionCarId);
        Task<DateTime?> GetLastBidTimeAsync(Guid auctionCarId);
        Task<IEnumerable<Bid>> GetBidsAfterTimeAsync(Guid auctionCarId, DateTime afterTime);
        Task<bool> HasBidsInLastSecondsAsync(Guid auctionCarId, int seconds);

        // ƏVVƏLKİ METODLARA ƏLAVƏ
        Task<IEnumerable<Bid>> GetBidsAboveAmountAsync(Guid auctionCarId, decimal amount);
        Task<IEnumerable<Bid>> GetBidsByStatusAsync(Guid auctionCarId, BidStatus status);
        Task<IEnumerable<Bid>> GetBidsByTypeAsync(Guid auctionCarId, BidType bidType);

        // BATCH ƏMƏLİYYATLAR
        Task<IEnumerable<Bid>> GetBidsForProcessingAsync(int batchSize = 100);
        Task<int> UpdateExpiredBidsAsync();
        Task<int> MarkBidsAsProcessedAsync(IEnumerable<Guid> bidIds);
    }
}