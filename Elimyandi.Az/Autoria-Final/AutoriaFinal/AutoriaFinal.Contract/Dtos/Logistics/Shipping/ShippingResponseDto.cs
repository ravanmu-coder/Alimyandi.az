using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Logistics.Shipping
{
    public record ShippingResponseDto(
        Guid Id,
        Guid AuctionCarId,
        Guid ShippingCompanyId,
        ShippingStatus Status,
        string? TrackingNumber,
        DateTime? PickupAtUtc,
        DateTime? DeliveredAtUtc,
        string? DeliveryCountry,
        string? DeliveryCity,
        string? DeliveryAddress,
        string? PostalCode);
}
