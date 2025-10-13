using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Identity
{
    public interface IGoogleAuthService
    {
        Task<string> HandleGoogleLoginAsync();
    }
}
