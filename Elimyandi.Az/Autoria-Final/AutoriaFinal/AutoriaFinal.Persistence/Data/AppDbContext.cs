using AutoriaFinal.Domain.Entities.Ai.InitialEstimate;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Entities.Billing;
using AutoriaFinal.Domain.Entities.Identity;
using AutoriaFinal.Domain.Entities.Logistics;
using AutoriaFinal.Domain.Entities.Support;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
    {

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // DbSets — Identity
        public DbSet<RoleClaims> RoleClaims { get; set; }

        // DbSets — Auction & Vehicle
        public DbSet<Location> Locations { get; set; }
        public DbSet<Auction> Auctions { get; set; }
        public DbSet<AuctionCar> AuctionCars { get; set; }
        public DbSet<Bid> Bids { get; set; }
        public DbSet<Car> Cars { get; set; }
        public DbSet<AuctionWinner> AuctionWinners { get; set; }
        // DbSets — Billing
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<TransactionPayment> Transactions { get; set; }
        // DbSets — Logistics
        public DbSet<ShippingCompany> ShippingCompanies { get; set; }
        public DbSet<Shipping> Shippings { get; set; }
        // DbSets — Support & System
        public DbSet<Watchlist> Watchlists { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SupportMessage> SupportMessages { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }

    }
}
