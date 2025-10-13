using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Services.Auctions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace AutoriaFinal.API.Controllers.Auctions
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // ✅ ENABLE Authorization back
    public class AuctionCarController : ControllerBase
    {
        private readonly IAuctionCarService _auctionCarService;
        private readonly ILogger<AuctionCarController> _logger;

        public AuctionCarController(IAuctionCarService auctionCarService, ILogger<AuctionCarController> logger)
        {
            _auctionCarService = auctionCarService;
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
                   "Unknown User";
        }

        #endregion

        #region Basic CRUD Operations

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting all auction cars - User: {User}, Page: {Page}, Size: {PageSize}",
                currentUser, page, pageSize);

            var cars = await _auctionCarService.GetAllAsync();
            return Ok(cars);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionCarDetailDto>> GetById(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Getting auction car details - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}",
                currentUser, currentUserId, id);

            var car = await _auctionCarService.GetCarWithFullDetailsAsync(id, currentUserId);
            return Ok(car);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Seller")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionCarDetailDto>> Create([FromBody] AuctionCarCreateDto dto)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Creating new auction car - User: {User}, Lot: {LotNumber}, Auction: {AuctionId}, ERV: ${ERV}",
                currentUser, dto.LotNumber, dto.AuctionId, dto.EstimatedRetailValue);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdCar = await _auctionCarService.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = createdCar.Id }, createdCar);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Seller")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuctionCarDetailDto>> Update(
            Guid id,
            [FromBody] AuctionCarUpdateDto dto)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Updating auction car - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updatedCar = await _auctionCarService.UpdateAsync(id, dto);
            return Ok(updatedCar);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<object>> Delete(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Deleting auction car - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}",
                currentUser, currentUserId, id);

            var result = await _auctionCarService.DeleteAsync(id);
            return Ok(new
            {
                success = result,
                message = "Auction car deleted successfully",
                deletedAt = DateTime.UtcNow,
                deletedBy = currentUser,
                deletedByUserId = currentUserId
            });
        }

        #endregion

        #region Real Copart Lifecycle Management

        [HttpPost("{id}/prepare")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionCarDetailDto>> PrepareForAuction(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Preparing car for auction - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}",
                currentUser, currentUserId, id);

            var preparedCar = await _auctionCarService.PrepareCarForAuctionAsync(id, currentUserId);
            return Ok(preparedCar);
        }

        [HttpPost("{id}/activate")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionCarDetailDto>> ActivateCar(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Activating car for live auction - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}",
                currentUser, currentUserId, id);

            var activatedCar = await _auctionCarService.ActivateCarAsync(id, currentUserId);
            return Ok(activatedCar);
        }

        [HttpPost("{id}/end")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuctionCarDetailDto>> EndAuction(
            Guid id,
            [FromBody] EndAuctionRequest? request = null)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Ending auction for car - User: {User}, AuctionCarId: {AuctionCarId}, Reason: {Reason}",
                currentUser, id, request?.Reason ?? "Timer expired");

            var endedCar = await _auctionCarService.EndCarAuctionAsync(id);
            return Ok(endedCar);
        }

        [HttpPost("{id}/mark-unsold")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuctionCarDetailDto>> MarkUnsold(
            Guid id,
            [FromBody] MarkUnsoldRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Marking car as unsold - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, Reason: {Reason}",
                currentUser, currentUserId, id, request.Reason);

            var unsoldCar = await _auctionCarService.MarkCarUnsoldAsync(id, request.Reason, currentUserId);
            return Ok(unsoldCar);
        }

        #endregion

        #region Real Copart Timer Management

        [HttpGet("{id}/timer")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionCarTimerDto>> GetTimer(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";
            _logger.LogInformation("Getting timer info - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var timerInfo = await _auctionCarService.GetCarTimerInfoAsync(id);
            return Ok(timerInfo);
        }

        [HttpGet("{id}/timer/expired")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> IsTimerExpired(
            Guid id,
            [FromQuery] int timerSeconds = 10)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";
            _logger.LogInformation("Checking timer expiry - User: {User}, AuctionCarId: {AuctionCarId}, TimerSeconds: {TimerSeconds}",
                currentUser, id, timerSeconds);

            var isExpired = await _auctionCarService.IsCarTimerExpiredAsync(id, timerSeconds);
            return Ok(new
            {
                isExpired,
                auctionCarId = id,
                timerSeconds,
                checkedAt = DateTime.UtcNow,
                checkedBy = currentUser
            });
        }

        #endregion

        #region Real Copart Pre-Bid Management

        [HttpGet("{id}/pre-bids")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<BidGetDto>>> GetPreBids(Guid id)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting pre-bids - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var preBids = await _auctionCarService.GetPreBidsAsync(id);
            return Ok(preBids);
        }

        [HttpGet("{id}/pre-bids/highest")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> GetHighestPreBid(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";
            _logger.LogInformation("Getting highest pre-bid - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var highestPreBid = await _auctionCarService.GetHighestPreBidAsync(id);
            if (highestPreBid == null)
                return Ok(new
                {
                    message = "No pre-bids found for this car",
                    auctionCarId = id,
                    searchedBy = currentUser
                });

            return Ok(highestPreBid);
        }

        [HttpGet("{id}/pre-bids/requirements")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> CheckPreBidRequirements(Guid id)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Checking pre-bid requirements - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var hasRequired = await _auctionCarService.HasRequiredPreBidsAsync(id);
            return Ok(new
            {
                hasRequiredPreBids = hasRequired,
                auctionCarId = id,
                canStartAuction = hasRequired,
                checkedBy = currentUser
            });
        }

        [HttpGet("{id}/pre-bids/user/{userId}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> HasUserPreBid(Guid id, Guid userId)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Checking user pre-bid - Admin: {Admin}, AuctionCarId: {AuctionCarId}, CheckingUser: {UserId}",
                currentUser, id, userId);

            var hasPreBid = await _auctionCarService.HasUserPreBidAsync(id, userId);
            return Ok(new
            {
                hasPreBid,
                userId,
                auctionCarId = id,
                checkedBy = currentUser
            });
        }

        [HttpGet("{id}/pre-bids/me")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<object>> HasCurrentUserPreBid(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Checking current user pre-bid - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}",
                currentUser, currentUserId, id);

            var hasPreBid = await _auctionCarService.HasUserPreBidAsync(id, currentUserId);
            return Ok(new
            {
                hasPreBid,
                userId = currentUserId,
                auctionCarId = id,
                checkedBy = currentUser
            });
        }

        #endregion

        #region Real Copart Price Management

        [HttpPut("{id}/price")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionCarDetailDto>> UpdateCurrentPrice(
            Guid id,
            [FromBody] UpdatePriceRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Updating car price - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, NewPrice: ${NewPrice}",
                currentUser, currentUserId, id, request.NewPrice);

            var updatedCar = await _auctionCarService.UpdateCurrentPriceAsync(id, request.NewPrice, currentUserId);
            return Ok(updatedCar);
        }

        [HttpGet("{id}/reserve-met")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> IsReservePriceMet(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";
            _logger.LogInformation("Checking reserve price status - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var isReserveMet = await _auctionCarService.IsReservePriceMetAsync(id);
            return Ok(new
            {
                isReserveMet,
                auctionCarId = id,
                checkedAt = DateTime.UtcNow,
                checkedBy = currentUser
            });
        }

        [HttpGet("{id}/next-min-bid")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> GetNextMinimumBid(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";
            _logger.LogInformation("Calculating next minimum bid - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var nextMinBid = await _auctionCarService.CalculateNextMinimumBidAsync(id);
            return Ok(new
            {
                nextMinimumBid = nextMinBid,
                auctionCarId = id,
                calculatedAt = DateTime.UtcNow,
                calculatedBy = currentUser
            });
        }

        #endregion

        #region Real Copart Post-Auction Management

        [HttpPost("{id}/approve-winner")]
        [Authorize(Roles = "Admin,Seller")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuctionCarDetailDto>> ApproveWinner(
            Guid id,
            [FromBody] ApproveWinnerRequest? request = null)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Approving winner - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, Notes: {Notes}",
                currentUser, currentUserId, id, request?.ApprovalNotes ?? "None");

            var approvedCar = await _auctionCarService.ApproveWinnerAsync(id, currentUserId, request?.ApprovalNotes);
            return Ok(approvedCar);
        }

        [HttpPost("{id}/reject-winner")]
        [Authorize(Roles = "Admin,Seller")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuctionCarDetailDto>> RejectWinner(
            Guid id,
            [FromBody] RejectWinnerRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Rejecting winner - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, Reason: {Reason}",
                currentUser, currentUserId, id, request.RejectionReason);

            var rejectedCar = await _auctionCarService.RejectWinnerAsync(id, currentUserId, request.RejectionReason);
            return Ok(rejectedCar);
        }

        [HttpPost("{id}/deposit-paid")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuctionCarDetailDto>> MarkDepositPaid(
            Guid id,
            [FromBody] DepositPaidRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Marking deposit paid - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, Deposit: ${Deposit}",
                currentUser, currentUserId, id, request.DepositAmount);

            var updatedCar = await _auctionCarService.MarkDepositPaidAsync(id, request.DepositAmount, currentUserId);
            return Ok(updatedCar);
        }

        [HttpPost("{id}/complete-payment")]
        [Authorize(Roles = "Admin,PaymentManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuctionCarDetailDto>> CompletePayment(
            Guid id,
            [FromBody] CompletePaymentRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Completing payment - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, Total: ${Total}",
                currentUser, currentUserId, id, request.TotalAmount);

            var completedCar = await _auctionCarService.CompletePaymentAsync(id, request.TotalAmount, currentUserId);
            return Ok(completedCar);
        }

        #endregion

        #region Real Copart Lane Management

        [HttpPost("{id}/assign-lane")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuctionCarDetailDto>> AssignToLane(
            Guid id,
            [FromBody] AssignLaneRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Assigning car to lane - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}, Lane: {Lane}, Order: {Order}",
                currentUser, currentUserId, id, request.LaneNumber, request.RunOrder);

            var assignedCar = await _auctionCarService.AssignToLaneAsync(
                id, request.LaneNumber, request.RunOrder, request.ScheduledTime, currentUserId);
            return Ok(assignedCar);
        }

        [HttpGet("lane/{laneNumber}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetCarsByLane(
            int laneNumber,
            [FromQuery] DateTime? scheduleDate = null)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting cars by lane - User: {User}, Lane: {Lane}, Date: {Date}",
                currentUser, laneNumber, scheduleDate?.ToString("yyyy-MM-dd") ?? "All");

            var cars = await _auctionCarService.GetCarsByLaneAsync(laneNumber, scheduleDate);
            return Ok(cars);
        }

        #endregion

        #region Real Copart Statistics & Analytics

        [HttpGet("{id}/stats")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionCarStatsDto>> GetBidStatistics(Guid id)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting bid statistics - User: {User}, AuctionCarId: {AuctionCarId}",
                currentUser, id);

            var stats = await _auctionCarService.GetCarBidStatsAsync(id);
            return Ok(stats);
        }

        [HttpGet("{id}/full-details")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<AuctionCarDetailDto>> GetFullDetails(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Getting full car details - User: {User} (ID: {UserId}), AuctionCarId: {AuctionCarId}",
                currentUser, currentUserId, id);

            var carDetails = await _auctionCarService.GetCarWithFullDetailsAsync(id, currentUserId);
            return Ok(carDetails);
        }

        [HttpGet("auction/{auctionId}/sell-through-rate")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> GetSellThroughRate(Guid auctionId)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting sell-through rate - User: {User}, AuctionId: {AuctionId}",
                currentUser, auctionId);

            var rate = await _auctionCarService.GetSellThroughRateAsync(auctionId);
            return Ok(new
            {
                sellThroughRate = rate,
                auctionId,
                calculatedAt = DateTime.UtcNow,
                calculatedBy = currentUser
            });
        }

        #endregion

        #region Real Copart Query & Navigation Methods

        [HttpGet("auction/{auctionId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetCarsByAuction(Guid auctionId)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            _logger.LogInformation("Getting cars for auction - User: {User} (ID: {UserId}), AuctionId: {AuctionId}",
                currentUser, currentUserId, auctionId);

            var cars = await _auctionCarService.GetCarsByAuctionIdAsync(auctionId, currentUserId);
            return Ok(cars);
        }

        [HttpGet("lot/{lotNumber}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionCarDetailDto>> GetCarByLotNumber(string lotNumber)
        {
            var currentUserId = User.Identity?.IsAuthenticated == true ? GetCurrentUserId() : Guid.Empty;
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            _logger.LogInformation("Getting car by lot number - User: {User}, LotNumber: {LotNumber}",
                currentUser, lotNumber);

            var car = await _auctionCarService.GetCarByLotNumberAsync(lotNumber, currentUserId);
            if (car == null)
                return NotFound(new
                {
                    message = $"Lot {lotNumber} not found",
                    lotNumber,
                    searchedAt = DateTime.UtcNow,
                    searchedBy = currentUser
                });

            return Ok(car);
        }

        [HttpGet("auction/{auctionId}/active")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionCarDetailDto>> GetActiveCar(Guid auctionId)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";
            _logger.LogInformation("Getting active car for auction - User: {User}, AuctionId: {AuctionId}",
                currentUser, auctionId);

            var activeCar = await _auctionCarService.GetActiveCarForAuctionAsync(auctionId);
            if (activeCar == null)
                return NotFound(new
                {
                    message = $"No active car found for auction {auctionId}",
                    auctionId,
                    searchedAt = DateTime.UtcNow,
                    searchedBy = currentUser
                });

            return Ok(activeCar);
        }

        [HttpGet("auction/{auctionId}/next")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuctionCarDetailDto>> GetNextCar(
            Guid auctionId,
            [FromQuery] string currentLotNumber)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting next car - User: {User}, AuctionId: {AuctionId}, CurrentLot: {CurrentLot}",
                currentUser, auctionId, currentLotNumber);

            var nextCar = await _auctionCarService.GetNextCarForAuctionAsync(auctionId, currentLotNumber);
            if (nextCar == null)
                return NotFound(new
                {
                    message = $"No next car found after lot {currentLotNumber}",
                    auctionId,
                    currentLotNumber,
                    searchedBy = currentUser
                });

            return Ok(nextCar);
        }

        [HttpGet("auction/{auctionId}/ready")]
        [Authorize(Roles = "Admin,AuctionManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetCarsReady(Guid auctionId)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting cars ready for auction - User: {User}, AuctionId: {AuctionId}",
                currentUser, auctionId);

            var carsReady = await _auctionCarService.GetCarsReadyForAuctionAsync(auctionId);
            return Ok(carsReady);
        }

        [HttpGet("auction/{auctionId}/unsold")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetUnsoldCars(Guid auctionId)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting unsold cars - User: {User}, AuctionId: {AuctionId}",
                currentUser, auctionId);

            var unsoldCars = await _auctionCarService.GetUnsoldCarsAsync(auctionId);
            return Ok(unsoldCars);
        }

        [HttpGet("auction/{auctionId}/awaiting-approval")]
        [Authorize(Roles = "Admin,Seller")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetCarsAwaitingApproval(Guid auctionId)
        {
            var currentUser = GetCurrentUserName();
            _logger.LogInformation("Getting cars awaiting approval - User: {User}, AuctionId: {AuctionId}",
                currentUser, auctionId);

            var awaitingCars = await _auctionCarService.GetCarsAwaitingApprovalAsync(auctionId);
            return Ok(awaitingCars);
        }

        [HttpGet("user/{userId}/won")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AuctionCarGetDto>>> GetUserWonCars(
            Guid userId,
            [FromQuery] Guid? auctionId = null)
        {
            var currentUserId = GetCurrentUserId();
            var currentUser = GetCurrentUserName();

            // ✅ User can only see their own wins unless they are Admin
            if (userId != currentUserId && !User.IsInRole("Admin"))
            {
                return Forbid("You can only view your own won cars");
            }

            _logger.LogInformation("Getting user won cars - Requested by: {User} (ID: {UserId}), Target User: {TargetUserId}, AuctionId: {AuctionId}",
                currentUser, currentUserId, userId, auctionId ?? Guid.Empty);

            if (!auctionId.HasValue)
                return BadRequest(new { message = "AuctionId is required" });

            var wonCars = await _auctionCarService.GetUserWonCarsAsync(userId, auctionId.Value);
            return Ok(wonCars);
        }

        #endregion
        #region Vehicle Finder
        [HttpGet("auction-status")]
        [ProducesResponseType(typeof(VehicleFinderAuctionStatusDto), 200)]
        public async Task<IActionResult> GetAuctionStatus([FromQuery] Guid carId)
        {
            if (carId == Guid.Empty) return BadRequest("carId required");
            var list = await _auctionCarService.GetAuctionStatusForCarsAsync(new[] { carId });
            var single = list != null ? System.Linq.Enumerable.FirstOrDefault(list) : null;
            if (single == null) return NotFound();
            return Ok(single);
        }
        public class BatchRequest { public IEnumerable<Guid>? CarIds { get; set; } }

        [HttpPost("auction-status/batch")]
        [ProducesResponseType(typeof(IEnumerable<VehicleFinderAuctionStatusDto>), 200)]
        public async Task<IActionResult> GetAuctionStatusBatch([FromBody] BatchRequest req)
        {
            var carIds = req?.CarIds ?? Array.Empty<Guid>();
            if (!carIds.Any()) return BadRequest("carIds required");

            // Limit: prevent large payloads
            if (carIds.Count() > 200) return BadRequest("Max 200 carIds allowed per request");

            var res = await _auctionCarService.GetAuctionStatusForCarsAsync(carIds);
            return Ok(res);
        }
        #endregion
        #region Request Models

        public class UpdatePriceRequest
        {
            [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero")]
            public decimal NewPrice { get; set; }
        }

        public class MarkUnsoldRequest
        {
            [Required(ErrorMessage = "Reason is required")]
            [MinLength(3, ErrorMessage = "Reason must be at least 3 characters")]
            public string Reason { get; set; } = string.Empty;
        }

        public class EndAuctionRequest
        {
            public string? Reason { get; set; }
        }

        public class ApproveWinnerRequest
        {
            public string? ApprovalNotes { get; set; }
        }

        public class RejectWinnerRequest
        {
            [Required(ErrorMessage = "Rejection reason is required")]
            [MinLength(3, ErrorMessage = "Rejection reason must be at least 3 characters")]
            public string RejectionReason { get; set; } = string.Empty;
        }

        public class DepositPaidRequest
        {
            [Range(0.01, double.MaxValue, ErrorMessage = "Deposit amount must be greater than zero")]
            public decimal DepositAmount { get; set; }
        }

        public class CompletePaymentRequest
        {
            [Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than zero")]
            public decimal TotalAmount { get; set; }
        }

        public class AssignLaneRequest
        {
            [Range(1, 20, ErrorMessage = "Lane number must be between 1 and 20")]
            public int LaneNumber { get; set; }

            [Range(1, 1000, ErrorMessage = "Run order must be between 1 and 1000")]
            public int RunOrder { get; set; }

            [Required(ErrorMessage = "Scheduled time is required")]
            public DateTime ScheduledTime { get; set; }
        }

        #endregion
    }
}