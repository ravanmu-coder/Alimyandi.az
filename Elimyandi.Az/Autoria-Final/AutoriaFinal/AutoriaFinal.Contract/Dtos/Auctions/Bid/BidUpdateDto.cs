using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class BidUpdateDto
    {
        public decimal Amount { get; set; }
        public bool IsProxy { get; set; }
        public decimal? ProxyMax { get; set; }
    }
}
