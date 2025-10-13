using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Exceptions
{
    public class AuctionBusinessException : Exception
    {
        public AuctionBusinessException(string message) : base($"Auction Business Rule: {message}") { }

        public AuctionBusinessException(string carLot, string rule)
            : base($"Car {carLot} - {rule}") { }
    }
}
