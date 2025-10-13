using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.Auction
{
    public class AuctionGetDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = default!;
        public DateTime StartTimeUtc { get; set; }
        public DateTime EndTimeUtc { get; set; }
        public string Status { get; set; } = default!;
        public decimal? StartPrice { get; set; }
        public bool IsLive { get; set; }
        public decimal MinBidIncrement { get; set; }
        public string? CurrentCarLotNumber { get; set; }
        public int TotalCarsCount { get; set; }
        public int CarsWithPreBidsCount { get; set; }
        public Guid LocationId { get; set; }
        public string? LocationName { get; set; } // Navigation property məlumatı
    }
}