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
    public class TransactionPaymentConfiguration : BaseEntityConfiguration<TransactionPayment>
    {
        public override void Configure(EntityTypeBuilder<TransactionPayment> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.UserId).IsRequired();
            builder.HasIndex(x => x.UserId);


            builder.Property(x => x.InvoiceId);
            builder.HasIndex(x => x.InvoiceId);


            builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");


            builder.Property(x => x.Type).HasConversion<int>();


            builder.Property(x => x.Reference)
            .IsRequired()
            .HasMaxLength(64);
            builder.HasIndex(x => x.Reference);


            builder.Property(x => x.Notes)
            .HasMaxLength(500);
        }
    }
}
