using AutoriaFinal.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Text.Json;

namespace AutoriaFinal.API.ExceptionHandler
{
    public class AppExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<AppExceptionHandler> _logger;
        public AppExceptionHandler(ILogger<AppExceptionHandler> logger)
        {
            _logger = logger;
        }
        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            if(exception is not AppException appException)
            {
                return false;
            }
            _logger.LogError(
                exception, "AppException occurred: {Message}", exception.Message);
            return true;
        }
    }
}
