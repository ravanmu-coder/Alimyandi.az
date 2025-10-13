using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutoriaFinal.Infrastructure.Services.AiServices.InitialEstimate
{
    public class RestGeminiClient
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly ILogger<RestGeminiClient> _logger;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public RestGeminiClient(HttpClient http, IConfiguration cfg, ILogger<RestGeminiClient> logger)
        {
            _http = http ?? throw new ArgumentNullException(nameof(http));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            // Prefer environment variable for security, fallback to config
            _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                      ?? cfg["Gemini:ApiKey"]
                      ?? throw new ArgumentException("Gemini API key not found. Set GEMINI_API_KEY env var or Gemini:ApiKey in config.");

            _model = cfg["Gemini:Model"] ?? "gemini-2.5-flash";
        }

        /// <summary>
        /// Calls the Generative Language generateContent endpoint and returns parsed JsonDocument.
        /// </summary>
        public async Task<JsonDocument> GenerateContentAsync(string prompt, CancellationToken ct = default)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent";

            var payload = new
            {
                contents = new[] {
                    new { parts = new[] { new { text = prompt } } }
                },
                // optional generation controls can be added here if needed
            };

            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            req.Headers.Add("x-goog-api-key", _apiKey);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var sw = System.Diagnostics.Stopwatch.StartNew();
            using var res = await _http.SendAsync(req, ct).ConfigureAwait(false);
            sw.Stop();

            var text = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogError("GenerativeLanguage API error {Status} (ms:{Elapsed}): {Body}", (int)res.StatusCode, sw.ElapsedMilliseconds, Truncate(text, 2000));
                throw new InvalidOperationException($"GenerativeLanguage API returned {(int)res.StatusCode}: {text}");
            }

            _logger.LogInformation("GenerativeLanguage API success (ms:{Elapsed}) ResponseLen:{Len}", sw.ElapsedMilliseconds, text?.Length ?? 0);
            return JsonDocument.Parse(text);
        }

        private static string Truncate(string? s, int max)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;
            return s.Length <= max ? s : s.Substring(0, max) + "...";
        }
    }
}
