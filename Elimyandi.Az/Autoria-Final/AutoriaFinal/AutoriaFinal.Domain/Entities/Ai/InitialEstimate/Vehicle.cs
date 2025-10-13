using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Ai.InitialEstimate
{
    public class Vehicle
    {
        public Guid Id { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public decimal Price { get; set; }
        public int Mileage { get; set; }
        public string Description { get; set; }
        public bool HasAccidents { get; set; }
        public DateTime DatePosted { get; set; }
        public Vehicle()
        {
            Id = Guid.NewGuid();
            DatePosted = DateTime.UtcNow;
            Make = string.Empty;
            Model = string.Empty;
            Description = string.Empty;
        }
    }
}
