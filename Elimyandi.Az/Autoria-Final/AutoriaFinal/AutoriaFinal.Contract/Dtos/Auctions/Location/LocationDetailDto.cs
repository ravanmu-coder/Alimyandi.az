using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.Location
{
    public class LocationDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = default!;
        public string? AddressLine1 { get; set; }
        public string? City { get; set; }
        public string? Region { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
    }
}
