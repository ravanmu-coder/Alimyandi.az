using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Identity
{
    public class RoleClaims : BaseEntity
    {
        public string Code { get; private set; } = default!;
        public string? Description { get; private set; }

    }
}
