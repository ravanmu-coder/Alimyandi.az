using AutoriaFinal.Domain.Entities.Billing;
using AutoriaFinal.Domain.Repositories.Billing;
using AutoriaFinal.Persistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Billing
{
    public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IQueryable<Payment>> GetByInvoiceIdAsync(Guid invoiceId)
            => await Task.FromResult(_context.Payments.Where(p => p.InvoiceId == invoiceId).AsQueryable());
    }
}
