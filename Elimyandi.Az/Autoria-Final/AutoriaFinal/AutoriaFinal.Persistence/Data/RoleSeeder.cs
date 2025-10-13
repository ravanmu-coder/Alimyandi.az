using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AutoriaFinal.Persistence.Data
{
  
    public static class RoleSeeder
    {
        public static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
        {
            var roles = new[]
            {
                new { Name = "Admin", Description = "Sistem administratoru - tam icazələr" },
                new { Name = "Seller", Description = "Satıcı - avtomobil əlavə edə və hərrac yarada bilər" },
                new { Name = "Member", Description = "Üzv - hərraca iştirak edə və bid verə bilər" },
                //new { Name = "AuctionManager", Description = "Hərrac meneceri - hərracları idarə edə bilər" },
                //new { Name = "Moderator", Description = "Moderator - məzmunu yoxlaya və tənzimləyə bilər" }
            };

            foreach (var roleInfo in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleInfo.Name))
                {
                    // Yeni rol yarat
                    var role = new ApplicationRole
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = roleInfo.Name,
                        NormalizedName = roleInfo.Name.ToUpperInvariant(),
                        ConcurrencyStamp = Guid.NewGuid().ToString(),
                        Description = roleInfo.Description,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    var result = await roleManager.CreateAsync(role);

                    if (result.Succeeded)
                    {
                        Console.WriteLine($"✅ Role created successfully: {roleInfo.Name}");
                    }
                    else
                    {
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        Console.WriteLine($"❌ Failed to create role {roleInfo.Name}: {errors}");
                    }
                }
                else
                {
                    Console.WriteLine($"ℹ️ Role already exists: {roleInfo.Name}");
                }
            }
        }
        public static async Task<bool> AssignUserToRoleAsync(
            UserManager<ApplicationUser> userManager,
            string userId,
            string roleName)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(roleName))
            {
                Console.WriteLine("❌ User ID və ya rol adı boş ola bilməz");
                return false;
            }

            // İstifadəçini tap
            var user = await userManager.FindByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"❌ User not found with ID: {userId}");
                return false;
            }

            // Rol mövcudluğunu yoxla
            if (await userManager.IsInRoleAsync(user, roleName))
            {
                Console.WriteLine($"ℹ️ User {user.Email} already has role: {roleName}");
                return true;
            }

            // Rol təyin et
            var result = await userManager.AddToRoleAsync(user, roleName);
            if (result.Succeeded)
            {
                Console.WriteLine($"✅ Role '{roleName}' assigned to user: {user.Email}");
                return true;
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"❌ Failed to assign role '{roleName}' to user {user.Email}: {errors}");
                return false;
            }
        }
        public static async Task CreateDefaultAdminAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager)
        {
            const string adminEmail = "admin@autoria.az";
            const string adminPassword = "Admin123!";

            // Admin user mövcudluğunu yoxla
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                // Admin user yarat
                adminUser = new ApplicationUser
                {
                    UserName = "admin",
                    Email = adminEmail,
                    FirstName = "System",
                    LastName = "Administrator",
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    PhoneNumberConfirmed = false
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    // Admin rolunu təyin et
                    await AssignUserToRoleAsync(userManager, adminUser.Id, "Admin");
                    await AssignUserToRoleAsync(userManager, adminUser.Id, "Seller");

                    Console.WriteLine($"✅ Default admin user created: {adminEmail}");
                    Console.WriteLine($"🔑 Password: {adminPassword}");
                }
                else
                {

                }
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    Console.WriteLine($"❌ Failed to create admin user: {errors}");
                }
            }
            else
            {
                Console.WriteLine($"ℹ️ Admin user already exists: {adminEmail}");
            }
        }

        
    }
}