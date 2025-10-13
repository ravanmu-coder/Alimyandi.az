using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Billing.Payments
{
    public record PaymentRequestDto (Guid InvoiceId,
        decimal Amount,
        PaymentMethod Method,  // Card/BankTransfer/Wallet
        string ProviderRef);
}
