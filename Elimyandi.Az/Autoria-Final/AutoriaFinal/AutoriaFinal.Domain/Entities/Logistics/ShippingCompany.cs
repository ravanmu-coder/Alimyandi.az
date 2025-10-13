using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Logistics
{
    public class ShippingCompany : BaseEntity
    {
        public string Name { get; private set; } = default!;
        public string? Phone { get; private set; }
        public string? Email { get; private set; }
    }
}
