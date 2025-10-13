using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Enums.AuctionEnums
{
    public enum PaymentStatus
    {
        Pending = 0,
        Paid = 1,
        Cancelled = 2,
        PartiallyPaid = 3,
        Failed = 4
    }
}
