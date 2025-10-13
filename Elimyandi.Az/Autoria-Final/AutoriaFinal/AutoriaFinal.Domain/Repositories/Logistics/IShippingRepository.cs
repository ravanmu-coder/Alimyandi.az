using AutoriaFinal.Domain.Entities.Logistics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Logistics
{
    public interface IShippingRepository : IGenericRepository<Shipping>
    {
        Task<Shipping?> GetByLotIdAsync(Guid lotId);
    }
}
