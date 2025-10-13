using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Auction
{
    public class AuctionStatisticsDto
    {
        public Guid AuctionId { get; set; }
        public string AuctionName { get; set; } = default!;
        public int TotalCars { get; set; }
        public int SoldCars { get; set; }
        public int UnsoldCars { get; set; }
        public decimal TotalSalesAmount { get; set; }
        public decimal AverageSalePrice { get; set; }
        public int TotalBids { get; set; }
        public int UniqueBidders { get; set; }
        public DateTime AuctionStartTime { get; set; }
        public DateTime? AuctionEndTime { get; set; }
        public TimeSpan? AuctionDuration { get; set; }
    }

}
