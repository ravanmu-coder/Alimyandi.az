using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.Document
{
    public record DocumentResponseDto (
         Guid Id,
        Guid? CarId,
        Guid? AuctionId,
        string Type,
        string Url);
}
