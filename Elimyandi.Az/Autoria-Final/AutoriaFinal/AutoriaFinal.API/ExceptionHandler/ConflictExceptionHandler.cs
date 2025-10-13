using AutoriaFinal.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Text.Json;

namespace AutoriaFinal.API.ExceptionHandler
{
    public class ConflictExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<ConflictExceptionHandler> _logger;
        public ConflictExceptionHandler(ILogger<ConflictExceptionHandler> logger)
        {
            _logger = logger;
        }
        

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            if(exception is not ConflictException conflictException)
            {
                return false;
            }
            _logger.LogError(
                exception, "ConflictException occurred: {Message}", exception.Message);
            return true;
        }
    }
}
