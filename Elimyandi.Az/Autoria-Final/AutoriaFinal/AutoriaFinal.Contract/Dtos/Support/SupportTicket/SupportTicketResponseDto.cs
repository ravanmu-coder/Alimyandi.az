using AutoriaFinal.Contract.Dtos.Support.SupportMessage;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.SupportTicket
{
    public record SupportTicketResponseDto (
    Guid Id,
    Guid UserId,
        string Subject,
        TicketStatus Status,
        IReadOnlyList<SupportMessageResponseDto> Messages);
}
