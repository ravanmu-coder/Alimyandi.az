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
    public class TransactionPaymentRepository : GenericRepository<TransactionPayment>, ITransactionPaymentRepository
    {
        public TransactionPaymentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IQueryable<TransactionPayment>> GetByUserAsync(Guid userId)
            => await Task.FromResult(_context.Transactions.Where(t => t.UserId == userId).AsQueryable());
    }
}
