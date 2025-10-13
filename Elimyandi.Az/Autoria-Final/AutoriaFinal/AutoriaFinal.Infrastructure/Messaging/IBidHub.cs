using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Enums.Bids;
using AutoriaFinal.Contract.Services.Auctions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace AutoriaFinal.Infrastructure.Messaging
{
    public interface IBidHub_Old
    {
        Task JoinAuctionCar(Guid auctionCarId);
        Task LeaveAuctionCar(Guid auctionCarId);
        Task PlacePreBid(Guid auctionCarId, decimal amount);
        Task PlaceLiveBid(Guid auctionCarId, decimal amount);

        Task PlaceProxyBid(Guid auctionCarId, decimal startAmount, decimal maxAmount);

        Task CancelProxyBid(Guid bidId);
        Task GetAuctionStats(Guid auctionCarId);

        Task GetMyBids(Guid auctionCarId);

    }
}
