using System;
using System.ComponentModel.DataAnnotations;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class ProxyBidDto
    {
        [Required]
        public Guid AuctionCarId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [Range(1, 10000000)]
        public decimal StartAmount { get; set; }

        [Required]
        [Range(1, 10000000)]
        public decimal MaxAmount { get; set; }

        public DateTime? ValidUntil { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsPreBid { get; set; } = false;
    }
}