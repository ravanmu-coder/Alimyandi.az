using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class VehicleFinderAuctionStatusDto
    {
        public Guid CarId { get; set; }
        public bool IsInAuction { get; set; } = false;
        public Guid? AuctionId { get; set; }
        public string? AuctionStatus { get; set; }
        public bool AuctionIsLive { get; set; } = false;
        public string? AuctionCarCondition { get; set; }
        public string? LotNumber { get; set; }
        public decimal? CurrentPrice { get; set; }
        public int? RemainingTimeSeconds { get; set; }
    }
}
