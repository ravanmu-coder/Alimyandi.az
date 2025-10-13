using AutoriaFinal.Domain.Entities.Support;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Support
{
    public class SupportMessageConfiguration : BaseEntityConfiguration<SupportMessage>
    {
        public override void Configure(EntityTypeBuilder<SupportMessage> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.TicketId).IsRequired();
            builder.Property(x => x.FromUserId).IsRequired();


            builder.Property(x => x.Body)
            .IsRequired()
            .HasMaxLength(2000);


            builder.HasIndex(x => x.TicketId);
        }
    }
}
