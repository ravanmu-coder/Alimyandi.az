using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Admin
{
    public class AdminUserDetailDto
    {
        // ✅ BASIC INFO
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int Age { get; set; }
        public string? ProfilePicture { get; set; }
        public string? Bio { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }

        // ✅ STATUS & SECURITY
        public bool IsActive { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsDeleted { get; set; }

        // ✅ SECURITY DETAILS
        public int FailedLoginAttempts { get; set; }
        public DateTime? LastFailedLogin { get; set; }
        public DateTime? PasswordChangedAt { get; set; }
        public DateTime? EmailChangedAt { get; set; }
        public string? SecurityStamp { get; set; }
        public string? ConcurrencyStamp { get; set; }

        // ✅ ROLES & PERMISSIONS
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public string PrimaryRole { get; set; } = string.Empty;

        // ✅ PREFERENCES
        public bool AllowMarketing { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? TimeZone { get; set; }

        // ✅ BUSINESS STATISTICS
        public AdminUserStatsDto Stats { get; set; } = new();

        // ✅ RECENT ACTIVITIES
        public List<AdminUserActivityDto> RecentActivities { get; set; } = new();

        // ✅ COMPUTED PROPERTIES
        public string AccountStatus => GetAccountStatus();
        public string RiskAssessment => GetRiskAssessment();
        public bool RequiresAttention => GetRequiresAttention();
        public List<string> SecurityAlerts => GetSecurityAlerts();
        public TimeSpan AccountAge => DateTime.UtcNow - CreatedAt;
        public string MembershipDuration => GetMembershipDuration();

        private string GetAccountStatus()
        {
            if (IsDeleted) return "🗑️ Silindi";
            if (!IsActive) return "❌ Deaktiv";
            if (!EmailConfirmed) return "⚠️ Email təsdiqi gözləyir";
            if (FailedLoginAttempts >= 5) return "🔒 Bloklandı";
            return "✅ Aktiv";
        }

        private string GetRiskAssessment()
        {
            var riskScore = 0;

            // Login patterns
            if (FailedLoginAttempts >= 10) riskScore += 5;
            else if (FailedLoginAttempts >= 5) riskScore += 3;
            else if (FailedLoginAttempts >= 3) riskScore += 1;

            // Account verification
            if (!EmailConfirmed) riskScore += 3;
            if (!PhoneNumberConfirmed) riskScore += 1;

            // Activity patterns
            if (LastLoginAt == null) riskScore += 2;
            else if (LastLoginAt < DateTime.UtcNow.AddDays(-180)) riskScore += 3;

            return riskScore switch
            {
                >= 8 => "🔴 Çox yüksək risk",
                >= 5 => "🟠 Yüksək risk",
                >= 3 => "🟡 Orta risk",
                >= 1 => "🟢 Aşağı risk",
                _ => "✅ Minimal risk"
            };
        }

        private bool GetRequiresAttention()
        {
            return !IsActive || !EmailConfirmed || FailedLoginAttempts >= 5 ||
                   (LastLoginAt != null && LastLoginAt < DateTime.UtcNow.AddDays(-90));
        }

        private List<string> GetSecurityAlerts()
        {
            var alerts = new List<string>();

            if (FailedLoginAttempts >= 5)
                alerts.Add($"🚨 {FailedLoginAttempts} səhv giriş cəhdi");

            if (!EmailConfirmed)
                alerts.Add("⚠️ Email təsdiqi gözləyir");

            if (LastLoginAt == null)
                alerts.Add("⚠️ Heç giriş etməyib");
            else if (LastLoginAt < DateTime.UtcNow.AddDays(-180))
                alerts.Add("⚠️ 6 aydan çox giriş etməyib");

            if (PasswordChangedAt == null || PasswordChangedAt < DateTime.UtcNow.AddDays(-365))
                alerts.Add("🔐 Parol köhnədir (1 ildən çox)");

            return alerts;
        }

        private string GetMembershipDuration()
        {
            var duration = AccountAge;
            if (duration.Days < 1) return "Bu gün qeydiyyat olub";
            if (duration.Days < 30) return $"{duration.Days} gün";
            if (duration.Days < 365) return $"{duration.Days / 30} ay";
            return $"{duration.Days / 365} il";
        }
    }

    public class AdminUserStatsDto
    {
        public int TotalCars { get; set; }
        public int ActiveCars { get; set; }
        public int SoldCars { get; set; }
        public int TotalBids { get; set; }
        public int WonAuctions { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal TotalEarned { get; set; }
        public int TotalTransactions { get; set; }
        public int TotalLogins { get; set; }
        public double AverageSessionDuration { get; set; }
        public string FavoriteCategory { get; set; } = string.Empty;
        public DateTime? LastPurchase { get; set; }
        public DateTime? LastSale { get; set; }
    }

    public class AdminUserActivityDto
    {
        public DateTime Timestamp { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
