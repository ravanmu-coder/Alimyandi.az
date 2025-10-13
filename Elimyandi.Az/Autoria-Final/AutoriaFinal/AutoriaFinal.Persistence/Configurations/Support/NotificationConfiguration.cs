using AutoriaFinal.Domain.Entities.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Support
{
    public class NotificationConfiguration : BaseEntityConfiguration<Notification>
    {
        public override void Configure(EntityTypeBuilder<Notification> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.UserId).IsRequired();
            builder.HasIndex(x => x.UserId);


            builder.Property(x => x.Type).HasConversion<int>();


            builder.Property(x => x.PayloadJson)
            .IsRequired()
            .HasMaxLength(4000);


            builder.Property(x => x.IsRead)
            .HasDefaultValue(false);


            builder.Property(x => x.ReadAtUtc);


            builder.HasIndex(x => new { x.UserId, x.IsRead });
        }
    }
}
