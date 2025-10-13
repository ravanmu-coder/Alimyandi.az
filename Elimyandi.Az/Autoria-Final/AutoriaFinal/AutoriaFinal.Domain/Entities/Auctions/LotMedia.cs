using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class LotMedia : BaseEntity
    {
        public Guid AuctionCarId { get; private set; }
        public string Url { get; private set; } = default!;
        public MediaType Type { get; private set; } = MediaType.Image;
        public string? ContentType { get; private set; }
        public int SortOrder { get; private set; }
        public bool IsPrimary { get; private set; }

    }
}
