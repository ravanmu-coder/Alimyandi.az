using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Support
{
    public class SupportMessage : BaseEntity
    {
        public Guid TicketId { get; private set; }
        public Guid FromUserId { get; private set; }
        public string Body { get; private set; } = default!;
    }
}
