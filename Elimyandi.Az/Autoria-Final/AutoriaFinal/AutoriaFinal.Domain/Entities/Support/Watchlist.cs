using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Support
{
    public class Watchlist : BaseEntity
    {
        public Guid UserId { get; private set; }
        public Guid AuctionCarId { get; private set; }
    }
}
