using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.AudiLog
{
    public record AuditLogResponseDto (
         Guid? UserId,
        string EntityName,
        Guid EntityId,
        string Action,
        string DataJson);
}
