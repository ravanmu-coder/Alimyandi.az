using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Billing.Payments
{
    public record  PaymentResponseDto(Guid Id,
        Guid InvoiceId,
        decimal Amount,
        PaymentMethod Method,
        string ProviderRef,
        PaymentStatus Status,
        DateTime? PaidAtUtc);
}
