using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Enums.Bids
{
    public enum BidType
    {
        Regular = 1,    // Adi bid
        PreBid = 2,     // Auction başlamazdan əvvəl verilən bid
        ProxyBid = 3,   // Avtomatik artırma ilə bid
        AutoBid = 4     // Proxy bid tərəfindən avtomatik yaradılan bid
    }
}
