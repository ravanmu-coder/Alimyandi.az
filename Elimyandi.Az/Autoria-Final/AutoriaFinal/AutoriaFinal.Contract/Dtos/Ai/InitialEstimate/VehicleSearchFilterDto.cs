using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Ai.InitialEstimate
{
    public class VehicleSearchFilterDto
    {
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? VehicleType { get; set; } // "sedan", "suv" etc.
        public string? Condition { get; set; } // "no_accident", "used", "new" etc.
        public int? MinYear { get; set; }
        public int? MaxYear { get; set; }
    }
}
