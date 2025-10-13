using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Admin
{
    public class AdminUserListDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool IsActive { get; set; }
        public List<string> Roles { get; set; } = new();
        public string PrimaryRole { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTime? LastFailedLogin { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public int TotalCars { get; set; }
        public int TotalBids { get; set; }
        public decimal TotalSpent { get; set; }
        public string UserStatus => GetUserStatus();
        public string LastActivityText => GetLastActivityText();
        public bool IsVip => TotalSpent > 10000;
        public string RiskLevel => GetRiskLevel();

        private string GetUserStatus()
        {
            if (!IsActive) return "❌ Deaktiv";
            if (!EmailConfirmed) return "⚠️ Email təsdiqi gözləyir";
            if (FailedLoginAttempts >= 3) return "🔒 Giriş problemləri";
            if (LastLoginAt == null) return "🆕 Heç giriş etməyib";
            if (LastLoginAt < DateTime.UtcNow.AddDays(-30)) return "😴 Uzun müddət girmeyib";
            return "✅ Aktiv";
        }

        private string GetLastActivityText()
        {
            if (LastLoginAt == null) return "Heç daxil olmayıb";
            var days = (DateTime.UtcNow - LastLoginAt.Value).Days;
            return days switch
            {
                0 => "Bu gün",
                1 => "Dünən",
                < 7 => $"{days} gün əvvəl",
                < 30 => $"{days / 7} həftə əvvəl",
                < 365 => $"{days / 30} ay əvvəl",
                _ => $"{days / 365} il əvvəl"
            };
        }

        private string GetRiskLevel()
        {
            var score = 0;
            if (FailedLoginAttempts >= 5) score += 3;
            else if (FailedLoginAttempts >= 3) score += 2;
            else if (FailedLoginAttempts >= 1) score += 1;

            if (!EmailConfirmed) score += 2;
            if (LastLoginAt == null) score += 1;
            else if (LastLoginAt < DateTime.UtcNow.AddDays(-90)) score += 2;

            return score switch
            {
                >= 5 => "🔴 Yüksək",
                >= 3 => "🟡 Orta",
                >= 1 => "🟢 Aşağı",
                _ => "✅ Təhlükəsiz"
            };
        }
    }
}
