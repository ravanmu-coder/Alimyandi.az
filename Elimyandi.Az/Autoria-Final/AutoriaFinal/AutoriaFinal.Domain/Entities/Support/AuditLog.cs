using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Support
{
    public class AuditLog : BaseEntity
    {
        public Guid? UserId { get; private set; }
        public string EntityName { get; private set; } = default!;
        public Guid EntityId { get; private set; }
        public string Action { get; private set; } = default!;   // Created/Updated/Deleted/StateChanged/...
        public string DataJson { get; private set; } = "{}";
    }
}
