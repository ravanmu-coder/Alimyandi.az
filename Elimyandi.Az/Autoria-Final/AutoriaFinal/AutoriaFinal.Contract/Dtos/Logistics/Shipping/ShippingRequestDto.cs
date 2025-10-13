using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Logistics.Shipping
{
    public record ShippingRequestDto (
         Guid AuctionCarId,
        Guid ShippingCompanyId,
        string? DeliveryCountry,
        string? DeliveryCity,
        string? DeliveryAddress,
        string? PostalCode,
        string? TrackingNumber // sifariş yaradılarkən verilə bilər
        );
}
