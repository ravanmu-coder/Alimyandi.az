using AutoriaFinal.Domain.Entities.Billing;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Billing
{
    public class InvoiceConfiguration : BaseEntityConfiguration<Invoice>
    {
        public override void Configure(EntityTypeBuilder<Invoice> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.Number)
            .IsRequired()
            .HasMaxLength(32);
            builder.HasIndex(x => x.Number).IsUnique();


            builder.Property(x => x.BuyerId).IsRequired();
            builder.Property(x => x.AuctionCarId).IsRequired();
            builder.HasIndex(x => x.BuyerId);
            builder.HasIndex(x => x.AuctionCarId).IsUnique(); // 1 invoice per lot


            builder.Property(x => x.Subtotal).HasColumnType("decimal(18,2)");
            builder.Property(x => x.Fees).HasColumnType("decimal(18,2)");
            builder.Property(x => x.Tax).HasColumnType("decimal(18,2)");


            builder.Property(x => x.Status).HasConversion<int>();


            builder.HasMany(x => x.Payments)
            .WithOne()
            .HasForeignKey(p => p.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);


            builder.HasMany(x => x.Transactions)
            .WithOne()
            .HasForeignKey(t => t.InvoiceId)
            .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
