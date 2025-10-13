using AutoriaFinal.Domain.Entities.Billing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace AutoriaFinal.Domain.Repositories.Billing
{
    public interface ITransactionPaymentRepository : IGenericRepository<TransactionPayment>
    {
        Task<IQueryable<TransactionPayment>> GetByUserAsync(Guid userId);
    }
}
