
using AutoriaFinal.Contract.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;


namespace AutoriaFinal.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<LocalFileStorageService> _logger;
        public LocalFileStorageService(IWebHostEnvironment env, ILogger<LocalFileStorageService> logger)
        {
            _env = env;
            _logger = logger;
        }
        public async Task<string> SaveFileAsync(IFormFile file, string folder, string? fileName = null)
        {
            // VALIDATIONS -> use custom exceptions (no try/catch)
            if (file == null)
                throw new Exception("No file provided.");

            if (file.Length == 0)
                throw new Exception("Uploaded file is empty.");

            // normalize folder: remove leading/trailing slashes
            folder = (folder ?? string.Empty).Trim().Trim('/');

            // get wwwroot path
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var targetFolder = string.IsNullOrWhiteSpace(folder) ? webRoot : Path.Combine(webRoot, folder);

            // ensure directory exists
            if (!Directory.Exists(targetFolder))
            {
                Directory.CreateDirectory(targetFolder);
                _logger.LogInformation("Created upload directory: {Dir}", targetFolder);
            }

            // extension
            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension))
                extension = ".bin";

            // sanitize fileName if provided, else use short GUID
            string safeFileName;
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                var invalid = Path.GetInvalidFileNameChars();
                safeFileName = new string(fileName.Where(c => !invalid.Contains(c)).ToArray());
                if (!Path.HasExtension(safeFileName))
                    safeFileName += extension;
            }
            else
            {
                // Use shortened GUID to avoid long path issues (20 chars of hex)
                var shortGuid = Guid.NewGuid().ToString("N").Substring(0, 20);
                safeFileName = $"{shortGuid}{extension}";
            }

            // make sure path length is safe; if not, shorten GUID more
            var fullPath = Path.Combine(targetFolder, safeFileName);
            if (fullPath.Length > 240)
            {
                var shortGuid = Guid.NewGuid().ToString("N").Substring(0, 16);
                safeFileName = $"{shortGuid}{extension}";
                fullPath = Path.Combine(targetFolder, safeFileName);
            }

            _logger.LogInformation("Writing uploaded file to {FullPath} (origName={Orig}, size={Size})", fullPath, file.FileName, file.Length);

            // write file (no try/catch; failures will bubble to global handler)
            using (var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream);
            }

            var relative = string.IsNullOrWhiteSpace(folder) ? safeFileName : Path.Combine(folder, safeFileName).Replace("\\", "/");
            if (!relative.StartsWith("/")) relative = "/" + relative;

            _logger.LogInformation("File saved and available at {Url}", relative);
            return relative;
        }

        public Task DeleteFileAsync(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                throw new Exception("Path to delete is empty."); // :contentReference[oaicite:3]{index=3}

            var trimmed = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var fullPath = Path.Combine(webRoot, trimmed);

            if (!File.Exists(fullPath))
                throw new   ArgumentNullException("File", fullPath); // :contentReference[oaicite:4]{index=4}

            File.Delete(fullPath);
            _logger.LogInformation("Deleted file at {FullPath}", fullPath);

            return Task.CompletedTask;
        }

    }
}
