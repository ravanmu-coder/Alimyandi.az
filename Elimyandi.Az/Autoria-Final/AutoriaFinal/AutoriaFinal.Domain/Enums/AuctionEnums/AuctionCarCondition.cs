using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Enums.AuctionEnums
{
    public enum AuctionCarCondition
    {
        PreAuction = 0,                 // Before auction starts
        ReadyForAuction = 1,            // Has pre-bids, ready to go live
        LiveAuction = 2,                // Currently being auctioned
        Sold = 3,                       // Sold, awaiting approval
        Unsold = 4,                     // Did not sell
        AwaitingPayment = 5,            // Approved, awaiting payment
        AwaitingFullPayment = 6,        // Deposit paid, awaiting full payment
        ReadyForPickup = 7,             // Paid, ready for pickup
        Completed = 8,                  // Transaction completed
        Withdrawn = 9                   // Withdrawn from auction
    }
}
