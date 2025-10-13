using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Admin
{
    public class AdminUserFilterDto
    {
        // ✅ PAGINATION
        [Range(1, int.MaxValue, ErrorMessage = "Səhifə nömrəsi 1-dən böyük olmalıdır")]
        public int Page { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Səhifə ölçüsü 1-100 arası olmalıdır")]
        public int PageSize { get; set; } = 20;

        // ✅ SEARCH
        public string? SearchTerm { get; set; }
        public List<string> SearchFields { get; set; } = new() { "Email", "UserName", "FirstName", "LastName" };

        // ✅ FILTERING
        public List<string> Roles { get; set; } = new();
        public bool? IsActive { get; set; }
        public bool? EmailConfirmed { get; set; }
        public bool? PhoneConfirmed { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public DateTime? LastLoginFrom { get; set; }
        public DateTime? LastLoginTo { get; set; }
        public List<string> Countries { get; set; } = new();
        public List<string> Cities { get; set; } = new();
        public int? AgeFrom { get; set; }
        public int? AgeTo { get; set; }
        public decimal? TotalSpentFrom { get; set; }
        public decimal? TotalSpentTo { get; set; }
        public int? FailedLoginAttemptsFrom { get; set; }
        public int? FailedLoginAttemptsTo { get; set; }

        // ✅ SORTING
        public string SortBy { get; set; } = "CreatedAt";
        public string SortDirection { get; set; } = "DESC"; // ASC | DESC

        // ✅ ADVANCED FILTERS
        public bool? RequiresAttention { get; set; }
        public bool? IsVip { get; set; }
        public bool? HasProfilePicture { get; set; }
        public bool? AllowsMarketing { get; set; }
        public List<string> RiskLevels { get; set; } = new();

        // ✅ EXPORT OPTIONS
        public bool ExportMode { get; set; } = false;
        public string ExportFormat { get; set; } = "Excel"; // Excel | CSV | PDF
        public List<string> ExportFields { get; set; } = new();

        // ✅ VALIDATION
        public bool IsValid()
        {
            if (CreatedFrom.HasValue && CreatedTo.HasValue && CreatedFrom > CreatedTo)
                return false;

            if (LastLoginFrom.HasValue && LastLoginTo.HasValue && LastLoginFrom > LastLoginTo)
                return false;

            if (AgeFrom.HasValue && AgeTo.HasValue && AgeFrom > AgeTo)
                return false;

            if (TotalSpentFrom.HasValue && TotalSpentTo.HasValue && TotalSpentFrom > TotalSpentTo)
                return false;

            return true;
        }

        // ✅ HELPER METHODS
        public bool HasAnyFilter()
        {
            return !string.IsNullOrWhiteSpace(SearchTerm) ||
                   Roles.Any() ||
                   IsActive.HasValue ||
                   EmailConfirmed.HasValue ||
                   CreatedFrom.HasValue ||
                   CreatedTo.HasValue ||
                   Countries.Any() ||
                   Cities.Any() ||
                   RequiresAttention.HasValue ||
                   IsVip.HasValue;
        }

        public Dictionary<string, object> ToFilterDictionary()
        {
            var filters = new Dictionary<string, object>();

            if (!string.IsNullOrWhiteSpace(SearchTerm))
                filters.Add("SearchTerm", SearchTerm);

            if (Roles.Any())
                filters.Add("Roles", string.Join(", ", Roles));

            if (IsActive.HasValue)
                filters.Add("IsActive", IsActive.Value ? "Aktiv" : "Deaktiv");

            if (EmailConfirmed.HasValue)
                filters.Add("EmailConfirmed", EmailConfirmed.Value ? "Təsdiqlənib" : "Təsdiqlənməyib");

            if (CreatedFrom.HasValue)
                filters.Add("CreatedFrom", CreatedFrom.Value.ToString("dd.MM.yyyy"));

            if (CreatedTo.HasValue)
                filters.Add("CreatedTo", CreatedTo.Value.ToString("dd.MM.yyyy"));

            return filters;
        }
    }

    public class AdminBulkActionDto
    {
        [Required(ErrorMessage = "İstifadəçi ID-ləri tələb olunur")]
        public List<Guid> UserIds { get; set; } = new();

        [Required(ErrorMessage = "Əməliyyat növü tələb olunur")]
        public string Action { get; set; } = string.Empty; // "Activate", "Deactivate", "AssignRole", "RemoveRole", "Delete"

        public string? Value { get; set; } // For AssignRole/RemoveRole
        public string? Reason { get; set; }
        public bool SendNotification { get; set; } = true;

        public bool IsValid()
        {
            if (!UserIds.Any()) return false;

            var validActions = new[] { "Activate", "Deactivate", "AssignRole", "RemoveRole", "Delete", "SendEmail" };
            if (!validActions.Contains(Action)) return false;

            if ((Action == "AssignRole" || Action == "RemoveRole") && string.IsNullOrWhiteSpace(Value))
                return false;

            return true;
        }
    }

    public class AdminUserExportDto
    {
        public string Format { get; set; } = "Excel"; // Excel | CSV | PDF
        public List<string> Fields { get; set; } = new();
        public AdminUserFilterDto Filter { get; set; } = new();
        public bool IncludeStatistics { get; set; } = true;
        public bool IncludeAuditLog { get; set; } = false;
        public string? FileName { get; set; }
    }
}
