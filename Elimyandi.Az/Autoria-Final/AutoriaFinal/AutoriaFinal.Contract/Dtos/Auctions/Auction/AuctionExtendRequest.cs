using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Auction
{
    public class AuctionExtendRequest
    {
        [Range(1, 1440, ErrorMessage = "Əlavə vaxt 1-1440 dəqiqə arasında olmalıdır")]
        public int AdditionalMinutes { get; set; }

        [Required(ErrorMessage = "Uzatma səbəbi mütləqdir")]
        [StringLength(500, MinimumLength = 5)]
        public string Reason { get; set; } = default!;
    }
}
