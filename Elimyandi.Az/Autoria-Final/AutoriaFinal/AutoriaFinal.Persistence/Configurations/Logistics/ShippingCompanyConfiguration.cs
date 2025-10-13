using AutoriaFinal.Domain.Entities.Logistics;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Logistics
{
    public class ShippingCompanyConfiguration : BaseEntityConfiguration<ShippingCompany>
    {
        public override void Configure(EntityTypeBuilder<ShippingCompany> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(150);
            builder.HasIndex(x => x.Name).IsUnique();


            builder.Property(x => x.Phone).HasMaxLength(32);
            builder.Property(x => x.Email).HasMaxLength(256);
        }
    }
}
