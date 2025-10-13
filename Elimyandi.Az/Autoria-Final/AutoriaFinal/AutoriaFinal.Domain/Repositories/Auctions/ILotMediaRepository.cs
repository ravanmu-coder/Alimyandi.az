using AutoriaFinal.Domain.Entities.Auctions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Repositories.Auctions
{
    public interface ILotMediaRepository : IGenericRepository<LotMedia>
    {
        Task<IQueryable<LotMedia>> GetByLotAsync(Guid lotId);
    }
}
