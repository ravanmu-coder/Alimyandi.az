# Repository Guidelines
## Project Structure & Module Organization
AutoriaFinal.sln holds a layered solution: `AutoriaFinal.API` is the ASP.NET Core host exposing controllers in `Controllers/`, SignalR hubs in `Hubs/`, and static assets with logs under `wwwroot/`. `AutoriaFinal.Application` centralizes business logic through services (`Services/Auctions/`, `Services/Identity/`), mapping profiles, and custom exceptions. `AutoriaFinal.Domain` defines entities, enums, and repository contracts. `AutoriaFinal.Contract` packages DTOs and service interfaces shared with the API. `AutoriaFinal.Persistence` contains EF Core infrastructure in `Data/AppDbContext.cs`, configuration, migrations, and seeders. `AutoriaFinal.Infrastructure` adds cross-cutting services plus DI extensions.

## Build, Test, and Development Commands
- dotnet restore AutoriaFinal.sln: sync project dependencies before building.
- dotnet build AutoriaFinal.sln -c Debug: validate the entire solution compiles.
- dotnet run --project AutoriaFinal.API: launch the API with local settings.
- dotnet ef database update --project AutoriaFinal.Persistence --startup-project AutoriaFinal.API: apply the latest migrations to the configured SQL Server.

## Coding Style & Naming Conventions
Follow C# conventions: 4-space indentation, PascalCase for types, camelCase for locals, and suffix async methods with `Async`. Keep controllers thin and delegate heavy logic to application services. Register dependencies through `AutoriaFinal.Infrastructure/DependencyInjection`. Favor AutoMapper profiles in `Profiles/CustomProfile.cs` for DTO mapping.

## Testing Guidelines
A dedicated test project is not yet present. Create `tests/AutoriaFinal.Application.Tests` (for example `dotnet new xunit`) and reference the layer under test. Group tests by feature folder mirroring the `Services` structure and name files `<Subject>Tests.cs`. Run suites with `dotnet test` from the repository root. Target coverage around service orchestration, repository abstractions, and hub messaging.

## Commit & Pull Request Guidelines
Use imperative, scope-prefixed subjects such as `Add BidService command handler`; keep them under about 72 characters and expand on rationale in the body when needed. Squash noisy build artifacts before pushing. Pull requests should describe functional impact, list impacted layers, link issues, and include screenshots or curl examples for HTTP changes. Mention required database migrations and new environment variables.

## Security & Configuration Tips
Never commit real credentials; replace values in `AutoriaFinal.API/appsettings*.json` with placeholders and rely on user secrets or environment variables. Serilog writes rolling files to `AutoriaFinal.API/wwwroot/logs`; avoid checking large logs in. When updating connection strings or JWT keys, document the change in the pull request description and coordinate rotation steps with Operations.
