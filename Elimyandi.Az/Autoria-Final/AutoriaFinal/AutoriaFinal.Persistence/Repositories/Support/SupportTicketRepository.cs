using AutoriaFinal.Domain.Entities.Support;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Support;
using AutoriaFinal.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Support
{
    public class SupportTicketRepository : GenericRepository<SupportTicket>, ISupportTicketRepository
    {
        public SupportTicketRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<SupportTicket?> GetWithMessagesAsync(Guid id)
            =>await _context.SupportTickets.Include(t => t.Messages)
                                 .FirstOrDefaultAsync(t => t.Id == id);                                 
    }
}
