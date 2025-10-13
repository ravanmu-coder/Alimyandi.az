using AutoriaFinal.Contract.Dtos.Ai.InitialEstimate;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Ai.InitialEstimate
{
    public interface IQueryTranslator
    {
        Task<VehicleSearchFilterDto> TranslateToFilterAsync(string userQuery, CancellationToken cancellationToken = default);

    }
}
