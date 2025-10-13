using AutoriaFinal.Contract.Dtos.Ai.InitialEstimate;
using AutoriaFinal.Domain.Entities.Ai.InitialEstimate;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Ai.InitialEstimate
{
    public interface IVehicleValuationService
    {
        //Verilmis avtomobil qiymetine texmin edir 
        Task<VehiclePriceEstimate> EstimatePriceAsync(VehicleDetailsDto vehicleDetails, CancellationToken cancellationToken = default);
        Task<DealAnalysis> AnalyzeDealAsync(VehicleDetailsDto vehicleDetails, decimal askingPrice, CancellationToken cancellationToken = default);  
    }
}
