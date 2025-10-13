using AutoriaFinal.Domain.Entities.Support;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Support
{
    public class DocumentConfiguration : BaseEntityConfiguration<Document>
    {
        public override void Configure(EntityTypeBuilder<Document> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.Type)
            .IsRequired()
            .HasMaxLength(80);


            builder.Property(x => x.Url)
            .IsRequired()
            .HasMaxLength(1024);


            // Optional links to Car/Auction (no cascade delete to keep docs history)
            builder.HasIndex(x => x.CarId);
            builder.HasIndex(x => x.AuctionId);
        }
    }
}
