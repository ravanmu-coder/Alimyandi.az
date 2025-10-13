using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Enums.AuctionEnums
{
    public enum AuctionStatus
    {
        Draft = 0,      // ✅ Yaradılıb, hələ konfiqurasiya edilir
        Scheduled = 1,  // ✅ Planlaşdırılıb, pre-bid gözləyir
        Ready = 2,      // ✅ Pre-bid collection başlayıb, live auction gözləyir
        Running = 3,    // ✅ Canlı auction gedir
        Ended = 4,      // ✅ Bitib
        Cancelled = 5,  // ✅ Ləğv edilib
        Settled = 6
    }
}
