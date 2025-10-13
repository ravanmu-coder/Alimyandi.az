using AutoriaFinal.Domain.Entities.Logistics;
using AutoriaFinal.Domain.Repositories.Logistics;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Logistics
{
    public class ShippingCompanyRepository : GenericRepository<ShippingCompany>, IShippingCompanyRepository
    {
        public ShippingCompanyRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<ShippingCompany?> GetByNameAsync(string name)
            => await _context.ShippingCompanies.FirstOrDefaultAsync(s => s.Name == name);
    }
}
