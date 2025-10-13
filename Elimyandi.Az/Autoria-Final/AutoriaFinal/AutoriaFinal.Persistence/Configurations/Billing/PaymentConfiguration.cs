using AutoriaFinal.Domain.Entities.Billing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Billing
{
    public class PaymentConfiguration : BaseEntityConfiguration<Payment>
    {
        public override void Configure(EntityTypeBuilder<Payment> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.InvoiceId).IsRequired();
            builder.HasIndex(x => x.InvoiceId);


            builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");


            builder.Property(x => x.Method).HasConversion<int>();
            builder.Property(x => x.Status).HasConversion<int>();


            builder.Property(x => x.ProviderRef)
            .IsRequired()
            .HasMaxLength(128);
            builder.HasIndex(x => x.ProviderRef);


            builder.Property(x => x.PaidAtUtc);
        }
    }
}
