using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Exceptions
{
    public class NotFoundException : Exception
    {
        public NotFoundException(string entity, object key)
           : base($"{entity} with identifier {key} was not found.") { }
    }
}
