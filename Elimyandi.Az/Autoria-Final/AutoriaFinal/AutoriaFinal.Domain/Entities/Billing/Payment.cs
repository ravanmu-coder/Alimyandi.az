using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Billing
{
    public class Payment : BaseEntity
    {
        public Guid InvoiceId { get; private set; }
        public decimal Amount { get; private set; }
        public PaymentMethod Method { get; private set; } = PaymentMethod.Card;
        public string ProviderRef { get; private set; } = default!;
        public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;
        public DateTime? PaidAtUtc { get; private set; }
       
    }
}
