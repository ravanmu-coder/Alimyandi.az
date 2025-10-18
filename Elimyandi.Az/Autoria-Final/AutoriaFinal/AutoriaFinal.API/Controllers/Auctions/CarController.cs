using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Application.Services.Auctions;
using AutoriaFinal.Contract.Dtos.Auctions.Car;
using AutoriaFinal.Contract.Services.Auctions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoriaFinal.API.Controllers.Auctions
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CarController : ControllerBase
    {
        private readonly ICarService _carService;
        private readonly ILogger<CarController> _logger;
        public CarController(ICarService carService, ILogger<CarController> logger)
        {
            _carService = carService;
            _logger = logger;
        }
        //GET api/car   
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cars = await _carService.GetAllAsync();
            return Ok(cars);
        }
        //GET api/car/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var car = await _carService.GetByIdAsync(id);
            if (car == null)
                return NotFound();
            return Ok(car);
        }
        //POST api/car
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CarCreateDto dto)
        {
            var traceId = HttpContext.TraceIdentifier;
            var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            _logger.LogInformation("HTTP POST /api/car Create. TraceId={TraceId}, Owner={OwnerId}, VIN={Vin}", traceId, ownerId, dto?.Vin);
            _logger.LogInformation("RECEIVED DATA - Mileage={Mileage}, MileageUnit={MileageUnit}, Make={Make}, Model={Model}, Year={Year}, FuelType={FuelType}, DamageType={DamageType}, Price={Price}", 
                dto?.Mileage, dto?.MileageUnit, dto?.Make, dto?.Model, dto?.Year, dto?.FuelType, dto?.DamageType, dto?.Price);

            if (string.IsNullOrEmpty(ownerId))
            {
                _logger.LogWarning("Create unauthorized. TraceId={TraceId}", traceId);
                throw new UnauthorizedException("User not authenticated."); // middleware will map to 401. :contentReference[oaicite:16]{index=16}
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Create model invalid. TraceId={TraceId}, Errors={Errors}", traceId, ModelState);
                throw new BadRequestException("Invalid request data."); // middleware -> 400. :contentReference[oaicite:17]{index=17}
            }

            // No try/catch — let service throw application exceptions
            var created = await _carService.AddCarAsync(dto, ownerId);

            _logger.LogInformation("Create succeeded. CarId={CarId}, TraceId={TraceId}", created.Id, traceId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // Updated method to use CarResponseDto instead of CarRequestDto
        [HttpPut("{id}")]
        
        public async Task<IActionResult> Update(Guid id, [FromBody] CarUpdateDto dto)
        {
            var updated = await _carService.UpdateAsync(id, dto);
            return Ok(updated);
        }
        //DELETE api/car/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _carService.DeleteAsync(id);
            return result ? NoContent() : NotFound();
        }
        //GET api/car/vin/{vin}
        [HttpGet("vin/{vin}")]
        public async Task<IActionResult> GetByVin(string vin)
        {
            var car = await _carService.GetByVinAsync(vin);
            if (car == null)
                return NotFound();
            return Ok(car);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyAdvertisements()
        {
            var traceId = HttpContext.TraceIdentifier;
            var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            _logger.LogInformation("HTTP GET /api/car/mine. TraceId={TraceId}, Owner={OwnerId}", traceId, ownerId);

            if (string.IsNullOrEmpty(ownerId))
            {
                _logger.LogWarning("GetMyAdvertisements unauthorized. TraceId={TraceId}", traceId);
                throw new UnauthorizedException("User not authenticated."); 
            }

            var cars = await _carService.GetByOwnerIdAsync(ownerId);

            _logger.LogInformation("Returning {Count} cars for owner. Owner={OwnerId}, TraceId={TraceId}", cars?.Count() ?? 0, ownerId, traceId);
            return Ok(cars);
        }
        [HttpPost("{id}/photo")]
        [RequestSizeLimit(50_000_000)] // 50MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadPhoto([FromRoute] Guid id, [FromForm] FileUploadDto dto)
        {
            if (dto?.File == null)
            {
                _logger.LogWarning("UploadPhoto called without file. CarId={CarId}, TraceId={TraceId}", id, HttpContext.TraceIdentifier);
                throw new BadRequestException("Photo file is required.");
            }

            var result = await _carService.UploadPhotoAsync(id, dto.File);
            return Ok(result);
        }
        [HttpPost("{id}/video")]
        [RequestSizeLimit(500_000_000)] // 500MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadVideo([FromRoute] Guid id, [FromForm] FileUploadDto dto)
        {
            if (dto?.File == null)
            {
                _logger.LogWarning("UploadVideo called without file. CarId={CarId}, TraceId={TraceId}", id, HttpContext.TraceIdentifier);
                throw new BadRequestException("Video file is required.");
            }

            var result = await _carService.UploadVideoAsync(id, dto.File);
            return Ok(result);
        }
        
        
    }
}
