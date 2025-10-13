using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Support
{
    public class Notification : BaseEntity
    {
        public Guid UserId { get; private set; }
        public NotificationType Type { get; private set; }
        public string PayloadJson { get; private set; } = "{}";
        public bool IsRead { get; private set; }
        public DateTime? ReadAtUtc { get; private set; }
        public void MarkRead() { IsRead = true; ReadAtUtc = DateTime.UtcNow; MarkUpdated(); }
    }
}
