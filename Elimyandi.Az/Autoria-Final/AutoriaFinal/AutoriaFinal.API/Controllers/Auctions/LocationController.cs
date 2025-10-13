using AutoriaFinal.Contract.Dtos.Auctions.Location;
using AutoriaFinal.Contract.Services.Auctions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoriaFinal.API.Controllers.Auctions
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        // GET: api/location
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var locations = await _locationService.GetAllAsync();
            return Ok(locations);
        }

        // GET: api/location/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var location = await _locationService.GetByIdAsync(id);
            if (location == null)
                return NotFound();

            return Ok(location);
        }

        // POST: api/location
        [HttpPost]
        public async Task<IActionResult> Create(LocationCreateDto dto)
        {
            var created = await _locationService.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT: api/location/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, LocationUpdateDto dto)
        {
            var updated = await _locationService.UpdateAsync(id,dto);
            return Ok(updated);
        }

        // DELETE: api/location/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _locationService.DeleteAsync(id);
            return result ? NoContent() : NotFound();
        }
    }
}
