using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using AutoriaFinal.Domain.Repositories.Billing;

using AutoriaFinal.Domain.Repositories.Logistics;
using AutoriaFinal.Domain.Repositories.Support;
using AutoriaFinal.Persistence.Repositories;
using AutoriaFinal.Persistence.Repositories.Auctions;
using AutoriaFinal.Persistence.Repositories.Billing;

using AutoriaFinal.Persistence.Repositories.Logistics;
using AutoriaFinal.Persistence.Repositories.Support;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Extensions
{
    public static class RepositoryExtension
    {
        public static IServiceCollection AddRepositoriesRegistration(this IServiceCollection services)
        {
            // UoW
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Generic
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));   
            
            // ---- Auctions ----
            services.AddScoped<IAuctionRepository, AuctionRepository>();
            services.AddScoped<ILocationRepository, LocationRepository>();
            services.AddScoped<ICarRepository, CarRepository>();
            services.AddScoped<IAuctionCarRepository, AuctionCarRepository>();
            services.AddScoped<IBidRepository, BidRepository>();
            services.AddScoped<IAuctionWinnerRepository, AuctionWinnerRepository>();

            // ---- Billing ----
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();
            services.AddScoped<IPaymentRepository, PaymentRepository>();
            services.AddScoped<ITransactionPaymentRepository, TransactionPaymentRepository>();

            // ---- Identity ----
           
         
            // ---- Logistics ----
            services.AddScoped<IShippingRepository, ShippingRepository>();
            services.AddScoped<IShippingCompanyRepository, ShippingCompanyRepository>();

            // ---- Support ----
            services.AddScoped<IWatchlistRepository, WatchlistRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();
            services.AddScoped<ISupportTicketRepository, SupportTicketRepository>();
            services.AddScoped<ISupportMessageRepository, SupportMessageRepository>();
            services.AddScoped<IDocumentRepository, DocumentRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();

            return services;
        }
    }
}
