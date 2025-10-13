using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Auction
{
    public class SetCurrentCarRequest
    {
        [Required(ErrorMessage = "Lot nömrəsi mütləqdir")]
        [StringLength(20, MinimumLength = 1)]
        public string LotNumber { get; set; } = default!;
    }
}
