using AutoriaFinal.Domain.Entities.Billing;
using AutoriaFinal.Domain.Repositories.Billing;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Billing
{
    public class InvoiceRepository : GenericRepository<Invoice>, IInvoiceRepository
    {
        public InvoiceRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Invoice?> GetWithPaymentsAsync(Guid id)
            => await _context.Invoices.Include(p=> p.Payments)
                                      .FirstOrDefaultAsync(i => i.Id == id);
    }
}
