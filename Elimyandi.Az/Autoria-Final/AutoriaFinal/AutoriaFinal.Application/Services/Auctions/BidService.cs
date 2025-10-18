using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Contract.Enums.Bids;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.Bids;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Auctions
{
    public class BidService : GenericService<
        Bid,
        BidGetDto,
        BidDetailDto,
        BidCreateDto,
        BidUpdateDto>, IBidService
    {
        #region Dependencies & Constructor
        private readonly IBidRepository _bidRepository;
        private readonly IAuctionCarRepository _auctionCarRepository;
        private readonly IAuctionRepository _auctionRepository;
        private readonly IHubContext<BidHub> _bidHubContext;

        // ✅ YENİ: Concurrency Control
        private readonly SemaphoreSlim _proxyWarLock = new SemaphoreSlim(1, 1);
        private readonly SemaphoreSlim _sequenceLock = new SemaphoreSlim(1, 1);

        public BidService(
            IBidRepository bidRepository,
            IAuctionCarRepository auctionCarRepository,
            IAuctionRepository auctionRepository,
            IHubContext<BidHub> bidHubContext,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<BidService> logger)
            : base(bidRepository, mapper, unitOfWork, logger)
        {
            _bidRepository = bidRepository;
            _auctionCarRepository = auctionCarRepository;
            _auctionRepository = auctionRepository;
            _bidHubContext = bidHubContext;
        }
        #endregion

        #region GenericService Overrides

        public override async Task<BidDetailDto> AddAsync(BidCreateDto dto)
        {
            return await PlaceBidAsync(dto);
        }

        public new async Task<BidDetailDto> GetByIdAsync(Guid id)
        {
            _logger.LogInformation("🔍 Getting bid details: {BidId} {Time}",
                id, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var bid = await _bidRepository.GetByIdAsync(id);
            if (bid == null)
                throw new NotFoundException("Bid", id);

            var dto = _mapper.Map<BidDetailDto>(bid);
            await EnrichBidDetailsAsync(dto);

            return dto;
        }

        public new async Task<bool> DeleteAsync(Guid id)
        {
            _logger.LogInformation("🗑️ Retracting bid: {BidId}  {Time}",
                id, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var bid = await _bidRepository.GetByIdAsync(id);
            if (bid == null)
                return false;

            var auctionCar = await _auctionCarRepository.GetByIdAsync(bid.AuctionCarId);
            if (auctionCar?.IsActive == true)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Active auction zamanı bid geri çəkilə bilməz");

            bid.Retract("Bid retracted by user via  ");
            await _bidRepository.UpdateAsync(bid);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Bid retracted successfully: {BidId} at {Time}", id, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            return true;
        }

        #endregion

        #region Core Bid Operations

        public async Task<BidDetailDto> PlaceBidAsync(BidCreateDto dto, bool resetTimer = true)
        {
            _logger.LogInformation("💰 Placing bid: User {UserId}, Car {AuctionCarId}, Amount ${Amount}, Type: {BidType} at {Time}",
                dto.UserId, dto.AuctionCarId, dto.Amount, dto.BidType, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var validation = await ValidateBidAsync(dto);
            if (!validation.IsValid)
                throw new AuctionBusinessException("", string.Join("; ", validation.Errors));

            return dto.BidType switch
            {
                BidTypeDto.PreBid => await PlacePreBidAsync(dto),
                BidTypeDto.Regular => await PlaceLiveBidAsync(dto),
                BidTypeDto.ProxyBid => await PlaceProxyBidInternalAsync(dto),
                _ => throw new BadRequestException($"Unsupported bid type: {dto.BidType}")
            };
        }

        public async Task<BidDetailDto> PlacePreBidAsync(BidCreateDto dto)
        {
            _logger.LogInformation("🏁 Placing pre-bid: User {UserId}, Amount ${Amount} at {Time}",
                dto.UserId, dto.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(dto.AuctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", dto.AuctionCarId);

            if (auctionCar.Auction?.Status == AuctionStatus.Running)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Auction başladıqdan sonra pre-bid verilə bilməz");

            if (dto.Amount < auctionCar.MinPreBid)
                throw new AuctionBusinessException(auctionCar.LotNumber,
                    $"Pre-bid minimum {auctionCar.MinPreBid:C} olmalıdır");

            var bid = Bid.CreateRegularBid(
                dto.AuctionCarId,
                dto.UserId,
                dto.Amount,
                isPreBid: true,
                dto.IPAddress,
                dto.UserAgent);

            var createdBid = await _bidRepository.AddAsync(bid);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Real-time notification
            await _bidHubContext.Clients.Group($"AuctionCar-{dto.AuctionCarId}")
                .SendAsync("PreBidPlaced", new
                {
                    createdBid.Id,
                    createdBid.AuctionCarId,
                    createdBid.UserId,
                    createdBid.Amount,
                    createdBid.PlacedAtUtc,
                    BidType = "PreBid",
                    LotNumber = auctionCar.LotNumber,
                    ProcessedBy = " ",
                    Timestamp = DateTime.UtcNow
                });

            _logger.LogInformation("✅ Pre-bid placed: {BidId} - ${Amount} for {LotNumber} at {Time}",
               createdBid.Id, dto.Amount, auctionCar.LotNumber, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var result = _mapper.Map<BidDetailDto>(createdBid);
            await EnrichBidDetailsAsync(result);
            return result;
        }

        public async Task<BidDetailDto> PlaceLiveBidAsync(BidCreateDto dto)
        {
            _logger.LogInformation("🔴 Placing live bid: User {UserId}, Amount ${Amount} at {Time}",
                dto.UserId, dto.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(dto.AuctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", dto.AuctionCarId);

            if (auctionCar.Auction?.Status != AuctionStatus.Running)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Auction işləmir, live bid verilə bilməz");

            if (!auctionCar.IsActive)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Bu maşın hazırda aktiv deyil");

            // ✅ Seller öz maşınına bid verə bilməz
            if (auctionCar.Car?.OwnerId != null &&
                Guid.TryParse(auctionCar.Car.OwnerId, out var ownerId) &&
                ownerId == dto.UserId)
            {
                throw new AuctionBusinessException(auctionCar.LotNumber, "Seller öz maşınına bid verə bilməz");
            }

            // ✅ İstifadəçi öz highest bid-ini outbid edə bilməz
            var currentHighestBid = await _bidRepository.GetHighestBidAsync(dto.AuctionCarId);
            if (currentHighestBid?.UserId == dto.UserId)
            {
                throw new AuctionBusinessException(auctionCar.LotNumber,
                    $"Siz artıq ən yüksək bid-ə sahibsiniz (${currentHighestBid.Amount:N0}). Başqası bid verənə qədər gözləyin.");
            }

            var minimumBid = await CalculateMinimumBidAsync(dto.AuctionCarId);
            if (dto.Amount < minimumBid)
                throw new AuctionBusinessException(auctionCar.LotNumber, $"Minimum bid {minimumBid:C} olmalıdır");

            // ✅ YENİ: PROXY BID WAR MƏNTIQ
            var proxyWarResult = await ProcessProxyBidWarAsync(dto.AuctionCarId, dto.Amount, dto.UserId);

            if (proxyWarResult.IsOutbid)
            {
                _logger.LogInformation("🤖 User {UserId} bid ${Amount} OUTBID by proxy war: ${FinalAmount} from {WinnerUserId} at {Time}",
                    dto.UserId, dto.Amount, proxyWarResult.FinalAmount, proxyWarResult.WinningProxyUserId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                // ✅ Real-time notification for outbid
                await _bidHubContext.Clients.User(dto.UserId.ToString())
                    .SendAsync("BidOutbid", new
                    {
                        YourBid = dto.Amount,
                        OutbidAmount = proxyWarResult.FinalAmount,
                        WinnerUserId = proxyWarResult.WinningProxyUserId,
                        WarSummary = proxyWarResult.WarSummary,
                        BattleDuration = proxyWarResult.BattleDuration.TotalSeconds,
                        Timestamp = DateTime.UtcNow
                    });

                throw new AuctionBusinessException(auctionCar.LotNumber,
                    $"Your bid of ${dto.Amount:N0} was immediately outbid by proxy bidders to ${proxyWarResult.FinalAmount:N0}. " +
                    $"Battle lasted {proxyWarResult.BattleDuration.TotalSeconds:F1} seconds. Current price is now ${proxyWarResult.FinalAmount:N0}.");
            }

            // ✅ Normal bid yerləşdir (proxy outbid etmədi)
            var bid = Bid.CreateRegularBid(
                dto.AuctionCarId,
                dto.UserId,
                dto.Amount,
                isPreBid: false,
                dto.IPAddress,
                dto.UserAgent);

            bid.SequenceNumber = await GetNextSequenceNumberAsync(dto.AuctionCarId);
            var createdBid = await _bidRepository.AddAsync(bid);

            // ✅ Update AuctionCar - həm price həm də LastBidTime
            auctionCar.UpdateCurrentPrice(dto.Amount);
            auctionCar.LastBidTime = DateTime.UtcNow; // Timer reset üçün kritik!
            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Real-time notifications
            var groupName = $"AuctionCar-{dto.AuctionCarId}";

            await _bidHubContext.Clients.Group(groupName).SendAsync("NewLiveBid", new
            {
                createdBid.Id,
                createdBid.AuctionCarId,
                createdBid.UserId,
                createdBid.Amount,
                createdBid.PlacedAtUtc,
                BidType = "Live",
                IsHighest = true,
                LotNumber = auctionCar.LotNumber,
                ProcessedBy = " "
            });

            await _bidHubContext.Clients.Group(groupName).SendAsync("HighestBidUpdated", new
            {
                AuctionCarId = dto.AuctionCarId,
                Amount = dto.Amount,
                BidderId = dto.UserId,
                UpdatedAt = DateTime.UtcNow,
                NextMinimum = await CalculateMinimumBidAsync(dto.AuctionCarId)
            });

            // ✅ Timer reset - 30 saniyə (auction.TimerSeconds)
            var timerSeconds = auctionCar.Auction?.TimerSeconds ?? 30;
            await _bidHubContext.Clients.Group(groupName).SendAsync("AuctionTimerReset", new
            {
                AuctionCarId = dto.AuctionCarId,
                SecondsRemaining = timerSeconds, // Full timer duration reset
                NewTimerSeconds = timerSeconds,
                ResetAt = DateTime.UtcNow,
                ResetBy = "LiveBid"
            });

            var result = _mapper.Map<BidDetailDto>(createdBid);
            await EnrichBidDetailsAsync(result);

            _logger.LogInformation("✅ Live bid placed: {BidId} - ${Amount} for {LotNumber} at {Time}",
                createdBid.Id, dto.Amount, auctionCar.LotNumber, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            return result;
        }

        public async Task<BidDetailDto> PlaceProxyBidAsync(ProxyBidDto dto)
        {
            _logger.LogInformation("🤖 Placing proxy bid: User {UserId}, Start ${StartAmount}, Max ${MaxAmount} at {Time}",
                dto.UserId, dto.StartAmount, dto.MaxAmount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var createDto = new BidCreateDto
            {
                AuctionCarId = dto.AuctionCarId,
                UserId = dto.UserId,
                Amount = dto.StartAmount,
                IsProxy = true,
                ProxyMax = dto.MaxAmount,
                ValidUntil = dto.ValidUntil,
                Notes = dto.Notes,
                IsPreBid = dto.IsPreBid,
                BidType = dto.IsPreBid ? BidTypeDto.PreBid : BidTypeDto.ProxyBid
            };
            return await PlaceProxyBidInternalAsync(createDto);
        }

        #endregion

        #region Proxy Bid Management (ENHANCED REAL eBay LOGIC)

        private async Task<BidDetailDto> PlaceProxyBidInternalAsync(BidCreateDto dto)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(dto.AuctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", dto.AuctionCarId);

            if (!dto.ProxyMax.HasValue || dto.ProxyMax.Value <= dto.Amount)
                throw new BadRequestException("Proxy max amount must be greater than current amount");

            // ✅ YENİ: Intelligent Proxy Validation
            var currentHighestBid = await _bidRepository.GetHighestBidAsync(dto.AuctionCarId);
            var minIncrement = auctionCar.Auction?.MinBidIncrement ?? 100;

            if (currentHighestBid != null && dto.ProxyMax.Value < (currentHighestBid.Amount + minIncrement))
            {
                throw new AuctionBusinessException(auctionCar.LotNumber,
                    $"Your proxy max ${dto.ProxyMax.Value:N0} is too low. Current bid is ${currentHighestBid.Amount:N0}, minimum required: ${currentHighestBid.Amount + minIncrement:N0}");
            }

            // ✅ Efficiency Analysis
            var efficiency = await AnalyzeProxyEfficiencyAsync(dto.AuctionCarId, dto.ProxyMax.Value, dto.UserId);
            if (!efficiency.IsRecommended)
            {
                _logger.LogWarning("⚠️ Proxy bid not recommended: User {UserId}, Reason: {Strategy}, Win Probability: {WinProb}%",
                    dto.UserId, efficiency.Strategy, efficiency.WinProbability);
            }

            var validUntil = dto.ValidUntil ?? (dto.IsPreBid ? DateTime.UtcNow.AddDays(7) : DateTime.UtcNow.AddHours(24));

            var proxyBid = Bid.CreateProxyBid(
                dto.AuctionCarId,
                dto.UserId,
                dto.Amount,
                dto.ProxyMax.Value,
                validUntil,
                dto.IsPreBid,
                dto.IPAddress,
                dto.UserAgent);

            var createdBid = await _bidRepository.AddAsync(proxyBid);

            // ✅ YENİ: Əgər cari bid-dən yuxarıdırsa, dərhal auto-bid yarat
            if (currentHighestBid == null || dto.Amount > currentHighestBid.Amount)
            {
                var autoBidAmount = currentHighestBid != null
                    ? Math.Min(currentHighestBid.Amount + minIncrement, dto.ProxyMax.Value)
                    : dto.Amount;

                if (autoBidAmount != dto.Amount)
                {
                    var sequenceNumber = await GetNextSequenceNumberAsync(dto.AuctionCarId);
                    var autoBid = Bid.CreateAutoBid(
                        dto.AuctionCarId,
                        dto.UserId,
                        autoBidAmount,
                        createdBid.Id,
                        sequenceNumber);

                    await _bidRepository.AddAsync(autoBid);

                    auctionCar.UpdateCurrentPrice(autoBidAmount);
                    await _auctionCarRepository.UpdateAsync(auctionCar);

                    // ✅ Real-time notification for immediate auto-bid
                    await _bidHubContext.Clients.Group($"AuctionCar-{dto.AuctionCarId}")
                        .SendAsync("ProxyAutoBid", new
                        {
                            autoBid.Id,
                            autoBid.Amount,
                            autoBid.UserId,
                            ParentProxyId = createdBid.Id,
                            IsImmediate = true,
                            Timestamp = DateTime.UtcNow
                        });
                }
            }

            await _unitOfWork.SaveChangesAsync();

            // ✅ User-ə proxy success notification
            await _bidHubContext.Clients.User(dto.UserId.ToString()).SendAsync("ProxyBidActivated", new
            {
                createdBid.Id,
                StartAmount = dto.Amount,
                MaxAmount = dto.ProxyMax.Value,
                Efficiency = efficiency,
                ValidUntil = validUntil,
                Message = $"Proxy bid active: ${dto.Amount:N0} - ${dto.ProxyMax.Value:N0}",
                Timestamp = DateTime.UtcNow
            });

            var result = _mapper.Map<BidDetailDto>(createdBid);
            await EnrichBidDetailsAsync(result);

            _logger.LogInformation("✅ Proxy bid placed: {BidId} - Start ${Amount}, Max ${MaxAmount} for {LotNumber} (Efficiency: {WinProb}%) at {Time}",
                createdBid.Id, dto.Amount, dto.ProxyMax.Value, auctionCar.LotNumber, efficiency.WinProbability, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            return result;
        }

        // ✅ YENİ: ADVANCED PROXY BID WAR MƏNTIQ (Real eBay Algorithm)
        public async Task<ProxyWarResult> ProcessProxyBidWarAsync(Guid auctionCarId, decimal incomingBidAmount, Guid incomingUserId)
        {
            await _proxyWarLock.WaitAsync();
            try
            {
                var startTime = DateTime.UtcNow;
                var result = new ProxyWarResult { IsOutbid = false, FinalAmount = incomingBidAmount };

                // ✅ 1. Aktiv proxy bid-ləri gətir (strongest first)
                var activeProxies = (await _bidRepository.GetActiveProxyBidsAsync(auctionCarId))
                    .Where(pb => pb.UserId != incomingUserId && pb.IsProxyBidValid())
                    .OrderByDescending(pb => pb.ProxyMax)
                    .ToList();

                if (!activeProxies.Any())
                    return result;

                var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
                var minIncrement = auctionCar?.Auction?.MinBidIncrement ?? 100;

                _logger.LogInformation("🔥 PROXY WAR STARTED: {ProxyCount} proxies vs incoming ${Amount} at {Time}",
                    activeProxies.Count, incomingBidAmount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                // ✅ 2. Intelligent War Strategy
                var warBattles = new List<ProxyWarStep>();
                var currentBattlePrice = incomingBidAmount;
                Bid? winningProxy = null;

                foreach (var proxy in activeProxies)
                {
                    if (!proxy.CanOutbid(currentBattlePrice, minIncrement))
                        break; // Bu və sonrakı proxy-lər cavab verə bilməz

                    // ✅ Strategy-based bidding
                    var strategy = proxy.GetOptimalStrategy(currentBattlePrice, minIncrement, activeProxies);
                    var nextBidAmount = CalculateStrategicBidAmount(proxy, currentBattlePrice, minIncrement, strategy);

                    if (nextBidAmount <= currentBattlePrice)
                        continue; // Bu proxy artıq kifayət etmir

                    // ✅ War step record
                    warBattles.Add(new ProxyWarStep
                    {
                        ProxyBidId = proxy.Id,
                        UserId = proxy.UserId,
                        Amount = nextBidAmount,
                        Action = $"Proxy {strategy} Strategy",
                        Timestamp = DateTime.UtcNow
                    });

                    currentBattlePrice = nextBidAmount;
                    winningProxy = proxy;

                    _logger.LogInformation("⚔️ Proxy battle step: User {UserId} → ${Amount} (Strategy: {Strategy})",
                        proxy.UserId, nextBidAmount, strategy);
                }

                // ✅ 3. Final Auto-Bid Creation
                if (winningProxy != null && currentBattlePrice > incomingBidAmount)
                {
                    var sequenceNumber = await GetNextSequenceNumberAsync(auctionCarId);
                    var finalAutoBid = Bid.CreateAutoBid(
                        auctionCarId,
                        winningProxy.UserId,
                        currentBattlePrice,
                        winningProxy.Id,
                        sequenceNumber);

                    await _bidRepository.AddAsync(finalAutoBid);

                    if (auctionCar != null)
                    {
                        auctionCar.UpdateCurrentPrice(currentBattlePrice);
                        await _auctionCarRepository.UpdateAsync(auctionCar);
                    }

                    await _unitOfWork.SaveChangesAsync();

                    // ✅ Real-time war notifications
                    await _bidHubContext.Clients.Group($"AuctionCar-{auctionCarId}")
                        .SendAsync("ProxyWarCompleted", new
                        {
                            WinnerUserId = winningProxy.UserId,
                            FinalAmount = currentBattlePrice,
                            IncomingBid = incomingBidAmount,
                            BattleSteps = warBattles.Count,
                            BattleDuration = (DateTime.UtcNow - startTime).TotalSeconds,
                            ProcessedBy = " ",
                            Timestamp = DateTime.UtcNow
                        });

                    result.IsOutbid = true;
                    result.FinalAmount = currentBattlePrice;
                    result.WinningProxyUserId = winningProxy.UserId;
                    result.WinningProxyBidId = winningProxy.Id;
                    result.WarSteps = warBattles;
                    result.BattleDuration = DateTime.UtcNow - startTime;
                    result.WarSummary = $"{warBattles.Count} proxy battles, winner: User {winningProxy.UserId} at ${currentBattlePrice:N0}";
                }

                _logger.LogInformation("🏁 PROXY WAR COMPLETED: Winner {WinnerUserId} → ${FinalAmount}, Duration: {Duration}ms at {Time}",
                    result.WinningProxyUserId, result.FinalAmount, result.BattleDuration.TotalMilliseconds, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return result;
            }
            finally
            {
                _proxyWarLock.Release();
            }
        }

        // ✅ YENİ: Strategic Bid Amount Calculation
        private decimal CalculateStrategicBidAmount(Bid proxy, decimal currentPrice, decimal minIncrement, ProxyStrategy strategy)
        {
            if (!proxy.ProxyMax.HasValue)
                return 0;

            var baseNextAmount = currentPrice + minIncrement;

            return strategy switch
            {
                ProxyStrategy.Aggressive => Math.Min(proxy.ProxyMax.Value, currentPrice + (minIncrement * 3)), // Böyük addımlar
                ProxyStrategy.Conservative => Math.Min(proxy.ProxyMax.Value, baseNextAmount), // Minimum addım
                ProxyStrategy.Competitive => Math.Min(proxy.ProxyMax.Value, currentPrice + (minIncrement * 2)), // Orta addım
                ProxyStrategy.Defensive => Math.Min(proxy.ProxyMax.Value, baseNextAmount), // Minimum risk
                _ => Math.Min(proxy.ProxyMax.Value, baseNextAmount)
            };
        }

        // ✅ YENİ: Proxy Efficiency Analysis
        public async Task<ProxyEfficiencyResult> AnalyzeProxyEfficiencyAsync(Guid auctionCarId, decimal proposedMax, Guid userId)
        {
            var result = new ProxyEfficiencyResult();

            var activeProxies = (await _bidRepository.GetActiveProxyBidsAsync(auctionCarId))
                .Where(pb => pb.UserId != userId && pb.IsProxyBidValid())
                .ToList();

            var currentHighest = await _bidRepository.GetHighestBidAsync(auctionCarId);
            var currentPrice = currentHighest?.Amount ?? 0;

            // ✅ Competition Analysis
            var strongerProxies = activeProxies.Count(p => p.ProxyMax.HasValue && p.ProxyMax.Value >= proposedMax);
            var competitionLevel = activeProxies.Count;

            // ✅ Win Probability Calculation (simplified algorithm)
            if (strongerProxies == 0)
            {
                result.WinProbability = Math.Min(95, 100 - (competitionLevel * 5)); // Yüksək şans
                result.Strategy = "Dominant Position";
                result.IsRecommended = true;
            }
            else if (strongerProxies <= 2)
            {
                result.WinProbability = Math.Max(30, 70 - (strongerProxies * 20));
                result.Strategy = "Competitive Position";
                result.IsRecommended = result.WinProbability >= 50;
            }
            else
            {
                result.WinProbability = Math.Max(10, 40 - (strongerProxies * 10));
                result.Strategy = "Underdog Position";
                result.IsRecommended = false;
            }

            // ✅ Recommended Max Calculation
            var highestCompetitorMax = activeProxies.Where(p => p.ProxyMax.HasValue)
                                                  .Max(p => p.ProxyMax.Value);
            result.RecommendedMax = Math.Max(proposedMax, highestCompetitorMax + 500);

            // ✅ Estimated Final Price
            result.EstimatedFinalPrice = competitionLevel > 0
                ? Math.Min(proposedMax, highestCompetitorMax + 100)
                : Math.Max(currentPrice + 100, proposedMax * 0.8m);

            // ✅ Strategic Insights
            result.Insights.Add($"Competition level: {competitionLevel} active proxy bids");
            result.Insights.Add($"Stronger competitors: {strongerProxies}");
            result.Insights.Add($"Estimated competition max: ${highestCompetitorMax:N0}");

            if (!result.IsRecommended)
            {
                result.Insights.Add($"Consider increasing max to ${result.RecommendedMax:N0} for better chances");
            }

            return result;
        }

        // ✅ YENİ: Real-time Proxy Battle Status
        public async Task<ProxyStatusResult> GetProxyBattleStatusAsync(Guid auctionCarId)
        {
            var activeProxies = (await _bidRepository.GetActiveProxyBidsAsync(auctionCarId))
                .Where(pb => pb.IsProxyBidValid())
                .ToList();

            var currentHighest = await _bidRepository.GetHighestBidAsync(auctionCarId);
            var recentBids = await _bidRepository.GetBidsAfterTimeAsync(auctionCarId, DateTime.UtcNow.AddMinutes(-5));
            var hasRecentProxyActivity = recentBids.Any(b => b.IsAutoBid);

            var result = new ProxyStatusResult
            {
                ActiveProxyCount = activeProxies.Count,
                HighestProxyMax = activeProxies.Where(p => p.ProxyMax.HasValue).Max(p => p.ProxyMax.Value),
                CurrentBattlePrice = currentHighest?.Amount ?? 0,
                IsWarActive = hasRecentProxyActivity,
                BattlePhase = DetermineBattlePhase(activeProxies, hasRecentProxyActivity)
            };

            // ✅ Participant Analysis (gizli məlumatlar approximate)
            result.Participants = activeProxies.Select(p => new ProxyParticipant
            {
                UserId = p.UserId,
                UserName = $"Bidder-{p.UserId.ToString()[..8]}", // Partial anonymity
                EstimatedCapacity = EstimateCapacity(p, currentHighest?.Amount ?? 0),
                Status = DetermineParticipantStatus(p, currentHighest),
                LastActivity = p.PlacedAtUtc
            }).ToList();

            return result;
        }

        private string DetermineBattlePhase(List<Bid> activeProxies, bool hasRecentActivity)
        {
            if (activeProxies.Count == 0) return "Inactive";
            if (activeProxies.Count == 1) return "Dominating";
            if (hasRecentActivity) return "Active Battle";
            return "Standby";
        }

        private decimal EstimateCapacity(Bid proxy, decimal currentPrice)
        {
            if (!proxy.ProxyMax.HasValue) return 0;

            // ✅ Gizli məlumatları approximate göstər (security)
            var remaining = proxy.ProxyMax.Value - currentPrice;
            var approximateRanges = new[] { 100m, 500m, 1000m, 5000m, 10000m };

            return approximateRanges.FirstOrDefault(range => remaining <= range * 1.2m);
        }

        private string DetermineParticipantStatus(Bid proxy, Bid? currentHighest)
        {
            if (currentHighest?.UserId == proxy.UserId) return "Leading";
            if (!proxy.ProxyMax.HasValue) return "Unknown";
            if (proxy.ProxyMax.Value <= (currentHighest?.Amount ?? 0) + 100) return "Near Limit";
            return "Active";
        }

        #endregion

        #region Legacy Proxy Methods (DEPRECATED - keep for compatibility)

        public async Task ProcessProxyBidsAsync(Guid auctionCarId, decimal currentHighestBid)
        {
            _logger.LogWarning("⚠️ DEPRECATED: ProcessProxyBidsAsync called - use ProcessProxyBidWarAsync instead");

            // ✅ Fallback to new war logic
            await ProcessProxyBidWarAsync(auctionCarId, currentHighestBid, Guid.Empty);
        }

        public async Task<IEnumerable<BidDetailDto>> GetUserActiveProxyBidsAsync(Guid userId, Guid auctionCarId)
        {
            _logger.LogInformation("🔍 Getting user active proxy bids: User {UserId}, Car {AuctionCarId} at {Time}",
                userId, auctionCarId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var proxyBids = await _bidRepository.GetUserProxyBidsAsync(userId, auctionCarId);
            var activeBids = proxyBids.Where(pb => pb.IsProxyBidValid() && pb.Status == BidStatus.Placed);

            var results = _mapper.Map<IEnumerable<BidDetailDto>>(activeBids);
            foreach (var result in results)
            {
                await EnrichBidDetailsAsync(result);
            }

            _logger.LogInformation("✅ Found {Count} active proxy bids for user {UserId} at {Time}",
                results.Count(), userId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            return results;
        }

        public async Task<bool> CancelProxyBidAsync(Guid bidId, Guid userId)
        {
            _logger.LogInformation("❌ Cancelling proxy bid: {BidId} by user {UserId} at {Time}",
                bidId, userId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            var bid = await _bidRepository.GetByIdAsync(bidId);
            if (bid == null || bid.UserId != userId || !bid.IsProxy)
            {
                _logger.LogWarning("Proxy bid cancel failed: Invalid bid or user mismatch at {Time}", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                return false;
            }

            bid.Retract("Proxy bid cancelled by user via  ");
            await _bidRepository.UpdateAsync(bid);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Real-time notification
            await _bidHubContext.Clients.User(userId.ToString()).SendAsync("ProxyBidCancelled", new
            {
                BidId = bidId,
                CancelledAt = DateTime.UtcNow,
                ProcessedBy = " "
            });

            _logger.LogInformation("✅ Proxy bid cancelled successfully: {BidId} at {Time}", bidId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            return true;
        }

        #endregion

        #region Bid Validation

        public async Task<BidValidationResult> ValidateBidAsync(BidCreateDto dto)
        {
            var result = new BidValidationResult { IsValid = true };

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(dto.AuctionCarId);
            if (auctionCar == null)
            {
                result.IsValid = false;
                result.Errors.Add("Auction car not found");
                return result;
            }

            var auction = auctionCar.Auction;
            result.AuctionActive = auction?.Status == AuctionStatus.Running;

            // ✅ Auction status validation
            if (dto.IsPreBid)
            {
                if (auction?.Status == AuctionStatus.Running)
                    result.Errors.Add("Auction başladıqdan sonra pre-bid verilə bilməz");
            }
            else
            {
                if (auction?.Status != AuctionStatus.Running)
                    result.Errors.Add("Live bid yalnız running auction zamanı verilə bilər");

                if (!auctionCar.IsActive)
                    result.Errors.Add("Bu maşın hazırda aktiv deyil");
            }

            // ✅ Seller validation
            if (auctionCar.Car?.OwnerId != null &&
                Guid.TryParse(auctionCar.Car.OwnerId, out var ownerId) &&
                ownerId == dto.UserId)
            {
                result.Errors.Add("Seller öz maşınına bid verə bilməz");
            }

            // ✅ Amount validations
            var minimumBid = await CalculateMinimumBidAsync(dto.AuctionCarId);
            result.MinimumBidAmount = minimumBid;
            result.CurrentHighestBid = auctionCar.CurrentPrice;

            if (dto.Amount < minimumBid)
            {
                result.Errors.Add($"Minimum bid {minimumBid:C} olmalıdır");
                result.SuggestedBidAmount = minimumBid;
            }
            else
            {
                var increment = auction?.MinBidIncrement ?? 100;
                result.SuggestedBidAmount = Math.Max(minimumBid, auctionCar.CurrentPrice + increment);
            }

            // ✅ Self-outbid prevention
            if (!dto.IsPreBid && auction?.Status == AuctionStatus.Running)
            {
                var currentHighest = await _bidRepository.GetHighestBidAsync(dto.AuctionCarId);
                if (currentHighest?.UserId == dto.UserId)
                {
                    result.Errors.Add("Siz artıq ən yüksək bid-ə sahibsiniz");
                }
            }

            // ✅ Rate limiting (exclude auto-bids)
            var recentBids = await _bidRepository.GetBidsAfterTimeAsync(dto.AuctionCarId, DateTime.UtcNow.AddMinutes(-1));
            var userRecentManualBids = recentBids.Count(b => b.UserId == dto.UserId && !b.IsAutoBid);

            if (userRecentManualBids > 5)
            {
                result.Errors.Add("Çox tez-tez bid verirsiniz, bir dəqiqə gözləyin");
            }

            // ✅ Proxy bid validations
            if (dto.IsProxy && dto.ProxyMax.HasValue)
            {
                if (dto.ProxyMax.Value <= dto.Amount)
                    result.Errors.Add("Proxy maksimumu cari məbləğdən böyük olmalıdır");

                if (dto.ProxyMax.Value > 10000000)
                    result.Errors.Add("Proxy maksimumu 10,000,000-dan çox ola bilməz");

                // ✅ Check active proxy conflict
                var hasActiveProxy = await _bidRepository.HasActiveProxyBidAsync(dto.UserId, dto.AuctionCarId);
                if (hasActiveProxy)
                    result.Errors.Add("Sizin artıq aktiv proxy bid-iniz var");
            }

            result.IsValid = result.Errors.Count == 0;

            _logger.LogInformation("Bid validation completed: User {UserId}, Car {AuctionCarId}, Valid: {IsValid}, Errors: {ErrorCount} at {Time}",
                dto.UserId, dto.AuctionCarId, result.IsValid, result.Errors.Count, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            return result;
        }

        public async Task<decimal> GetMinimumBidAmountAsync(Guid auctionCarId)
        {
            return await CalculateMinimumBidAsync(auctionCarId);
        }

        private async Task<decimal> CalculateMinimumBidAsync(Guid auctionCarId)
        {
            try
            {
                // ✅ FİX: Mövcud repository method istifadə et
                var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
                if (auctionCar == null)
                {
                    _logger.LogWarning("⚠️ AuctionCar not found for minimum bid: {AuctionCarId}", auctionCarId);
                    return 100m; // Safe fallback
                }

                var currentPrice = auctionCar.CurrentPrice;

                // ✅ FİX: Null və ya 0 price üçün fallback
                if (currentPrice <= 0)
                {
                    currentPrice = auctionCar.StartPrice > 0 ? auctionCar.StartPrice :
                                  auctionCar.MinPreBid > 0 ? auctionCar.MinPreBid : 100m;
                }

                // ✅ FİX: Sadə increment calculation
                var increment = currentPrice switch
                {
                    <= 100m => 25m,
                    <= 500m => 50m,
                    <= 1000m => 100m,
                    <= 5000m => 250m,
                    <= 10000m => 500m,
                    _ => 1000m
                };

                var minimumBid = currentPrice + increment;

                // ✅ FİX: MinPreBid ilə müqayisə
                if (auctionCar.MinPreBid > 0 && minimumBid < auctionCar.MinPreBid)
                {
                    minimumBid = auctionCar.MinPreBid;
                }

                _logger.LogInformation("💰 Calculated minimum bid: Car {AuctionCarId}, Current ${Current}, Min ${Result}",
                    auctionCarId, currentPrice, minimumBid);

                return minimumBid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error calculating minimum bid for {AuctionCarId}", auctionCarId);
                return 100m; // Safe fallback
            }
        }

        public async Task<bool> CanUserPlaceBidAsync(Guid userId, Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar?.Auction == null) return false;

            // ✅ Basic checks
            if (auctionCar.Auction.Status != AuctionStatus.Running) return true; // Pre-bid allowed
            if (!auctionCar.IsActive) return false; // Car not active

            // ✅ Self-ownership check
            if (auctionCar.Car?.OwnerId != null &&
                Guid.TryParse(auctionCar.Car.OwnerId, out var ownerId) &&
                ownerId == userId)
                return false;

            return true;
        }

        #endregion

        #region Bid History & Statistics

        public async Task<BidHistoryDto> GetBidHistoryAsync(Guid auctionCarId, int pageSize = 50)
        {
            _logger.LogInformation("📊 Getting bid history: Car {AuctionCarId}, PageSize {PageSize}",
                auctionCarId, pageSize);

            try
            {
                // ✅ FİX: Yeni repository method istifadə et
                var auctionCar = await _bidRepository.GetAuctionCarWithBidsAsync(auctionCarId);
                if (auctionCar == null)
                    throw new NotFoundException("AuctionCar", auctionCarId);

                // ✅ FİX: Yeni repository method ilə bids al
                var allBids = await _bidRepository.GetBidsForCarAsync(auctionCarId, pageSize);

                // ✅ FİX: Sadə mapping
                var bidDtos = allBids.Select(bid => new BidGetDto
                {
                    Id = bid.Id,
                    AuctionCarId = bid.AuctionCarId,
                    UserId = bid.UserId,
                    Amount = bid.Amount,
                    PlacedAtUtc = bid.PlacedAtUtc,
                    IsPreBid = bid.IsPreBid,
                    IsProxy = bid.IsProxy,
                    IsAutoBid = bid.IsAutoBid,
                    Status = bid.Status.ToString(),
                    UserName = $"Bidder-{bid.UserId.ToString()[..8]}", // Anonymous
                    TimeAgo = CalculateTimeAgo(bid.PlacedAtUtc)
                }).ToList();

                // ✅ FİX: Sadə statistics
                var totalBids = allBids.Count();
                var uniqueBidders = allBids.Select(b => b.UserId).Distinct().Count();

                var result = new BidHistoryDto
                {
                    AuctionCarId = auctionCarId,
                    LotNumber = auctionCar.LotNumber ?? "Unknown",
                    CarInfo = auctionCar.Car != null
                        ? $"{auctionCar.Car.Year} {auctionCar.Car.Make} {auctionCar.Car.Model}"
                        : "Car info unavailable",
                    TotalBids = totalBids,
                    UniqueBidders = uniqueBidders,
                    StartingPrice = auctionCar.StartPrice,
                    WinningPrice = auctionCar.CurrentPrice,
                    PriceIncrease = auctionCar.CurrentPrice - auctionCar.StartPrice,
                    AuctionStartTime = auctionCar.Auction?.StartTimeUtc ?? DateTime.MinValue,
                    AuctionEndTime = auctionCar.Auction?.EndTimeUtc,
                    Bids = bidDtos,
                    TopBidders = new List<BidderSummaryDto>() // Empty list for now
                };

                _logger.LogInformation("✅ Bid history retrieved: {TotalBids} bids, {UniqueBidders} bidders",
                    totalBids, uniqueBidders);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting bid history for {AuctionCarId}", auctionCarId);

                // ✅ FİX: Error zamanı empty but valid result
                return new BidHistoryDto
                {
                    AuctionCarId = auctionCarId,
                    LotNumber = "Error",
                    CarInfo = "Unable to load car information",
                    TotalBids = 0,
                    UniqueBidders = 0,
                    StartingPrice = 0,
                    WinningPrice = 0,
                    PriceIncrease = 0,
                    AuctionStartTime = DateTime.MinValue,
                    AuctionEndTime = null,
                    Bids = new List<BidGetDto>(),
                    TopBidders = new List<BidderSummaryDto>()
                };
            }
        }

        public async Task<IEnumerable<BidGetDto>> GetRecentBidsAsync(Guid auctionCarId, int count = 10)
        {
            var recentBids = await _bidRepository.GetRecentBidsAsync(auctionCarId, count);
            var dtos = _mapper.Map<IEnumerable<BidGetDto>>(recentBids);

            foreach (var dto in dtos)
            {
                dto.TimeAgo = CalculateTimeAgo(dto.PlacedAtUtc);
            }

            return dtos;
        }

        public async Task<IEnumerable<BidGetDto>> GetUserBidsAsync(Guid userId)
        {
            var userBids = await _bidRepository.GetUserAllBidsAsync(userId);
            var result = _mapper.Map<IEnumerable<BidGetDto>>(userBids);
            return result;
        }

        public async Task<BidSummaryDto> GetUserBidSummaryAsync(Guid userId, Guid auctionId)
        {
            var userBids = await _bidRepository.GetUserBidsForAuctionAsync(userId, auctionId);

            if (!userBids.Any())
            {
                return new BidSummaryDto { UserId = userId, AuctionId = auctionId };
            }

            var preBids = userBids.Count(b => b.IsPreBid);
            var liveBids = userBids.Count(b => !b.IsPreBid && !b.IsProxy);
            var proxyBids = userBids.Count(b => b.IsProxy);

            return new BidSummaryDto
            {
                UserId = userId,
                AuctionId = auctionId,
                TotalBids = userBids.Count(),
                PreBids = preBids,
                LiveBids = liveBids,
                ProxyBids = proxyBids,
                WinningBids = 0,
                TotalBidAmount = userBids.Sum(b => b.Amount),
                HighestBidAmount = userBids.Max(b => b.Amount),
                LowestBidAmount = userBids.Min(b => b.Amount),
                AverageBidAmount = userBids.Average(b => b.Amount),
                FirstBidTime = userBids.Min(b => b.PlacedAtUtc),
                LastBidTime = userBids.Max(b => b.PlacedAtUtc)
            };
        }

        #endregion

        #region Real-time Support Methods

        public async Task<BidDetailDto?> GetHighestBidAsync(Guid auctionCarId)
        {
            var highestBid = await _bidRepository.GetHighestBidAsync(auctionCarId);
            if (highestBid == null) return null;

            var dto = _mapper.Map<BidDetailDto>(highestBid);
            await EnrichBidDetailsAsync(dto);
            return dto;
        }

        public async Task<DateTime?> GetLastBidTimeAsync(Guid auctionCarId)
        {
            return await _bidRepository.GetLastBidTimeAsync(auctionCarId);
        }

        public async Task<IEnumerable<BidGetDto>> GetBidsAfterTimeAsync(Guid auctionCarId, DateTime afterTime)
        {
            var bids = await _bidRepository.GetBidsAfterTimeAsync(auctionCarId, afterTime);
            return _mapper.Map<IEnumerable<BidGetDto>>(bids);
        }

        public async Task<BidStatsDto> GetBidStatsAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var totalBids = await _bidRepository.GetTotalBidCountAsync(auctionCarId);
            var activeBids = await _bidRepository.GetActiveBidCountAsync(auctionCarId);
            var preBids = auctionCar.Bids.Count(b => b.IsPreBid);
            var proxyBids = auctionCar.Bids.Count(b => b.IsProxy);
            var uniqueBidders = await _bidRepository.GetUniqueBiddersCountAsync(auctionCarId);

            var allBids = auctionCar.Bids.Where(b => b.Status == BidStatus.Placed).ToList();
            var highestBid = allBids.Any() ? allBids.Max(b => b.Amount) : 0;
            var lowestBid = allBids.Any() ? allBids.Min(b => b.Amount) : 0;
            var averageBid = allBids.Any() ? allBids.Average(b => b.Amount) : 0;

            return new BidStatsDto
            {
                AuctionCarId = auctionCarId,
                LotNumber = auctionCar.LotNumber,
                TotalBids = totalBids,
                UniqueBidders = uniqueBidders,
                ActiveBids = activeBids,
                PreBids = preBids,
                ProxyBids = proxyBids,
                CurrentPrice = auctionCar.CurrentPrice,
                StartingPrice = auctionCar.MinPreBid,
                HighestBid = highestBid,
                LowestBid = lowestBid,
                AverageBid = averageBid,
                PriceIncrease = highestBid - auctionCar.MinPreBid,
                PriceIncreasePercentage = auctionCar.MinPreBid > 0 ?
                    ((highestBid - auctionCar.MinPreBid) / auctionCar.MinPreBid) * 100 : 0
            };
        }

        public async Task<IEnumerable<BidderSummaryDto>> GetTopBiddersAsync(Guid auctionId, int count = 10)
        {
            var topBidders = await _bidRepository.GetTopBiddersAsync(auctionId, count);
            var result = _mapper.Map<IEnumerable<BidderSummaryDto>>(topBidders);
            return result;
        }

        #endregion

        #region Private Helper Methods

        private async Task EnrichBidDetailsAsync(BidDetailDto dto)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithFullDetailsAsync(dto.AuctionCarId);
            if (auctionCar != null)
            {
                dto.AuctionCarLotNumber = auctionCar.LotNumber;
                dto.AuctionName = auctionCar.Auction?.Name ?? "";
                dto.CarMake = auctionCar.Car?.Make;
                dto.CarModel = auctionCar.Car?.Model;
                dto.CarYear = auctionCar.Car?.Year;
                dto.CarVin = auctionCar.Car?.Vin;

                var highestBid = await _bidRepository.GetHighestBidAsync(dto.AuctionCarId);
                dto.IsHighestBid = highestBid?.Id == dto.Id;
                dto.IsWinningBid = dto.IsHighestBid && auctionCar.Auction?.Status == AuctionStatus.Ended;

                if (highestBid != null)
                    dto.DistanceFromHighest = Math.Max(0, highestBid.Amount - dto.Amount);
            }

            var nextMinBid = await CalculateMinimumBidAsync(dto.AuctionCarId);
            dto.NextMinimumBid = nextMinBid;

            if (dto.IsProxy)
            {
                dto.RemainingProxyAmount = Math.Max(0, (dto.ProxyMax ?? 0) - dto.Amount);
                dto.IsExpired = dto.ValidUntil.HasValue && DateTime.UtcNow > dto.ValidUntil.Value;
                dto.IsActive = dto.Status == "Placed" && !dto.IsExpired;
            }
        }

        private string CalculateTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;
            return timeSpan switch
            {
                { TotalMinutes: < 1 } => "İndi",
                { TotalMinutes: < 60 } => $"{(int)timeSpan.TotalMinutes} dəqiqə əvvəl",
                { TotalHours: < 24 } => $"{(int)timeSpan.TotalHours} saat əvvəl",
                _ => $"{(int)timeSpan.TotalDays} gün əvvəl"
            };
        }

        // ✅ Thread-safe sequence number generation
        private async Task<int> GetNextSequenceNumberAsync(Guid auctionCarId)
        {
            await _sequenceLock.WaitAsync();
            try
            {
                var maxSequence = await _bidRepository.GetMaxSequenceNumberAsync(auctionCarId);
                return maxSequence + 1;
            }
            finally
            {
                _sequenceLock.Release();
            }
        }

        #endregion
    }
}