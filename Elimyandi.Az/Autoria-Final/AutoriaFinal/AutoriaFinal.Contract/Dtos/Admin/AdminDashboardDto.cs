using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Admin
{
    public class AdminDashboardDto
    {
        public AdminUserStatsOverview UserStats { get; set; } = new();
        public AdminAuctionStatsOverview AuctionStats { get; set; } = new();
        public AdminFinancialStatsOverview FinancialStats { get; set; } = new();
        public AdminSystemStatsOverview SystemStats { get; set; } = new();
        public List<AdminRecentActivityDto> RecentActivities { get; set; } = new();
        public List<AdminAlertDto> SystemAlerts { get; set; } = new();
        public List<AdminTopUserDto> TopUsers { get; set; } = new();
        public AdminChartDataDto ChartData { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public TimeSpan GenerationTime { get; set; }
    }

    public class AdminUserStatsOverview
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int NewUsersToday { get; set; }
        public int NewUsersThisWeek { get; set; }
        public int NewUsersThisMonth { get; set; }
        public int UnconfirmedUsers { get; set; }
        public int BlockedUsers { get; set; }
        public int VipUsers { get; set; }
        public double ActiveUserPercentage => TotalUsers > 0 ? (double)ActiveUsers / TotalUsers * 100 : 0;
        public double ConfirmationRate => TotalUsers > 0 ? (double)(TotalUsers - UnconfirmedUsers) / TotalUsers * 100 : 0;
        public List<AdminUsersByRoleDto> UsersByRole { get; set; } = new();
        public List<AdminUsersByLocationDto> UsersByLocation { get; set; } = new();
    }

    public class AdminAuctionStatsOverview
    {
        public int TotalAuctions { get; set; }
        public int ActiveAuctions { get; set; }
        public int CompletedAuctions { get; set; }
        public int CancelledAuctions { get; set; }
        public int TotalCars { get; set; }
        public int CarsInAuction { get; set; }
        public int SoldCars { get; set; }
        public int UnsoldCars { get; set; }
        public double SellThroughRate => TotalCars > 0 ? (double)SoldCars / TotalCars * 100 : 0;
        public decimal AverageCarPrice { get; set; }
        public int TotalBids { get; set; }
        public int BidsToday { get; set; }
        public double AverageBidsPerCar => TotalCars > 0 ? (double)TotalBids / TotalCars : 0;
    }

    public class AdminFinancialStatsOverview
    {
        public decimal TotalRevenue { get; set; }
        public decimal RevenueToday { get; set; }
        public decimal RevenueThisWeek { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public decimal RevenueThisYear { get; set; }
        public decimal CommissionEarned { get; set; }
        public decimal PendingPayments { get; set; }
        public decimal CompletedPayments { get; set; }
        public int TotalTransactions { get; set; }
        public int PendingTransactions { get; set; }
        public int FailedTransactions { get; set; }
        public double PaymentSuccessRate => TotalTransactions > 0 ? (double)(TotalTransactions - FailedTransactions) / TotalTransactions * 100 : 0;
        public decimal AverageTransactionAmount { get; set; }
    }

    public class AdminSystemStatsOverview
    {
        public double SystemUptime { get; set; }
        public int TotalApiCalls { get; set; }
        public int ApiCallsToday { get; set; }
        public double AverageResponseTime { get; set; }
        public int ErrorCount { get; set; }
        public int WarningCount { get; set; }
        public int ActiveConnections { get; set; }
        public long DatabaseSize { get; set; }
        public long StorageUsed { get; set; }
        public double CpuUsage { get; set; }
        public double MemoryUsage { get; set; }
        public string ServerHealth => GetServerHealth();

        private string GetServerHealth()
        {
            if (SystemUptime < 95) return "🔴 Kritik";
            if (SystemUptime < 99) return "🟡 Diqqət";
            return "✅ Yaxşı";
        }
    }

    public class AdminRecentActivityDto
    {
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Icon => GetIcon();

        private string GetIcon()
        {
            return Type.ToLower() switch
            {
                "login" => "🔑",
                "logout" => "🚪",
                "register" => "📝",
                "bid" => "💰",
                "auction" => "🏆",
                "payment" => "💳",
                "error" => "❌",
                "warning" => "⚠️",
                _ => "ℹ️"
            };
        }
    }

    public class AdminAlertDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }
        public string ActionUrl { get; set; } = string.Empty;
        public string Icon => GetIcon();

        private string GetIcon()
        {
            return Severity.ToLower() switch
            {
                "critical" => "🚨",
                "high" => "🔴",
                "medium" => "🟡",
                "low" => "🟢",
                "info" => "ℹ️",
                _ => "📌"
            };
        }
    }

    public class AdminTopUserDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal TotalSpent { get; set; }
        public int TotalPurchases { get; set; }
        public int TotalBids { get; set; }
        public DateTime LastActivity { get; set; }
        public string Category { get; set; } = string.Empty; // "Buyer", "Seller", "Active", etc.
    }

    public class AdminUsersByRoleDto
    {
        public string Role { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class AdminUsersByLocationDto
    {
        public string Location { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class AdminChartDataDto
    {
        public List<AdminChartPointDto> UserRegistrations { get; set; } = new();
        public List<AdminChartPointDto> AuctionActivity { get; set; } = new();
        public List<AdminChartPointDto> Revenue { get; set; } = new();
        public List<AdminChartPointDto> BidActivity { get; set; } = new();
    }

    public class AdminChartPointDto
    {
        public DateTime Date { get; set; }
        public decimal Value { get; set; }
        public string Label { get; set; } = string.Empty;
    }
}
