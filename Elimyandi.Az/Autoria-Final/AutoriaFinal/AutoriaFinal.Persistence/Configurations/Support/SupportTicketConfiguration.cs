using AutoriaFinal.Domain.Entities.Support;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Support
{
    public class SupportTicketConfiguration : BaseEntityConfiguration<SupportTicket>
    {
        public override void Configure(EntityTypeBuilder<SupportTicket> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.UserId).IsRequired();
            builder.HasIndex(x => x.UserId);


            builder.Property(x => x.Subject)
            .IsRequired()
            .HasMaxLength(200);


            builder.Property(x => x.Status)
            .HasConversion<int>();


            builder.HasMany(x => x.Messages)
            .WithOne()
            .HasForeignKey(m => m.TicketId)
            .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
