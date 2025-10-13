using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Auctions
{
    public class LotMediaConfiguration : BaseEntityConfiguration<LotMedia>
    {
        public override void Configure(EntityTypeBuilder<LotMedia> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.Url)
            .IsRequired()
            .HasMaxLength(1024);


            builder.Property(x => x.Type)
            .HasConversion<int>();


            builder.Property(x => x.ContentType)
            .HasMaxLength(100);


            builder.Property(x => x.SortOrder)
            .HasDefaultValue(0);


            builder.Property(x => x.IsPrimary)
            .HasDefaultValue(false);


            builder.HasIndex(x => x.AuctionCarId);
            builder.HasIndex(x => new { x.AuctionCarId, x.SortOrder }).IsUnique();

        }
    }
}
