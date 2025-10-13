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
    public class LocationRepository : GenericRepository<Location>, ILocationRepository
    {
        public LocationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Location?> GetByNameAsync(string name)
        {
            return await _dbSet.FirstOrDefaultAsync(l=>l.Name == name);
        }
    }
}
