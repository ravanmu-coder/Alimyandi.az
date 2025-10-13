using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Ai.InitialEstimate
{
    public class DealAnalysis
    {
        public decimal EstimatedMarketValue { get; set; }
        public decimal AskingPrice { get; set; }
        public string Currency { get; set; }
        public string DealRating { get; set; } // Məs: "good_deal", "fair", "overpriced"
        public string Advice { get; set; }

        public DealAnalysis()
        {
            Currency = string.Empty;
            DealRating = string.Empty;
            Advice = string.Empty;
        }
    }
}
