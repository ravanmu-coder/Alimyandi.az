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
    public class AuctionHub : Hub
    {
        private readonly ILogger<AuctionHub> _logger;
        private readonly IAuctionService _auctionService;
        private const string AuctionGroupPrefix = "auction-";
        private const string UserGroupPrefix = "user-";
        public AuctionHub(ILogger<AuctionHub> logger, IAuctionService auctionService)
        {
            _logger = logger;
            _auctionService = auctionService;
        }

        public async Task JoinAuction(Guid auctionId)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("Error", "Authentication required");
                return;
            }

            var groupName = $"auction-{auctionId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // ✅ Get current auction state and timer to send to client
            var auctionState = await _auctionService.GetAuctionCurrentStateAsync(auctionId);
            var timerInfo = await _auctionService.GetAuctionTimerInfoAsync(auctionId);

            await Clients.Caller.SendAsync("JoinedAuction", new
            {
                AuctionId = auctionId,
                UserId = userId,
                GroupName = groupName,
                CurrentTimer = timerInfo,
                AuctionState = auctionState,
                IsLive = auctionState.IsLive,
                CurrentCarLotNumber = auctionState.CurrentCarLotNumber,
                JoinedAt = DateTime.UtcNow,
                Message = "Successfully joined auction - timer and state synced"
            });

            _logger.LogInformation("✅ User {UserId} joined auction {AuctionId} group: {GroupName}, Timer: {RemainingSeconds}s, IsLive: {IsLive}, CurrentLot: {CurrentLot}", 
                userId, auctionId, groupName, timerInfo.RemainingSeconds, auctionState.IsLive, auctionState.CurrentCarLotNumber);
        }

        public async Task LeaveAuction(Guid auctionId)
        {
            var userId = GetCurrentUserId();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction-{auctionId}");

            // ✅ FİX: PascalCase method name  
            await Clients.Caller.SendAsync("LeftAuction", new
            {
                AuctionId = auctionId,
                UserId = userId,
                LeftAt = DateTime.UtcNow
            });

            _logger.LogInformation("User {UserId} left auction {AuctionId} group", userId, auctionId);
        }

        // ✅ YENİ: Ping method əlavə et
        public async Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", new
            {
                ServerTime = DateTime.UtcNow,
                ConnectionId = Context.ConnectionId
            });
        }
        public async Task GetAuctionStatus(Guid auctionId)
        {
            // İndi serverdən əsl statusu çəkirik və caller-a göndəririk
            try
            {
                var statusDto = await _auctionService.GetAuctionCurrentStateAsync(auctionId);
                await Clients.Caller.SendAsync("AuctionStatusResponse", statusDto);
                _logger.LogInformation("Auction status requested by connection {ConnectionId} for auction {AuctionId}",
                    Context.ConnectionId, auctionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get auction status for {AuctionId}", auctionId);
                await Clients.Caller.SendAsync("Error", "Failed to retrieve auction status");
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("User connected: {ConnectionId}, UserId: {UserId}", Context.ConnectionId, userId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Client disconnected: {ConnectionId}, UserId: {UserId}, Reason: {Reason}",
                Context.ConnectionId, userId, exception?.Message ?? "No reason");
            await base.OnDisconnectedAsync(exception);
        }
        private Guid GetCurrentUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}
