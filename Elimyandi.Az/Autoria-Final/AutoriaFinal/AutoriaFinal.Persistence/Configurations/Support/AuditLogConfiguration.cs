using AutoriaFinal.Domain.Entities.Support;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Support
{
    public class AuditLogConfiguration : BaseEntityConfiguration<AuditLog>
    {
        public override void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.EntityName)
            .IsRequired()
            .HasMaxLength(100);


            builder.Property(x => x.EntityId)
            .IsRequired();


            builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(50);


            builder.Property(x => x.DataJson)
            .IsRequired(); // store as NVARCHAR(MAX) by default


            builder.HasIndex(x => x.UserId);
            builder.HasIndex(x => new { x.EntityName, x.EntityId });
        }
    }
}
