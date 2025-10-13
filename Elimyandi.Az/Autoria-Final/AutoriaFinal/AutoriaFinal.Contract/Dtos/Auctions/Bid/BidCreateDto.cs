
using AutoriaFinal.Contract.Enums.Bids;
using System;
using System.ComponentModel.DataAnnotations;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{    
    public class BidCreateDto
    {
        [Required(ErrorMessage = "AuctionCar ID mütləqdir")]
        public Guid AuctionCarId { get; set; }

        [Required(ErrorMessage = "User ID mütləqdir")]
        public Guid UserId { get; set; }

        [Required(ErrorMessage = "Bid məbləği mütləqdir")]
        [Range(1, 10000000, ErrorMessage = "Bid məbləği 1-10,000,000 arasında olmalıdır")]
        public decimal Amount { get; set; }

        public bool IsPreBid { get; set; } = false;

        public bool IsProxy { get; set; } = false;

        [Range(1, 10000000, ErrorMessage = "Proxy maksimum məbləği 1-10,000,000 arasında olmalıdır")]
        public decimal? ProxyMax { get; set; }
        [StringLength(1000, ErrorMessage = "Qeydlər 1000 simvoldan çox ola bilməz")]
        public string? Notes { get; set; }

        public DateTime? ValidUntil { get; set; } // Proxy bid-lər üçün etibarlılıq müddəti

        [StringLength(45, ErrorMessage = "IP address uzunluğu maksimum 45 simvol ola bilər")]
        public string? IPAddress { get; set; }

        [StringLength(500, ErrorMessage = "User agent uzunluğu maksimum 500 simvol ola bilər")]
        public string? UserAgent { get; set; }

        public BidTypeDto BidType { get; set; } = BidTypeDto.Regular;
    }

   
}