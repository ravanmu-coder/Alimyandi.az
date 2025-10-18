using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Infrastructure.Hubs;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AutoriaFinal.Infrastructure.Services.Background
{
    public class AuctionTimerBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<AuctionHub> _auctionHubContext;
        private readonly ILogger<AuctionTimerBackgroundService> _logger;

        public AuctionTimerBackgroundService(
            IServiceProvider serviceProvider,
            IHubContext<AuctionHub> auctionHubContext,
            ILogger<AuctionTimerBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _auctionHubContext = auctionHubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("✅ Auction Timer Background Service Started.");
            await Task.Delay(5000, stoppingToken); // Tətbiqin tam başlamasını gözlə

            while (!stoppingToken.IsCancellationRequested)
            {
                // Hər dövrdə yeni bir 'scope' yaradırıq ki, servislər düzgün işləsin
                using (var scope = _serviceProvider.CreateScope())
                {
                    var auctionService = scope.ServiceProvider.GetRequiredService<IAuctionService>();
                    try
                    {
                        var liveAuctions = await auctionService.GetLiveAuctionsAsync();

                        if (!liveAuctions.Any())
                        {
                            await Task.Delay(5000, stoppingToken);
                            continue;
                        }

                        foreach (var auction in liveAuctions)
                        {
                            var timerInfo = await auctionService.GetAuctionTimerInfoAsync(auction.Id);

                            // ✅ COPART LOGIC: Send timer tick to ALL users in auction group
                            await _auctionHubContext.Clients
                                .Group($"auction-{auction.Id}")
                                .SendAsync("TimerTick", new {
                                    auctionId = timerInfo.AuctionId,
                                    remainingSeconds = timerInfo.RemainingSeconds,
                                    timerSeconds = timerInfo.TimerSeconds,
                                    currentCarLotNumber = timerInfo.CurrentCarLotNumber,
                                    isExpired = timerInfo.IsExpired,
                                    isLive = timerInfo.IsLive,
                                    timeDisplay = timerInfo.TimeDisplay,
                                    lastBidTime = timerInfo.LastBidTime
                                }, stoppingToken);

                            // ✅ Enhanced logging for debugging
                            if (timerInfo.RemainingSeconds % 10 == 0 || timerInfo.RemainingSeconds <= 10)
                            {
                                _logger.LogInformation("⏰ Timer Tick: Auction {Id}, Lot {Lot}, Remaining: {Seconds}s, Live: {IsLive}, Group: auction-{AuctionId}",
                                    auction.Id, timerInfo.CurrentCarLotNumber, timerInfo.RemainingSeconds, timerInfo.IsLive, auction.Id);
                            }
                            else
                            {
                                _logger.LogTrace("Timer Tick: Auction {Id}, Remaining: {Seconds}s, Live: {IsLive}",
                                    auction.Id, timerInfo.RemainingSeconds, timerInfo.IsLive);
                            }

                            // ⚠️ KRİTİK DƏYİŞİKLİK: Taymer bitibsə, server avtomatik hərəkətə keçir
                            if (timerInfo.IsExpired && !string.IsNullOrEmpty(timerInfo.CurrentCarLotNumber))
                            {
                                _logger.LogInformation(
                                    "⏰ TIMER EXPIRED for Auction {AuctionId}, Lot {Lot}. Triggering auto-move to next car...",
                                    auction.Id, timerInfo.CurrentCarLotNumber);

                                try
                                {
                                    // Bu metod həm cari maşının qalibini təyin edəcək, həm də növbəti maşına keçəcək
                                    await auctionService.MoveToNextCarAsync(auction.Id);

                                    _logger.LogInformation(
                                        "✅ Successfully moved to the next car for Auction {AuctionId}.", auction.Id);
                                }
                                catch (Exception moveEx)
                                {
                                    _logger.LogError(moveEx,
                                        "❌ Failed to automatically move to the next car for Auction {AuctionId}", auction.Id);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ An error occurred in the auction timer background service loop.");
                    }
                }

                // Hər saniyədə bir dəfə işləməsini təmin edirik
                await Task.Delay(1000, stoppingToken);
            }

            _logger.LogInformation("⏹️ Auction Timer Background Service Stopped.");
        }
    }
}