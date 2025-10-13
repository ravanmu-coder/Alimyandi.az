using System;
using System.ComponentModel.DataAnnotations;

namespace AutoriaFinal.Contract.Dtos.Auctions.Auction
{   
    public class AuctionCreateDto
    {
        [Required(ErrorMessage = "Auction adı mütləqdir")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Auction adı 3-200 simvol arasında olmalıdır")]
        public string Name { get; set; } = default!;

        [Required(ErrorMessage = "Location mütləqdir")]
        public Guid LocationId { get; set; }

        [Required(ErrorMessage = "Başlama vaxtı mütləqdir")]
        public DateTime StartTimeUtc { get; set; }

        [Required(ErrorMessage = "Bitmə vaxtı mütləqdir")]
        public DateTime EndTimeUtc { get; set; }

        // ƏLAVƏ: Yeni property-lər
        [Range(1, 600, ErrorMessage = "Timer 1-600 saniyə arasında olmalıdır")]
        public int TimerSeconds { get; set; } = 10;

        [Range(1, 10000, ErrorMessage = "Minimum bid artımı 1-10000 arasında olmalıdır")]
        public decimal MinBidIncrement { get; set; } = 100;

        [Range(5, 120, ErrorMessage = "Maksimum maşın müddəti 5-120 dəqiqə arasında olmalıdır")]
        public int MaxCarDurationMinutes { get; set; } = 30;
    }
}