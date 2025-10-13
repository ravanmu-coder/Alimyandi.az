using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Enums.Bids;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Repositories.Auctions;
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
    public class BidController : ControllerBase
    {
        private readonly IBidService _bidService;
        private readonly IBidRepository _bidRepository;
        private readonly ILogger<BidController> _logger;
        private readonly IHubContext<AuctionHub> _hubContext;
        private readonly IHubContext<BidHub> _bidHubContext;

        public BidController(
            IBidService bidService,
            IBidRepository bidRepository,
            ILogger<BidController> logger,
            IHubContext<AuctionHub> hubContext,
            IHubContext<BidHub> bidHubContext)
        {
            _bidService = bidService;
            _bidRepository = bidRepository;
            _logger = logger;
            _hubContext = hubContext;
            _bidHubContext = bidHubContext;
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

        private string GetClientIPAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        private string GetClientUserAgent()
        {
            return Request.Headers.UserAgent.FirstOrDefault() ?? "Unknown";
        }

        private string GetAnonymizedCapacity(decimal amount)
        {
            return amount switch
            {
                < 1000m => "Small",
                < 5000m => "Medium",
                < 10000m => "Large",
                < 50000m => "Very Large",
                _ => "Institutional"
            };
        }

        private int CalculatePerformanceScore(BidSummaryDto summary)
        {
            if (summary.TotalBids == 0) return 0;

            try
            {
                var winRate = Convert.ToDouble(summary.WinRate);

                var efficiency = 0.0;
                if (summary.TotalBids > 0 && summary.HighestBidAmount > 0)
                {
                    efficiency = (Convert.ToDouble(summary.AverageBidAmount) /
                                 Convert.ToDouble(summary.HighestBidAmount)) * 100.0;
                }

                var finalScore = (winRate * 0.6) + (efficiency * 0.4);

                return Math.Max(0, Math.Min(100, (int)Math.Round(finalScore)));
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Performance score calculation failed: {Error}", ex.Message);
                return 0;
            }
        }

        private string GetRecommendationLevel(BidSummaryDto summary)
        {
            var score = CalculatePerformanceScore(summary);

            return score switch
            {
                >= 80 => "Expert Bidder",
                >= 60 => "Experienced",
                >= 40 => "Intermediate",
                >= 20 => "Beginner",
                _ => "New User"
            };
        }

        #endregion

        #region Core Bid Operations

        [HttpPost("prebid")]
        [ProducesResponseType(typeof(ApiResponse<BidDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<BidDetailDto>>> PlacePreBid([FromBody] PlacePreBidRequest request)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("📋 PRE-BID REQUEST: User {UserId} ({UserName}), Car {AuctionCarId}, Amount ${Amount} at {Time}",
                userId, userName, request.AuctionCarId, request.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var dto = new BidCreateDto
                {
                    AuctionCarId = request.AuctionCarId,
                    UserId = userId,
                    Amount = request.Amount,
                    BidType = BidTypeDto.PreBid,
                    IsPreBid = true,
                    Notes = request.Notes,
                    IPAddress = GetClientIPAddress(),
                    UserAgent = GetClientUserAgent()
                };

                var validation = await _bidService.ValidateBidAsync(dto);
                if (!validation.IsValid)
                {
                    _logger.LogWarning("❌ Pre-bid validation failed: User {UserId} ({UserName}), Errors: [{Errors}] at {Time}",
                        userId, userName, string.Join(", ", validation.Errors), DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Pre-bid validation failed",
                        Data = new
                        {
                            Errors = validation.Errors,
                            Warnings = validation.Warnings,
                            MinimumBid = validation.MinimumBidAmount,
                            SuggestedAmount = validation.SuggestedBidAmount,
                            CurrentHighest = validation.CurrentHighestBid,
                            ValidationTimestamp = DateTime.UtcNow
                        },
                        ProcessedBy = userName
                    });
                }

                var result = await _bidService.PlaceBidAsync(dto);

                await _bidHubContext.Clients.Group($"AuctionCar-{request.AuctionCarId}")
                    .SendAsync("PreBidPlaced", new
                    {
                        result.Id,
                        result.AuctionCarId,
                        result.UserId,
                        result.Amount,
                        result.PlacedAtUtc,
                        result.UserName,
                        BidType = "PreBid",
                        LotNumber = result.AuctionCarLotNumber,
                        ProcessedBy = userName,
                        ProcessedAt = DateTime.UtcNow,
                        ValidationPassed = true
                    });

                _logger.LogInformation("✅ PRE-BID SUCCESS: {BidId} - User {UserId} ({UserName}) - ${Amount} - Lot {LotNumber} at {Time}",
                    result.Id, userId, userName, request.Amount, result.AuctionCarLotNumber, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return Ok(new ApiResponse<BidDetailDto>
                {
                    Success = true,
                    Message = "Pre-bid uğurla yerləşdirildi",
                    Data = result,
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 PRE-BID ERROR: User {UserId} ({UserName}), Car {AuctionCarId}, Amount ${Amount} at {Time}",
                    userId, userName, request.AuctionCarId, request.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = new { Error = "Pre-bid placement failed", Timestamp = DateTime.UtcNow },
                    ProcessedBy = userName
                });
            }
        }

        [HttpPost("live")]
        [ProducesResponseType(typeof(ApiResponse<BidDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<BidDetailDto>>> PlaceLiveBid([FromBody] PlaceLiveBidRequest request)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("🔴 LIVE-BID REQUEST: User {UserId} ({UserName}), Car {AuctionCarId}, Amount ${Amount} at {Time}",
                userId, userName, request.AuctionCarId, request.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var recentBids = await _bidService.GetBidsAfterTimeAsync(request.AuctionCarId, DateTime.UtcNow.AddSeconds(-10));
                var userRecentManualBids = recentBids.Count(b => b.UserId == userId && !b.IsAutoBid);

                if (userRecentManualBids >= 3)
                {
                    _logger.LogWarning("⚠️ RATE LIMITED: User {UserId} ({UserName}) - {Count} bids in 10 seconds at {Time}",
                        userId, userName, userRecentManualBids, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                    return StatusCode(429, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Çox tez bid verirsiniz. 10 saniyə gözləyin.",
                        Data = new
                        {
                            RetryAfter = 10,
                            RecentBidsCount = userRecentManualBids,
                            CooldownUntil = DateTime.UtcNow.AddSeconds(10),
                            Reason = "Rate limit protection"
                        },
                        ProcessedBy = userName
                    });
                }

                var hasActiveProxy = await _bidRepository.HasActiveProxyBidAsync(userId, request.AuctionCarId);
                if (hasActiveProxy)
                {
                    var userProxyBids = await _bidService.GetUserActiveProxyBidsAsync(userId, request.AuctionCarId);

                    _logger.LogWarning("⚠️ PROXY CONFLICT: User {UserId} ({UserName}) has active proxy bids at {Time}",
                        userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                    return Conflict(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Aktiv proxy bid-iniz var. Əvvəlcə onu ləğv edin və ya bitməsini gözləyin.",
                        Data = new
                        {
                            ActiveProxyBids = userProxyBids.Count(),
                            ConflictType = "ActiveProxyBid",
                            Resolution = "Cancel proxy bid or wait for expiration",
                            ProxyBids = userProxyBids.Select(p => new {
                                p.Id,
                                p.Amount,
                                p.ProxyMax,
                                p.ValidUntil
                            })
                        },
                        ProcessedBy = userName
                    });
                }

                var dto = new BidCreateDto
                {
                    AuctionCarId = request.AuctionCarId,
                    UserId = userId,
                    Amount = request.Amount,
                    BidType = BidTypeDto.Regular,
                    IsPreBid = false,
                    IPAddress = GetClientIPAddress(),
                    UserAgent = GetClientUserAgent()
                };

                var validation = await _bidService.ValidateBidAsync(dto);
                if (!validation.IsValid)
                {
                    _logger.LogWarning("❌ Live-bid validation failed: User {UserId} ({UserName}), Errors: [{Errors}] at {Time}",
                        userId, userName, string.Join(", ", validation.Errors), DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Live bid validation failed",
                        Data = new
                        {
                            Errors = validation.Errors,
                            Warnings = validation.Warnings,
                            MinimumBid = validation.MinimumBidAmount,
                            SuggestedAmount = validation.SuggestedBidAmount,
                            CurrentHighest = validation.CurrentHighestBid,
                            AuctionActive = validation.AuctionActive,
                            RequiresPreBid = validation.RequiresPreBid
                        },
                        ProcessedBy = userName
                    });
                }

                var result = await _bidService.PlaceBidAsync(dto);

                var groupName = $"AuctionCar-{request.AuctionCarId}";

                await _bidHubContext.Clients.Group(groupName).SendAsync("NewLiveBid", new
                {
                    result.Id,
                    result.AuctionCarId,
                    result.UserId,
                    result.Amount,
                    result.PlacedAtUtc,
                    result.UserName,
                    result.IsHighestBid,
                    BidType = "Live",
                    LotNumber = result.AuctionCarLotNumber,
                    SequenceNumber = result.SequenceNumber,
                    ProcessedBy = userName,
                    ProcessedAt = DateTime.UtcNow
                });

                await _bidHubContext.Clients.Group(groupName).SendAsync("HighestBidUpdated", new
                {
                    AuctionCarId = request.AuctionCarId,
                    Amount = result.Amount,
                    BidderId = result.UserId,
                    BidderName = result.UserName,
                    PreviousAmount = validation.CurrentHighestBid,
                    Increment = result.Amount - validation.CurrentHighestBid,
                    UpdatedAt = DateTime.UtcNow,
                    NextMinimum = result.NextMinimumBid,
                    UpdatedBy = userName
                });

                await _bidHubContext.Clients.Group(groupName).SendAsync("AuctionTimerReset", new
                {
                    AuctionCarId = request.AuctionCarId,
                    SecondsRemaining = 10,
                    ResetAt = DateTime.UtcNow,
                    ResetBy = "LiveBid",
                    BidId = result.Id,
                    ResetByUser = userName
                });

                var stats = await _bidService.GetBidStatsAsync(request.AuctionCarId);
                await _bidHubContext.Clients.Group(groupName).SendAsync("BidStatsUpdated", new
                {
                    Stats = stats,
                    LastUpdate = DateTime.UtcNow,
                    UpdatedBy = userName
                });

                _logger.LogInformation("✅ LIVE-BID SUCCESS: {BidId} - User {UserId} ({UserName}) - ${Amount} - Highest: {IsHighest} - Lot {LotNumber} at {Time}",
                    result.Id, userId, userName, request.Amount, result.IsHighestBid, result.AuctionCarLotNumber, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return Ok(new ApiResponse<BidDetailDto>
                {
                    Success = true,
                    Message = result.IsHighestBid ? "You are now the highest bidder!" : "Bid placed successfully",
                    Data = result,
                    Metadata = new
                    {
                        TimerReset = true,
                        IsHighestBid = result.IsHighestBid,
                        NextMinimumBid = result.NextMinimumBid,
                        PriceIncrease = result.Amount - validation.CurrentHighestBid,
                        BidSequence = result.SequenceNumber
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 LIVE-BID ERROR: User {UserId} ({UserName}), Car {AuctionCarId}, Amount ${Amount} at {Time}",
                    userId, userName, request.AuctionCarId, request.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = new
                    {
                        Error = "Live bid placement failed",
                        ErrorType = ex.GetType().Name,
                        Timestamp = DateTime.UtcNow
                    },
                    ProcessedBy = userName
                });
            }
        }

        [HttpPost("proxy")]
        [ProducesResponseType(typeof(ApiResponse<BidDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<BidDetailDto>>> PlaceProxyBid([FromBody] PlaceProxyBidRequest request)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("🤖 PROXY-BID REQUEST: User {UserId} ({UserName}), Car {AuctionCarId}, Start ${StartAmount}, Max ${MaxAmount} at {Time}",
                userId, userName, request.AuctionCarId, request.StartAmount, request.MaxAmount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var efficiency = await _bidService.AnalyzeProxyEfficiencyAsync(request.AuctionCarId, request.MaxAmount, userId);

                var proxyDto = new ProxyBidDto
                {
                    AuctionCarId = request.AuctionCarId,
                    UserId = userId,
                    StartAmount = request.StartAmount,
                    MaxAmount = request.MaxAmount,
                    Notes = request.Notes,
                    IsPreBid = request.IsPreBid
                };

                var result = await _bidService.PlaceProxyBidAsync(proxyDto);

                await _bidHubContext.Clients.User(userId.ToString()).SendAsync("ProxyBidSuccess", new
                {
                    result.Id,
                    result.Amount,
                    result.ProxyMax,
                    result.ValidUntil,
                    Efficiency = efficiency,
                    Message = $"Proxy bid active: ${request.StartAmount:N0} - ${request.MaxAmount:N0}",
                    ProcessedBy = userName,
                    ProcessedAt = DateTime.UtcNow
                });

                await _bidHubContext.Clients.Group($"AuctionCar-{request.AuctionCarId}")
                    .SendAsync("ProxyBidderJoined", new
                    {
                        AuctionCarId = request.AuctionCarId,
                        UserId = userId,
                        StartAmount = request.StartAmount,
                        IsPreBid = request.IsPreBid,
                        CompetitionLevel = efficiency.WinProbability,
                        AnonymizedCapacity = GetAnonymizedCapacity(request.MaxAmount),
                        JoinedAt = DateTime.UtcNow,
                        JoinedBy = userName
                    });

                _logger.LogInformation("✅ PROXY-BID SUCCESS: {BidId} - User {UserId} ({UserName}) - Start ${Start}, Max ${Max} - Win Probability: {WinProb}% at {Time}",
                    result.Id, userId, userName, request.StartAmount, request.MaxAmount, efficiency.WinProbability, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return Ok(new ApiResponse<BidDetailDto>
                {
                    Success = true,
                    Message = "Proxy bid activated successfully",
                    Data = result,
                    Metadata = new
                    {
                        Efficiency = efficiency,
                        AnonymizedCapacity = GetAnonymizedCapacity(request.MaxAmount),
                        ProxyStrategy = efficiency.Strategy,
                        WinProbability = efficiency.WinProbability,
                        RecommendedMax = efficiency.RecommendedMax,
                        EstimatedFinalPrice = efficiency.EstimatedFinalPrice
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 PROXY-BID ERROR: User {UserId} ({UserName}), Car {AuctionCarId}, Start ${Start}, Max ${Max} at {Time}",
                    userId, userName, request.AuctionCarId, request.StartAmount, request.MaxAmount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = new
                    {
                        Error = "Proxy bid placement failed",
                        ErrorType = ex.GetType().Name,
                        Timestamp = DateTime.UtcNow
                    },
                    ProcessedBy = userName
                });
            }
        }

        [HttpDelete("proxy/{bidId}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> CancelProxyBid(Guid bidId)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("❌ PROXY CANCEL REQUEST: {BidId} by User {UserId} ({UserName}) at {Time}",
                bidId, userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var success = await _bidService.CancelProxyBidAsync(bidId, userId);
                if (!success)
                {
                    _logger.LogWarning("⚠️ PROXY CANCEL FAILED: {BidId} - Invalid bid or permission denied for User {UserId} ({UserName}) at {Time}",
                        bidId, userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to cancel proxy bid. It may not exist or you may not have permission.",
                        Data = new
                        {
                            BidId = bidId,
                            Reason = "Bid not found or permission denied",
                            Timestamp = DateTime.UtcNow
                        },
                        ProcessedBy = userName
                    });
                }

                await _bidHubContext.Clients.User(userId.ToString()).SendAsync("ProxyBidCancelled", new
                {
                    BidId = bidId,
                    CancelledAt = DateTime.UtcNow,
                    ProcessedBy = userName,
                    Reason = "User cancellation"
                });

                _logger.LogInformation("✅ PROXY CANCELLED: {BidId} by User {UserId} ({UserName}) at {Time}",
                    bidId, userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Proxy bid cancelled successfully",
                    Data = new
                    {
                        BidId = bidId,
                        CancelledAt = DateTime.UtcNow,
                        ProcessedBy = userName
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 PROXY CANCEL ERROR: {BidId} by User {UserId} ({UserName}) at {Time}",
                    bidId, userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = new { Error = "Proxy bid cancellation failed", Timestamp = DateTime.UtcNow },
                    ProcessedBy = userName
                });
            }
        }

        #endregion

        #region Advanced Proxy Features

        [HttpGet("auction-car/{auctionCarId}/proxy-battle-status")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<ProxyStatusResult>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<ProxyStatusResult>>> GetProxyBattleStatus(Guid auctionCarId)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            _logger.LogInformation("🔥 PROXY BATTLE STATUS: Car {AuctionCarId} requested by {User} at {Time}",
                auctionCarId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var status = await _bidService.GetProxyBattleStatusAsync(auctionCarId);

                return Ok(new ApiResponse<ProxyStatusResult>
                {
                    Success = true,
                    Message = "Proxy battle status retrieved",
                    Data = status,
                    Metadata = new
                    {
                        RefreshInterval = 5000,
                        LastUpdate = DateTime.UtcNow,
                        DataFreshness = "Real-time"
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 PROXY BATTLE STATUS ERROR: Car {AuctionCarId} by {User} at {Time}",
                    auctionCarId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<ProxyStatusResult>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = currentUser
                });
            }
        }

        [HttpPost("auction-car/{auctionCarId}/analyze-proxy-efficiency")]
        [ProducesResponseType(typeof(ApiResponse<ProxyEfficiencyResult>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<ProxyEfficiencyResult>>> AnalyzeProxyEfficiency(
            Guid auctionCarId,
            [FromBody] AnalyzeProxyRequest request)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("📊 PROXY EFFICIENCY ANALYSIS: User {UserId} ({UserName}), Car {AuctionCarId}, Proposed Max ${ProposedMax} at {Time}",
                userId, userName, auctionCarId, request.ProposedMax, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var analysis = await _bidService.AnalyzeProxyEfficiencyAsync(auctionCarId, request.ProposedMax, userId);

                return Ok(new ApiResponse<ProxyEfficiencyResult>
                {
                    Success = true,
                    Message = "Proxy efficiency analysis completed",
                    Data = analysis,
                    Metadata = new
                    {
                        AnalysisType = "Advanced Competitive Intelligence",
                        Recommendation = analysis.IsRecommended ? "Recommended" : "Not Recommended",
                        ConfidenceLevel = analysis.WinProbability >= 70 ? "High" : analysis.WinProbability >= 40 ? "Medium" : "Low"
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 PROXY EFFICIENCY ERROR: User {UserId} ({UserName}), Car {AuctionCarId} at {Time}",
                    userId, userName, auctionCarId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<ProxyEfficiencyResult>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = userName
                });
            }
        }

        #endregion

        #region Bid Info & History

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<BidDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<BidDetailDto>>> GetBidById(Guid id)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            _logger.LogInformation("🔍 BID DETAILS REQUEST: {BidId} by {User} at {Time}",
                id, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var bid = await _bidService.GetByIdAsync(id);

                return Ok(new ApiResponse<BidDetailDto>
                {
                    Success = true,
                    Message = "Bid details retrieved successfully",
                    Data = bid,
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 BID DETAILS ERROR: {BidId} by {User} at {Time}",
                    id, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Bid not found",
                    Data = new { BidId = id, Timestamp = DateTime.UtcNow },
                    ProcessedBy = currentUser
                });
            }
        }

        [HttpGet("auction-car/{auctionCarId}/history")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<BidHistoryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<BidHistoryDto>>> GetBidHistory(
            Guid auctionCarId,
            [FromQuery] int pageSize = 50)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            _logger.LogInformation("📊 BID HISTORY REQUEST: Car {AuctionCarId}, PageSize {PageSize} by {User} at {Time}",
                auctionCarId, pageSize, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var history = await _bidService.GetBidHistoryAsync(auctionCarId, pageSize);

                return Ok(new ApiResponse<BidHistoryDto>
                {
                    Success = true,
                    Message = "Bid history retrieved successfully",
                    Data = history,
                    Metadata = new
                    {
                        PageSize = pageSize,
                        TotalBids = history.TotalBids,
                        UniqueBidders = history.UniqueBidders,
                        DataFreshness = "Real-time"
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 BID HISTORY ERROR: Car {AuctionCarId} by {User} at {Time}",
                    auctionCarId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<BidHistoryDto>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = currentUser
                });
            }
        }

        [HttpGet("auction-car/{auctionCarId}/recent")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BidGetDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IEnumerable<BidGetDto>>>> GetRecentBids(
            Guid auctionCarId,
            [FromQuery] int count = 10)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            try
            {
                var recentBids = await _bidService.GetRecentBidsAsync(auctionCarId, count);

                _logger.LogInformation("Recent bids requested by {User} for car {AuctionCarId} - Found {Count} bids",
                    currentUser, auctionCarId, recentBids.Count());

                return Ok(new ApiResponse<IEnumerable<BidGetDto>>
                {
                    Success = true,
                    Message = "Recent bids retrieved successfully",
                    Data = recentBids,
                    Metadata = new
                    {
                        Count = recentBids.Count(),
                        RequestedCount = count,
                        RefreshInterval = 2000
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 RECENT BIDS ERROR: Car {AuctionCarId} by {User} at {Time}",
                    auctionCarId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<IEnumerable<BidGetDto>>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = currentUser
                });
            }
        }

        [HttpGet("auction-car/{auctionCarId}/stats")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<BidStatsDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<BidStatsDto>>> GetBidStats(Guid auctionCarId)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            try
            {
                var stats = await _bidService.GetBidStatsAsync(auctionCarId);

                _logger.LogInformation("Bid stats requested by {User} for car {AuctionCarId}",
                    currentUser, auctionCarId);

                return Ok(new ApiResponse<BidStatsDto>
                {
                    Success = true,
                    Message = "Bid statistics retrieved successfully",
                    Data = stats,
                    Metadata = new
                    {
                        LastCalculated = DateTime.UtcNow,
                        RefreshInterval = 5000,
                        Accuracy = "Real-time"
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 BID STATS ERROR: Car {AuctionCarId} by {User} at {Time}",
                    auctionCarId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<BidStatsDto>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = currentUser
                });
            }
        }

        [HttpGet("auction-car/{auctionCarId}/highest")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<BidDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<BidDetailDto>>> GetHighestBid(Guid auctionCarId)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            try
            {
                var highestBid = await _bidService.GetHighestBidAsync(auctionCarId);

                if (highestBid == null)
                {
                    return Ok(new ApiResponse<BidDetailDto>
                    {
                        Success = true,
                        Message = "No bids found for this auction car",
                        Data = null,
                        Timestamp = DateTime.UtcNow,
                        ProcessedBy = currentUser
                    });
                }

                _logger.LogInformation("Highest bid retrieved by {User} for car {AuctionCarId} - Amount: ${Amount}",
                    currentUser, auctionCarId, highestBid.Amount);

                return Ok(new ApiResponse<BidDetailDto>
                {
                    Success = true,
                    Message = "Highest bid retrieved successfully",
                    Data = highestBid,
                    Metadata = new
                    {
                        IsRealTime = true,
                        LastUpdate = DateTime.UtcNow
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 HIGHEST BID ERROR: Car {AuctionCarId} by {User} at {Time}",
                    auctionCarId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<BidDetailDto>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = currentUser
                });
            }
        }

        [HttpGet("auction-car/{auctionCarId}/minimum")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<object>>> GetMinimumBid(Guid auctionCarId)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "Anonymous";

            try
            {
                // ✅ FİX: Mövcud service method istifadə et
                var minimumBid = await _bidService.GetMinimumBidAmountAsync(auctionCarId);

                // ✅ FİX: 0 və ya neqativ olarsa fallback
                if (minimumBid <= 0)
                {
                    // ✅ FİX: Yeni repository method istifadə et
                    var auctionCar = await _bidRepository.GetAuctionCarWithBidsAsync(auctionCarId);
                    if (auctionCar != null)
                    {
                        var currentPrice = auctionCar.CurrentPrice;

                        if (currentPrice > 0)
                        {
                            // Copart-style increment hesabla
                            minimumBid = currentPrice + (currentPrice switch
                            {
                                < 100m => 25m,
                                < 500m => 50m,
                                < 1000m => 100m,
                                < 5000m => 250m,
                                < 10000m => 500m,
                                _ => 1000m
                            });
                        }
                        else
                        {
                            minimumBid = Math.Max(100m, auctionCar.StartPrice);
                        }
                    }
                    else
                    {
                        minimumBid = 100m; // Absolute fallback
                    }
                }

                _logger.LogInformation("✅ Minimum bid calculated: {AuctionCarId} = ${Amount} by {User}",
                    auctionCarId, minimumBid, currentUser);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Minimum bid amount retrieved successfully",
                    Data = new
                    {
                        MinimumBidAmount = minimumBid,
                        Currency = "USD",
                        CalculatedAt = DateTime.UtcNow,
                        ValidUntil = DateTime.UtcNow.AddMinutes(5)
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 MINIMUM BID ERROR: Car {AuctionCarId} by {User}",
                    auctionCarId, currentUser);

                // ✅ FİX: Error zamanı da valid response
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Using fallback minimum bid calculation",
                    Data = new
                    {
                        MinimumBidAmount = 100m, // Safe fallback
                        Currency = "USD",
                        CalculatedAt = DateTime.UtcNow,
                        ValidUntil = DateTime.UtcNow.AddMinutes(5),
                        Note = "Calculated using fallback logic"
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
        }

        #endregion

        #region User Bids

        [HttpGet("my-bids")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BidGetDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IEnumerable<BidGetDto>>>> GetMyBids()
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("👤 MY BIDS REQUEST: User {UserId} ({UserName}) at {Time}",
                userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var userBids = await _bidService.GetUserBidsAsync(userId);

                _logger.LogInformation("User bids retrieved for {UserId} ({UserName}) - Found {Count} bids",
                    userId, userName, userBids.Count());

                return Ok(new ApiResponse<IEnumerable<BidGetDto>>
                {
                    Success = true,
                    Message = "User bids retrieved successfully",
                    Data = userBids,
                    Metadata = new
                    {
                        TotalBids = userBids.Count(),
                        UserId = userId,
                        DataScope = "All user bids"
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 MY BIDS ERROR: User {UserId} ({UserName}) at {Time}",
                    userId, userName, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<IEnumerable<BidGetDto>>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = userName
                });
            }
        }

        [HttpGet("my-proxy-bids/{auctionCarId}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BidDetailDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<IEnumerable<BidDetailDto>>>> GetMyProxyBids(Guid auctionCarId)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("🤖 MY PROXY BIDS REQUEST: User {UserId} ({UserName}), Car {AuctionCarId} at {Time}",
                userId, userName, auctionCarId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var proxyBids = await _bidService.GetUserActiveProxyBidsAsync(userId, auctionCarId);

                _logger.LogInformation("User proxy bids retrieved for {UserId} ({UserName}) on car {AuctionCarId} - Found {Count} proxy bids",
                    userId, userName, auctionCarId, proxyBids.Count());

                return Ok(new ApiResponse<IEnumerable<BidDetailDto>>
                {
                    Success = true,
                    Message = "User proxy bids retrieved successfully",
                    Data = proxyBids,
                    Metadata = new
                    {
                        ActiveProxyBids = proxyBids.Count(),
                        UserId = userId,
                        AuctionCarId = auctionCarId
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 MY PROXY BIDS ERROR: User {UserId} ({UserName}), Car {AuctionCarId} at {Time}",
                    userId, userName, auctionCarId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<IEnumerable<BidDetailDto>>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = userName
                });
            }
        }

        [HttpGet("my-summary/{auctionId}")]
        [ProducesResponseType(typeof(ApiResponse<BidSummaryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<BidSummaryDto>>> GetMyBidSummary(Guid auctionId)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("📈 MY BID SUMMARY REQUEST: User {UserId} ({UserName}), Auction {AuctionId} at {Time}",
                userId, userName, auctionId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var summary = await _bidService.GetUserBidSummaryAsync(userId, auctionId);

                _logger.LogInformation("Bid summary retrieved for {UserId} ({UserName}) on auction {AuctionId} - {TotalBids} total bids",
                    userId, userName, auctionId, summary.TotalBids);

                return Ok(new ApiResponse<BidSummaryDto>
                {
                    Success = true,
                    Message = "User bid summary retrieved successfully",
                    Data = summary,
                    Metadata = new
                    {
                        PerformanceScore = CalculatePerformanceScore(summary),
                        AnalysisType = "Comprehensive",
                        RecommendationLevel = GetRecommendationLevel(summary)
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 MY BID SUMMARY ERROR: User {UserId} ({UserName}), Auction {AuctionId} at {Time}",
                    userId, userName, auctionId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<BidSummaryDto>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = userName
                });
            }
        }

        #endregion

        #region Validation & Utilities

        [HttpPost("validate")]
        [ProducesResponseType(typeof(ApiResponse<BidValidationResult>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<BidValidationResult>>> ValidateBid([FromBody] ValidateBidRequest request)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            _logger.LogInformation("✔️ BID VALIDATION REQUEST: User {UserId} ({UserName}), Car {AuctionCarId}, Amount ${Amount} at {Time}",
                userId, userName, request.AuctionCarId, request.Amount, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                var dto = new BidCreateDto
                {
                    AuctionCarId = request.AuctionCarId,
                    UserId = userId,
                    Amount = request.Amount,
                    BidType = request.BidType,
                    IsPreBid = request.IsPreBid,
                    IsProxy = request.IsProxy,
                    ProxyMax = request.ProxyMax
                };

                var validation = await _bidService.ValidateBidAsync(dto);

                _logger.LogInformation("Bid validation completed for {UserId} ({UserName}) - Valid: {IsValid}",
                    userId, userName, validation.IsValid);

                return Ok(new ApiResponse<BidValidationResult>
                {
                    Success = true,
                    Message = validation.IsValid ? "Bid validation passed" : "Bid validation failed",
                    Data = validation,
                    Metadata = new
                    {
                        ValidationTimestamp = DateTime.UtcNow,
                        ValidationType = "Comprehensive",
                        RulesApplied = new[] { "Amount", "Timing", "Authorization", "Competition", "Rate Limiting" }
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 BID VALIDATION ERROR: User {UserId} ({UserName}), Car {AuctionCarId} at {Time}",
                    userId, userName, request.AuctionCarId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<BidValidationResult>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = userName
                });
            }
        }

        [HttpGet("can-bid/{auctionCarId}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<object>>> CanUserPlaceBid(Guid auctionCarId)
        {
            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();

            try
            {
                var canBid = await _bidService.CanUserPlaceBidAsync(userId, auctionCarId);

                _logger.LogInformation("Bid permission check for {UserId} ({UserName}) on car {AuctionCarId} - Can bid: {CanBid}",
                    userId, userName, auctionCarId, canBid);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = canBid ? "User can place bid" : "User cannot place bid",
                    Data = new
                    {
                        CanPlaceBid = canBid,
                        UserId = userId,
                        AuctionCarId = auctionCarId,
                        CheckedAt = DateTime.UtcNow
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = userName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 CAN BID ERROR: User {UserId} ({UserName}), Car {AuctionCarId} at {Time}",
                    userId, userName, auctionCarId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = userName
                });
            }
        }

        #endregion

        #region Real-time Integration

        [HttpPost("notify-auction-event")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<object>>> NotifyAuctionEvent([FromBody] AuctionEventRequest request)
        {
            var currentUser = User.Identity?.IsAuthenticated == true ? GetCurrentUserName() : "System";

            _logger.LogInformation("📢 AUCTION EVENT NOTIFICATION: {EventType} for Auction {AuctionId} by {User} at {Time}",
                request.EventType, request.AuctionId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            try
            {
                switch (request.EventType.ToLower())
                {
                    case "started":
                        await _hubContext.Clients.Group($"auction-{request.AuctionId}")
                            .SendAsync("AuctionStarted", request.AuctionId, request.Data);
                        break;

                    case "ended":
                        await _hubContext.Clients.Group($"auction-{request.AuctionId}")
                            .SendAsync("AuctionEnded", request.AuctionId, request.Data);
                        break;

                    case "extended":
                        await _hubContext.Clients.Group($"auction-{request.AuctionId}")
                            .SendAsync("AuctionExtended", request.AuctionId, request.Data);
                        break;

                    case "timer":
                        await _hubContext.Clients.Group($"auction-{request.AuctionId}")
                            .SendAsync("AuctionTimerUpdated", request.AuctionId, request.Data);
                        break;

                    default:
                        _logger.LogWarning("⚠️ Unknown event type: {EventType}", request.EventType);
                        break;
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Auction event notification sent successfully",
                    Data = new
                    {
                        EventType = request.EventType,
                        AuctionId = request.AuctionId,
                        ProcessedAt = DateTime.UtcNow
                    },
                    Timestamp = DateTime.UtcNow,
                    ProcessedBy = currentUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 AUCTION EVENT ERROR: {EventType} for Auction {AuctionId} by {User} at {Time}",
                    request.EventType, request.AuctionId, currentUser, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null,
                    ProcessedBy = currentUser
                });
            }
        }

        #endregion

        #region Request/Response DTOs

        public class PlacePreBidRequest
        {
            public Guid AuctionCarId { get; set; }
            public decimal Amount { get; set; }
            public string? Notes { get; set; }
        }

        public class PlaceLiveBidRequest
        {
            public Guid AuctionCarId { get; set; }
            public decimal Amount { get; set; }
        }

        public class PlaceProxyBidRequest
        {
            public Guid AuctionCarId { get; set; }
            public decimal StartAmount { get; set; }
            public decimal MaxAmount { get; set; }
            public string? Notes { get; set; }
            public bool IsPreBid { get; set; } = false;
        }

        public class ValidateBidRequest
        {
            public Guid AuctionCarId { get; set; }
            public decimal Amount { get; set; }
            public BidTypeDto BidType { get; set; }
            public bool IsPreBid { get; set; }
            public bool IsProxy { get; set; }
            public decimal? ProxyMax { get; set; }
        }

        public class AuctionEventRequest
        {
            public Guid AuctionId { get; set; }
            public string EventType { get; set; } = default!;
            public object Data { get; set; } = default!;
        }

        public class AnalyzeProxyRequest
        {
            public decimal ProposedMax { get; set; }
        }

        public class ApiResponse<T>
        {
            public bool Success { get; set; }
            public string Message { get; set; } = "";
            public T? Data { get; set; }
            public object? Metadata { get; set; }
            public DateTime Timestamp { get; set; } = DateTime.UtcNow;
            public string ProcessedBy { get; set; } = "";
        }

        #endregion
    }
}