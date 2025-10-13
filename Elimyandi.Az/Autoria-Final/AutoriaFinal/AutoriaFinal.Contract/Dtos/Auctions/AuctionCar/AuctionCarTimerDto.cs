using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class AuctionCarTimerDto
    {
        public Guid AuctionCarId { get; set; }
        public string LotNumber { get; set; } = default!;
        public int RemainingTimeSeconds { get; set; }
        public bool IsExpired { get; set; }
        public DateTime? LastBidTime { get; set; }
        public DateTime? NextTimeoutAt { get; set; }
        public bool IsActive { get; set; }
        public bool ShowFinalCall { get; set; }
        public bool IsInCriticalTime { get; set; }
        public string TimerStatus => IsExpired ? "EXPIRED" : IsInCriticalTime ? "CRITICAL" : "NORMAL";
        public decimal CurrentPrice { get; set; }
        public decimal NextMinimumBid { get; set; }
        public bool IsReserveMet { get; set; }
    }
}
