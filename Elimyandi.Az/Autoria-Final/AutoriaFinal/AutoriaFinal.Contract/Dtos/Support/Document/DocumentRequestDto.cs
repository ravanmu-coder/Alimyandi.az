using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.Document
{
    public record DocumentRequestDto (
        Guid? CarId,
        Guid? AuctionId,
        string Type,
        string Url);
}
