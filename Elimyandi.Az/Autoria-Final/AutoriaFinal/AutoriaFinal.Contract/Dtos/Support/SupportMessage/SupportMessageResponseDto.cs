using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.SupportMessage
{
    public record SupportMessageResponseDto (
          Guid Id,
        Guid TicketId,
        Guid FromUserId,
        string Body);
}
