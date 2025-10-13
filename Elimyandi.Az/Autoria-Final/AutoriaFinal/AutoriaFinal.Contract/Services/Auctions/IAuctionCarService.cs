using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Auctions
{
    public interface IAuctionCarService : IGenericService<
        AuctionCar,
        AuctionCarGetDto,
        AuctionCarDetailDto,
        AuctionCarCreateDto,
        AuctionCarUpdateDto>
    {
        // Lifecycle Management
        Task<AuctionCarDetailDto> PrepareCarForAuctionAsync(Guid auctionCarId, Guid currentUserId);
        Task<AuctionCarDetailDto> ActivateCarAsync(Guid auctionCarId, Guid currentUserId);
        Task<AuctionCarDetailDto> EndCarAuctionAsync(Guid auctionCarId);

        Task<AuctionCarDetailDto> MarkCarUnsoldAsync(Guid auctionCarId, string reason, Guid currentUserId);

        // Pre-Bid Management
        Task<bool> HasRequiredPreBidsAsync(Guid auctionCarId);
        Task<BidDetailDto?> GetHighestPreBidAsync(Guid auctionCarId);
        Task<bool> HasUserPreBidAsync(Guid auctionCarId, Guid userId);
        Task<IEnumerable<BidGetDto>> GetPreBidsAsync(Guid auctionCarId);

        // Price Management
        Task<AuctionCarDetailDto> UpdateCurrentPriceAsync(Guid auctionCarId, decimal newPrice, Guid bidderId);
        Task<bool> IsReservePriceMetAsync(Guid auctionCarId);
        Task<decimal> CalculateNextMinimumBidAsync(Guid auctionCarId);

        // Timer Management
        Task<AuctionCarTimerDto> GetCarTimerInfoAsync(Guid auctionCarId);
        Task UpdateLastBidTimeAsync(Guid auctionCarId, DateTime bidTime, Guid bidderId);
        Task<bool> IsCarTimerExpiredAsync(Guid auctionCarId, int timerSeconds);

        // Post-Auction Management
        Task<AuctionCarDetailDto> ApproveWinnerAsync(Guid auctionCarId, Guid sellerId, string? approvalNotes = null);
        Task<AuctionCarDetailDto> RejectWinnerAsync(Guid auctionCarId, Guid sellerId, string rejectionReason);
        Task<AuctionCarDetailDto> MarkDepositPaidAsync(Guid auctionCarId, decimal depositAmount, Guid buyerId);
        Task<AuctionCarDetailDto> CompletePaymentAsync(Guid auctionCarId, decimal totalAmount, Guid buyerId);

        // Lane Management
        Task<AuctionCarDetailDto> AssignToLaneAsync(Guid auctionCarId, int laneNumber, int runOrder, DateTime scheduledTime, Guid currentUserId);
        Task<IEnumerable<AuctionCarGetDto>> GetCarsByLaneAsync(int laneNumber, DateTime? scheduleDate = null);

        // Statistics
        Task<AuctionCarStatsDto> GetCarBidStatsAsync(Guid auctionCarId);
        Task<decimal> GetSellThroughRateAsync(Guid auctionId);

        // Query Methods
        Task<AuctionCarDetailDto> GetCarWithFullDetailsAsync(Guid auctionCarId, Guid? currentUserId = null);
        Task<IEnumerable<AuctionCarGetDto>> GetCarsByAuctionIdAsync(Guid auctionId, Guid? currentUserId = null);
        Task<AuctionCarDetailDto?> GetCarByLotNumberAsync(string lotNumber, Guid? currentUserId = null);
        Task<AuctionCarDetailDto?> GetActiveCarForAuctionAsync(Guid auctionId);
        Task<AuctionCarDetailDto?> GetNextCarForAuctionAsync(Guid auctionId, string currentLotNumber);
        Task<IEnumerable<AuctionCarGetDto>> GetCarsReadyForAuctionAsync(Guid auctionId);
        Task<IEnumerable<AuctionCarGetDto>> GetUnsoldCarsAsync(Guid auctionId);
        Task<IEnumerable<AuctionCarGetDto>> GetCarsAwaitingApprovalAsync(Guid auctionId);
        Task<IEnumerable<AuctionCarGetDto>> GetUserWonCarsAsync(Guid userId, Guid auctionId);
        Task<IEnumerable<VehicleFinderAuctionStatusDto>> GetAuctionStatusForCarsAsync(IEnumerable<Guid> carIds);
    }
}