using AutoriaFinal.Domain.Entities.Support;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Support
{
    public interface IWatchlistRepository : IGenericRepository<Watchlist>
    {
        Task<bool> IsWatchingAsync(Guid userId, Guid lotId);
    }
}
