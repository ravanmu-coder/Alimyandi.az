using AutoriaFinal.Domain.Entities.Billing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Billing
{
    public interface IPaymentRepository : IGenericRepository<Payment>
    {
        Task<IQueryable<Payment>> GetByInvoiceIdAsync(Guid invoiceId);
    }
}
