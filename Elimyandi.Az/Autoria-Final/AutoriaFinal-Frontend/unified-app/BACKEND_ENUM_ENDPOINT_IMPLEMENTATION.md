# Backend Enum Metadata Endpoint Implementation Guide

## Overview
This document provides a complete implementation guide for creating the `/api/metadata/enums` endpoint in your .NET backend. This endpoint will provide enum-to-label mappings for the frontend to display human-readable labels instead of numeric values.

## Required Endpoint

**Endpoint**: `GET /api/metadata/enums`  
**Authentication**: Requires authentication (JWT token)  
**Response Format**: JSON object mapping enum names to value-label pairs

### Expected Response Format
```json
{
  "AuctionStatus": { "0":"Draft", "1":"Scheduled", "2":"Running", "3":"Ended", "4":"Cancelled", "5":"Settled" },
  "BidStatus": { "0":"Placed", "1":"Retracted", "2":"Invalidated" },
  "BidType": { "1":"Regular", "2":"PreBid", "3":"ProxyBid", "4":"AutoBid" },
  "CarCondition": { "0":"Unknown", "1":"RunAndDrive", "2":"EngineStartProgram", "3":"NoStart", "4":"PartsOnly" },
  "DamageType": { "0":"Unknown", "1":"FrontEnd", "2":"RearEnd", "3":"Side", "4":"AllOver", "5":"Hail", "6":"Flood", "7":"Fire", "8":"Vandalism", "9":"NormalWear" },
  "DriveTrain": { "0":"Unknown", "1":"FWD", "2":"RWD", "3":"AWD", "4":"4WD" },
  "FuelType": { "0":"Unknown", "1":"Gasoline", "2":"Diesel", "3":"Electric", "4":"Hybrid", "5":"Other" },
  "TitleType": { "0":"Unknown", "1":"Clean", "2":"Salvage", "3":"Rebuilt", "4":"Flood", "5":"Fire", "6":"Lemon", "7":"Other" },
  "Transmission": { "0":"Unknown", "1":"Manual", "2":"Automatic", "3":"CVT", "4":"SemiAutomatic" }
}
```

## Implementation Steps

### 1. Create Enum Definitions
First, ensure your enums are properly defined in your backend project:

```csharp
// Enums/AuctionStatus.cs
namespace YourProject.Enums
{
    public enum AuctionStatus
    {
        Draft = 0,
        Scheduled = 1,
        Running = 2,
        Ended = 3,
        Cancelled = 4,
        Settled = 5
    }
}

// Enums/BidStatus.cs
namespace YourProject.Enums
{
    public enum BidStatus
    {
        Placed = 0,
        Retracted = 1,
        Invalidated = 2
    }
}

// Enums/BidType.cs
namespace YourProject.Enums
{
    public enum BidType
    {
        Regular = 1,
        PreBid = 2,
        ProxyBid = 3,
        AutoBid = 4
    }
}

// Enums/CarCondition.cs
namespace YourProject.Enums
{
    public enum CarCondition
    {
        Unknown = 0,
        RunAndDrive = 1,
        EngineStartProgram = 2,
        NoStart = 3,
        PartsOnly = 4
    }
}

// Enums/DamageType.cs
namespace YourProject.Enums
{
    public enum DamageType
    {
        Unknown = 0,
        FrontEnd = 1,
        RearEnd = 2,
        Side = 3,
        AllOver = 4,
        Hail = 5,
        Flood = 6,
        Fire = 7,
        Vandalism = 8,
        NormalWear = 9
    }
}

// Enums/DriveTrain.cs
namespace YourProject.Enums
{
    public enum DriveTrain
    {
        Unknown = 0,
        FWD = 1,
        RWD = 2,
        AWD = 3,
        FourWD = 4
    }
}

// Enums/FuelType.cs
namespace YourProject.Enums
{
    public enum FuelType
    {
        Unknown = 0,
        Gasoline = 1,
        Diesel = 2,
        Electric = 3,
        Hybrid = 4,
        Other = 5
    }
}

// Enums/TitleType.cs
namespace YourProject.Enums
{
    public enum TitleType
    {
        Unknown = 0,
        Clean = 1,
        Salvage = 2,
        Rebuilt = 3,
        Flood = 4,
        Fire = 5,
        Lemon = 6,
        Other = 7
    }
}

// Enums/Transmission.cs
namespace YourProject.Enums
{
    public enum Transmission
    {
        Unknown = 0,
        Manual = 1,
        Automatic = 2,
        CVT = 3,
        SemiAutomatic = 4
    }
}
```

