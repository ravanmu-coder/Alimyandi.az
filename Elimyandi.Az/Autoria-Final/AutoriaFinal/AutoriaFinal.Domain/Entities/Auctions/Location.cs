using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class Location : BaseEntity
    {
        public string Name { get;  set; } = default!;

        public string? AddressLine1 { get;  set; }
        public string? City { get; set; }
        public string? Region { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public ICollection<Car> Cars { get; set; } = new List<Car>();

    }
}
