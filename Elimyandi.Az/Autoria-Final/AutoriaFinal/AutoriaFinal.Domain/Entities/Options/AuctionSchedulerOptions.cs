using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Options
{
    public class AuctionSchedulerOptions
    {
        public int PollIntervalSeconds { get; set; } = 2;    // default 2s (tənzimlənə bilər)
        public int BatchSize { get; set; } = 1;            // hər batchdə maksimum neçə auction işlənəcək
        public bool EnableLotTimerProcessing { get; set; } = true;
        public bool CatchUpOnStart { get; set; } = true;
        public int MaxConcurrentWorkers { get; set; } = 4;  // optional: paralellik üçün
    }

}
