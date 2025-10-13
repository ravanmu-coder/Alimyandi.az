using AutoriaFinal.Contract.Dtos.Billing.Payments;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Billing.Invoice
{
    public record InvoiceResponseDto (Guid Id,
        string Number,
        Guid BuyerId,
        Guid AuctionCarId,
        decimal Subtotal,
        decimal Fees,
        decimal Tax,
        decimal Total,
        PaymentStatus Status,
        IReadOnlyList<PaymentResponseDto>? Payments);
}
