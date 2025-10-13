using AutoriaFinal.Contract.Dtos.Ai.InitialEstimate;
using AutoriaFinal.Contract.Services.Ai.InitialEstimate;
using AutoriaFinal.Domain.Entities.Ai.InitialEstimate;
using AutoriaFinal.Infrastructure.Services.AiServices.InitialEstimate;
using Google.Cloud.AIPlatform.V1;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoriaFinal.API.Controllers.Ai
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ValuationController : ControllerBase
    {
        private readonly GeminiVehicleValuationServiceRest _valuationService;
        private readonly ILogger<ValuationController> _logger;

        public ValuationController(GeminiVehicleValuationServiceRest valuationService, ILogger<ValuationController> logger)
        {
            _valuationService = valuationService;
            _logger = logger;
        }

        [HttpPost("estimate")]
        public async Task<IActionResult> Estimate([FromBody] VehicleDetailsDto vehicle, [FromQuery] decimal? askingPrice = null, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _valuationService.GetEstimateAsync(vehicle, askingPrice, ct);
                if (result == null)
                    return StatusCode(204); // or return NotFound / Empty

                // optional: extra validation
                if (!result.IsValid())
                {
                    _logger.LogWarning("Estimate returned invalid data: {@result}", result);
                    return StatusCode(502, new { message = "Invalid estimate returned from valuation service." });
                }

                return Ok(result);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Estimate request canceled by client");
                return StatusCode(499); // client closed request (nonstandard) or 408
            }
            catch (Grpc.Core.RpcException rpcEx)
            {
                _logger.LogError(rpcEx, "gRPC error while calling Vertex AI");
                return StatusCode(502, new { message = "AI provider error." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in valuation endpoint");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }

}