### 2. Create the Metadata Controller

```csharp
// Controllers/MetadataController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using YourProject.Enums;

namespace YourProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication
    public class MetadataController : ControllerBase
    {
        [HttpGet("enums")]
        public IActionResult GetEnumsMetadata()
        {
            try
            {
                var enumMetadata = new Dictionary<string, Dictionary<string, string>>();

                // List of enums to expose to the frontend
                var enumsToExpose = new Type[]
                {
                    typeof(AuctionStatus),
                    typeof(BidStatus),
                    typeof(BidType),
                    typeof(CarCondition),
                    typeof(DamageType),
                    typeof(DriveTrain),
                    typeof(FuelType),
                    typeof(TitleType),
                    typeof(Transmission)
                };

                foreach (var enumType in enumsToExpose)
                {
                    var enumValues = Enum.GetValues(enumType);
                    var enumMap = new Dictionary<string, string>();

                    foreach (var value in enumValues)
                    {
                        // Get the integer value and its string representation (name)
                        var intValue = (int)value;
                        var name = value.ToString();

                        // Add to the map, ensuring the key is a stringified integer
                        enumMap.Add(intValue.ToString(), name);
                    }
                    
                    enumMetadata.Add(enumType.Name, enumMap);
                }

                return Ok(enumMetadata);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve enum metadata", details = ex.Message });
            }
        }

        [HttpGet("enums/{enumName}")]
        public IActionResult GetEnumMetadata(string enumName)
        {
            try
            {
                // Find the enum type by name
                var enumType = Assembly.GetExecutingAssembly()
                    .GetTypes()
                    .FirstOrDefault(t => t.IsEnum && t.Name.Equals(enumName, StringComparison.OrdinalIgnoreCase));

                if (enumType == null)
                {
                    return NotFound(new { error = $"Enum '{enumName}' not found" });
                }

                var enumValues = Enum.GetValues(enumType);
                var enumMap = new Dictionary<string, string>();

                foreach (var value in enumValues)
                {
                    var intValue = (int)value;
                    var name = value.ToString();
                    enumMap.Add(intValue.ToString(), name);
                }

                return Ok(new { [enumName] = enumMap });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve enum metadata", details = ex.Message });
            }
        }
    }
}
```

### 3. Alternative Implementation with Custom Attributes

If you want more control over the labels, you can use custom attributes:

```csharp
// Attributes/EnumLabelAttribute.cs
using System;

namespace YourProject.Attributes
{
    [AttributeUsage(AttributeTargets.Field)]
    public class EnumLabelAttribute : Attribute
    {
        public string Label { get; }
        public string Description { get; }

        public EnumLabelAttribute(string label, string description = null)
        {
            Label = label;
            Description = description;
        }
    }
}

// Updated enum with custom labels
namespace YourProject.Enums
{
    public enum AuctionStatus
    {
        [EnumLabel("Draft", "Auction is being prepared")]
        Draft = 0,
        
        [EnumLabel("Scheduled", "Auction is scheduled to start")]
        Scheduled = 1,
        
        [EnumLabel("Running", "Auction is currently active")]
        Running = 2,
        
        [EnumLabel("Ended", "Auction has finished")]
        Ended = 3,
        
        [EnumLabel("Cancelled", "Auction was cancelled")]
        Cancelled = 4,
        
        [EnumLabel("Settled", "Auction is settled")]
        Settled = 5
    }
}

// Updated controller method to use custom attributes
[HttpGet("enums")]
public IActionResult GetEnumsMetadata()
{
    try
    {
        var enumMetadata = new Dictionary<string, Dictionary<string, string>>();
        var enumsToExpose = new Type[]
        {
            typeof(AuctionStatus),
            typeof(BidStatus),
            typeof(BidType),
            typeof(CarCondition),
            typeof(DamageType),
            typeof(DriveTrain),
            typeof(FuelType),
            typeof(TitleType),
            typeof(Transmission)
        };

        foreach (var enumType in enumsToExpose)
        {
            var enumValues = Enum.GetValues(enumType);
            var enumMap = new Dictionary<string, string>();

            foreach (var value in enumValues)
            {
                var intValue = (int)value;
                var name = value.ToString();
                
                // Check for custom label attribute
                var field = enumType.GetField(name);
                var labelAttribute = field?.GetCustomAttribute<EnumLabelAttribute>();
                
                var displayName = labelAttribute?.Label ?? name;
                enumMap.Add(intValue.ToString(), displayName);
            }
            
            enumMetadata.Add(enumType.Name, enumMap);
        }

        return Ok(enumMetadata);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { error = "Failed to retrieve enum metadata", details = ex.Message });
    }
}
```

