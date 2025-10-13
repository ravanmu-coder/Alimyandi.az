using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Logistics.ShippingCompany
{
    public record ShippingCompanyRequestDto (
         string Name,
        string? Phone,
        string? Email);
}
