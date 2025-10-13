
using AutoriaFinal.Application.Services;
using AutoriaFinal.Application.Services.Admin;
using AutoriaFinal.Application.Services.Auctions;
using AutoriaFinal.Application.Services.Identity;
using AutoriaFinal.Contract.Services;
using AutoriaFinal.Contract.Services.Admin;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Contract.Services.Identity;
using AutoriaFinal.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddServiceRegistration(this IServiceCollection services)
        {
            services.AddScoped(typeof(IGenericService<,,,,>), typeof(GenericService<,,,,>));

            #region Auctions
            services.AddScoped<IAuctionService, AuctionService>();
            services.AddScoped<IAuctionCarService, AuctionCarService>();
            services.AddScoped<IBidService, BidService>();

            services.AddScoped<ICarService, CarService>();
            services.AddScoped<ILocationService, LocationService>();
            #endregion
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IGoogleAuthService, GoogleAuthService>();
            services.AddScoped<IAdminService, AdminService>();
            return services;
        }
    }
}
