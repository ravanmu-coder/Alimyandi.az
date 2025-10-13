using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.Auction;
using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.Extensions.Logging;

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

        public AuctionService(
            IAuctionRepository auctionRepository,
            IAuctionCarRepository auctionCarRepository,
            IAuctionWinnerRepository auctionWinnerRepository,
            IBidRepository bidRepository,
            ILocationRepository locationRepository,
            IGenericRepository<Auction> repository,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            ILogger<AuctionService> logger)
            : base(repository, mapper, unitOfWork, logger)
        {
            _auctionRepository = auctionRepository;
            _auctionCarRepository = auctionCarRepository;
            _auctionWinnerRepository = auctionWinnerRepository;
            _bidRepository = bidRepository;
            _locationRepository = locationRepository;
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
        // ✅ DÜZƏLDILMIŞ StartAuctionAsync()
        public async Task<AuctionDetailDto> StartAuctionAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Ready && auction.Status != AuctionStatus.Scheduled)
                throw new ConflictException("Auction yalnız Ready və ya Scheduled vəziyyətdə start edilə bilər");

            // ✅ YENİ: Əgər Scheduled-dan start edirikse, əvvəl Ready et
            if (auction.Status == AuctionStatus.Scheduled)
            {
                _logger.LogInformation("🔄 Auto-preparing auction from Scheduled to Ready: {AuctionId} - User: ravanmu-coder", auctionId);
                auction.MakeReady();
                await _auctionRepository.UpdateAsync(auction);
                await _unitOfWork.SaveChangesAsync();
            }

            // ✅ YENİ: Car-ları ready et
            foreach (var car in auction.AuctionCars.Where(c => c.AuctionCondition == AuctionCarCondition.PreAuction))
            {
                car.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                car.MarkUpdated();
                _logger.LogInformation("🔄 Auto-preparing car condition: {LotNumber} → ReadyForAuction - User: ravanmu-coder", car.LotNumber);
            }

            auction.Start();

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ AUCTION STARTED: {AuctionId} - Current Car: {LotNumber} - Start Price: ${StartPrice} - User: ravanmu-coder - Time: 2025-10-06 15:10:52",
                auctionId, auction.CurrentCarLotNumber, auction.StartPrice);

            return await GetDetailedByIdAsync(auctionId);
        }
        // ✅ DÜZƏLDILMIŞ MakeAuctionReadyAsync()
        public async Task<AuctionDetailDto> MakeAuctionReadyAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Scheduled)
                throw new ConflictException("Yalnız Scheduled auction Ready edilə bilər");

            if (!auction.AuctionCars.Any())
                throw new ConflictException("Auction-da heç bir maşın yoxdur");

            // ✅ YENİ: Car-ları PreAuction-dan ReadyForAuction-a keçir
            var preAuctionCars = auction.AuctionCars.Where(c => c.AuctionCondition == AuctionCarCondition.PreAuction).ToList();
            foreach (var car in preAuctionCars)
            {
                car.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                car.MarkUpdated();

                // ✅ YENİ: Əgər StartPrice yoxdursa, default set et
                if (car.StartPrice <= 0 && car.CurrentPrice <= 0)
                {
                    car.CurrentPrice = car.StartPrice = 100; // Default minimum
                    _logger.LogInformation("🔧 Set default StartPrice for car: {LotNumber} = $100 - User: ravanmu-coder", car.LotNumber);
                }

                _logger.LogInformation("🔄 Car condition updated: {LotNumber} → ReadyForAuction - User: ravanmu-coder", car.LotNumber);
            }

            auction.MakeReady();

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ AUCTION READY: {AuctionId} - Pre-bid collection started with {CarCount} cars ({ReadyCars} ready) - User: ravanmu-coder - Time: 2025-10-06 15:10:52",
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
                    await EndCurrentCarAndAssignWinner(currentCar);
                }
            }

            auction.End();
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            var soldCarsCount = auction.AuctionCars.Count(ac => ac.AuctionWinner != null);
            var totalSalesAmount = auction.AuctionCars
                .Where(ac => ac.AuctionWinner != null)
                .Sum(ac => ac.AuctionWinner.Amount);

            _logger.LogInformation("AUCTION ENDED: {AuctionId} - Total Cars: {TotalCars}, Sold: {SoldCars}, Sales Amount: {Amount}",
                auctionId, auction.AuctionCars.Count, soldCarsCount, totalSalesAmount);

            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<AuctionDetailDto> CancelAuctionAsync(Guid auctionId, string reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new BadRequestException("Ləğv etmə səbəbi mütləqdir");

            var auction = await _auctionRepository.GetByIdAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            auction.Cancel();
            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogWarning("AUCTION CANCELLED: {AuctionId} - Reason: {Reason}", auctionId, reason);
            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<AuctionDetailDto> ExtendAuctionAsync(Guid auctionId, int additionalMinutes, string reason)
        {
            if (additionalMinutes <= 0)
                throw new BadRequestException("Əlavə vaxt müsbət olmalıdır");

            if (string.IsNullOrWhiteSpace(reason))
                throw new BadRequestException("Uzatma səbəbi mütləqdir");

            var auction = await _auctionRepository.GetByIdAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            var previousEndTime = auction.EndTimeUtc;
            auction.ExtendAuction(additionalMinutes);

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("AUCTION EXTENDED: {AuctionId} - Additional Minutes: {Minutes} - From: {PreviousEnd} To: {NewEnd}",
                auctionId, additionalMinutes, previousEndTime, auction.EndTimeUtc);

            return await GetDetailedByIdAsync(auctionId);
        }

        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsByStatusAsync(AuctionStatus status)
        {
            var auctions = await _auctionRepository.GetAuctionsByStatusAsync(status);
            return _mapper.Map<IEnumerable<AuctionGetDto>>(auctions);
        }

        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsReadyToMakeReadyAsync()
        {
            var now = DateTime.UtcNow;
            var auctions = await _auctionRepository.GetAuctionsByStatusAsync(AuctionStatus.Scheduled);

            var readyToMakeReady = auctions.Where(a =>
                a.PreBidStartTimeUtc.HasValue &&
                a.PreBidStartTimeUtc.Value <= now &&
                a.AuctionCars.Any());

            return _mapper.Map<IEnumerable<AuctionGetDto>>(readyToMakeReady);
        }
        #endregion

        #region Car Crossing Methods

        // ✅ DÜZƏLDILMIŞ MoveToNextCarAsync()
        public async Task<AuctionDetailDto> MoveToNextCarAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Running)
                throw new ConflictException("Yalnız işləyən auction-da maşın dəyişdirilə bilər");

            var previousLotNumber = auction.CurrentCarLotNumber;

            // ✅ Cari car-ı deaktiv et və Sold/Unsold et
            var currentCar = auction.AuctionCars
                .FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);

            if (currentCar != null)
            {
                currentCar.MarkAsInactive();
                currentCar.AuctionCondition = AuctionCarCondition.Sold; // Və ya Unsold
                await EndCurrentCarAndAssignWinner(currentCar);
                _logger.LogInformation("🔄 Ended current car: {LotNumber} → {Condition} - User: ravanmu-coder",
                    currentCar.LotNumber, currentCar.AuctionCondition);
            }

            auction.MoveToNextCar();

            // ✅ Yeni car-ı aktiv et
            if (!string.IsNullOrEmpty(auction.CurrentCarLotNumber))
            {
                var newCurrentCar = auction.AuctionCars
                    .FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);

                if (newCurrentCar != null)
                {
                    newCurrentCar.MarkAsActive();
                    newCurrentCar.AuctionCondition = AuctionCarCondition.LiveAuction;
                    _logger.LogInformation("🎯 Activated new car: {LotNumber} → LiveAuction - User: ravanmu-coder",
                        newCurrentCar.LotNumber);
                }
            }

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            if (auction.Status == AuctionStatus.Ended)
            {
                _logger.LogInformation("🏁 AUCTION AUTO-COMPLETED: {AuctionId} - No more cars available - User: ravanmu-coder - Time: 2025-10-06 15:10:52", auctionId);
            }
            else
            {
                _logger.LogInformation("🔄 MOVED TO NEXT CAR: {AuctionId} - From: {PreviousLot} To: {CurrentLot} - New Start Price: ${StartPrice} - User: ravanmu-coder - Time: 2025-10-06 15:10:52",
                    auctionId, previousLotNumber, auction.CurrentCarLotNumber, auction.StartPrice);
            }

            return await GetDetailedByIdAsync(auctionId);
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

        // ✅ DÜZƏLDILMIŞ SetCurrentCarAsync()
        public async Task<AuctionDetailDto> SetCurrentCarAsync(Guid auctionId, string lotNumber)
        {
            if (string.IsNullOrWhiteSpace(lotNumber))
                throw new BadRequestException("Lot nömrəsi mütləqdir");

            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (auction.Status != AuctionStatus.Running)
                throw new ConflictException("Yalnız işləyən auction-da cari maşın təyin edilə bilər");

            var targetCar = auction.AuctionCars.FirstOrDefault(ac => ac.LotNumber == lotNumber);
            if (targetCar == null)
                throw new NotFoundException($"AuctionCar with lot number {lotNumber}", lotNumber);

            // ✅ YENİ: Car-ı ReadyForAuction status-da olması üçün yoxla
            if (targetCar.AuctionCondition == AuctionCarCondition.PreAuction)
            {
                targetCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                _logger.LogInformation("🔧 Auto-prepared car: {LotNumber} → ReadyForAuction - User: ravanmu-coder", lotNumber);
            }

            // ✅ StartPrice logic
            if (!targetCar.HasPreBids())
            {
                var startPrice = targetCar.StartPrice > 0 ? targetCar.StartPrice : 100; // Default minimum
                _logger.LogInformation("💰 Setting current car without pre-bids, using StartPrice: ${StartPrice} for {LotNumber} - User: ravanmu-coder",
                    startPrice, lotNumber);

                targetCar.UpdateCurrentPrice(startPrice);
                auction.SetStartPrice(startPrice);
            }
            else
            {
                var highestPreBid = targetCar.GetHighestPreBid();
                if (highestPreBid != null)
                {
                    targetCar.UpdateCurrentPrice(highestPreBid.Amount);
                    auction.SetStartPrice(highestPreBid.Amount);
                    _logger.LogInformation("💰 Setting current car with pre-bid: ${Amount} for {LotNumber} - User: ravanmu-coder",
                        highestPreBid.Amount, lotNumber);
                }
                else
                {
                    var startPrice = targetCar.StartPrice > 0 ? targetCar.StartPrice : 100;
                    targetCar.UpdateCurrentPrice(startPrice);
                    auction.SetStartPrice(startPrice);
                }
            }

            // ✅ Əvvəlki car-ı deaktiv et
            var previousCar = auction.AuctionCars
                .FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);

            if (previousCar != null)
            {
                previousCar.MarkAsInactive();
                previousCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                _logger.LogInformation("🔄 Deactivated previous car: {PreviousLot} - User: ravanmu-coder", previousCar.LotNumber);
            }

            // ✅ Yeni car-ı aktiv et
            targetCar.MarkAsActive();
            targetCar.AuctionCondition = AuctionCarCondition.LiveAuction;
            auction.CurrentCarLotNumber = lotNumber;
            auction.CurrentCarStartTime = DateTime.UtcNow;

            await _auctionRepository.UpdateAsync(auction);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ MANUAL CAR SWITCH: {AuctionId} - To: {LotNumber} - Price: ${StartPrice} by ravanmu-coder at 2025-10-06 15:10:52",
                auctionId, lotNumber, auction.StartPrice);

            return await GetDetailedByIdAsync(auctionId);
        }
        #endregion

        #region Real-Time Status Methods

        public async Task<IEnumerable<AuctionGetDto>> GetActiveAuctionsAsync()
        {
            var activeAuctions = await _auctionRepository.GetActiveAuctionsAsync();
            return _mapper.Map<IEnumerable<AuctionGetDto>>(activeAuctions);
        }

        public async Task<IEnumerable<AuctionGetDto>> GetLiveAuctionsAsync()
        {
            var liveAuctions = await _auctionRepository.GetLiveAuctionsAsync();
            return _mapper.Map<IEnumerable<AuctionGetDto>>(liveAuctions);
        }

        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsReadyToStartAsync()
        {
            var readyAuctions = await _auctionRepository.GetScheduledAuctionsReadyToStartAsync();
            return _mapper.Map<IEnumerable<AuctionGetDto>>(readyAuctions);
        }

        public async Task<AuctionDetailDto> GetAuctionCurrentStateAsync(Guid auctionId)
        {
            return await GetDetailedByIdAsync(auctionId);
        }
        #endregion

        #region Timer and Scheduling Methods

        public async Task<AuctionTimerInfo> GetAuctionTimerInfoAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            if (string.IsNullOrEmpty(auction.CurrentCarLotNumber) || auction.Status != AuctionStatus.Running)
            {
                return new AuctionTimerInfo
                {
                    AuctionId = auctionId,
                    IsExpired = true,
                    RemainingSeconds = 0,
                    TimerSeconds = auction.TimerSeconds,
                    CurrentCarLotNumber = auction.CurrentCarLotNumber,
                    CarStartTime = auction.CurrentCarStartTime
                };
            }

            var currentCar = auction.AuctionCars
                .First(ac => ac.LotNumber == auction.CurrentCarLotNumber);
            var isTimeExpired = currentCar.IsTimeExpired(auction.TimerSeconds);
            var referenceTime = currentCar.LastBidTime ?? currentCar.ActiveStartTime ?? DateTime.UtcNow;
            var timeSinceReference = DateTime.UtcNow - referenceTime;
            var remainingSeconds = Math.Max(0, auction.TimerSeconds - (int)timeSinceReference.TotalSeconds);

            return new AuctionTimerInfo
            {
                AuctionId = auctionId,
                CurrentCarLotNumber = auction.CurrentCarLotNumber,
                LastBidTime = currentCar.LastBidTime,
                TimerSeconds = auction.TimerSeconds,
                RemainingSeconds = remainingSeconds,
                IsExpired = isTimeExpired,
                CarStartTime = currentCar.ActiveStartTime
            };
        }

        public async Task ResetAuctionTimerAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetByIdAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);
            if (auction.Status != AuctionStatus.Running)
                throw new ConflictException("Yalnız işləyən auction-ın timer-ı reset edilə bilər");

            _logger.LogDebug("TIMER RESET REQUESTED: {AuctionId} - Timer: {TimerSeconds}s at {ResetTime}",
                auctionId, auction.TimerSeconds, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
        }

        public async Task<IEnumerable<AuctionGetDto>> GetExpiredAuctionsAsync()
        {
            var runningAuctions = await _auctionRepository.GetAuctionsByStatusAsync(AuctionStatus.Running);
            var currentTime = DateTime.UtcNow;
            var expiredAuctions = new List<Auction>();

            foreach (var auction in runningAuctions)
            {
                if (auction.EndTimeUtc <= currentTime)
                {
                    expiredAuctions.Add(auction);
                    continue;
                }
                if (!string.IsNullOrEmpty(auction.CurrentCarLotNumber))
                {
                    var currentCar = auction.AuctionCars
                        .FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber);
                    if (currentCar != null && currentCar.IsTimeExpired(auction.TimerSeconds))
                    {
                        expiredAuctions.Add(auction);
                    }
                }
            }

            if (expiredAuctions.Any())
            {
                _logger.LogInformation("EXPIRED AUCTIONS DETECTED: {Count} auctions at {CheckTime}",
                    expiredAuctions.Count, currentTime.ToString("yyyy-MM-dd HH:mm:ss"));
            }

            return _mapper.Map<IEnumerable<AuctionGetDto>>(expiredAuctions);
        }
        #endregion

        #region Statistics and Information Methods

        public async Task<AuctionStatisticsDto> GetAuctionStatisticsAsync(Guid auctionId)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(auctionId);
            if (auction == null)
                throw new NotFoundException("Auction", auctionId);

            var allBids = auction.AuctionCars.SelectMany(ac => ac.Bids).ToList();

            // ✅ FIX: Düzgün enum value istifadə et
            var soldCars = auction.AuctionCars.Where(ac =>
                ac.WinnerStatus == AuctionWinnerStatus.Won ||
                ac.WinnerStatus == AuctionWinnerStatus.SellerApproved ||
                ac.WinnerStatus == AuctionWinnerStatus.Completed).ToList();

            var statistics = new AuctionStatisticsDto
            {
                AuctionId = auctionId,
                AuctionName = auction.Name,
                TotalCars = auction.AuctionCars.Count,
                SoldCars = soldCars.Count,
                UnsoldCars = auction.AuctionCars.Count(ac => ac.WinnerStatus == AuctionWinnerStatus.Unsold),
                TotalBids = allBids.Count, // ✅ FIX
                UniqueBidders = allBids.Select(b => b.UserId).Distinct().Count() // ✅ FIX
            };

            if (soldCars.Any())
            {
                var saleAmounts = soldCars.Where(ac => ac.SoldPrice.HasValue)
                                         .Select(ac => ac.SoldPrice.Value).ToList();
                if (saleAmounts.Any())
                {
                    statistics.TotalSalesAmount = saleAmounts.Sum();
                    statistics.AverageSalePrice = saleAmounts.Average();
                }
            }

            return statistics;
        }

        public async Task<IEnumerable<AuctionGetDto>> GetAuctionsByLocationAsync(Guid locationId)
        {
            var auctions = await _auctionRepository.GetAuctionsByLocationAsync(locationId);
            return _mapper.Map<IEnumerable<AuctionGetDto>>(auctions);
        }
        #endregion

        #region Custom Private Methods

        private async Task<AuctionDetailDto> GetDetailedByIdAsync(Guid id)
        {
            var auction = await _auctionRepository.GetAuctionWithCarsAsync(id);
            if (auction == null)
                throw new NotFoundException("Auction", id);

            var dto = _mapper.Map<AuctionDetailDto>(auction);

            dto.TotalCarsCount = auction.AuctionCars.Count;
            dto.CarsWithPreBidsCount = auction.AuctionCars.Count(ac => ac.Bids.Any(b => b.IsPreBid));
            dto.SoldCarsCount = auction.AuctionCars.Count(ac => ac.AuctionWinner != null);
            dto.UnsoldCarsCount = dto.TotalCarsCount - dto.SoldCarsCount;
            dto.TotalSalesAmount = auction.AuctionCars
                .Where(ac => ac.AuctionWinner != null)
                .Sum(ac => ac.AuctionWinner.Amount);

            return dto;
        }

        private async Task EndCurrentCarAndAssignWinner(AuctionCar auctionCar)
        {
            var highestBid = auctionCar.Bids
                .Where(b => !b.IsPreBid && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc)
                .FirstOrDefault();

            if (highestBid != null && auctionCar.AuctionWinner == null)
            {
                var winner = AuctionWinner.Create(
                    auctionCar.Id,
                    highestBid.UserId,
                    highestBid.Id,
                    highestBid.Amount
                    );
                await _auctionWinnerRepository.AddAsync(winner);
                auctionCar.MarkWon(highestBid.Amount);
                _logger.LogInformation("CAR SOLD: {LotNumber} - Winner: {UserId} - Amount: ${Amount} at {SoldTime}",
                   auctionCar.LotNumber, highestBid.UserId, highestBid.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            }
            else
            {
                auctionCar.MarkUnsold();
                _logger.LogInformation("CAR UNSOLD: {LotNumber} - No valid bids at {UnsoldTime}",
                    auctionCar.LotNumber, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            }
            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();
        }
        #endregion
    }
}