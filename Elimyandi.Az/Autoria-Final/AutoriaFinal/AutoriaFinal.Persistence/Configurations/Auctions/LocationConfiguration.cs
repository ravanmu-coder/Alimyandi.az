using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{
    public class LocationConfiguration : BaseEntityConfiguration<Location>
    {
        public override void Configure(EntityTypeBuilder<Location> builder)
        {
            base.Configure(builder);

            builder.Property(x => x.Name)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(x => x.AddressLine1)
                   .HasMaxLength(200);

            builder.Property(x => x.City)
                   .HasMaxLength(100);

            builder.Property(x => x.Region)
                   .HasMaxLength(100);

            builder.Property(x => x.Country)
                   .HasMaxLength(100);

            builder.Property(x => x.PostalCode)
                   .HasMaxLength(20);

            // 1 Location → çoxlu Car
            builder.HasMany(l => l.Cars)
                   .WithOne(c => c.Location)
                   .HasForeignKey(c => c.LocationId)
                   .OnDelete(DeleteBehavior.Restrict);
        }   
    }
}
