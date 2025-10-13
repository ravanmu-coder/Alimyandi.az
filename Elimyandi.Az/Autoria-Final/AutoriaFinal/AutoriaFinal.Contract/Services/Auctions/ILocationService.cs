using AutoriaFinal.Contract.Dtos.Auctions.Location;
using AutoriaFinal.Domain.Entities.Auctions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Auctions
{
    public interface ILocationService : IGenericService<
        Location,
        LocationGetDto,
        LocationDetailDto,
        LocationCreateDto,
        LocationUpdateDto>
    {
        Task<LocationDetailDto?> GetByNameAsync(string name);
    }
}
