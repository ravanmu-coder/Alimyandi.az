using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Logistics
{
    public class Shipping : BaseEntity
    {
        public Guid AuctionCarId { get; private set; }
        public Guid ShippingCompanyId { get; private set; }

        public ShippingStatus Status { get; private set; } = ShippingStatus.NotRequested;
        public string? TrackingNumber { get; private set; }
        public DateTime? PickupAtUtc { get; private set; }
        public DateTime? DeliveredAtUtc { get; private set; }

        public string? DeliveryCountry { get; private set; }
        public string? DeliveryCity { get; private set; }
        public string? DeliveryAddress { get; private set; }
        public string? PostalCode { get; private set; }
        public void Request(string? tracking = null) { Status = ShippingStatus.Requested; TrackingNumber = tracking; MarkUpdated(); }
        public void PickUp(DateTime whenUtc) { Status = ShippingStatus.PickingUp; PickupAtUtc = whenUtc; MarkUpdated(); }
        public void InTransit() { Status = ShippingStatus.InTransit; MarkUpdated(); }
        public void Deliver(DateTime whenUtc) { Status = ShippingStatus.Delivered; DeliveredAtUtc = whenUtc; MarkUpdated(); }
        public void Cancel() { Status = ShippingStatus.Cancelled; MarkUpdated(); }
        public void SetDeliveryAddress(string? country, string? city, string? address, string? postal)
        { DeliveryCountry = country; DeliveryCity = city; DeliveryAddress = address; PostalCode = postal; MarkUpdated(); }
    }
}
