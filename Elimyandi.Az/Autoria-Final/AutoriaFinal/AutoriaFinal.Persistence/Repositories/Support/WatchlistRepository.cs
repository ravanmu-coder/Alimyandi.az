using AutoriaFinal.Domain.Entities.Support;
using AutoriaFinal.Domain.Repositories.Support;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Support
{
    public class WatchlistRepository : GenericRepository<Watchlist>, IWatchlistRepository
    {
        public WatchlistRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> IsWatchingAsync(Guid userId, Guid lotId)
            => await _context.Watchlists.AnyAsync(w => w.UserId == userId && w.AuctionCarId == lotId);
    }
}
