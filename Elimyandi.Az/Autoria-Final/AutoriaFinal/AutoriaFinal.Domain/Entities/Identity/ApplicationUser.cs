using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Entities.Auctions;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Domain.Entities.Identity
{
    public class ApplicationUser : IdentityUser
    {
        // ✅ BASIC INFO
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;

        // ✅ PERSONAL INFO
        public DateTime? DateOfBirth { get; set; }
        public string? ProfilePicture { get; set; }
        public string? Bio { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }

        // ✅ PREFERENCES
        public bool AllowMarketing { get; set; } = false;
        public string? PreferredLanguage { get; set; } = "az";
        public string? TimeZone { get; set; }

        // ✅ AUDIT FIELDS
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsDeleted { get; set; } = false;

        //  SECURITY
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LastFailedLogin { get; set; }
        public DateTime? PasswordChangedAt { get; set; }

        public ICollection<Car> Cars { get; set; } = new List<Car>();

        //  COMPUTED PROPERTIES
        public string FullName => $"{FirstName} {LastName}".Trim();
        public int Age
        {
            get
            {
                if (DateOfBirth == null) return 0;
                var today = DateTime.UtcNow.Date;
                var age = today.Year - DateOfBirth.Value.Year;
                if (DateOfBirth.Value.Date > today.AddYears(-age)) age--;
                return Math.Max(0, age);
            }
        }

        // BUSINESS METHODS
        public void Activate() => IsActive = true;
        public void Deactivate() => IsActive = false;
        public void UpdateLastLogin() => LastLoginAt = DateTime.UtcNow;
        public void IncrementFailedLogin()
        {
            FailedLoginAttempts++;
            LastFailedLogin = DateTime.UtcNow;
        }
        public void ResetFailedLogin() => FailedLoginAttempts = 0;
        public void MarkAsUpdated(string updatedBy = "System")
        {
            UpdatedAt = DateTime.UtcNow;
            UpdatedBy = updatedBy;
        }
        public void SoftDelete()
        {
            IsDeleted = true;
            DeletedAt = DateTime.UtcNow;
            IsActive = false;
        }
    }
}
