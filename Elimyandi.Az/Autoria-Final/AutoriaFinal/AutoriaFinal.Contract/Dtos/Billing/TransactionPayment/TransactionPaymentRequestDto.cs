using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Billing.TransactionPayment
{
    public record TransactionPaymentRequestDto(Guid UserId,
        Guid? InvoiceId,
        decimal Amount,
        TransactionType Type, // Debit/Credit/Fee/Refund
        string Reference,
        string? Notes);
}
