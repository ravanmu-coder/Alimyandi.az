using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.Car;
using AutoriaFinal.Contract.Services;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Auctions
{
    public class CarService : GenericService<
        Car,
        CarGetDto,
        CarDetailDto,
        CarCreateDto,
        CarUpdateDto>,
        ICarService
    {
        private readonly ICarRepository _carRepository;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILocationRepository _locationRepository;
        private readonly ILogger<CarService> _logger;
        public CarService(  
      ICarRepository carRepository,
      ILocationRepository locationRepository,
      IFileStorageService fileStorageService,
      IMapper mapper,
      IUnitOfWork unitOfWork,
      ILogger<GenericService<Car, CarGetDto, CarDetailDto, CarCreateDto, CarUpdateDto>> baseLogger,
      ILogger<CarService> logger)   
      : base(carRepository, mapper, unitOfWork, baseLogger)
        {
            _carRepository = carRepository;
            _locationRepository = locationRepository;
            _fileStorageService = fileStorageService;
            _mapper = mapper;
            _logger = logger;
        }
        public async Task<CarDetailDto> AddCarAsync(CarCreateDto dto, string ownerId)
        {
            _logger.LogInformation("Creating car (VIN: {Vin}) for owner {OwnerId}", dto?.Vin, ownerId);
            _logger.LogInformation("Received DTO data: Make={Make}, Model={Model}, Year={Year}, FuelType={FuelType}, DamageType={DamageType}, Price={Price}, Mileage={Mileage}",
                dto?.Make, dto?.Model, dto?.Year, dto?.FuelType, dto?.DamageType, dto?.Price, dto?.Mileage);

            if (dto == null)
            {
                _logger.LogWarning("CarCreateDto is null");
                throw new BadRequestException("Car information cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(dto.Vin))
            {
                _logger.LogWarning("VIN is required");
                throw new BadRequestException("VIN is required.");
            }

            // VIN uniqueness
            var existing = await _carRepository.GetByVinAsync(dto.Vin);
            if (existing != null)
            {
                _logger.LogWarning("Car creation failed: Duplicate VIN {Vin}", dto.Vin);
                throw new ConflictException($"A car with VIN '{dto.Vin}' already exists.");
            }

            var location = await _locationRepository.GetByIdAsync(dto.LocationId);
            if (location == null)
            {
                _logger.LogWarning("Location {LocationId} not found", dto.LocationId);
                throw new NotFoundException("Location", dto.LocationId);
            }

            if (dto.Image != null)
            {
                _logger.LogInformation("Saving image for VIN {Vin}", dto.Vin);
                var imagePath = await _fileStorageService.SaveFileAsync(dto.Image, "images/cars");
                dto.ImagePath = imagePath;
            }

            var entity = _mapper.Map<Car>(dto);
            entity.OwnerId = ownerId;

            _logger.LogInformation("Mapped entity data: Make={Make}, Model={Model}, Year={Year}, FuelType={FuelType}, DamageType={DamageType}, Price={Price}, Mileage={Mileage}",
                entity.Make, entity.Model, entity.Year, entity.FuelType, entity.DamageType, entity.Price, entity.Mileage);

            await _carRepository.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Car created successfully. Id: {CarId} Vin: {Vin}", entity.Id, entity.Vin);

            return _mapper.Map<CarDetailDto>(entity);
        }
        public async Task<IEnumerable<CarGetDto>> GetByOwnerIdAsync(string ownerId)
        {
            _logger.LogInformation("Fetching cars for owner {OwnerId}", ownerId);

            var queryable = _repository.GetQueryable(); 
            var entities = await queryable
                .Where(c => c.OwnerId == ownerId && !c.IsDeleted)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CarGetDto>>(entities);
        }
        public async Task<CarDetailDto?> GetByVinAsync(string vin)
        {
            _logger.LogInformation("Fetching car by VIN {Vin}", vin);

            var entity = await _carRepository.GetByVinAsync(vin);
            if (entity is null)
            {
                _logger.LogWarning("Car with VIN {Vin} not found", vin);
                throw new BadRequestException($"Car with VIN {vin} not found.");
            }

            _logger.LogInformation("Car with VIN {Vin} retrieved successfully", vin);
            return _mapper.Map<CarDetailDto>(entity);
        }
        public async Task<CarDetailDto> UploadPhotoAsync(Guid carId, IFormFile file)
        {
            if (file == null)
            {
                _logger.LogWarning("UploadPhotoAsync called with null file for CarId {CarId}", carId);
                throw new BadRequestException("No file uploaded.");
            }

            var car = await _carRepository.GetByIdAsync(carId);
            if (car == null)
            {
                _logger.LogWarning("UploadPhotoAsync: Car {CarId} not found", carId);
                throw new NotFoundException("Car", carId);
            }
            // Validate content type & size
            var allowedImageTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedImageTypes.Contains(file.ContentType))
                throw new BadRequestException("Unsupported image type.");
            if (file.Length > 10 * 1024 * 1024) // 10MB
                throw new BadRequestException("Image too large (max 10MB).");


            // Optionally validate image mime types or size here (skipped for brevity)
            var photoPath = await _fileStorageService.SaveFileAsync(file, "images/cars");

            car.PhotoUrls = string.IsNullOrWhiteSpace(car.PhotoUrls) ? photoPath : $"{car.PhotoUrls};{photoPath}";
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Uploaded photo for car {CarId}. New PhotoUrls: {PhotoUrls}", carId, car.PhotoUrls);

            return _mapper.Map<CarDetailDto>(car);
        }

        public async Task<CarDetailDto> UploadVideoAsync(Guid carId, IFormFile file)
        {
            if (file == null)
            {
                _logger.LogWarning("UploadVideoAsync called with null file for CarId {CarId}", carId);
                throw new BadRequestException("No file uploaded.");
            }

            var car = await _carRepository.GetByIdAsync(carId);
            if (car == null)
            {
                _logger.LogWarning("UploadVideoAsync: Car {CarId} not found", carId);
                throw new NotFoundException("Car", carId);
            }

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowed = new[] { ".mp4", ".mov", ".avi", ".mkv" };
            if (!allowed.Contains(ext))
            {
                _logger.LogWarning("UploadVideoAsync: Unsupported extension {Ext} for Car {CarId}", ext, carId);
                throw new BadRequestException("Unsupported video format.");
            }

            var videoPath = await _fileStorageService.SaveFileAsync(file, "videos/cars");

            car.VideoUrls = string.IsNullOrWhiteSpace(car.VideoUrls) ? videoPath : $"{car.VideoUrls};{videoPath}";
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Uploaded video for car {CarId}. New VideoUrls: {VideoUrls}", carId, car.VideoUrls);

            return _mapper.Map<CarDetailDto>(car);
        }
    }
}
