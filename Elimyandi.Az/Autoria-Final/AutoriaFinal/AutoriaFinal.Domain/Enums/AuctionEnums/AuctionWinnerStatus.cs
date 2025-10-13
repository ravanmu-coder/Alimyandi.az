using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Enums.AuctionEnums
{
    public enum AuctionWinnerStatus
    {
        Pending = 0,                    // No winner yet
        Won = 1,                        // Winner determined
        Unsold = 2,                     // No sale
        AwaitingSellerApproval = 3,     // Seller must approve
        SellerApproved = 4,             // Seller approved sale
        SellerRejected = 5,             // Seller rejected sale
        DepositPaid = 6,                // Winner paid deposit
        PaymentComplete = 7,            // Full payment received
        Completed = 8,                  // Transaction complete
        PaymentFailed = 9,              // Payment failed
        PaymentOverdue = 10,            // Payment overdue
        Cancelled = 11,
        Confirmed = 12
    }
}
