using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Identity
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool IsActive { get; set; } = true;
        public string FullName => $"{FirstName} {LastName}".Trim();
        public int Age => DateOfBirth?.CalculateAge() ?? 0;
        public string PrimaryRole => Roles.FirstOrDefault() ?? "User";
        public bool IsAdmin => Roles.Contains("Admin") || Roles.Contains("SuperAdmin");
        public bool IsSeller => Roles.Contains("Seller") || IsAdmin;
    }

    public static class DateTimeExtensions
    {
        public static int CalculateAge(this DateTime birthDate)
        {
            var today = DateTime.UtcNow.Date;
            var age = today.Year - birthDate.Year;
            if (birthDate.Date > today.AddYears(-age)) age--;
            return Math.Max(0, age);
        }
    }
}
