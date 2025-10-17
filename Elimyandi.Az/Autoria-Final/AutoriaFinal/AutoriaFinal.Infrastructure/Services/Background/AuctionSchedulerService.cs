using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Options;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.Extensions.Hosting;
using AutoriaFinal.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;

namespace AutoriaFinal.Infrastructure.Services
{
    public class AuctionSchedulerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<AuctionHub> _auctionHub;
        private readonly IHubContext<BidHub> _bidHub;
        private readonly ILogger<AuctionSchedulerService> _logger;
        private readonly AuctionSchedulerOptions _options;
        private int _currentCycle = 0;

        public AuctionSchedulerService(
            IServiceScopeFactory scopeFactory,
            IHubContext<AuctionHub> auctionHub,
            IHubContext<BidHub> bidHub,
            IOptions<AuctionSchedulerOptions> options,
            ILogger<AuctionSchedulerService> logger)
        {
            _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
            _auctionHub = auctionHub ?? throw new ArgumentNullException(nameof(auctionHub));
            _bidHub = bidHub ?? throw new ArgumentNullException(nameof(bidHub));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _options = options?.Value ?? new AuctionSchedulerOptions();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 AuctionSchedulerService STARTED - User: ravanmu-coder - Time: 2025-10-06 15:13:52");
            _logger.LogInformation("⚙️  Configuration: PollInterval={Poll}s, BatchSize={Batch}, LotTimer={LotTimer}, CatchUp={CatchUp}",
                _options.PollIntervalSeconds, _options.BatchSize, _options.EnableLotTimerProcessing, _options.CatchUpOnStart);

            // ✅ Startup delay to ensure app is fully initialized
            await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

            if (_options.CatchUpOnStart)
            {
                try
                {
                    _logger.LogInformation("🔄 Starting catch-up process... - User: ravanmu-coder");
                    await DoCatchUpAsync(stoppingToken);
                    _logger.LogInformation("✅ Catch-up process completed - User: ravanmu-coder");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Catch-up failed at startup - User: ravanmu-coder");
                }
            }

            var consecutiveErrorCount = 0;
            const int maxConsecutiveErrors = 3;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _currentCycle++;
                    var sw = Stopwatch.StartNew();

                    // ✅ Process all lifecycle stages with counts - INCLUDING CAR CONDITIONS
                    var processedCounts = new
                    {
                        ReadyTransitions = await ProcessScheduledToReadyAsync(stoppingToken),
                        StartTransitions = await ProcessReadyToRunningAsync(stoppingToken),
                        EndTransitions = await ProcessRunningToEndedAsync(stoppingToken),
                        CarTransitions = _options.EnableLotTimerProcessing ? await ProcessExpiredCarsAsync(stoppingToken) : 0,
                        CarConditionUpdates = await ProcessCarConditionsAsync(stoppingToken) // ✅ YENİ ƏLAVƏen
                    };

                    sw.Stop();
                    var totalProcessed = processedCounts.ReadyTransitions + processedCounts.StartTransitions +
                                       processedCounts.EndTransitions + processedCounts.CarTransitions + processedCounts.CarConditionUpdates;

                    if (totalProcessed > 0 || _currentCycle % 30 == 0) // Log every 30 cycles or when events processed
                    {
                        _logger.LogInformation("⚡ Cycle #{Cycle}: Ready={Ready}, Start={Start}, End={End}, Cars={Cars}, Conditions={Conditions} | Duration={Duration}ms - User: ravanmu-coder",
                            _currentCycle, processedCounts.ReadyTransitions, processedCounts.StartTransitions,
                            processedCounts.EndTransitions, processedCounts.CarTransitions, processedCounts.CarConditionUpdates, sw.ElapsedMilliseconds);
                    }

                    consecutiveErrorCount = 0; // Reset on success
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    consecutiveErrorCount++;
                    _logger.LogError(ex, "❌ Scheduler cycle #{Cycle} failed (Error #{ErrorCount}) - User: ravanmu-coder", _currentCycle, consecutiveErrorCount);

                    if (consecutiveErrorCount >= maxConsecutiveErrors)
                    {
                        var backoffSeconds = Math.Min(30, _options.PollIntervalSeconds * consecutiveErrorCount);
                        _logger.LogWarning("⚠️ Too many errors, backing off for {Backoff}s - User: ravanmu-coder", backoffSeconds);
                        await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), stoppingToken);
                    }
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(_options.PollIntervalSeconds), stoppingToken);
                }
                catch (OperationCanceledException) { break; }
            }

            _logger.LogInformation("🛑 AuctionSchedulerService STOPPED after {Cycles} cycles - User: ravanmu-coder - Time: 2025-10-06 15:13:52", _currentCycle);
        }

        // ✅ Scheduled → Ready (Pre-bid collection starts)
        private async Task<int> ProcessScheduledToReadyAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var auctionRepo = scope.ServiceProvider.GetRequiredService<IAuctionRepository>();

                var scheduledAuctions = (await auctionRepo.GetAuctionsReadyToMakeReadyAsync())
                    .Take(_options.BatchSize)
                    .ToList();

                if (!scheduledAuctions.Any())
                    return 0;

                _logger.LogDebug("🔄 Processing {Count} auctions for Scheduled→Ready transition - User: ravanmu-coder", scheduledAuctions.Count);

                var processedCount = 0;
                foreach (var auction in scheduledAuctions)
                {
                    if (ct.IsCancellationRequested) break;

                    try
                    {
                        var transitioned = await auctionRepo.TryTransitionAuctionStatusAsync(
                            auction.Id, AuctionStatus.Scheduled, AuctionStatus.Ready, ct);

                        if (!transitioned)
                        {
                            _logger.LogDebug("⚠️ Auction {AuctionId} transition Scheduled→Ready skipped (concurrent update) - User: ravanmu-coder", auction.Id);
                            continue;
                        }

                        // ✅ YENİ: Car-ları da Ready et
                        foreach (var car in auction.AuctionCars.Where(c => c.AuctionCondition == AuctionCarCondition.PreAuction))
                        {
                            car.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                            car.MarkUpdated();

                            // ✅ StartPrice yoxdursa default set et
                            if (car.StartPrice <= 0 && car.CurrentPrice <= 0)
                            {
                                car.StartPrice = car.CurrentPrice = 100; // Default minimum
                            }
                        }

                        // Update auction metrics
                        auction.Status = AuctionStatus.Ready;
                        auction.TotalCarsCount = auction.AuctionCars.Count;
                        auction.CarsWithPreBidsCount = auction.AuctionCars.Count(ac => ac.Bids.Any(b => b.IsPreBid));

                        await auctionRepo.UpdateAsync(auction);

                        // SignalR notification
                        await _auctionHub.Clients.Group($"auction-{auction.Id}")
                            .SendAsync("AuctionReady", new
                            {
                                AuctionId = auction.Id,
                                Name = auction.Name,
                                Status = "Ready",
                                PreBidStartTime = auction.PreBidStartTimeUtc,
                                TotalCars = auction.TotalCarsCount,
                                CarsWithPreBids = auction.CarsWithPreBidsCount,
                                ReadyCars = auction.AuctionCars.Count(c => c.AuctionCondition == AuctionCarCondition.ReadyForAuction),
                                Timestamp = DateTime.UtcNow
                            }, ct);

                        _logger.LogInformation("✅ Auction READY: {AuctionId} - {Name} - Cars: {TotalCars} ({PreBids} with pre-bids, {ReadyCars} ready) - User: ravanmu-coder",
                            auction.Id, auction.Name, auction.TotalCarsCount, auction.CarsWithPreBidsCount,
                            auction.AuctionCars.Count(c => c.AuctionCondition == AuctionCarCondition.ReadyForAuction));

                        processedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to make auction ready: {AuctionId} - {Name} - User: ravanmu-coder", auction.Id, auction.Name);
                    }
                }

                return processedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ProcessScheduledToReadyAsync failed - User: ravanmu-coder");
                return 0;
            }
        }

        // ✅ Ready → Running (Live auction starts)
        private async Task<int> ProcessReadyToRunningAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var auctionRepo = scope.ServiceProvider.GetRequiredService<IAuctionRepository>();
                var auctionService = scope.ServiceProvider.GetRequiredService<IAuctionService>();

                var readyAuctions = (await auctionRepo.GetAuctionsReadyToStartAsync())
                    .Take(_options.BatchSize)
                    .ToList();

                if (!readyAuctions.Any())
                    return 0;

                _logger.LogDebug("🚀 Processing {Count} auctions for Ready→Running transition - User: ravanmu-coder", readyAuctions.Count);

                var processedCount = 0;
                foreach (var auction in readyAuctions)
                {
                    if (ct.IsCancellationRequested) break;

                    try
                    {
                        var transitioned = await auctionRepo.TryTransitionAuctionStatusAsync(
                            auction.Id, AuctionStatus.Ready, AuctionStatus.Running, ct);

                        if (!transitioned)
                        {
                            _logger.LogDebug("⚠️ Auction {AuctionId} transition Ready→Running skipped (concurrent update) - User: ravanmu-coder", auction.Id);
                            continue;
                        }

                        // Start the auction via service
                        var startedAuction = await auctionService.StartAuctionAsync(auction.Id);

                        // SignalR notification
                        await _auctionHub.Clients.Group($"auction-{auction.Id}")
                            .SendAsync("AuctionStarted", new
                            {
                                AuctionId = auction.Id,
                                Name = auction.Name,
                                Status = "Running",
                                StartTimeUtc = auction.StartTimeUtc,
                                CurrentCar = startedAuction.CurrentCarLotNumber,
                                StartPrice = startedAuction.StartPrice,
                                TimerSeconds = auction.TimerSeconds,
                                Timestamp = DateTime.UtcNow
                            }, ct);

                        _logger.LogInformation("✅ Auction STARTED: {AuctionId} - {Name} - Car: {Car} - Price: ${Price} - User: ravanmu-coder",
                            auction.Id, auction.Name, startedAuction.CurrentCarLotNumber, startedAuction.StartPrice);

                        processedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to start auction: {AuctionId} - {Name} - User: ravanmu-coder", auction.Id, auction.Name);
                    }
                }

                return processedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ProcessReadyToRunningAsync failed - User: ravanmu-coder");
                return 0;
            }
        }

        // ✅ Running → Ended (Time-based ending)
        private async Task<int> ProcessRunningToEndedAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var auctionRepo = scope.ServiceProvider.GetRequiredService<IAuctionRepository>();
                var auctionService = scope.ServiceProvider.GetRequiredService<IAuctionService>();

                var expiredAuctions = (await auctionRepo.GetExpiredRunningAuctionsAsync())
                    .Take(_options.BatchSize)
                    .ToList();

                if (!expiredAuctions.Any())
                    return 0;

                _logger.LogDebug("⏹️ Processing {Count} auctions for Running→Ended transition - User: ravanmu-coder", expiredAuctions.Count);

                var processedCount = 0;
                foreach (var auction in expiredAuctions)
                {
                    if (ct.IsCancellationRequested) break;

                    try
                    {
                        var transitioned = await auctionRepo.TryTransitionAuctionStatusAsync(
                            auction.Id, AuctionStatus.Running, AuctionStatus.Ended, ct);

                        if (!transitioned)
                        {
                            _logger.LogDebug("⚠️ Auction {AuctionId} transition Running→Ended skipped (concurrent update) - User: ravanmu-coder", auction.Id);
                            continue;
                        }

                        // End the auction via service
                        var endedAuction = await auctionService.EndAuctionAsync(auction.Id);

                        // Calculate final stats
                        var totalSales = endedAuction.TotalSalesAmount;
                        var soldCars = endedAuction.SoldCarsCount;

                        // SignalR notification
                        await _auctionHub.Clients.Group($"auction-{auction.Id}")
                            .SendAsync("AuctionEnded", new
                            {
                                AuctionId = auction.Id,
                                Name = auction.Name,
                                Status = "Ended",
                                EndTimeUtc = auction.EndTimeUtc,
                                TotalSales = totalSales,
                                SoldCars = soldCars,
                                TotalCars = endedAuction.TotalCarsCount,
                                Duration = (DateTime.UtcNow - auction.StartTimeUtc).TotalMinutes,
                                Timestamp = DateTime.UtcNow
                            }, ct);

                        _logger.LogInformation("✅ Auction ENDED: {AuctionId} - {Name} - Duration: {Duration:F1}min - Sales: ${Sales} ({Sold}/{Total} cars) - User: ravanmu-coder",
                            auction.Id, auction.Name, (DateTime.UtcNow - auction.StartTimeUtc).TotalMinutes, totalSales, soldCars, endedAuction.TotalCarsCount);

                        processedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to end auction: {AuctionId} - {Name} - User: ravanmu-coder", auction.Id, auction.Name);
                    }
                }

                return processedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ProcessRunningToEndedAsync failed - User: ravanmu-coder");
                return 0;
            }
        }

        // ✅ Car timer management (10-second timer logic)
        private async Task<int> ProcessExpiredCarsAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var auctionRepo = scope.ServiceProvider.GetRequiredService<IAuctionRepository>();
                var auctionCarService = scope.ServiceProvider.GetRequiredService<IAuctionCarService>();
                var auctionService = scope.ServiceProvider.GetRequiredService<IAuctionService>();

                var runningAuctions = (await auctionRepo.GetAuctionsByStatusAsync(AuctionStatus.Running))
                    .Where(a => !string.IsNullOrEmpty(a.CurrentCarLotNumber))
                    .Take(_options.BatchSize)
                    .ToList();

                if (!runningAuctions.Any())
                    return 0;

                var processedCount = 0;
                foreach (var auction in runningAuctions)
                {
                    if (ct.IsCancellationRequested) break;

                    try
                    {
                        var currentCar = auction.AuctionCars
                            .FirstOrDefault(ac => ac.LotNumber == auction.CurrentCarLotNumber && ac.IsActive);

                        if (currentCar != null && currentCar.IsTimeExpired(auction.TimerSeconds))
                        {
                            _logger.LogDebug("⏰ Car timer expired: {LotNumber} in auction {AuctionId} (Timer: {Timer}s) - User: ravanmu-coder",
                                currentCar.LotNumber, auction.Id, auction.TimerSeconds);

                            // ✅ End current car auction
                            await auctionCarService.EndCarAuctionAsync(currentCar.Id);
                            var updatedAuction = await auctionService.MoveToNextCarAsync(auction.Id);

                            // SignalR notification
                            await _bidHub.Clients.Group($"auction-{auction.Id}")
                                .SendAsync("CarTimerExpired", new
                                {
                                    AuctionId = auction.Id,
                                    ExpiredLot = currentCar.LotNumber,
                                    NextLot = updatedAuction.CurrentCarLotNumber,
                                    AuctionStatus = updatedAuction.Status,
                                    NextStartPrice = updatedAuction.StartPrice,
                                    Timestamp = DateTime.UtcNow
                                }, ct);

                            if (updatedAuction.Status == "Ended")
                            {
                                _logger.LogInformation("🏁 Auction AUTO-COMPLETED: {AuctionId} - {Name} (no more cars) - User: ravanmu-coder",
                                    auction.Id, auction.Name);
                            }
                            else
                            {
                                _logger.LogInformation("🔄 Car progression: {ExpiredLot} → {NextLot} in auction {AuctionId} - Price: ${Price} - User: ravanmu-coder",
                                    currentCar.LotNumber, updatedAuction.CurrentCarLotNumber, auction.Id, updatedAuction.StartPrice);
                            }

                            processedCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to process expired car in auction: {AuctionId} - User: ravanmu-coder", auction.Id);
                    }
                }

                return processedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ProcessExpiredCarsAsync failed - User: ravanmu-coder");
                return 0;
            }
        }

        // ✅ YENİ METHOD: Car condition management (PreAuction → ReadyForAuction)
        private async Task<int> ProcessCarConditionsAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var auctionCarRepo = scope.ServiceProvider.GetRequiredService<IAuctionCarRepository>();

                // ✅ PreAuction car-larını Ready auction-larda ReadyForAuction-a keçir
                var carsNeedingUpdate = await auctionCarRepo.GetCarsNeedingConditionUpdateAsync();

                if (!carsNeedingUpdate.Any())
                    return 0;

                _logger.LogDebug("🔄 Processing {Count} cars for condition updates - User: ravanmu-coder", carsNeedingUpdate.Count());

                var processedCount = 0;
                foreach (var car in carsNeedingUpdate.Take(_options.BatchSize))
                {
                    if (ct.IsCancellationRequested) break;

                    try
                    {
                        // ✅ PreAuction → ReadyForAuction
                        if (car.AuctionCondition == AuctionCarCondition.PreAuction &&
                            car.Auction.Status == AuctionStatus.Ready)
                        {
                            car.AuctionCondition = AuctionCarCondition.ReadyForAuction;

                            // ✅ StartPrice yoxdursa default set et
                            if (car.StartPrice <= 0 && car.CurrentPrice <= 0)
                            {
                                car.StartPrice = car.CurrentPrice = 100; // Default minimum
                                _logger.LogInformation("🔧 Set default StartPrice for car: {LotNumber} = $100 - User: ravanmu-coder", car.LotNumber);
                            }

                            car.MarkUpdated();
                            await auctionCarRepo.UpdateAsync(car);

                            _logger.LogInformation("✅ Car condition updated: {LotNumber} → ReadyForAuction (Auction: {AuctionId}) - User: ravanmu-coder",
                                car.LotNumber, car.AuctionId);
                            processedCount++;
                        }

                        // ✅ ReadyForAuction → LiveAuction (for current car in running auction)
                        else if (car.AuctionCondition == AuctionCarCondition.ReadyForAuction &&
                                car.Auction.Status == AuctionStatus.Running &&
                                car.Auction.CurrentCarLotNumber == car.LotNumber &&
                                !car.IsActive)
                        {
                            car.AuctionCondition = AuctionCarCondition.LiveAuction;
                            car.MarkAsActive();
                            car.MarkUpdated();
                            await auctionCarRepo.UpdateAsync(car);

                            _logger.LogInformation("✅ Car activated: {LotNumber} → LiveAuction (Auction: {AuctionId}) - User: ravanmu-coder",
                                car.LotNumber, car.AuctionId);
                            processedCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to update car condition: {LotNumber} - User: ravanmu-coder", car.LotNumber);
                    }
                }

                return processedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ProcessCarConditionsAsync failed - User: ravanmu-coder");
                return 0;
            }
        }

        // ✅ Startup catch-up
        private async Task DoCatchUpAsync(CancellationToken ct)
        {
            try
            {
                var sw = Stopwatch.StartNew();

                var catchupCounts = new
                {
                    Ready = await ProcessScheduledToReadyAsync(ct),
                    Started = await ProcessReadyToRunningAsync(ct),
                    Ended = await ProcessRunningToEndedAsync(ct),
                    CarConditions = await ProcessCarConditionsAsync(ct) // ✅ YENİ ƏLAVƏ
                };

                sw.Stop();
                var total = catchupCounts.Ready + catchupCounts.Started + catchupCounts.Ended + catchupCounts.CarConditions;

                _logger.LogInformation("✅ Catch-up completed: Ready={Ready}, Started={Started}, Ended={Ended}, CarConditions={CarConditions} | Duration={Duration}ms - User: ravanmu-coder",
                    catchupCounts.Ready, catchupCounts.Started, catchupCounts.Ended, catchupCounts.CarConditions, sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Catch-up process failed - User: ravanmu-coder");
            }
        }
    }
}