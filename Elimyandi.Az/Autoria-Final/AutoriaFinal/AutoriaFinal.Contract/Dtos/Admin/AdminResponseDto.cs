using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Admin
{
    public class AdminResponseDto<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public AdminMetadataDto? Metadata { get; set; }
        public List<string> Errors { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public TimeSpan ProcessingTime { get; set; }
        public string RequestId { get; set; } = Guid.NewGuid().ToString();

        public static AdminResponseDto<T> Success(T data, string message = "Əməliyyat uğurla tamamlandı")
        {
            return new AdminResponseDto<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data
            };
        }

        public static AdminResponseDto<T> Error(string message, List<string>? errors = null)
        {
            return new AdminResponseDto<T>
            {
                IsSuccess = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }

        public static AdminResponseDto<T> Warning(T data, string message, List<string>? warnings = null)
        {
            return new AdminResponseDto<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data,
                Warnings = warnings ?? new List<string>()
            };
        }
    }

    public class AdminPagedResponseDto<T> : AdminResponseDto<List<T>>
    {
        public AdminPaginationDto Pagination { get; set; } = new();

        public static AdminPagedResponseDto<T> Success(
            List<T> data,
            int totalCount,
            int page,
            int pageSize,
            string message = "Məlumatlar uğurla alındı")
        {
            return new AdminPagedResponseDto<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data,
                Pagination = new AdminPaginationDto
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalItems = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    HasNextPage = page * pageSize < totalCount,
                    HasPreviousPage = page > 1
                }
            };
        }
    }

    public class AdminMetadataDto
    {
        public Dictionary<string, object> Filters { get; set; } = new();
        public string SortBy { get; set; } = string.Empty;
        public string SortDirection { get; set; } = string.Empty;
        public DateTime QueryExecutedAt { get; set; } = DateTime.UtcNow;
        public TimeSpan QueryDuration { get; set; }
        public string QueryHash { get; set; } = string.Empty;
        public bool FromCache { get; set; }
        public int CacheHits { get; set; }
    }

    public class AdminPaginationDto
    {
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
        public int StartItem => (CurrentPage - 1) * PageSize + 1;
        public int EndItem => Math.Min(CurrentPage * PageSize, TotalItems);
        public List<int> PageNumbers => GeneratePageNumbers();

        private List<int> GeneratePageNumbers()
        {
            var pages = new List<int>();
            var start = Math.Max(1, CurrentPage - 2);
            var end = Math.Min(TotalPages, CurrentPage + 2);

            for (int i = start; i <= end; i++)
            {
                pages.Add(i);
            }

            return pages;
        }
    }

    public class AdminBulkOperationResultDto
    {
        public int TotalRequested { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public int SkippedCount { get; set; }
        public List<AdminBulkOperationItemDto> Results { get; set; } = new();
        public TimeSpan ProcessingTime { get; set; }
        public bool IsPartialSuccess => SuccessCount > 0 && FailureCount > 0;
        public bool IsCompleteSuccess => SuccessCount == TotalRequested;
        public bool IsCompleteFailure => FailureCount == TotalRequested;
        public double SuccessRate => TotalRequested > 0 ? (double)SuccessCount / TotalRequested * 100 : 0;
    }

    public class AdminBulkOperationItemDto
    {
        public Guid UserId { get; set; }
        public string UserIdentifier { get; set; } = string.Empty; // Email or UserName
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorCode { get; set; }
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    }
}
