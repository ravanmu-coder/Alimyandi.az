using AutoriaFinal.Contract.Services.Auctions;
using Microsoft.AspNetCore.Authorization;
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
    [Authorize]
    public class WinnerHub : Hub
    {
        private readonly ILogger<WinnerHub> _logger;
        private readonly IAuctionWinnerService _auctionWinnerService;

        // Group prefixes for organized real-time communications
        private const string WinnerGroupPrefix = "winner-";
        private const string SellerGroupPrefix = "seller-";
        private const string AdminGroup = "admin-notifications";
        private const string PaymentGroup = "payment-alerts";
        private const string AuctionWinnerGroupPrefix = "auction-winner-";
        private const string PaymentUpdatesPrefix = "payment-updates-";

        public WinnerHub(ILogger<WinnerHub> logger, IAuctionWinnerService auctionWinnerService)
        {
            _logger = logger;
            _auctionWinnerService = auctionWinnerService;
        }

        #region Connection Management

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();
            var userRole = GetCurrentUserRole();

            _logger.LogInformation("🔗 Winner Hub - User connected: {ConnectionId}, User: {UserId} ({UserName}), Role: {Role}",
                Context.ConnectionId, userId, userName, userRole);

            // Automatically join user to their personal winner group
            if (userId != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"{WinnerGroupPrefix}{userId}");

                // Auto-join admin users to admin notifications
                if (userRole.Contains("Admin"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
                }

                // Auto-join payment managers to payment group
                if (userRole.Contains("PaymentManager") || userRole.Contains("Admin"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, PaymentGroup);
                }
            }

            // Send welcome message with connection info
            await Clients.Caller.SendAsync("WinnerHubConnected", new
            {
                ConnectionId = Context.ConnectionId,
                UserId = userId,
                UserName = userName,
                Role = userRole,
                ServerTime = DateTime.UtcNow,
                Message = "🎯 Connected to Copart Winner Hub - Real-time notifications enabled",
                Features = new[] { "WinnerNotifications", "PaymentAlerts", "StatusUpdates", "AdminActions" }
            });

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("🔌 Winner Hub - User disconnected: {ConnectionId}, User: {UserId} ({UserName}), Reason: {Reason}",
                Context.ConnectionId, userId, userName, exception?.Message ?? "Normal disconnect");

            await base.OnDisconnectedAsync(exception);
        }

        #endregion

        #region Group Management

        /// Join as winner to receive winner-specific notifications
        public async Task JoinAsWinner()
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "Authentication",
                    Message = "Authentication required to join winner notifications"
                });
                return;
            }

            var groupName = $"{WinnerGroupPrefix}{userId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // Get user's active winners count
            var userWinners = await _auctionWinnerService.GetUserWinnersAsync(userId);
            var activeWinners = userWinners.Count(w => w.PaymentStatus is "Pending" or "PartiallyPaid");

            await Clients.Caller.SendAsync("JoinedAsWinner", new
            {
                UserId = userId,
                GroupName = groupName,
                ActiveWinnersCount = activeWinners,
                JoinedAt = DateTime.UtcNow,
                Message = $"🏆 Joined winner notifications - {activeWinners} active wins"
            });

            _logger.LogInformation("👤 User {UserId} joined as winner group with {ActiveWinners} active wins",
                userId, activeWinners);
        }

        /// Join as seller to receive seller-specific notifications
        public async Task JoinAsSeller(Guid sellerId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == Guid.Empty)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "Authentication",
                    Message = "Authentication required"
                });
                return;
            }

            var groupName = $"{SellerGroupPrefix}{sellerId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // Get pending confirmations count
            var pendingConfirmations = await _auctionWinnerService.GetPendingConfirmationsBySellerAsync(sellerId);

            await Clients.Caller.SendAsync("JoinedAsSeller", new
            {
                SellerId = sellerId,
                UserId = currentUserId,
                GroupName = groupName,
                PendingConfirmationsCount = pendingConfirmations.Count(),
                JoinedAt = DateTime.UtcNow,
                Message = $"🏪 Joined seller notifications - {pendingConfirmations.Count()} pending confirmations"
            });

            _logger.LogInformation("🏪 User {UserId} joined as seller {SellerId} group with {PendingCount} pending confirmations",
                currentUserId, sellerId, pendingConfirmations.Count());
        }

        /// Join admin notifications (Admin role required)
        [Authorize(Roles = "Admin")]
        public async Task JoinAdminNotifications()
        {
            var userId = GetCurrentUserId();

            await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);

            // Get system statistics
            var overduePayments = await _auctionWinnerService.GetOverduePaymentsAsync();
            var candidates = await _auctionWinnerService.GetCandidatesForReAuctionAsync();

            await Clients.Caller.SendAsync("JoinedAdminNotifications", new
            {
                UserId = userId,
                GroupName = AdminGroup,
                OverduePaymentsCount = overduePayments.Count(),
                ReAuctionCandidatesCount = candidates.Count(),
                JoinedAt = DateTime.UtcNow,
                Message = $"⚡ Joined admin notifications - System overview available"
            });

            _logger.LogInformation("👑 Admin user {UserId} joined admin notifications with system overview", userId);
        }

        /// Join payment notifications (PaymentManager or Admin role required)
        [Authorize(Roles = "Admin,PaymentManager")]
        public async Task JoinPaymentNotifications()
        {
            var userId = GetCurrentUserId();

            await Groups.AddToGroupAsync(Context.ConnectionId, PaymentGroup);

            // Get payment statistics
            var overdueCount = (await _auctionWinnerService.GetOverduePaymentsAsync()).Count();
            var partiallyPaidCount = (await _auctionWinnerService.GetPartiallyPaidWinnersAsync()).Count();
            var collectionRate = await _auctionWinnerService.GetOverallCollectionRateAsync();

            await Clients.Caller.SendAsync("JoinedPaymentNotifications", new
            {
                UserId = userId,
                GroupName = PaymentGroup,
                OverdueCount = overdueCount,
                PartiallyPaidCount = partiallyPaidCount,
                CollectionRate = collectionRate,
                JoinedAt = DateTime.UtcNow,
                Message = $"💳 Joined payment notifications - Collection rate: {collectionRate:F1}%"
            });

            _logger.LogInformation("💳 Payment team user {UserId} joined payment notifications", userId);
        }

        /// Subscribe to specific auction car winner notifications
        public async Task SubscribeToAuctionCarWinner(Guid auctionCarId)
        {
            var userId = GetCurrentUserId();
            var groupName = $"{AuctionWinnerGroupPrefix}{auctionCarId}";

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // Check if there's already a winner for this car
            var existingWinner = await _auctionWinnerService.GetWinnerByAuctionCarIdAsync(auctionCarId);

            await Clients.Caller.SendAsync("SubscribedToAuctionCarWinner", new
            {
                AuctionCarId = auctionCarId,
                UserId = userId,
                GroupName = groupName,
                HasWinner = existingWinner != null,
                WinnerInfo = existingWinner != null ? new
                {
                    WinnerId = existingWinner.Id,
                    Amount = existingWinner.Amount,
                    PaymentStatus = existingWinner.PaymentStatus
                } : null,
                SubscribedAt = DateTime.UtcNow
            });

            _logger.LogInformation("🎯 User {UserId} subscribed to auction car {AuctionCarId} winner notifications",
                userId, auctionCarId);
        }

        #endregion

        #region Winner Interactions

        /// Acknowledge a winner notification
        public async Task AcknowledgeWinnerNotification(Guid winnerId, string notificationType)
        {
            var userId = GetCurrentUserId();

            await Clients.Caller.SendAsync("WinnerNotificationAcknowledged", new
            {
                WinnerId = winnerId,
                NotificationType = notificationType,
                AcknowledgedAt = DateTime.UtcNow,
                UserId = userId,
                Message = "Notification acknowledged"
            });

            _logger.LogInformation("✅ Winner notification acknowledged: {WinnerId} by {UserId}, Type: {Type}",
                winnerId, userId, notificationType);
        }

        /// Request payment extension from winner
        public async Task RequestPaymentExtension(Guid winnerId, int additionalDays, string reason)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            if (additionalDays <= 0 || additionalDays > 30)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "ValidationError",
                    Message = "Additional days must be between 1 and 30"
                });
                return;
            }

            // Validate that user owns this winner
            var winner = await _auctionWinnerService.GetWinnerByIdAsync(winnerId);
            if (winner == null || winner.UserId != userId)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "Unauthorized",
                    Message = "You can only request extension for your own wins"
                });
                return;
            }

            var requestId = Guid.NewGuid();

            // Send to admin and payment teams
            await Clients.Groups(AdminGroup, PaymentGroup).SendAsync("PaymentExtensionRequested", new
            {
                RequestId = requestId,
                WinnerId = winnerId,
                RequestedBy = userId,
                RequestedByName = userName,
                AdditionalDays = additionalDays,
                Reason = reason,
                CurrentDueDate = winner.PaymentDueDate,
                WinnerAmount = winner.Amount,
                RemainingAmount = winner.RemainingAmount,
                RequestedAt = DateTime.UtcNow,
                Priority = winner.IsOverdue ? "High" : "Normal"
            });

            await Clients.Caller.SendAsync("PaymentExtensionRequestSent", new
            {
                RequestId = requestId,
                WinnerId = winnerId,
                AdditionalDays = additionalDays,
                Reason = reason,
                Status = "Pending",
                SentAt = DateTime.UtcNow,
                Message = "Extension request sent to payment team"
            });

            _logger.LogInformation("📅 Payment extension requested: Winner {WinnerId} by {UserId}, Days: {Days}, Reason: {Reason}",
                winnerId, userId, additionalDays, reason);
        }

        /// Create support ticket for winner
        public async Task CreateSupportTicket(Guid winnerId, string subject, string message, string priority = "Normal")
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();
            var ticketId = Guid.NewGuid();

            if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(message))
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "ValidationError",
                    Message = "Subject and message are required"
                });
                return;
            }

            // Validate that user owns this winner
            var winner = await _auctionWinnerService.GetWinnerByIdAsync(winnerId);
            if (winner == null || winner.UserId != userId)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "Unauthorized",
                    Message = "You can only create tickets for your own wins"
                });
                return;
            }

            // Send to admin team
            await Clients.Group(AdminGroup).SendAsync("SupportTicketCreated", new
            {
                TicketId = ticketId,
                WinnerId = winnerId,
                CreatedBy = userId,
                CreatedByName = userName,
                Subject = subject,
                Message = message,
                Priority = priority,
                WinnerInfo = new
                {
                    LotNumber = winner.AuctionCarLotNumber,
                    Amount = winner.Amount,
                    PaymentStatus = winner.PaymentStatus,
                    IsOverdue = winner.IsOverdue
                },
                CreatedAt = DateTime.UtcNow,
                Status = "Open"
            });

            await Clients.Caller.SendAsync("SupportTicketCreated", new
            {
                TicketId = ticketId,
                Subject = subject,
                Status = "Open",
                Priority = priority,
                CreatedAt = DateTime.UtcNow,
                Message = "Support ticket created successfully"
            });

            _logger.LogInformation("🎫 Support ticket created: {TicketId} by {UserId} for winner {WinnerId}, Priority: {Priority}",
                ticketId, userId, winnerId, priority);
        }

        /// Get real-time winner status
        public async Task GetWinnerRealTimeStatus(Guid winnerId)
        {
            var userId = GetCurrentUserId();

            var winner = await _auctionWinnerService.GetWinnerByIdAsync(winnerId);
            if (winner == null)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "NotFound",
                    Message = "Winner not found"
                });
                return;
            }

            await Clients.Caller.SendAsync("WinnerRealTimeStatus", new
            {
                WinnerId = winnerId,
                PaymentStatus = winner.PaymentStatus,
                Amount = winner.Amount,
                PaidAmount = winner.PaidAmount,
                RemainingAmount = winner.RemainingAmount,
                PaymentProgress = winner.PaymentProgress,
                IsOverdue = winner.IsOverdue,
                DaysOverdue = winner.DaysOverdue,
                PaymentDueDate = winner.PaymentDueDate,
                LastUpdated = winner.UpdatedAt,
                RequestedBy = userId,
                RequestedAt = DateTime.UtcNow
            });

            _logger.LogInformation("📊 Winner real-time status requested: {WinnerId} by {UserId}", winnerId, userId);
        }

        /// Subscribe to payment updates for specific winner
        public async Task SubscribeToPaymentUpdates(Guid winnerId)
        {
            var userId = GetCurrentUserId();
            var groupName = $"{PaymentUpdatesPrefix}{winnerId}";

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            await Clients.Caller.SendAsync("SubscribedToPaymentUpdates", new
            {
                WinnerId = winnerId,
                GroupName = groupName,
                SubscribedAt = DateTime.UtcNow,
                Message = "Subscribed to real-time payment updates"
            });

            _logger.LogInformation("💳 User {UserId} subscribed to payment updates for winner {WinnerId}",
                userId, winnerId);
        }

        #endregion

        #region Seller Interactions

        /// Confirm winner by seller (will be processed via service)
        public async Task ConfirmWinnerBySeller(Guid winnerId, string? confirmationNotes)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            await Clients.Caller.SendAsync("SellerWinnerConfirmationSent", new
            {
                WinnerId = winnerId,
                ConfirmedBy = userId,
                ConfirmedByName = userName,
                Notes = confirmationNotes,
                ConfirmedAt = DateTime.UtcNow,
                Status = "Pending",
                Message = "Winner confirmation request sent"
            });

            _logger.LogInformation("✅ Seller winner confirmation sent: Winner {WinnerId} by seller {UserId}",
                winnerId, userId);
        }

        /// Reject winner by seller (will be processed via service)
        public async Task RejectWinnerBySeller(Guid winnerId, string rejectionReason)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            if (string.IsNullOrWhiteSpace(rejectionReason))
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    Type = "ValidationError",
                    Message = "Rejection reason is required"
                });
                return;
            }

            await Clients.Caller.SendAsync("SellerWinnerRejectionSent", new
            {
                WinnerId = winnerId,
                RejectedBy = userId,
                RejectedByName = userName,
                Reason = rejectionReason,
                RejectedAt = DateTime.UtcNow,
                Status = "Pending",
                Message = "Winner rejection request sent"
            });

            _logger.LogInformation("❌ Seller winner rejection sent: Winner {WinnerId} by seller {UserId}, Reason: {Reason}",
                winnerId, userId, rejectionReason);
        }

        #endregion

        #region Admin Operations

        /// Broadcast system-wide announcement (Admin only)
        [Authorize(Roles = "Admin")]
        public async Task BroadcastSystemAnnouncement(string message, string type = "Info", int durationSeconds = 10)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            await Clients.All.SendAsync("SystemAnnouncement", new
            {
                Message = message,
                Type = type, // Info, Warning, Success, Danger
                DurationSeconds = durationSeconds,
                AnnouncedBy = userName,
                AnnouncedAt = DateTime.UtcNow,
                Icon = type switch
                {
                    "Warning" => "fas fa-exclamation-triangle",
                    "Success" => "fas fa-check-circle",
                    "Danger" => "fas fa-exclamation-circle",
                    _ => "fas fa-info-circle"
                }
            });

            _logger.LogInformation("📢 System announcement broadcasted by {AdminId}: {Message} (Type: {Type})",
                userId, message, type);
        }

        /// Send bulk payment reminder notification (Admin/PaymentManager only)
        [Authorize(Roles = "Admin,PaymentManager")]
        public async Task InitiateBulkPaymentReminders(int daysBefore = 2)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            // Notify payment group about bulk reminder initiation
            await Clients.Group(PaymentGroup).SendAsync("BulkRemindersInitiated", new
            {
                InitiatedBy = userId,
                InitiatedByName = userName,
                DaysBefore = daysBefore,
                InitiatedAt = DateTime.UtcNow,
                Status = "Processing",
                Message = $"Bulk payment reminders initiated for {daysBefore} days before due date"
            });

            _logger.LogInformation("📧 Bulk payment reminders initiated by {UserId} for {DaysBefore} days before",
                userId, daysBefore);
        }

        #endregion

        #region Helper Methods

        private Guid GetCurrentUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        private string GetCurrentUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
        }

        private string GetCurrentUserRole()
        {
            return Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        }

        #endregion
    }

    #region Hub Extension Methods for Service Integration

    public static class WinnerHubExtensions
    {

        /// Send winner assigned notification to all relevant groups
        public static async Task NotifyWinnerAssigned(this IHubContext<WinnerHub> hubContext,
            Guid winnerId, Guid auctionCarId, Guid userId, string userName, decimal amount, string lotNumber)
        {
            // Notify winner
            await hubContext.Clients.Group($"winner-{userId}")
                .SendAsync("WinnerAssigned", new
                {
                    WinnerId = winnerId,
                    AuctionCarId = auctionCarId,
                    Amount = amount,
                    LotNumber = lotNumber,
                    AssignedAt = DateTime.UtcNow,
                    Message = $"🏆 Congratulations! You won Lot #{lotNumber} for ${amount:N2}!"
                });

            // Notify auction car subscribers
            await hubContext.Clients.Group($"auction-winner-{auctionCarId}")
                .SendAsync("AuctionWinnerAnnounced", new
                {
                    AuctionCarId = auctionCarId,
                    WinnerId = winnerId,
                    WinnerUserId = userId,
                    WinnerName = userName,
                    Amount = amount,
                    LotNumber = lotNumber,
                    AnnouncedAt = DateTime.UtcNow
                });

            // Notify admin group
            await hubContext.Clients.Group("admin-notifications")
                .SendAsync("NewWinnerAssigned", new
                {
                    WinnerId = winnerId,
                    AuctionCarId = auctionCarId,
                    WinnerUserId = userId,
                    WinnerName = userName,
                    Amount = amount,
                    LotNumber = lotNumber,
                    AssignedAt = DateTime.UtcNow
                });
        }

        /// Send payment received notification
        public static async Task NotifyPaymentReceived(this IHubContext<WinnerHub> hubContext,
            Guid winnerId, Guid userId, decimal amount, decimal totalPaid, decimal totalAmount, bool isFullyPaid)
        {
            var paymentType = isFullyPaid ? "Full Payment" : "Partial Payment";

            await hubContext.Clients.Group($"winner-{userId}")
                .SendAsync("PaymentReceived", new
                {
                    WinnerId = winnerId,
                    Amount = amount,
                    TotalPaid = totalPaid,
                    TotalAmount = totalAmount,
                    RemainingAmount = totalAmount - totalPaid,
                    IsFullyPaid = isFullyPaid,
                    PaymentType = paymentType,
                    ReceivedAt = DateTime.UtcNow,
                    Message = $"💰 {paymentType} received: ${amount:N2}"
                });

            await hubContext.Clients.Group("payment-alerts")
                .SendAsync("PaymentProcessed", new
                {
                    WinnerId = winnerId,
                    Amount = amount,
                    PaymentType = paymentType,
                    WinnerUserId = userId,
                    IsFullyPaid = isFullyPaid,
                    ProcessedAt = DateTime.UtcNow
                });

            // Send to payment updates subscribers
            await hubContext.Clients.Group($"payment-updates-{winnerId}")
                .SendAsync("PaymentUpdated", new
                {
                    WinnerId = winnerId,
                    Amount = amount,
                    TotalPaid = totalPaid,
                    TotalAmount = totalAmount,
                    IsFullyPaid = isFullyPaid,
                    UpdatedAt = DateTime.UtcNow
                });
        }

        /// Send winner status changed notification

        public static async Task NotifyWinnerStatusChanged(this IHubContext<WinnerHub> hubContext,
            Guid winnerId, Guid userId, string oldStatus, string newStatus, string? reason = null)
        {
            await hubContext.Clients.Group($"winner-{userId}")
                .SendAsync("WinnerStatusChanged", new
                {
                    WinnerId = winnerId,
                    OldStatus = oldStatus,
                    NewStatus = newStatus,
                    Reason = reason,
                    ChangedAt = DateTime.UtcNow,
                    Message = $"Status changed from {oldStatus} to {newStatus}"
                });

            await hubContext.Clients.Group($"payment-updates-{winnerId}")
                .SendAsync("StatusChanged", new
                {
                    WinnerId = winnerId,
                    OldStatus = oldStatus,
                    NewStatus = newStatus,
                    Reason = reason,
                    ChangedAt = DateTime.UtcNow
                });
        }
    }

    #endregion
}
