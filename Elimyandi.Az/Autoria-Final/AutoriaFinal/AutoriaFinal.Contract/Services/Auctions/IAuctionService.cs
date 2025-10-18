using AutoriaFinal.Contract.Dtos.Auctions.Auction;
using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services.Auctions
{
    public interface IAuctionService : IGenericService<
        Auction,
        AuctionGetDto,
        AuctionDetailDto,
        AuctionCreateDto,
        AuctionUpdateDto>
    {
        // ========== AUCTION HƏYAT TSİKLİ ==========
        Task<AuctionDetailDto> AddAuctionAsync(AuctionCreateDto dto, Guid currentUserId);

        /// Auction başladıqda ilk maşının ən yüksək pre-bid-i ilə başlamalıdır
        Task<AuctionDetailDto> StartAuctionAsync(Guid auctionId);

        /// Timer bitdikdə və ya bütün maşınlar satıldıqda auction bitməlidir
        Task<AuctionDetailDto> EndAuctionAsync(Guid auctionId);

        /// Texniki problemlər və ya digər səbəblərə görə auction ləğv edilə bilər
        Task<AuctionDetailDto> CancelAuctionAsync(Guid auctionId, string reason);

        /// Copart sistemində auction vaxtı uzadıla bilər
        Task<AuctionDetailDto> ExtendAuctionAsync(Guid auctionId, int additionalMinutes, string reason);

        // ✅ YENİ: Pre-bid collection lifecycle
        Task<AuctionDetailDto> MakeAuctionReadyAsync(Guid auctionId);

        // ========== MAŞIN KEÇİDİ ==========

        /// Hər maşının 10 saniyəlik timer-ı bitdikdə növbəti maşına keçməlidir
        Task<AuctionDetailDto> MoveToNextCarAsync(Guid auctionId);

        /// Timer bitdikdə həmin maşının qalib və statusu müəyyənləşməlidir
        Task<AuctionCarDetailDto> EndCarAuctionAsync(Guid auctionCarId);

        /// Auction-da hansı maşının hal-hazırda satıldığını bilmək lazımdır
        Task<AuctionDetailDto> SetCurrentCarAsync(Guid auctionId, string lotNumber);

        // ========== REAL-TIME STATUS ==========

        /// Dashboard-da və timer service-də aktiv auction-ları izləmək üçün
        Task<IEnumerable<AuctionGetDto>> GetActiveAuctionsAsync();

        /// Real-time connection-lar üçün lazımdır
        Task<IEnumerable<AuctionGetDto>> GetLiveAuctionsAsync();

        /// Timer service bu auction-ları avtomatik başlatmalıdır
        Task<IEnumerable<AuctionGetDto>> GetAuctionsReadyToStartAsync();

        /// Real-time UI yeniləmələri üçün lazımdır
        Task<AuctionDetailDto> GetAuctionCurrentStateAsync(Guid auctionId);

        // ✅ YENİ: Status-based queries - ƏSAS ÇATIŞAN METODLAR
        Task<IEnumerable<AuctionGetDto>> GetAuctionsByStatusAsync(AuctionStatus status);
        Task<IEnumerable<AuctionGetDto>> GetAuctionsReadyToMakeReadyAsync();

        // ========== TİMER VƏ SCHEDULER DƏSTƏYİ ==========

        /// Timer service real-time timer göstərmək üçün bu məlumatı istifadə edir
        Task<AuctionTimerInfo> GetAuctionTimerInfoAsync(Guid auctionId);

        /// Hər yeni bid-də 10 saniyəlik timer yenidən başlamalıdır
        Task ResetAuctionTimerAsync(Guid auctionId);

        /// Timer service bu auction-ları avtomatik bitirməlidir
        Task<IEnumerable<AuctionGetDto>> GetExpiredAuctionsAsync();

        // ========== STATİSTİKA VƏ HESABATLAR ==========

        /// Admin dashboard və hesabatlar üçün lazımdır
        Task<AuctionStatisticsDto> GetAuctionStatisticsAsync(Guid auctionId);

        /// Müxtəlif yerlərdə keçirilən auction-ları göstərmək üçün
        Task<IEnumerable<AuctionGetDto>> GetAuctionsByLocationAsync(Guid locationId);
    }

    // ========== HELPER CLASS-LAR ==========

    /// Real-time timer göstərmək üçün lazımdır
    public class AuctionTimerInfo
    {
        public Guid AuctionId { get; set; }

        // Hal-hazırda aktiv olan lot nömrəsi
        public string? CurrentCarLotNumber { get; set; }

        // Son bid vaxtı (timer bu vaxta əsasən hesablanır)
        public DateTime? LastBidTime { get; set; }

        // Lot-un başlama vaxtı (ilk dəfə aktiv olduğu an)
        public DateTime? CarStartTime { get; set; }

        // Hər lot üçün ümumi timer müddəti (məs. 30 saniyə)
        public int TimerSeconds { get; set; }

        // Hazırda qalan saniyələr (server real-time hesablayır)
        public int RemainingSeconds { get; set; }

        // Vaxt bitibsə true
        public bool IsExpired { get; set; }

        // ✅ COPART LOGIC: Auction live status
        public bool IsLive { get; set; }

        // Qalan vaxtı frontend üçün oxunaqlı formatda göstərmək üçün (məs. "00:17")
        public string? TimeDisplay { get; set; }
    }

}