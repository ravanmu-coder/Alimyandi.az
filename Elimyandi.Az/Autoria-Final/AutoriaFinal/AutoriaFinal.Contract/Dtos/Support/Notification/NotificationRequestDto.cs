using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Support.Notification
{
    public record NotificationRequestDto (
          Guid UserId,
        NotificationType Type,
        string PayloadJson);
}
