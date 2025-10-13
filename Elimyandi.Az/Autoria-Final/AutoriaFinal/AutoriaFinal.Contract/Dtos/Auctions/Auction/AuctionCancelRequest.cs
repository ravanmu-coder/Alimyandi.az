using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Auction
{
    public class AuctionCancelRequest
    {
        
        [Required(ErrorMessage = "Ləğv etmə səbəbi mütləqdir")]
        [StringLength(500, MinimumLength = 5, ErrorMessage = "Səbəb 5-500 simvol arasında olmalıdır")]
        public string Reason { get; set; } = default!;
    }
}
