using AutoriaFinal.Domain.Entities.Auctions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Auctions
{
    public interface ICarRepository : IGenericRepository<Car>
    {
        Task<Car?> GetByVinAsync(string vin);
    }
}
