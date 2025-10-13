using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.SupportTicket
{
    public record SupportTicketRequestDto (
        Guid UserId,
        string Subject);
}
