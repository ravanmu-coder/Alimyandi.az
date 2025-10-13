using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Billing.Invoice
{
    public record InvoiceRequestDto (Guid BuyerId,        // User
        Guid AuctionCarId,
        decimal Subtotal,    // hammer
        decimal Fees,
        decimal Tax,
        string? Number = null);
}
