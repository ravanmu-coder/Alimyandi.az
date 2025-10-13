using AutoriaFinal.Domain.Entities.Logistics;
using AutoriaFinal.Domain.Repositories.Logistics;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Logistics
{
    public class ShippingRepository : GenericRepository<Shipping>, IShippingRepository
    {
        public ShippingRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Shipping?> GetByLotIdAsync(Guid lotId)
            => await _context.Shippings.FirstOrDefaultAsync(s => s.AuctionCarId == lotId);
    }
}
