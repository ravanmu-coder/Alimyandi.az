using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Enums.AuctionEnums
{
    public enum WinnerNotificationType
    {
        WinnerAnnouncement = 1,     // Qalib elan edilməsi
        ConfirmationRequired = 2,   // Seller təsdiqi tələb olunur
        PaymentReminder = 3,        // Ödəniş xatırlatması
        PaymentOverdue = 4,         // Ödəniş gecikməsi
        PaymentReceived = 5,        // Ödəniş qəbul edildi
        SaleCompleted = 6,          // Satış tamamlandı
        SaleCancelled = 7,          // Satış ləğv edildi
        SecondChanceOffered = 8     // İkinci şans təklifi
    }
}
