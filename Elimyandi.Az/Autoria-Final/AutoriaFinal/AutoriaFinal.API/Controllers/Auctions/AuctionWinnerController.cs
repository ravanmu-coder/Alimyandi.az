using AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using AutoriaFinal.Infrastructure.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace AutoriaFinal.API.Controllers.Auctions
{
    [Route("api/auction-winners")]
    [ApiController]
    [Authorize]
    public class AuctionWinnerController : ControllerBase
    {
        private readonly IAuctionWinnerService _auctionWinnerService;
        private readonly IHubContext<WinnerHub> _winnerHubContext;
        private readonly ILogger<AuctionWinnerController> _logger;

        public AuctionWinnerController(
            IAuctionWinnerService auctionWinnerService,
            IHubContext<WinnerHub> winnerHubContext,
            ILogger<AuctionWinnerController> logger)
        {
            _auctionWinnerService = auctionWinnerService;
            _winnerHubContext = winnerHubContext;
            _logger = logger;
        }

        #region Basic CRUD Operations

        [HttpGet]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<IEnumerable<AuctionWinnerGetDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetAllWinners(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? status = null)
        {
            _logger.LogInformation("🔍 Getting all winners - Page: {Page}, Size: {PageSize}, Status: {Status} by {User}",
                page, pageSize, status, GetCurrentUserName());

            var winners = await _auctionWinnerService.GetAllAsync();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<PaymentStatus>(status, out var paymentStatus))
            {
                winners = await _auctionWinnerService.GetWinnersByPaymentStatusAsync(paymentStatus);
            }

            var totalCount = winners.Count();
            var paginatedWinners = winners.Skip((page - 1) * pageSize).Take(pageSize);

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                Winners = paginatedWinners,
                Pagination = new
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            }, "Winners retrieved successfully"));
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetWinnerById(Guid id)
        {
            _logger.LogInformation("📋 Getting winner details: {WinnerId} by {User}", id, GetCurrentUserName());

            var winner = await _auctionWinnerService.GetWinnerByIdAsync(id);
            if (winner == null)
                return NotFound(CopartApiResponse<string>.Error("Winner not found", 404));

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(winner, "Winner details retrieved successfully"));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> CreateWinner([FromBody] AuctionWinnerCreateDto dto)
        {
            _logger.LogInformation("🏆 Creating winner manually: AuctionCar {AuctionCarId}, User {UserId} by {Admin}",
                dto.AuctionCarId, dto.UserId, GetCurrentUserName());

            if (!ModelState.IsValid)
                return BadRequest(CopartApiResponse<string>.Error("Invalid data provided", 400));

            var createdWinner = await _auctionWinnerService.AddAsync(dto);

            // Send real-time notifications
            await _winnerHubContext.NotifyWinnerAssigned(
                createdWinner.Id,
                createdWinner.AuctionCarId,
                createdWinner.UserId,
                createdWinner.UserName,
                createdWinner.Amount,
                createdWinner.AuctionCarLotNumber);

            _logger.LogInformation("✅ Winner created manually: {WinnerId} by {Admin}",
                createdWinner.Id, GetCurrentUserName());

            return CreatedAtAction(nameof(GetWinnerById), new { id = createdWinner.Id },
                CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(createdWinner, "Winner created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> UpdateWinner(Guid id, [FromBody] AuctionWinnerUpdateDto dto)
        {
            _logger.LogInformation("🔄 Updating winner: {WinnerId} by {User}, Reason: {Reason}",
                id, GetCurrentUserName(), dto.UpdateReason);

            if (!ModelState.IsValid)
                return BadRequest(CopartApiResponse<string>.Error("Invalid data provided", 400));

            var updatedWinner = await _auctionWinnerService.UpdateAsync(id, dto);

            // Send real-time status update
            await _winnerHubContext.NotifyWinnerStatusChanged(
                id, updatedWinner.UserId, "Updated", updatedWinner.PaymentStatus, dto.UpdateReason);

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(updatedWinner, "Winner updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> DeleteWinner(Guid id)
        {
            _logger.LogInformation("🗑️ Deleting winner: {WinnerId} by {Admin}", id, GetCurrentUserName());

            var success = await _auctionWinnerService.DeleteAsync(id);

            if (!success)
                return NotFound(CopartApiResponse<string>.Error("Winner not found", 404));

            return Ok(CopartApiResponse<string>.SuccessMessage("Winner deleted successfully"));
        }

        #endregion

        #region Winner Assignment - Copart Style

        [HttpPost("assign/{auctionCarId:guid}")]
        [Authorize(Roles = "Admin,System")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> AssignWinner(Guid auctionCarId)
        {
            _logger.LogInformation("🎯 Auto-assigning winner for AuctionCar: {AuctionCarId} by {User}",
                auctionCarId, GetCurrentUserName());

            var winner = await _auctionWinnerService.AssignWinnerAsync(auctionCarId);

            // Send real-time notifications like Copart
            await _winnerHubContext.NotifyWinnerAssigned(
                winner.Id,
                auctionCarId,
                winner.UserId,
                winner.UserName,
                winner.Amount,
                winner.AuctionCarLotNumber);

            _logger.LogInformation("🏆 Winner auto-assigned: {WinnerId} for car {AuctionCarId}",
                winner.Id, auctionCarId);

            return CreatedAtAction(nameof(GetWinnerById), new { id = winner.Id },
                CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(winner,
                    $"🎉 Congratulations! Winner assigned for Lot #{winner.AuctionCarLotNumber}"));
        }

        [HttpPost("assign-manual")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status201Created)]
        public async Task<ActionResult> AssignWinnerManually([FromBody] ManualAssignRequest request)
        {
            _logger.LogInformation("👤 Manual winner assignment by {Admin}: Car {AuctionCarId}, User {UserId}",
                GetCurrentUserName(), request.AuctionCarId, request.UserId);

            var winner = await _auctionWinnerService.AssignWinnerManuallyAsync(
                request.AuctionCarId, request.UserId, request.WinningBidId, request.Amount);

            // Send notifications
            await _winnerHubContext.NotifyWinnerAssigned(
                winner.Id,
                request.AuctionCarId,
                request.UserId,
                winner.UserName,
                request.Amount,
                winner.AuctionCarLotNumber);

            return CreatedAtAction(nameof(GetWinnerById), new { id = winner.Id },
                CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(winner, "Winner assigned manually by admin"));
        }

        [HttpPost("second-chance")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> AssignSecondChanceWinner([FromBody] SecondChanceRequest request)
        {
            _logger.LogInformation("🥈 Assigning second chance winner by {Admin}: Car {AuctionCarId}, Original {OriginalWinnerId}",
                GetCurrentUserName(), request.AuctionCarId, request.OriginalWinnerId);

            var secondChanceWinner = await _auctionWinnerService.AssignSecondChanceWinnerAsync(
                request.AuctionCarId, request.OriginalWinnerId);

            if (secondChanceWinner == null)
                return NotFound(CopartApiResponse<string>.Error("No second chance candidate found", 404));

            // Send special second chance notification
            await _winnerHubContext.Clients.Group($"winner-{secondChanceWinner.UserId}")
                .SendAsync("SecondChanceOffered", new
                {
                    WinnerId = secondChanceWinner.Id,
                    AuctionCarId = request.AuctionCarId,
                    LotNumber = secondChanceWinner.AuctionCarLotNumber,
                    Amount = secondChanceWinner.Amount,
                    OfferedAt = DateTime.UtcNow,
                    Message = $"🥈 Second Chance! You have been offered Lot #{secondChanceWinner.AuctionCarLotNumber} for ${secondChanceWinner.Amount:N2}"
                });

            return CreatedAtAction(nameof(GetWinnerById), new { id = secondChanceWinner.Id },
                CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(secondChanceWinner,
                    "🥈 Second chance winner assigned - buyer has been notified"));
        }

        #endregion

        #region Payment Processing - Copart Style

        [HttpPost("{id:guid}/payment")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentRequest request)
        {
            _logger.LogInformation("💳 Recording payment by {User}: Winner {WinnerId}, Amount ${Amount}",
                GetCurrentUserName(), id, request.Amount);

            var updatedWinner = await _auctionWinnerService.RecordPaymentAsync(
                id, request.Amount, request.PaymentReference, request.Notes);

            var isFullyPaid = updatedWinner.IsFullyPaid;
            var totalPaid = updatedWinner.PaidAmount ?? 0;

            // Send real-time payment notification like Copart
            await _winnerHubContext.NotifyPaymentReceived(
                id, updatedWinner.UserId, request.Amount, totalPaid, updatedWinner.Amount, isFullyPaid);

            var message = isFullyPaid
                ? $"🎉 Payment completed! Total: ${totalPaid:N2}"
                : $"💰 Partial payment recorded: ${request.Amount:N2} (Total: ${totalPaid:N2}/{updatedWinner.Amount:N2})";

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(updatedWinner, message));
        }

        [HttpPost("{id:guid}/extend-payment-due")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> ExtendPaymentDueDate(Guid id, [FromBody] ExtendPaymentRequest request)
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("📅 Extending payment due date by {User}: Winner {WinnerId}, Days +{Days}",
                GetCurrentUserName(), id, request.AdditionalDays);

            var updatedWinner = await _auctionWinnerService.ExtendPaymentDueDateAsync(
                id, request.AdditionalDays, request.Reason, currentUserId);

            // Notify winner about extension like Copart
            await _winnerHubContext.Clients.Group($"winner-{updatedWinner.UserId}")
                .SendAsync("PaymentDueDateExtended", new
                {
                    WinnerId = id,
                    AdditionalDays = request.AdditionalDays,
                    NewDueDate = updatedWinner.PaymentDueDate,
                    Reason = request.Reason,
                    ExtendedBy = GetCurrentUserName(),
                    ExtendedAt = DateTime.UtcNow,
                    Message = $"📅 Payment due date extended by {request.AdditionalDays} days. New due date: {updatedWinner.PaymentDueDate:MM/dd/yyyy}"
                });

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(updatedWinner,
                $"Payment due date extended by {request.AdditionalDays} days"));
        }

        [HttpGet("overdue")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetOverduePayments()
        {
            _logger.LogInformation("⚠️ Getting overdue payments by {User}", GetCurrentUserName());

            var overdueWinners = await _auctionWinnerService.GetOverduePaymentsAsync();
            var totalOverdueAmount = overdueWinners.Sum(w => w.RemainingAmount);

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                Winners = overdueWinners,
                Count = overdueWinners.Count(),
                TotalOverdueAmount = totalOverdueAmount,
                OverdueStats = new
                {
                    Under7Days = overdueWinners.Count(w => w.DaysUntilDue >= -7),
                    Under30Days = overdueWinners.Count(w => w.DaysUntilDue >= -30),
                    Over30Days = overdueWinners.Count(w => w.DaysUntilDue < -30)
                }
            }, $"⚠️ Found {overdueWinners.Count()} overdue payments totaling ${totalOverdueAmount:N2}"));
        }

        #endregion

        #region Seller Confirmation - Copart Style

        [HttpPost("{id:guid}/confirm")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> ConfirmWinner(Guid id, [FromBody] ConfirmWinnerRequest request)
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("✅ Confirming winner by seller: Winner {WinnerId}, Seller {SellerId}",
                id, currentUserId);

            var confirmedWinner = await _auctionWinnerService.ConfirmWinnerAsync(
                id, currentUserId, request.ConfirmationNotes);

            // Notify winner about confirmation like Copart
            await _winnerHubContext.Clients.Group($"winner-{confirmedWinner.UserId}")
                .SendAsync("WinnerConfirmed", new
                {
                    WinnerId = id,
                    ConfirmedBy = currentUserId,
                    ConfirmedByName = GetCurrentUserName(),
                    LotNumber = confirmedWinner.AuctionCarLotNumber,
                    Amount = confirmedWinner.Amount,
                    Notes = request.ConfirmationNotes,
                    ConfirmedAt = DateTime.UtcNow,
                    Message = $"🎉 Great news! Seller confirmed your winning bid for Lot #{confirmedWinner.AuctionCarLotNumber}"
                });

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(confirmedWinner,
                "✅ Winner confirmed by seller - buyer has been notified"));
        }

        [HttpPost("{id:guid}/reject")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> RejectWinner(Guid id, [FromBody] AuctionWinnerRejectRequest request)
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("❌ Rejecting winner by seller: Winner {WinnerId}, Seller {SellerId}, Reason: {Reason}",
                id, currentUserId, request.RejectionReason);

            var rejectedWinner = await _auctionWinnerService.RejectWinnerAsync(
                id, currentUserId, request.RejectionReason);

            // Notify winner about rejection like Copart
            await _winnerHubContext.Clients.Group($"winner-{rejectedWinner.UserId}")
                .SendAsync("WinnerRejected", new
                {
                    WinnerId = id,
                    RejectedBy = currentUserId,
                    RejectedByName = GetCurrentUserName(),
                    LotNumber = rejectedWinner.AuctionCarLotNumber,
                    Reason = request.RejectionReason,
                    RejectedAt = DateTime.UtcNow,
                    Message = $"❌ Unfortunately, seller rejected your winning bid for Lot #{rejectedWinner.AuctionCarLotNumber}. Reason: {request.RejectionReason}"
                });

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(rejectedWinner,
                "❌ Winner rejected by seller - buyer has been notified"));
        }

        [HttpPost("{id:guid}/cancel")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> CancelWinner(Guid id, [FromBody] CancelWinnerRequest request)
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("🚫 Cancelling winner by admin: Winner {WinnerId}, Admin {AdminId}, Reason: {Reason}",
                id, currentUserId, request.Reason);

            var cancelledWinner = await _auctionWinnerService.CancelWinnerAsync(
                id, request.Reason, currentUserId);

            // Notify winner about cancellation
            await _winnerHubContext.Clients.Group($"winner-{cancelledWinner.UserId}")
                .SendAsync("WinnerCancelled", new
                {
                    WinnerId = id,
                    CancelledBy = currentUserId,
                    CancelledByName = GetCurrentUserName(),
                    LotNumber = cancelledWinner.AuctionCarLotNumber,
                    Reason = request.Reason,
                    CancelledAt = DateTime.UtcNow,
                    Message = $"🚫 Your winner status for Lot #{cancelledWinner.AuctionCarLotNumber} has been cancelled. Reason: {request.Reason}"
                });

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(cancelledWinner,
                "🚫 Winner cancelled by admin - buyer has been notified"));
        }

        #endregion

        #region User-specific Endpoints - Copart Style

        [HttpGet("my-wins")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetMyWins([FromQuery] string? status = null)
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("📊 Getting my wins for user: {UserId}, Status filter: {Status}", currentUserId, status);

            var myWins = await _auctionWinnerService.GetUserWinnersAsync(currentUserId);

            if (!string.IsNullOrEmpty(status))
            {
                myWins = myWins.Where(w => w.PaymentStatus.Equals(status, StringComparison.OrdinalIgnoreCase));
            }

            var winsSummary = new
            {
                TotalWins = myWins.Count(),
                CompletedSales = myWins.Count(w => w.PaymentStatus == "Paid"),
                PendingPayments = myWins.Count(w => w.PaymentStatus == "Pending"),
                PartiallyPaid = myWins.Count(w => w.PaymentStatus == "PartiallyPaid"),
                TotalAmount = myWins.Sum(w => w.Amount),
                TotalPaid = myWins.Sum(w => w.PaidAmount ?? 0),
                OverdueCount = myWins.Count(w => w.IsOverdue)
            };

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                Wins = myWins,
                Summary = winsSummary
            }, $"📊 Found {myWins.Count()} wins - ${winsSummary.TotalAmount:N2} total value"));
        }

        [HttpGet("my-unpaid")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetMyUnpaidWins()
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("💸 Getting unpaid wins for user: {UserId}", currentUserId);

            var unpaidWins = await _auctionWinnerService.GetUnpaidWinnersAsync(currentUserId);
            var totalUnpaidAmount = unpaidWins.Sum(w => w.RemainingAmount);

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                Wins = unpaidWins,
                Count = unpaidWins.Count(),
                TotalUnpaidAmount = totalUnpaidAmount,
                UrgentCount = unpaidWins.Count(w => w.RequiresAction)
            }, $"💸 {unpaidWins.Count()} unpaid wins - ${totalUnpaidAmount:N2} outstanding"));
        }

        [HttpGet("auction-car/{auctionCarId:guid}/winner")]
        [ProducesResponseType(typeof(CopartApiResponse<AuctionWinnerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetWinnerByAuctionCar(Guid auctionCarId)
        {
            _logger.LogInformation("🔍 Getting winner for auction car: {AuctionCarId}", auctionCarId);

            var winner = await _auctionWinnerService.GetWinnerByAuctionCarIdAsync(auctionCarId);
            if (winner == null)
                return NotFound(CopartApiResponse<string>.Error("No winner found for this auction car", 404));

            return Ok(CopartApiResponse<AuctionWinnerDetailDto>.SuccessWithData(winner,
                $"Winner found for Lot #{winner.AuctionCarLotNumber}"));
        }

        #endregion

        #region Notifications & Reminders - Copart Style

        [HttpPost("{id:guid}/send-payment-reminder")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<string>), StatusCodes.Status200OK)]
        public async Task<ActionResult> SendPaymentReminder(Guid id)
        {
            _logger.LogInformation("📧 Sending payment reminder by {User}: Winner {WinnerId}",
                GetCurrentUserName(), id);

            var sent = await _auctionWinnerService.SendPaymentReminderAsync(id);

            if (sent)
            {
                var winner = await _auctionWinnerService.GetWinnerByIdAsync(id);
                if (winner != null)
                {
                    await _winnerHubContext.Clients.Group($"winner-{winner.UserId}")
                        .SendAsync("PaymentReminderSent", new
                        {
                            WinnerId = id,
                            LotNumber = winner.AuctionCarLotNumber,
                            Amount = winner.RemainingAmount,
                            PaymentDueDate = winner.PaymentDueDate,
                            ReminderCount = winner.PaymentReminderCount,
                            SentAt = DateTime.UtcNow,
                            Message = $"📧 Payment reminder sent for Lot #{winner.AuctionCarLotNumber} - ${winner.RemainingAmount:N2} due by {winner.PaymentDueDate:MM/dd/yyyy}"
                        });
                }
            }

            var message = sent
                ? "📧 Payment reminder sent successfully"
                : "⚠️ Reminder not eligible (too recent or fully paid)";

            return Ok(CopartApiResponse<string>.SuccessMessage(message));
        }

        [HttpPost("bulk-payment-reminders")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> SendBulkPaymentReminders([FromQuery] int daysBefore = 2)
        {
            _logger.LogInformation("📧 Sending bulk payment reminders by {User}: {DaysBefore} days before",
                GetCurrentUserName(), daysBefore);

            var sentCount = await _auctionWinnerService.SendBulkPaymentRemindersAsync(daysBefore);

            // Notify admin about bulk operation
            await _winnerHubContext.Clients.Group("admin-notifications")
                .SendAsync("BulkRemindersCompleted", new
                {
                    SentCount = sentCount,
                    DaysBefore = daysBefore,
                    CompletedAt = DateTime.UtcNow,
                    InitiatedBy = GetCurrentUserName(),
                    Message = $"📧 Bulk reminders completed: {sentCount} reminders sent"
                });

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                SentCount = sentCount,
                DaysBefore = daysBefore,
                CompletedAt = DateTime.UtcNow
            }, $"📧 Bulk reminders sent to {sentCount} winners"));
        }

        #endregion

        #region Analytics & Statistics - Copart Style

        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<WinnerStatisticsDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetWinnerStatistics(
            [FromQuery] Guid? auctionId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            _logger.LogInformation("📊 Generating winner statistics by {User}: Auction {AuctionId}, {From} to {To}",
                GetCurrentUserName(), auctionId, fromDate, toDate);

            var statistics = await _auctionWinnerService.GetWinnerStatisticsAsync(auctionId, fromDate, toDate);

            return Ok(CopartApiResponse<WinnerStatisticsDto>.SuccessWithData(statistics,
                $"📊 Statistics generated: {statistics.TotalWinners} winners, {statistics.CompletionRate:F1}% completion rate"));
        }

        [HttpGet("top-buyers")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<IEnumerable<TopBuyerDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetTopBuyers([FromQuery] int count = 10)
        {
            _logger.LogInformation("🏆 Getting top buyers by {User}: Count {Count}", GetCurrentUserName(), count);

            var topBuyers = await _auctionWinnerService.GetTopBuyersAsync(count);

            return Ok(CopartApiResponse<IEnumerable<TopBuyerDto>>.SuccessWithData(topBuyers,
                $"🏆 Top {topBuyers.Count()} buyers retrieved"));
        }

        [HttpGet("user/{userId:guid}/analytics")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetUserAnalytics(Guid userId)
        {
            _logger.LogInformation("📈 Getting user analytics by {User} for user: {UserId}", GetCurrentUserName(), userId);

            var successRate = await _auctionWinnerService.GetUserSuccessRateAsync(userId);
            var averagePaymentTime = await _auctionWinnerService.GetUserAveragePaymentTimeAsync(userId);
            var userWins = await _auctionWinnerService.GetUserWinnersAsync(userId);

            var analytics = new
            {
                UserId = userId,
                SuccessRate = successRate,
                AveragePaymentTime = averagePaymentTime,
                TotalWins = userWins.Count(),
                TotalSpent = userWins.Sum(w => w.PaidAmount ?? 0),
                TotalCommitted = userWins.Sum(w => w.Amount),
                OverdueCount = userWins.Count(w => w.IsOverdue),
                ReliabilityScore = successRate switch
                {
                    >= 95 => "Excellent",
                    >= 85 => "Very Good",
                    >= 75 => "Good",
                    >= 60 => "Fair",
                    _ => "Poor"
                }
            };

            return Ok(CopartApiResponse<object>.SuccessWithData(analytics,
                $"📈 User analytics: {successRate:F1}% success rate"));
        }

        #endregion

        #region Search & Filter Operations - Copart Style

        [HttpPost("search")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> SearchWinners([FromBody] WinnerSearchCriteriaDto criteria)
        {
            _logger.LogInformation("🔍 Searching winners by {User}: Page {Page}, Size {PageSize}",
                GetCurrentUserName(), criteria.Page, criteria.PageSize);

            var winners = await _auctionWinnerService.SearchWinnersAsync(criteria);

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                Winners = winners,
                Count = winners.Count(),
                SearchCriteria = criteria
            }, $"🔍 Found {winners.Count()} winners matching search criteria"));
        }

        [HttpGet("amount-range")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(typeof(CopartApiResponse<IEnumerable<AuctionWinnerGetDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetWinnersByAmountRange(
            [FromQuery] decimal minAmount = 0,
            [FromQuery] decimal maxAmount = 1000000)
        {
            _logger.LogInformation("💲 Getting winners by amount range: ${Min:N2} - ${Max:N2}", minAmount, maxAmount);

            var winners = await _auctionWinnerService.GetWinnersByAmountRangeAsync(minAmount, maxAmount);

            return Ok(CopartApiResponse<IEnumerable<AuctionWinnerGetDto>>.SuccessWithData(winners,
                $"💲 Found {winners.Count()} winners in range ${minAmount:N2} - ${maxAmount:N2}"));
        }

        #endregion

        #region System Maintenance - Copart Style

        [HttpPost("maintenance/mark-overdue")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> MarkOverduePayments()
        {
            _logger.LogInformation("⚠️ Marking overdue payments by {Admin}", GetCurrentUserName());

            var markedCount = await _auctionWinnerService.MarkOverduePaymentsAsync();

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                MarkedCount = markedCount,
                ProcessedAt = DateTime.UtcNow
            }, $"⚠️ Marked {markedCount} overdue payments"));
        }

        [HttpPost("maintenance/archive-completed")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult> ArchiveCompletedWinners([FromQuery] DateTime? cutoffDate = null)
        {
            var actualCutoffDate = cutoffDate ?? DateTime.UtcNow.AddDays(-90);
            _logger.LogInformation("📦 Archiving completed winners by {Admin} before: {CutoffDate:yyyy-MM-dd}",
                GetCurrentUserName(), actualCutoffDate);

            var archivedCount = await _auctionWinnerService.ArchiveCompletedWinnersAsync(actualCutoffDate);

            return Ok(CopartApiResponse<object>.SuccessWithData(new
            {
                ArchivedCount = archivedCount,
                CutoffDate = actualCutoffDate,
                ProcessedAt = DateTime.UtcNow
            }, $"📦 Archived {archivedCount} completed winners"));
        }

        [HttpGet("maintenance/integrity-report")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CopartApiResponse<WinnerIntegrityReportDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> ValidateWinnerDataIntegrity()
        {
            _logger.LogInformation("🔍 Validating winner data integrity by {Admin}", GetCurrentUserName());

            var report = await _auctionWinnerService.ValidateWinnerDataIntegrityAsync();

            var severity = report.HasCriticalIssues ? "CRITICAL" :
                          report.IssuesFound > 0 ? "WARNING" : "GOOD";

            return Ok(CopartApiResponse<WinnerIntegrityReportDto>.SuccessWithData(report,
                $"🔍 Data integrity check completed - Status: {severity} ({report.IssuesFound} issues found)"));
        }

        #endregion

        #region Helper Methods

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId :
                   Guid.Parse("9f8bbe66-5499-4790-8e3e-011a4cbda67d"); // ravanmu-coder default
        }

        private string GetCurrentUserName()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "ravanmu-coder";
        }

        #endregion

        #region Request Models - AuctionWinner Controller Specific

        public class ManualAssignRequest
        {
            [Required]
            public Guid AuctionCarId { get; set; }

            [Required]
            public Guid UserId { get; set; }

            [Required]
            public Guid WinningBidId { get; set; }

            [Required]
            [Range(1, 10000000)]
            public decimal Amount { get; set; }
        }

        public class SecondChanceRequest
        {
            [Required]
            public Guid AuctionCarId { get; set; }

            [Required]
            public Guid OriginalWinnerId { get; set; }
        }

        public class RecordPaymentRequest
        {
            [Required]
            [Range(0.01, 10000000)]
            public decimal Amount { get; set; }

            public string? PaymentReference { get; set; }
            public string? Notes { get; set; }
        }

        public class ExtendPaymentRequest
        {
            [Required]
            [Range(1, 30)]
            public int AdditionalDays { get; set; }

            [Required]
            public string Reason { get; set; } = default!;
        }

        public class ConfirmWinnerRequest
        {
            public string? ConfirmationNotes { get; set; }
        }

        // ⚠️ CRITICAL: Bu sinifin adını dəyişdik ki, AuctionCarController-dəki RejectWinnerRequest ilə qarışmasın
        public class AuctionWinnerRejectRequest
        {
            [Required]
            public string RejectionReason { get; set; } = default!;
        }

        public class CancelWinnerRequest
        {
            [Required]
            public string Reason { get; set; } = default!;
        }

        #endregion
    }

    #region Copart API Response Model

    public class CopartApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string Message { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string RequestId { get; set; } = Guid.NewGuid().ToString();

        // Factory: success with data
        public static CopartApiResponse<T> SuccessWithData(T data, string message = "Operation successful", int statusCode = 200)
        {
            return new CopartApiResponse<T>
            {
                Success = true,
                Data = data,
                Message = message,
                StatusCode = statusCode
            };
        }

        // Factory: success with only message (no data)
        public static CopartApiResponse<T> SuccessMessage(string message, int statusCode = 200)
        {
            return new CopartApiResponse<T>
            {
                Success = true,
                Data = default,
                Message = message,
                StatusCode = statusCode
            };
        }

        // Factory: error
        public static CopartApiResponse<T> Error(string message, int statusCode = 400)
        {
            return new CopartApiResponse<T>
            {
                Success = false,
                Data = default,
                Message = message,
                StatusCode = statusCode
            };
        }
    }

    #endregion
}