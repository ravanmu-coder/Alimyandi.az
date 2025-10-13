using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.Watchlist
{
    public record WatchlistResponseDto (
          Guid Id,
        Guid UserId,
        Guid AuctionCarId);
}
