using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Support
{
    public class SupportTicket : BaseEntity
    {
        public Guid UserId { get; private set; }
        public string Subject { get; private set; } = default!;
        public TicketStatus Status { get; private set; } = TicketStatus.Open;

        public ICollection<SupportMessage> Messages { get; private set; } = new List<SupportMessage>();
        public void SetStatus(TicketStatus status) { Status = status; MarkUpdated(); }
        public void AddMessage(SupportMessage message) { Messages.Add(message); MarkUpdated(); }
    }
}
