using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Billing.TransactionPayment
{
    public record TransactionPaymentResponseDto(Guid Id,
        Guid UserId,
        Guid? InvoiceId,
        decimal Amount,
        TransactionType Type,
        string Reference,
        string? Notes);
}
