using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.SupportMessage
{
    public record SupportMessageRequestDto (
         Guid TicketId,
        Guid FromUserId,
        string Body);
}
