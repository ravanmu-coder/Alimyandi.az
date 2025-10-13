# Backend Enum Metadata Endpoint Implementation Guide

## Overview
This document provides instructions for implementing the `/api/admin/enums` endpoint in the C# backend to provide enum metadata for the frontend.

## Required Endpoint

### GET /api/admin/enums

**Purpose**: Returns all enum types and their mappings in a standardized JSON format.

**Response Format**:
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

## Implementation Options

### Option 1: Reflection-Based Implementation (Recommended)

Create a controller method that uses reflection to extract enum values:

```csharp
[HttpGet("enums")]
public async Task<IActionResult> GetEnums()
{
    try
    {
        var enumMetadata = new Dictionary<string, Dictionary<string, string>>();
        
        // Define the enum types you want to include
        var enumTypes = new[]
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
        
        foreach (var enumType in enumTypes)
        {
            var enumValues = new Dictionary<string, string>();
            var values = Enum.GetValues(enumType);
            
            foreach (var value in values)
            {
                var numericValue = Convert.ToInt32(value).ToString();
                var name = Enum.GetName(enumType, value);
                enumValues[numericValue] = name;
            }
            
            enumMetadata[enumType.Name] = enumValues;
        }
        
        return Ok(enumMetadata);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { error = "Failed to retrieve enum metadata", details = ex.Message });
    }
}
```

### Option 2: Static Configuration

If reflection is not preferred, create a static configuration:

```csharp
[HttpGet("enums")]
public async Task<IActionResult> GetEnums()
{
    var enumMetadata = new Dictionary<string, Dictionary<string, string>>
    {
        ["AuctionStatus"] = new Dictionary<string, string>
        {
            ["0"] = "Draft",
            ["1"] = "Scheduled",
            ["2"] = "Running",
            ["3"] = "Ended",
            ["4"] = "Cancelled",
            ["5"] = "Settled"
        },
        ["BidStatus"] = new Dictionary<string, string>
        {
            ["0"] = "Placed",
            ["1"] = "Retracted",
            ["2"] = "Invalidated"
        },
        ["BidType"] = new Dictionary<string, string>
        {
            ["1"] = "Regular",
            ["2"] = "PreBid",
            ["3"] = "ProxyBid",
            ["4"] = "AutoBid"
        },
        // ... continue for all enum types
    };
    
    return Ok(enumMetadata);
}
```

### Option 3: Database-Driven Configuration

If enum values are stored in the database:

```csharp
[HttpGet("enums")]
public async Task<IActionResult> GetEnums()
{
    try
    {
        var enumMetadata = await _enumService.GetAllEnumMetadataAsync();
        return Ok(enumMetadata);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { error = "Failed to retrieve enum metadata", details = ex.Message });
    }
}
```

## Required Enum Types

Ensure these enum types exist in your C# backend:

```csharp
public enum AuctionStatus
{
    Draft = 0,
    Scheduled = 1,
    Running = 2,
    Ended = 3,
    Cancelled = 4,
    Settled = 5
}

public enum BidStatus
{
    Placed = 0,
    Retracted = 1,
    Invalidated = 2
}

public enum BidType
{
    Regular = 1,
    PreBid = 2,
    ProxyBid = 3,
    AutoBid = 4
}

public enum CarCondition
{
    Unknown = 0,
    RunAndDrive = 1,
    EngineStartProgram = 2,
    NoStart = 3,
    PartsOnly = 4
}

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

public enum DriveTrain
{
    Unknown = 0,
    FWD = 1,
    RWD = 2,
    AWD = 3,
    FourWD = 4
}

public enum FuelType
{
    Unknown = 0,
    Gasoline = 1,
    Diesel = 2,
    Electric = 3,
    Hybrid = 4,
    Other = 5
}

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

public enum Transmission
{
    Unknown = 0,
    Manual = 1,
    Automatic = 2,
    CVT = 3,
    SemiAutomatic = 4
}
```

## Authentication & Authorization

The endpoint should require authentication:

```csharp
[Authorize] // Require authentication
[HttpGet("enums")]
public async Task<IActionResult> GetEnums()
{
    // Implementation here
}
```

## Caching Considerations

Consider adding caching to improve performance:

```csharp
[HttpGet("enums")]
[ResponseCache(Duration = 3600)] // Cache for 1 hour
public async Task<IActionResult> GetEnums()
{
    // Implementation here
}
```

## Error Handling

Ensure proper error handling:

```csharp
[HttpGet("enums")]
public async Task<IActionResult> GetEnums()
{
    try
    {
        // Implementation here
        return Ok(enumMetadata);
    }
    catch (UnauthorizedAccessException)
    {
        return Unauthorized(new { error = "Authentication required" });
    }
    catch (ForbiddenException)
    {
        return Forbid();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving enum metadata");
        return StatusCode(500, new { error = "Internal server error" });
    }
}
```

## Testing

Test the endpoint with:

```bash
curl -X GET "https://your-api-url/api/admin/enums" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response should match the JSON format specified above.

## Notes

1. **Key Format**: Use string keys (numeric values as strings) for consistency with frontend expectations
2. **Value Format**: Use human-readable labels that match the enum names
3. **Consistency**: Ensure enum values match between frontend fallback and backend implementation
4. **Performance**: Consider caching if enum values don't change frequently
5. **Security**: Ensure proper authentication and authorization
6. **Documentation**: Update API documentation to include this endpoint

This endpoint will enable the frontend to display human-readable labels instead of numeric enum values throughout the application.
