using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Support
{
    public class Document : BaseEntity
    {
        public Guid? CarId { get; private set; }      // Car-a aid sənəd
        public Guid? AuctionId { get; private set; }  // Auction-a aid sənəd

        public string Type { get; private set; } = default!; // Title, Inspection, Customs...
        public string Url { get; private set; } = default!;
    }
}
