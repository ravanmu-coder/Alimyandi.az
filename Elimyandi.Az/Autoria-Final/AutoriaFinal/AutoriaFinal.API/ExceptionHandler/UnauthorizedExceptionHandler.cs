using AutoriaFinal.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Text.Json;

namespace AutoriaFinal.API.ExceptionHandler
{
    public class UnauthorizedExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<UnauthorizedExceptionHandler> _logger;
        public UnauthorizedExceptionHandler(ILogger<UnauthorizedExceptionHandler> logger)
        {
            _logger = logger;
        }
       
        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            if(exception is not UnauthorizedException unauthorizedException)
            {
                return false;   
            }
            _logger.LogError(
                exception, "UnauthorizedException occurred: {Message}", exception.Message);
            return true;
        }
    }
}
