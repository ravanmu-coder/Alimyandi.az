using AutoriaFinal.Domain.Entities.Support;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Configurations.Support
{
    public class WatchlistConfiguration : BaseEntityConfiguration<Watchlist>
    {
        public override void Configure(EntityTypeBuilder<Watchlist> builder)
        {
            base.Configure(builder);


            builder.Property(x => x.UserId).IsRequired();
            builder.Property(x => x.AuctionCarId).IsRequired();


            builder.HasIndex(x => new { x.UserId, x.AuctionCarId }).IsUnique();
        }
    }
}
