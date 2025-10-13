using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Auctions
{
    public class CarRepository : GenericRepository<Car>, ICarRepository
    {
        public CarRepository(AppDbContext context) : base(context) { }

        public Task<Car?> GetByVinAsync(string vin)
            => _context.Cars.FirstOrDefaultAsync(c=> c.Vin == vin && !c.IsDeleted);
    }
}
