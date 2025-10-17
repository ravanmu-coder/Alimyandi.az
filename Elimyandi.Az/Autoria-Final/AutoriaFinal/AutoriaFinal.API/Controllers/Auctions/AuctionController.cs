using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.Auction;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Infrastructure.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace AutoriaFinal.API.Controllers.Auctions
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuctionController : ControllerBase
    {
        private readonly IAuctionService _auctionService;
        private readonly IHubContext<AuctionHub> _hubContext;
        private readonly ILogger<AuctionController> _logger;

        public AuctionController(
            IAuctionService auctionService,
            IHubContext<AuctionHub> hubContext,
            ILogger<AuctionController> logger)
        {
            _auctionService = auctionService;
            _hubContext = hubContext;
            _logger = logger;
        }

        #region Helper Methods

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Valid user authentication required");
            }
            return userId;
        }

        private string GetCurrentUserName()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ??
                   User.FindFirst(ClaimTypes.Email)?.Value ??
                   User.FindFirst("preferred_username")?.Value ??
                   User.Identity?.Name ??
                   "Unknown User";
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "Member";
        }

        #endregion

        #region Basic Crud
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<AuctionGetDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetAllAuctions()
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            var auctions = await _auctionService.GetAllAsync();
            _logger.LogInformation("All auctions retrieved by {User} at {Time}",
                currentUser, DateTime.UtcNow);
            return Ok(auctions);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionDetailDto>> GetAuctionById(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            _logger.LogInformation("Getting auction details - User: {User}, AuctionId: {AuctionId}",
                currentUser, id);

            var auction = await _auctionService.GetByIdAsync(id);
            return Ok(auction);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuctionDetailDto>> CreateAuction([FromBody] AuctionCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            var result = await _auctionService.AddAuctionAsync(dto, currentUserId);

            // SignalR notification
            await _hubContext.Clients.All.SendAsync("AuctionScheduled", result.Id, result.StartTimeUtc);

            _logger.LogInformation("AUCTION CREATED: {AuctionId} - {Name} by {User} (ID: {UserId}) at {Time}",
                result.Id, result.Name, currentUser, currentUserId, DateTime.UtcNow);

            return CreatedAtAction(nameof(GetAuctionById), new { id = result.Id }, result);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionDetailDto>> UpdateAuction(Guid id, [FromBody] AuctionUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUser = GetCurrentUserName();
            var result = await _auctionService.UpdateAsync(id, dto);

            _logger.LogInformation("AUCTION UPDATED: {AuctionId} by {User} at {Time}",
                id, currentUser, DateTime.UtcNow);

            return Ok(result);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult> DeleteAuction(Guid id)
        {
            var currentUser = GetCurrentUserName();
            var success = await _auctionService.DeleteAsync(id);

            _logger.LogWarning("AUCTION DELETED: {AuctionId} by {User} at {Time}",
                id, currentUser, DateTime.UtcNow);

            return NoContent();
        }
        #endregion

        #region Auction Main LifeCycle Methods
        [HttpPost("{id:guid}/start")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionDetailDto>> StartAuction(Guid id)
        {
            var currentUser = GetCurrentUserName();
            var result = await _auctionService.StartAuctionAsync(id);

            await _hubContext.Clients.Group($"auction-{id}")
                .SendAsync("AuctionStarted", id, result.StartPrice ?? 0);

            _logger.LogInformation("AUCTION STARTED: {AuctionId} - Car: {LotNumber} - Price: ${StartPrice} by {User} at {Time}",
                id, result.CurrentCarLotNumber, result.StartPrice, currentUser, DateTime.UtcNow);

            return Ok(result);
        }

        [HttpPost("{id:guid}/end")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionDetailDto>> EndAuction(Guid id)
        {
            var currentUser = GetCurrentUserName();
            var result = await _auctionService.EndAuctionAsync(id);
            var finalWinAmount = result.TotalSalesAmount;

            await _hubContext.Clients.Group($"auction-{id}")
                .SendAsync("AuctionEnded", id, Guid.Empty, finalWinAmount);

            _logger.LogInformation("AUCTION ENDED: {AuctionId} - Cars: {Total}, Sold: {Sold}, Total: ${Amount} by {User} at {Time}",
                id, result.TotalCarsCount, result.SoldCarsCount, finalWinAmount, currentUser, DateTime.UtcNow);

            return Ok(result);
        }

        [HttpPost("{id:guid}/cancel")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionDetailDto>> CancelAuction(Guid id, [FromBody] AuctionCancelRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Reason))
                return BadRequest("Ləğv etmə səbəbi mütləqdir");

            var currentUser = GetCurrentUserName();
            var result = await _auctionService.CancelAuctionAsync(id, request.Reason);

            await _hubContext.Clients.Group($"auction-{id}")
                .SendAsync("AuctionCanceled", id);

            _logger.LogWarning("AUCTION CANCELLED: {AuctionId} - Reason: {Reason} by {User} at {Time}",
               id, request.Reason, currentUser, DateTime.UtcNow);

            return Ok(result);
        }

        [HttpPost("{id:guid}/extend")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionDetailDto>> ExtendAuction(Guid id, [FromBody] AuctionExtendRequest request)
        {
            if (request == null)
                return BadRequest("Request məlumatları mütləqdir");

            if (request.AdditionalMinutes <= 0)
                return BadRequest("Əlavə vaxt müsbət olmalıdır");

            if (string.IsNullOrWhiteSpace(request.Reason))
                return BadRequest("Uzatma səbəbi mütləqdir");

            var currentUser = GetCurrentUserName();
            var result = await _auctionService.ExtendAuctionAsync(id, request.AdditionalMinutes, request.Reason);

            await _hubContext.Clients.Group($"auction-{id}")
                .SendAsync("AuctionExtended", id, result.EndTimeUtc);

            _logger.LogInformation("AUCTION EXTENDED: {AuctionId} - Minutes: +{Minutes} - Reason: {Reason} by {User} at {Time}",
               id, request.AdditionalMinutes, request.Reason, currentUser, DateTime.UtcNow);

            return Ok(result);
        }

        [HttpGet("dashboard-stats")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetDashboardStats()
        {
            var currentUser = GetCurrentUserName();

            try
            {
                var stats = new
                {
                    Draft = (await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Draft)).Count(),
                    Scheduled = (await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Scheduled)).Count(),
                    Ready = (await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Ready)).Count(),
                    Running = (await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Running)).Count(),
                    Ended = (await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Ended)).Count(),
                    Cancelled = (await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Cancelled)).Count(),
                    CurrentTime = DateTime.UtcNow,
                    RequestedBy = currentUser,
                    ServerInfo = new
                    {
                        Environment = "Development",
                        Version = "1.0.0",
                        LastRestart = DateTime.UtcNow.AddHours(-2)
                    }
                };

                _logger.LogInformation("Dashboard stats requested by {User} at {Time}",
                    currentUser, DateTime.UtcNow);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get dashboard stats for user {User}", currentUser);
                return StatusCode(500, new { error = "Failed to retrieve dashboard statistics" });
            }
        }

        [HttpGet("status/{status}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<AuctionGetDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetAuctionsByStatus(AuctionStatus status)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            try
            {
                var auctions = await _auctionService.GetAuctionsByStatusAsync(status);

                _logger.LogInformation("Auctions by status {Status} requested by {User} - Found {Count} auctions",
                    status, currentUser, auctions.Count());

                return Ok(auctions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get auctions by status: {Status} for user {User}", status, currentUser);
                return StatusCode(500, new { error = "Failed to retrieve auctions" });
            }
        }

        [HttpPost("{id:guid}/make-ready")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionDetailDto>> MakeAuctionReady(Guid id)
        {
            var currentUser = GetCurrentUserName();

            try
            {
                var result = await _auctionService.MakeAuctionReadyAsync(id);

                await _hubContext.Clients.Group($"auction-{id}")
                    .SendAsync("AuctionReady", new
                    {
                        AuctionId = id,
                        TotalCars = result.TotalCarsCount,
                        PreBidStarted = true,
                        MadeReadyBy = currentUser
                    });

                _logger.LogInformation("AUCTION MADE READY: {AuctionId} by {User} at {Time}",
                    id, currentUser, DateTime.UtcNow);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to make auction ready: {AuctionId} by user {User}", id, currentUser);
                return StatusCode(500, new { error = "Failed to make auction ready" });
            }
        }

        [HttpGet("scheduler-debug")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetSchedulerDebugInfo()
        {
            var currentUser = GetCurrentUserName();

            try
            {
                var now = DateTime.UtcNow;
                var debugInfo = new
                {
                    CurrentTime = now,
                    RequestedBy = currentUser,
                    ReadyToMakeReady = await _auctionService.GetAuctionsReadyToMakeReadyAsync(),
                    ReadyToStart = await _auctionService.GetAuctionsReadyToStartAsync(),
                    Running = await _auctionService.GetAuctionsByStatusAsync(AuctionStatus.Running),
                    Expired = await _auctionService.GetExpiredAuctionsAsync()
                };

                _logger.LogInformation("Scheduler debug info requested by {User} at {Time}",
                    currentUser, DateTime.UtcNow);

                return Ok(debugInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get scheduler debug info for user {User}", currentUser);
                return StatusCode(500, new { error = "Failed to retrieve debug info" });
            }
        }

        [HttpPost("force-scheduler-run")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ForceSchedulerRun()
        {
            var currentUser = GetCurrentUserName();

            try
            {
                var stats = new
                {
                    Message = "Scheduler run triggered manually",
                    Time = DateTime.UtcNow,
                    Status = "Processing...",
                    TriggeredBy = currentUser
                };

                _logger.LogInformation("Manual scheduler run triggered by {User}", currentUser);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to trigger scheduler run for user {User}", currentUser);
                return StatusCode(500, new { error = "Failed to trigger scheduler" });
            }
        }
        #endregion

        #region Auto Car Progression Methods
        [HttpPost("{id:guid}/next-car")]
        [Authorize(Roles = "Admin,System")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionDetailDto>> MoveToNextCar(Guid id)
        {
            var currentUser = GetCurrentUserName();
            var result = await _auctionService.MoveToNextCarAsync(id);

            if (result.Status == "Ended")
            {
                await _hubContext.Clients.Group($"auction-{id}")
                    .SendAsync("AuctionEnded", id, Guid.Empty, result.TotalSalesAmount);

                _logger.LogInformation("AUCTION AUTO-COMPLETED: {AuctionId} - No more cars by {User} at {Time}",
                    id, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            }
            else
            {
                await _hubContext.Clients.Group($"auction-{id}")
                    .SendAsync("AuctionStarted", id, result.StartPrice ?? 0);

                _logger.LogInformation("AUTO NEXT CAR: {AuctionId} - New Car: {LotNumber} - Price: ${StartPrice} by {User} at {Time}",
                    id, result.CurrentCarLotNumber, result.StartPrice, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            }

            return Ok(result);
        }

        [HttpPost("{id:guid}/set-current-car")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AuctionDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionDetailDto>> SetCurrentCar(Guid id, [FromBody] SetCurrentCarRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.LotNumber))
                return BadRequest("Lot nömrəsi mütləqdir");

            var currentUser = GetCurrentUserName();
            var result = await _auctionService.SetCurrentCarAsync(id, request.LotNumber);

            await _hubContext.Clients.Group($"auction-{id}")
               .SendAsync("AuctionStarted", id, result.StartPrice ?? 0);

            _logger.LogInformation("MANUAL CAR SWITCH: {AuctionId} - To: {LotNumber} by {User} at {Time}",
                id, request.LotNumber, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            return Ok(result);
        }
        #endregion

        #region Real-Time Status Methods
        [HttpGet("live")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<AuctionGetDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetLiveAuctions()
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            var auctions = await _auctionService.GetLiveAuctionsAsync();

            _logger.LogInformation("Live auctions requested by {User} - Found {Count} live auctions",
                currentUser, auctions.Count());

            return Ok(auctions);
        }

        [HttpGet("active")]
        [Authorize(Roles = "Admin,AuctionManager,Seller")]
        [ProducesResponseType(typeof(IEnumerable<AuctionGetDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetActiveAuctions()
        {
            var currentUser = GetCurrentUserName();
            var auctions = await _auctionService.GetActiveAuctionsAsync();

            _logger.LogInformation("Active auctions requested by {User} - Found {Count} active auctions",
                currentUser, auctions.Count());

            return Ok(auctions);
        }

        [HttpGet("ready-to-start")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<AuctionGetDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetAuctionsReadyToStart()
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            var auctions = await _auctionService.GetAuctionsReadyToStartAsync();

            _logger.LogInformation("Ready-to-start auctions requested by {User} - Found {Count} auctions",
                currentUser, auctions.Count());

            return Ok(auctions);
        }

        [HttpGet("expired")]
        [Authorize(Roles = "System")]
        [ProducesResponseType(typeof(IEnumerable<AuctionGetDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetExpiredAuctions()
        {
            var currentUser = GetCurrentUserName();
            var auctions = await _auctionService.GetExpiredAuctionsAsync();

            _logger.LogInformation("Expired auctions requested by {User} - Found {Count} expired auctions",
                currentUser, auctions.Count());

            return Ok(auctions);
        }

        [HttpGet("location/{locationId:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AuctionGetDto>>> GetAuctionsByLocation(Guid locationId)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            var auctions = await _auctionService.GetAuctionsByLocationAsync(locationId);

            _logger.LogInformation("Auctions by location {LocationId} requested by {User} - Found {Count} auctions",
                locationId, currentUser, auctions.Count());

            return Ok(auctions);
        }
        #endregion

        #region Timer & Real-Time Info
        [HttpGet("{id:guid}/timer")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuctionTimerInfo), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionTimerInfo>> GetAuctionTimer(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true
                ? GetCurrentUserName()
                : "Anonymous";

            try
            {
                var timerInfo = await _auctionService.GetAuctionTimerInfoAsync(id);

                _logger.LogInformation("⏱ Auction timer requested by {User} for auction {AuctionId}",
                    currentUser, id);

                return Ok(timerInfo);
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning("❌ Auction not found: {AuctionId}. Requested by {User}", id, currentUser);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "⚠️ Unexpected error while getting timer for auction {AuctionId} by {User}",
                    id, currentUser);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An unexpected error occurred while retrieving auction timer."
                });
            }
        }


        [HttpGet("{id:guid}/current-state")]
        [AllowAnonymous]
        public async Task<ActionResult<AuctionDetailDto>> GetCurrentState(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            var result = await _auctionService.GetAuctionCurrentStateAsync(id);

            _logger.LogInformation("Auction current state requested by {User} for auction {AuctionId}",
                currentUser, id);

            return Ok(result);
        }
        #endregion

        #region Statistics & Reports
        [HttpGet("{id:guid}/statistics")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(typeof(AuctionStatisticsDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionStatisticsDto>> GetAuctionStatistics(Guid id)
        {
            var currentUser = GetCurrentUserName();
            var statistics = await _auctionService.GetAuctionStatisticsAsync(id);

            _logger.LogInformation("AUCTION STATISTICS: {AuctionId} - Total: ${Amount}, Cars: {Cars} accessed by {User} at {Time}",
                id, statistics.TotalSalesAmount, statistics.TotalCars, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            return Ok(statistics);
        }
        #endregion
    }
}