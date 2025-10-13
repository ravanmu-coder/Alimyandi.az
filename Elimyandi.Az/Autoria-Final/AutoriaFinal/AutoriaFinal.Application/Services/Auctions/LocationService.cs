using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.Location;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Auctions
{
    public class LocationService : GenericService<
        Location,
        LocationGetDto,
        LocationDetailDto,
        LocationCreateDto,
        LocationUpdateDto>,ILocationService
    {
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<LocationService> _logger;
        public LocationService(
     ILocationRepository locationRepository,
     IMapper mapper,
     IUnitOfWork unitOfWork,
     ILogger<GenericService<Location, LocationGetDto, LocationDetailDto, LocationCreateDto, LocationUpdateDto>> baseLogger,
     ILogger<LocationService> logger)
     : base(locationRepository, mapper, unitOfWork, baseLogger)
        {
            _locationRepository = locationRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<LocationDetailDto?> GetByNameAsync(string name)
        {
            _logger.LogInformation("Fetching location by name {Name}", name);

            var entity = await _locationRepository.GetByNameAsync(name);
            if (entity == null)
            {
                _logger.LogWarning("Location with name {Name} not found", name);
                throw new NotFoundException("Location", name);
            }

            _logger.LogInformation("Location with name {Name} retrieved successfully", name);
            return _mapper.Map<LocationDetailDto>(entity);
        }
    }
}
