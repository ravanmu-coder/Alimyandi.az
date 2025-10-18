using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Enums.Bids;
using AutoriaFinal.Contract.Services.Auctions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace AutoriaFinal.Infrastructure.Hubs
{
    public class BidHub : Hub
    {
        private readonly ILogger<BidHub> _logger;
        private readonly IBidService _bidService;
        private const string AuctionCarGroupPrefix = "AuctionCar-";
        private const string UserGroupPrefix = "User-";
        private const int BidTimer = 10;

        public BidHub(ILogger<BidHub> logger, IBidService bidService)
        {
            _logger = logger;
            _bidService = bidService;
        }

        public async Task JoinAuctionCar(Guid auctionCarId)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("Error", "Authentication required");
                return;
            }

            var groupName = $"{AuctionCarGroupPrefix}{auctionCarId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Groups.AddToGroupAsync(Context.ConnectionId, $"{UserGroupPrefix}{userId}");

            // ✅ Get complete snapshot: bids, stats, minimum bid
            var highestBid = await _bidService.GetHighestBidAsync(auctionCarId);
            var recentBids = await _bidService.GetRecentBidsAsync(auctionCarId, 20);
            var stats = await _bidService.GetBidStatsAsync(auctionCarId);
            var lastBidTime = await _bidService.GetLastBidTimeAsync(auctionCarId);
            var minimumBid = await _bidService.GetMinimumBidAmountAsync(auctionCarId);

            await Clients.Caller.SendAsync("JoinedAuctionCar", new
            {
                AuctionCarId = auctionCarId,
                GroupName = groupName,
                HighestBid = highestBid,
                RecentBids = recentBids,
                BidHistory = recentBids, // Alias for compatibility
                Stats = stats,
                LastBidTime = lastBidTime,
                MinimumBid = minimumBid,
                JoinedAt = DateTime.UtcNow,
                Message = "Successfully joined auction car - complete snapshot loaded"
            });

            _logger.LogInformation("✅ User {UserId} joined AuctionCar {AuctionCarId} group: {GroupName}, HighestBid: ${HighestBid}, RecentBids: {BidCount}, MinBid: ${MinBid}", 
                userId, auctionCarId, groupName, highestBid?.Amount ?? 0, recentBids?.Count() ?? 0, minimumBid);
        }

        public async Task LeaveAuctionCar(Guid auctionCarId)
        {
            var userId = GetCurrentUserId();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"{AuctionCarGroupPrefix}{auctionCarId}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"{UserGroupPrefix}{userId}");
            await Clients.Caller.SendAsync("LeftAuctionCar", auctionCarId);
            _logger.LogInformation("User {UserId} left AuctionCar {AuctionCarId} group", userId, auctionCarId);
        }

        public async Task PlacePreBid(Guid auctionCarId, decimal amount)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("BidError", "Authentication required");
                return;
            }

            var dto = new BidCreateDto
            {
                AuctionCarId = auctionCarId,
                UserId = userId,
                Amount = amount,
                BidType = BidTypeDto.PreBid,
                IsPreBid = true,
                IPAddress = GetClientIPAddress(),
                UserAgent = GetClientUserAgent()
            };

            var validation = await _bidService.ValidateBidAsync(dto);
            if (!validation.IsValid)
            {
                await Clients.Caller.SendAsync("BidValidationError", new
                {
                    Errors = validation.Errors,
                    MinimumBid = validation.MinimumBidAmount,
                    SuggestedAmount = validation.SuggestedBidAmount
                });
                return;
            }

            // ✅ BidService artıq PreBidPlaced event göndərir
            // Dublikat göndərməməliyik
            var result = await _bidService.PlaceBidAsync(dto);

            // ✅ Yalnız caller-ə uğur mesajı göndər
            await Clients.Caller.SendAsync("PreBidSuccess", result);
            _logger.LogInformation("Pre-bid placed via BidHub: User {UserId}, Amount {Amount}", userId, amount);
        }

        public async Task PlaceLiveBid(Guid auctionCarId, decimal amount)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("BidError", "Authentication required");
                return;
            }

            var dto = new BidCreateDto
            {
                AuctionCarId = auctionCarId,
                UserId = userId,
                Amount = amount,
                BidType = BidTypeDto.Regular,
                IsPreBid = false,
                IPAddress = GetClientIPAddress(),
                UserAgent = GetClientUserAgent()
            };

            var validation = await _bidService.ValidateBidAsync(dto);
            if (!validation.IsValid)
            {
                await Clients.Caller.SendAsync("BidValidationError", new
                {
                    Errors = validation.Errors,
                    MinimumBid = validation.MinimumBidAmount,
                    SuggestedAmount = validation.SuggestedBidAmount
                });
                return;
            }

            // ✅ BidService artıq bütün real-time event-ləri göndərir (NewLiveBid, HighestBidUpdated, AuctionTimerReset)
            // Dublikat event göndərməməliyik - BidService handle edir
            var result = await _bidService.PlaceBidAsync(dto);

            // ✅ Yalnız caller-ə uğur mesajı göndər
            await Clients.Caller.SendAsync("LiveBidSuccess", result);
            _logger.LogInformation("Live bid placed via BidHub: User {UserId}, Amount {Amount}, Highest: {IsHighest}",
                userId, amount, result.IsHighestBid);
        }

        public async Task PlaceProxyBid(Guid auctionCarId, decimal startAmount, decimal maxAmount)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("BidError", "Authentication required");
                return;
            }

            var proxyDto = new ProxyBidDto
            {
                AuctionCarId = auctionCarId,
                UserId = userId,
                StartAmount = startAmount,
                MaxAmount = maxAmount,
                IsPreBid = false
            };

            var result = await _bidService.PlaceProxyBidAsync(proxyDto);

            await Clients.Caller.SendAsync("ProxyBidSuccess", new
            {
                result.Id,
                result.Amount,
                result.ProxyMax,
                result.ValidUntil,
                Message = $"Proxy bid active: ${startAmount} - ${maxAmount}"
            });

            await Clients.Group($"{AuctionCarGroupPrefix}{auctionCarId}").SendAsync("ProxyBidderJoined", new
            {
                AuctionCarId = auctionCarId,
                UserId = userId,
                StartAmount = startAmount
            });

            _logger.LogInformation("Proxy bid placed: User {UserId}, Start {Start}, Max {Max}",
                userId, startAmount, maxAmount);
        }

        public async Task CancelProxyBid(Guid bidId)
        {
            var userId = GetCurrentUserId();
            var success = await _bidService.CancelProxyBidAsync(bidId, userId);

            if (success)
            {
                await Clients.Caller.SendAsync("ProxyBidCancelled", bidId);
                _logger.LogInformation("Proxy bid cancelled: {BidId} by user {UserId}", bidId, userId);
            }
            else
            {
                await Clients.Caller.SendAsync("BidError", "Failed to cancel proxy bid");
            }
        }

        public async Task GetAuctionStats(Guid auctionCarId)
        {
            var stats = await _bidService.GetBidStatsAsync(auctionCarId);
            var recentBids = await _bidService.GetRecentBidsAsync(auctionCarId, 10);

            await Clients.Caller.SendAsync("AuctionStatsResponse", new
            {
                Stats = stats,
                RecentBids = recentBids,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task GetMyBids(Guid auctionCarId)
        {
            var userId = GetCurrentUserId();
            var userProxyBids = await _bidService.GetUserActiveProxyBidsAsync(userId, auctionCarId);

            await Clients.Caller.SendAsync("MyBidsResponse", new
            {
                ProxyBids = userProxyBids,
                Timestamp = DateTime.UtcNow
            });
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Client connected: {ConnectionId}, User: {UserId}", Context.ConnectionId, userId);

            await Clients.Caller.SendAsync("Connected", new
            {
                ConnectionId = Context.ConnectionId,
                UserId = userId,
                ServerTime = DateTime.UtcNow,
                Message = "Connected to Bid Hub"
            });

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Client disconnected: {ConnectionId}, User: {UserId}, Reason: {Reason}",
                Context.ConnectionId, userId, exception?.Message ?? "Normal disconnect");
            await base.OnDisconnectedAsync(exception);
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        private string GetClientIPAddress()
        {
            return Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "";
        }

        private string GetClientUserAgent()
        {
            return Context.GetHttpContext()?.Request.Headers.UserAgent.FirstOrDefault() ?? "";
        }
    }
}
