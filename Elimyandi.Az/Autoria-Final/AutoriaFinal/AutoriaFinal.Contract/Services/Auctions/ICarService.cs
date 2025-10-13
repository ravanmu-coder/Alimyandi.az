using AutoriaFinal.Contract.Dtos.Auctions.Car;
using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Auctions
{
    public interface ICarService : IGenericService<
        Car,
        CarGetDto,
        CarDetailDto,
        CarCreateDto,
        CarUpdateDto>
    {
        Task<CarDetailDto> AddCarAsync(CarCreateDto dto, string ownerId);
        Task<IEnumerable<CarGetDto>> GetByOwnerIdAsync(string ownerId); 
        Task<CarDetailDto?> GetByVinAsync(string vin);
        Task<CarDetailDto> UploadPhotoAsync(Guid carId, IFormFile file);
        Task<CarDetailDto> UploadVideoAsync(Guid carId, IFormFile file);
    }
}
