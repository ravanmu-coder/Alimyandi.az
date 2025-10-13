using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Ai.InitialEstimate
{
    public class VehiclePriceEstimate
    {
        [JsonPropertyName("estimatedAveragePrice")]
        public decimal EstimatedAveragePrice { get; set; } = 0m;

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "UNKNOWN";

        [JsonPropertyName("minPrice")]
        public decimal MinPrice { get; set; } = 0m;

        [JsonPropertyName("maxPrice")]
        public decimal MaxPrice { get; set; } = 0m;

        [JsonPropertyName("confidenceScore")]
        public double ConfidenceScore { get; set; } = 0.0;

        [JsonPropertyName("analysisSummary")]
        public string AnalysisSummary { get; set; } = "";

        // Helper: basic validation check
        public bool IsValid()
        {
            if (EstimatedAveragePrice < 0 || MinPrice < 0 || MaxPrice < 0) return false;
            if (MinPrice > MaxPrice) return false;
            return true;
        }
    }
}