### 4. Add Caching (Optional)

For better performance, you can add caching:

```csharp
// Controllers/MetadataController.cs (with caching)
using Microsoft.Extensions.Caching.Memory;

public class MetadataController : ControllerBase
{
    private readonly IMemoryCache _cache;
    private const string ENUM_CACHE_KEY = "enum_metadata";
    private readonly TimeSpan CACHE_DURATION = TimeSpan.FromHours(1);

    public MetadataController(IMemoryCache cache)
    {
        _cache = cache;
    }

    [HttpGet("enums")]
    public IActionResult GetEnumsMetadata()
    {
        if (_cache.TryGetValue(ENUM_CACHE_KEY, out Dictionary<string, Dictionary<string, string>> cachedMetadata))
        {
            return Ok(cachedMetadata);
        }

        try
        {
            var enumMetadata = new Dictionary<string, Dictionary<string, string>>();
            // ... enum processing logic ...

            _cache.Set(ENUM_CACHE_KEY, enumMetadata, CACHE_DURATION);
            return Ok(enumMetadata);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to retrieve enum metadata", details = ex.Message });
        }
    }
}
```

### 5. Register Services (if using DI)

```csharp
// Program.cs or Startup.cs
public void ConfigureServices(IServiceCollection services)
{
    // ... other services ...
    
    // Add memory cache for enum metadata
    services.AddMemoryCache();
    
    // ... other services ...
}
```

## Testing the Endpoint

### Using Postman/curl
```bash
# Test the endpoint
curl -X GET "https://your-api-url/api/metadata/enums" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
  "AuctionStatus": { "0":"Draft", "1":"Scheduled", "2":"Running", "3":"Ended", "4":"Cancelled", "5":"Settled" },
  "BidStatus": { "0":"Placed", "1":"Retracted", "2":"Invalidated" },
  "BidType": { "1":"Regular", "2":"PreBid", "3":"ProxyBid", "4":"AutoBid" },
  "CarCondition": { "0":"Unknown", "1":"RunAndDrive", "2":"EngineStartProgram", "3":"NoStart", "4":"PartsOnly" },
  "DamageType": { "0":"Unknown", "1":"FrontEnd", "2":"RearEnd", "3":"Side", "4":"AllOver", "5":"Hail", "6":"Flood", "7":"Fire", "8":"Vandalism", "9":"NormalWear" },
  "DriveTrain": { "0":"Unknown", "1":"FWD", "2":"RWD", "3":"AWD", "4":"4WD" },
  "FuelType": { "0":"Unknown", "1":"Gasoline", "2":"Diesel", "3":"Electric", "4":"Hybrid", "5":"Other" },
  "TitleType": { "0":"Unknown", "1":"Clean", "2":"Salvage", "3":"Rebuilt", "4":"Flood", "5":"Fire", "6":"Lemon", "7":"Other" },
  "Transmission": { "0":"Unknown", "1":"Manual", "2":"Automatic", "3":"CVT", "4":"SemiAutomatic" }
}
```

## Frontend Integration

The frontend will automatically try multiple endpoints in this order:
1. `/api/admin/enums` (existing endpoint)
2. `/api/metadata/enums` (new endpoint)
3. `/api/enums` (fallback)

If all endpoints fail, the frontend will use fallback mappings defined in the `enumService.ts` file.

## Error Handling

The endpoint should handle the following scenarios:
- **401 Unauthorized**: When no valid JWT token is provided
- **403 Forbidden**: When user doesn't have permission
- **500 Internal Server Error**: When there's an exception processing enums

## Performance Considerations

1. **Caching**: Implement caching to avoid reflection overhead on every request
2. **Compression**: Enable response compression for the JSON payload
3. **Rate Limiting**: Consider rate limiting to prevent abuse

## Security Considerations

1. **Authentication**: Always require valid JWT tokens
2. **Authorization**: Consider role-based access if needed
3. **Input Validation**: Validate enum names in the single enum endpoint
4. **Error Information**: Don't expose sensitive information in error messages

## Deployment Notes

1. Ensure the endpoint is accessible from your frontend domain
2. Configure CORS if needed
3. Test the endpoint after deployment
4. Monitor performance and error rates

This implementation provides a robust, scalable solution for providing enum metadata to your frontend application.
