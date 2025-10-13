using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Billing
{
    public class TransactionPayment : BaseEntity
    {
        public Guid UserId { get; private set; }
        public Guid? InvoiceId { get; private set; }
        public decimal Amount { get; private set; }
        public TransactionType Type { get; private set; } = TransactionType.Debit;
        public string Reference { get; private set; } = default!;
        public string? Notes { get; private set; }
    }
}
