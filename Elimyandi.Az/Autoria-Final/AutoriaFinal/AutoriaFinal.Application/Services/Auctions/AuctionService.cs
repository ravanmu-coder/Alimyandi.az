using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.Auction;
using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Auctions
{
    public class AuctionService : GenericService<
        Auction, AuctionGetDto, AuctionDetailDto, AuctionCreateDto, AuctionUpdateDto>, IAuctionService
    {
        private readonly IAuctionRepository _auctionRepository;
        private readonly IAuctionCarRepository _auctionCarRepository;
        private readonly IAuctionWinnerRepository _auctionWinnerRepository;
        private readonly IBidRepository _bidRepository;
        private readonly ILocationRepository _locationRepository;
        private readonly IHubContext<AuctionHub> _hubContext;

        // DÜZƏLİŞ: Constructor-a çatışmayan repository-lər əlavə edildi
        public AuctionService(
            IAuctionRepository auctionRepository,
            IAuctionCarRepository auctionCarRepository,
            IAuctionWinnerRepository auctionWinnerRepository,
            IBidRepository bidRepository,
            ILocationRepository locationRepository,
            IGenericRepository<Auction> repository,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            ILogger<AuctionService> logger,
            IHubContext<AuctionHub> hubContext)
            : base(repository, mapper, unitOfWork, logger)
        {
            _auctionRepository = auctionRepository;
            _auctionCarRepository = auctionCarRepository;
            _auctionWinnerRepository = auctionWinnerRepository;
            _bidRepository = bidRepository; // DÜZƏLİŞ: Mənimsətmə əlavə edildi
            _locationRepository = locationRepository; // DÜZƏLİŞ: Mənimsətmə əlavə edildi
            _hubContext = hubContext;
        }

        #region Override GenericService Methods

        public async Task<AuctionDetailDto> AddAuctionAsync(AuctionCreateDto dto, Guid currentUserId)
        {
            if (dto.StartTimeUtc >= dto.EndTimeUtc)
                throw new BadRequestException("Başlama vaxtı bitmə vaxtından əvvəl olmalıdır");

            var location = await _locationRepository.GetByIdAsync(dto.LocationId);
            if (location == null)
                throw new NotFoundException("Location", dto.LocationId);

            _logger.LogInformation("Creating auction: {AuctionName} scheduled for {StartTime} by user {UserId}",
                dto.Name, dto.StartTimeUtc, currentUserId);

            var auction = Auction.Create(
                name: dto.Name,
                locationId: dto.LocationId,
                createdByUserId: currentUserId,
                startTime: dto.StartTimeUtc,
                timerSeconds: dto.TimerSeconds,
                minBidIncrement: dto.MinBidIncrement,
                autoStart: true);

            auction.Schedule(dto.StartTimeUtc, dto.EndTimeUtc);
            auction.MaxCarDurationMinutes = dto.MaxCarDurationMinutes;

            var createdAuction = await _auctionRepository.AddAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ AUCTION SCHEDULED: {AuctionId} - {Name} - PreBid starts: {PreBidStart}",
                createdAuction.Id, createdAuction.Name, createdAuction.PreBidStartTimeUtc);

            return await GetDetailedByIdAsync(createdAuction.Id);
        }

        public override async Task<AuctionDetailDto> UpdateAsync(Guid id, AuctionUpdateDto dto)
        {
            var auction = await _auctionRepository.GetByIdAsync(id);
            if (auction == null)
                throw new NotFoundException("Auction", id);

            if (auction.Status != AuctionStatus.Draft)
                throw new ConflictException("Yalnız Draft status-da olan auction-lar dəyişdirilə bilər");

            _mapper.Map(dto, auction);
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("AUCTION UPDATED: {AuctionId}", id);
            return await GetDetailedByIdAsync(id);
        }
        #endregion

        #region Auction Main Lifecycle Methods
        public async Task<AuctionDetailDto> StartAuctionAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Ready && auction.Status != AuctionStatus.Scheduled)
                throw new ConflictException("Auction yalnız Ready və ya Scheduled vəziyyətdə start edilə bilər");

            if (auction.Status == AuctionStatus.Scheduled)
            {
                _logger.LogInformation("🔄 Auto-preparing auction from Scheduled to Ready: {AuctionId}", auctionId);
                auction.MakeReady();
                await _auctionRepository.UpdateAsync(auction);
                await _unitOfWork.SaveChangesAsync();
            }

            foreach (var car in auction.AuctionCars.Where(c => c.AuctionCondition == AuctionCarCondition.PreAuction))
            {
                car.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                car.MarkUpdated();
                _logger.LogInformation("🔄 Auto-preparing car condition: {LotNumber} → ReadyForAuction", car.LotNumber);
            }

            auction.Start();

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ AUCTION STARTED: {AuctionId} - Current Car: {LotNumber} - Start Price: ${StartPrice}",
                auctionId, auction.CurrentCarLotNumber, auction.StartPrice);

            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<AuctionDetailDto> MakeAuctionReadyAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Scheduled)
                throw new ConflictException("Yalnız Scheduled auction Ready edilə bilər");

            if (!auction.AuctionCars.Any())
                throw new ConflictException("Auction-da heç bir maşın yoxdur");

            var preAuctionCars = auction.AuctionCars.Where(c => c.AuctionCondition == AuctionCarCondition.PreAuction).ToList();
            foreach (var car in preAuctionCars)
            {
                car.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                car.MarkUpdated();

                if (car.StartPrice <= 0 && car.CurrentPrice <= 0)
                {
                    car.CurrentPrice = car.StartPrice = 100;
                    _logger.LogInformation("🔧 Set default StartPrice for car: {LotNumber} = $100", car.LotNumber);
                }
                _logger.LogInformation("🔄 Car condition updated: {LotNumber} → ReadyForAuction", car.LotNumber);
            }

            auction.MakeReady();
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ AUCTION READY: {AuctionId} - Pre-bid started with {CarCount} cars ({ReadyCars} ready)",
                auctionId, auction.TotalCarsCount, preAuctionCars.Count);

            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<AuctionDetailDto> EndAuctionAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (!string.IsNullOrEmpty(auction.CurrentCarLotNumber))
            {
                var currentCar = auction.AuctionCars
                    .FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);
                if (currentCar != null)
                {
                    // DÜZƏLİŞ: Artıq nəticəni gözləmirik, çünki bu metod manual çağırılır
                    await EndCurrentCarAndAssignWinner(currentCar);
                }
            }

            auction.End();
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("AUCTION ENDED: {AuctionId}", auctionId);
            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<AuctionDetailDto> CancelAuctionAsync(Guid auctionId, string reason)
        {
            var auction = await _auctionRepository.GetByIdAsync(auctionId);
            if (auction == null) throw new NotFoundException("Auction", auctionId);
            auction.Cancel();
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();
            _logger.LogWarning("AUCTION CANCELLED: {AuctionId} - Reason: {Reason}", auctionId, reason);
            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<AuctionDetailDto> ExtendAuctionAsync(Guid auctionId, int additionalMinutes, string reason)
        {
            var auction = await _auctionRepository.GetByIdAsync(auctionId);
            if (auction == null) throw new NotFoundException("Auction", auctionId);
            auction.ExtendAuction(additionalMinutes);
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();
            _logger.LogInformation("AUCTION EXTENDED: {AuctionId}", auctionId);
            return await GetDetailedByIdAsync(auctionId);
        }

        #endregion

        #region Car Crossing Methods

        public async Task<AuctionDetailDto> MoveToNextCarAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null) throw new NotFoundException("Auction", auctionId);
            if (auction.Status != AuctionStatus.Running) return await GetDetailedByIdAsync(auctionId);

            var previousLotNumber = auction.CurrentCarLotNumber;
            var currentCar = auction.AuctionCars.FirstOrDefault(ac => ac.LotNumber == previousLotNumber);

            if (currentCar != null)
            {
                var winnerInfo = await EndCurrentCarAndAssignWinner(currentCar);
                // ✅ Group name AuctionHub ilə uyğun: "auction-{auctionId}"
                await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("CarCompleted", winnerInfo);
                _logger.LogInformation("SignalR Event Sent: CarCompleted for Lot {LotNumber}", previousLotNumber);
                await Task.Delay(2000);
            }

            auction.MoveToNextCar();
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            var updatedAuctionState = await GetDetailedByIdAsync(auctionId);

            if (updatedAuctionState.Status == "Ended")
            {
                // ✅ Group name AuctionHub ilə uyğun: "auction-{auctionId}"
                await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("AuctionEnded", new { auctionId, updatedAuctionState.TotalSalesAmount });
                _logger.LogInformation("SignalR Event Sent: AuctionEnded for Auction {AuctionId}", auctionId);
            }
            else
            {
                // ✅ Group name AuctionHub ilə uyğun: "auction-{auctionId}"
                await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("CarMoved", new
                {
                    previousLotNumber,
                    nextLotNumber = updatedAuctionState.CurrentCarLotNumber,
                    nextCarId = updatedAuctionState.AuctionCars?.FirstOrDefault(c => c.LotNumber == updatedAuctionState.CurrentCarLotNumber)?.Id,
                    newState = updatedAuctionState
                });
                _logger.LogInformation("SignalR Event Sent: CarMoved from {PrevLot} to {NextLot}", previousLotNumber, updatedAuctionState.CurrentCarLotNumber);
            }

            return updatedAuctionState;
        }

        public async Task<AuctionCarDetailDto> EndCarAuctionAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            await EndCurrentCarAndAssignWinner(auctionCar);
            _logger.LogInformation("CAR AUCTION ENDED: {AuctionCarId} - Lot: {LotNumber}",
               auctionCarId, auctionCar.LotNumber);

            return _mapper.Map<AuctionCarDetailDto>(auctionCar);
        }

        public async Task<AuctionDetailDto> SetCurrentCarAsync(Guid auctionId, string lotNumber)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null) throw new NotFoundException("Auction", auctionId);
            if (auction.Status != AuctionStatus.Running) throw new ConflictException("Yalnız işləyən auction-da cari maşın təyin edilə bilər");

            var targetCar = auction.AuctionCars.FirstOrDefault(ac => ac.LotNumber == lotNumber);
            if (targetCar == null) throw new NotFoundException($"AuctionCar with lot number {lotNumber}", lotNumber);

            if (targetCar.AuctionCondition == AuctionCarCondition.PreAuction)
            {
                targetCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
            }

            if (!targetCar.HasPreBids())
            {
                targetCar.UpdateCurrentPrice(targetCar.StartPrice > 0 ? targetCar.StartPrice : 100);
            }
            else
            {
                var highestPreBid = targetCar.GetHighestPreBid();
                if (highestPreBid != null) targetCar.UpdateCurrentPrice(highestPreBid.Amount);
            }

            var previousCar = auction.AuctionCars.FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);
            if (previousCar != null)
            {
                previousCar.MarkAsInactive();
                previousCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
            }

            targetCar.MarkAsActive();
            targetCar.AuctionCondition = AuctionCarCondition.LiveAuction;
            auction.CurrentCarLotNumber = lotNumber;
            auction.CurrentCarStartTime = DateTime.UtcNow;

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ MANUAL CAR SWITCH: {AuctionId} - To: {LotNumber}", auctionId, lotNumber);
            return await GetDetailedByIdAsync(auctionId);
        }

        #endregion

        #region Real-Time Status & Timer Methods

        public async Task<IEnumerable<AuctionGetDto>> GetActiveAuctionsAsync() => _mapper.Map<IEnumerable<AuctionGetDto>>(await _auctionRepository.GetActiveAuctionsAsync());
        public async Task<IEnumerable<AuctionGetDto>> GetLiveAuctionsAsync() => _mapper.Map<IEnumerable<AuctionGetDto>>(await _auctionRepository.GetLiveAuctionsAsync());
        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsReadyToStartAsync() => _mapper.Map<IEnumerable<AuctionGetDto>>(await _auctionRepository.GetScheduledAuctionsReadyToStartAsync());
        public async Task<AuctionDetailDto> GetAuctionCurrentStateAsync(Guid auctionId) => await GetDetailedByIdAsync(auctionId);
        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsByStatusAsync(AuctionStatus status) => _mapper.Map<IEnumerable<AuctionGetDto>>(await _auctionRepository.GetAuctionsByStatusAsync(status));
        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsReadyToMakeReadyAsync() => _mapper.Map<IEnumerable<AuctionGetDto>>((await _auctionRepository.GetAuctionsByStatusAsync(AuctionStatus.Scheduled)).Where(a => a.IsReadyToMakeReady()));
        public async Task<IEnumerable<AuctionGetDto>> GetExpiredAuctionsAsync() => _mapper.Map<IEnumerable<AuctionGetDto>>((await _auctionRepository.GetAuctionsByStatusAsync(AuctionStatus.Running)).Where(a => a.EndTimeUtc <= DateTime.UtcNow));
        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsByLocationAsync(Guid locationId) => _mapper.Map<IEnumerable<AuctionGetDto>>(await _auctionRepository.GetAuctionsByLocationAsync(locationId));

        public async Task<AuctionTimerInfo> GetAuctionTimerInfoAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null) throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Running || string.IsNullOrEmpty(auction.CurrentCarLotNumber))
            {
                return new AuctionTimerInfo { 
                    AuctionId = auctionId, 
                    IsExpired = true, 
                    RemainingSeconds = 0, 
                    TimerSeconds = auction.TimerSeconds,
                    IsLive = false
                };
            }

            var currentCar = auction.AuctionCars.FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);
            if (currentCar == null)
            {
                return new AuctionTimerInfo { 
                    AuctionId = auctionId, 
                    IsExpired = true, 
                    RemainingSeconds = 0, 
                    TimerSeconds = auction.TimerSeconds,
                    IsLive = false
                };
            }

            // ✅ COPART LOGIC: Timer starts from ActiveStartTime or LastBidTime
            var referenceTime = currentCar.LastBidTime ?? currentCar.ActiveStartTime ?? DateTime.UtcNow;
            var elapsed = DateTime.UtcNow - referenceTime;
            
            // ✅ Timer duration: auction.TimerSeconds or default 30
            var timerSeconds = auction.TimerSeconds > 0 ? auction.TimerSeconds : 30;
            var remainingSeconds = Math.Max(0, timerSeconds - (int)elapsed.TotalSeconds);
            var timeSpan = TimeSpan.FromSeconds(remainingSeconds);

            return new AuctionTimerInfo
            {
                AuctionId = auctionId,
                CurrentCarLotNumber = auction.CurrentCarLotNumber,
                LastBidTime = currentCar.LastBidTime,
                TimerSeconds = timerSeconds,
                RemainingSeconds = remainingSeconds,
                IsExpired = remainingSeconds == 0,
                IsLive = true, // ✅ Always true for running auctions
                CarStartTime = currentCar.ActiveStartTime,
                TimeDisplay = $"{timeSpan.Minutes:D2}:{timeSpan.Seconds:D2}"
            };
        }

        public Task ResetAuctionTimerAsync(Guid auctionId)
        {
            _logger.LogDebug("TIMER RESET REQUESTED: {AuctionId}", auctionId);
            return Task.CompletedTask;
        }

        #endregion

        #region Statistics and Private Methods

        public async Task<AuctionStatisticsDto> GetAuctionStatisticsAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null) throw new NotFoundException("Auction", auctionId);
            return _mapper.Map<AuctionStatisticsDto>(auction);
        }

        private async Task<AuctionDetailDto> GetDetailedByIdAsync(Guid id)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(id);
            if (auction == null) throw new NotFoundException("Auction", id);
            return _mapper.Map<AuctionDetailDto>(auction);
        }

        // DÜZƏLİŞ: Köhnə, `Task` qaytaran metod tamamilə silindi.
        // Yalnız bu `Task<object>` qaytaran versiya qalır.
        private async Task<object> EndCurrentCarAndAssignWinner(AuctionCar auctionCar)
        {
            var highestBid = auctionCar.Bids
                .Where(b => !b.IsPreBid && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenBy(b => b.PlacedAtUtc)
                .FirstOrDefault();

            object result;

            if (highestBid != null)
            {
                if (auctionCar.AuctionWinner == null)
                {
                    var winner = AuctionWinner.Create(auctionCar.Id, highestBid.UserId, highestBid.Id, highestBid.Amount);
                    await _auctionWinnerRepository.AddAsync(winner);
                    auctionCar.MarkWon(highestBid.Amount);
                    _logger.LogInformation("CAR SOLD: Lot {LotNumber} to User {UserId} for ${Amount}",
                       auctionCar.LotNumber, highestBid.UserId, highestBid.Amount);
                }

                result = new
                {
                    AuctionCarId = auctionCar.Id,
                    LotNumber = auctionCar.LotNumber,
                    Status = "Sold",
                    WinnerUserId = highestBid.UserId,
                    WinnerName = "Winner " + highestBid.UserId.ToString().Substring(0, 5),
                    FinalPrice = highestBid.Amount
                };
            }
            else
            {
                auctionCar.MarkUnsold();
                _logger.LogInformation("CAR UNSOLD: Lot {LotNumber} - No valid bids.", auctionCar.LotNumber);

                result = new
                {
                    AuctionCarId = auctionCar.Id,
                    LotNumber = auctionCar.LotNumber,
                    Status = "Unsold",
                    WinnerName = (string)null,
                    FinalPrice = (decimal?)null
                };
            }

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return result;
        }

        #endregion
    }
}