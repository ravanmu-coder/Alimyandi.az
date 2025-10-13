using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Abstractions
{
    public abstract class BaseEntity
    {
        public Guid Id { get;protected set; } = Guid.NewGuid();
        public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
        public DateTime? UpdatedAtUtc { get; protected set; }
        public bool IsDeleted { get; protected set; }
        public void MarkUpdated()=> UpdatedAtUtc = DateTime.UtcNow;
        public void MarkDeleted() { IsDeleted = true;MarkUpdated(); }
    }
}
