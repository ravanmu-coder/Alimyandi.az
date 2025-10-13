using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Log
{
    public class LogDataDTO
    {
        public LogLevel Level { get; set; }

        public string Message { get; set; }

        public string? Source { get; set; }

        public int? UserId { get; set; }

        public string? RequestId { get; set; }

    }
}
