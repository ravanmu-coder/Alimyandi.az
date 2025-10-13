using AutoriaFinal.Domain.Entities.Support;
using AutoriaFinal.Domain.Repositories.Support;
using AutoriaFinal.Persistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Support
{
    public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IQueryable<Notification>> GetUnreadByUserAsync(Guid userId)
            => await Task.FromResult(_context.Notifications.Where(n => n.UserId == userId && !n.IsRead).AsQueryable());
    }
}
