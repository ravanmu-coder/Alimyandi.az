using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.FinanceEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace AutoriaFinal.Domain.Entities.Billing
{
    public class Invoice : BaseEntity
    {
        public string Number { get; private set; } = default!;
        public Guid BuyerId { get; private set; }             // Identity.User
        public Guid AuctionCarId { get; private set; }

        public decimal Subtotal { get; private set; }         // Hammer
        public decimal Fees { get; private set; }             // Buyer/Internet/Storage
        public decimal Tax { get; private set; }
        public decimal Total => Subtotal + Fees + Tax;

        public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;

        public ICollection<Payment> Payments { get; private set; } = new List<Payment>();
        public ICollection<TransactionPayment> Transactions { get; private set; } = new List<TransactionPayment>();
        public void SetFees(decimal fees) { Fees = fees; MarkUpdated(); }
        public void SetTax(decimal tax) { Tax = tax; MarkUpdated(); }
        //public void MarkPaid() { Status = PaymentStatus.Succeeded; MarkUpdated(); }
        //public void MarkFailed() { Status = PaymentStatus.Failed; MarkUpdated(); }
        //public void MarkRefunded() { Status = PaymentStatus.Refunded; MarkUpdated(); }
    }
}
