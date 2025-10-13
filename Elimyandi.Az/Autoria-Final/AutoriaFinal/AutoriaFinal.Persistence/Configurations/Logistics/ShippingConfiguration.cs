using AutoriaFinal.Domain.Entities.Logistics;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Logistics
{
    public class ShippingConfiguration : BaseEntityConfiguration<Shipping>
    {
        public override void Configure(EntityTypeBuilder<Shipping> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.AuctionCarId).IsRequired();
            builder.Property(x => x.ShippingCompanyId).IsRequired();
            builder.HasIndex(x => x.AuctionCarId).IsUnique(); // 1 shipping per lot
            builder.HasIndex(x => x.ShippingCompanyId);


            builder.Property(x => x.Status).HasConversion<int>();


            builder.Property(x => x.TrackingNumber).HasMaxLength(128);


            builder.Property(x => x.DeliveryCountry).HasMaxLength(80);
            builder.Property(x => x.DeliveryCity).HasMaxLength(120);
            builder.Property(x => x.DeliveryAddress).HasMaxLength(200);
            builder.Property(x => x.PostalCode).HasMaxLength(20);
        }
    }
}
