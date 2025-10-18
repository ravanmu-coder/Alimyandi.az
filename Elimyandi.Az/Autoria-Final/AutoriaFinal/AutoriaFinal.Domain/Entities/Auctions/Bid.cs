using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Enums.Bids;
using System;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class Bid : BaseEntity
    {
        public Guid AuctionCarId { get; set; }
        public Guid UserId { get; set; }

        public decimal Amount { get; set; }
        public bool IsProxy { get; set; }
        public decimal? ProxyMax { get; set; }

        public bool IsPreBid { get; set; } = false;

        public BidStatus Status { get; set; } = BidStatus.Placed;
        public DateTime PlacedAtUtc { get; set; } = DateTime.UtcNow;
        public BidType BidType { get; set; } 
        public string? Notes { get; set; }                       
        public DateTime? ValidUntil { get; set; }               
        public DateTime? ProcessedAt { get; set; }              
        public string? IPAddress { get; set; }                  
        public string? UserAgent { get; set; }               
        public int SequenceNumber { get; set; }                
        public bool IsAutoBid { get; set; } = false;           
        public Guid? ParentBidId { get; set; }                 
        public AuctionCar AuctionCar { get; set; } = default!;
        public Bid? ParentBid { get; set; }                    // Proxy bid-in əsas bid-i
        public ICollection<Bid> ChildBids { get; set; } = new List<Bid>(); 

        public Bid() { }
        #region Rich Data Model
        #region Factory Methods

        public static Bid CreateRegularBid(
            Guid auctionCarId,
            Guid userId,
            decimal amount,
            bool isPreBid = false,
            string? ipAddress = null,
            string? userAgent = null)
        {
            if (amount <= 0)
                throw new ArgumentException("Bid məbləği sıfırdan böyük olmalıdır", nameof(amount));

            var bid = new Bid
            {
                Id = Guid.NewGuid(),
                AuctionCarId = auctionCarId,
                UserId = userId,
                Amount = amount,
                IsPreBid = isPreBid,
                BidType = isPreBid ? BidType.PreBid : BidType.Regular,
                Status = BidStatus.Placed,
                PlacedAtUtc = DateTime.UtcNow,
                IPAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow
            };

            return bid;
        }

        public static Bid CreateProxyBid(
            Guid auctionCarId,
            Guid userId,
            decimal currentAmount,
            decimal maxAmount,
            DateTime validUntil,
            bool isPreBid = false,
            string? ipAddress = null,
            string? userAgent = null)
        {
            if (currentAmount <= 0)
                throw new ArgumentException("Cari bid məbləği sıfırdan böyük olmalıdır", nameof(currentAmount));

            if (maxAmount <= currentAmount)
                throw new ArgumentException("Maksimum məbləğ cari məbləğdən böyük olmalıdır", nameof(maxAmount));

            if (validUntil <= DateTime.UtcNow)
                throw new ArgumentException("Etibarlılıq tarixi gələcəkdə olmalıdır", nameof(validUntil));

            var bid = new Bid
            {
                Id = Guid.NewGuid(),
                AuctionCarId = auctionCarId,
                UserId = userId,
                Amount = currentAmount,
                IsProxy = true,
                ProxyMax = maxAmount,
                ValidUntil = validUntil,
                IsPreBid = isPreBid,
                BidType = isPreBid ? BidType.PreBid : BidType.ProxyBid,
                Status = BidStatus.Placed,
                PlacedAtUtc = DateTime.UtcNow,
                IPAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow
            };

            return bid;
        }

        public static Bid CreateAutoBid(
            Guid auctionCarId,
            Guid userId,
            decimal amount,
            Guid parentBidId,
            int sequenceNumber)
        {
            var bid = new Bid
            {
                Id = Guid.NewGuid(),
                AuctionCarId = auctionCarId,
                UserId = userId,
                Amount = amount,
                IsAutoBid = true,
                ParentBidId = parentBidId,
                SequenceNumber = sequenceNumber,
                BidType = BidType.AutoBid,
                Status = BidStatus.Placed,
                PlacedAtUtc = DateTime.UtcNow,
                ProcessedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            return bid;
        }

        #endregion

        #region Business Logic Methods

        public void Invalidate(string? reason = null)
        {
            Status = BidStatus.Invalidated;
            Notes = string.IsNullOrEmpty(Notes) ? reason : $"{Notes}; {reason}";
            MarkUpdated();
        }

        public void Retract(string? reason = null)
        {
            if (Status != BidStatus.Placed)
                throw new InvalidOperationException("Yalnız aktiv bid-lər geri çəkilə bilər");

            Status = BidStatus.Retracted;
            Notes = string.IsNullOrEmpty(Notes) ? reason : $"{Notes}; {reason}";
            MarkUpdated();
        }

        public void MarkAsProcessed()
        {
            ProcessedAt = DateTime.UtcNow;
            MarkUpdated();
        }

        public bool IsProxyBidValid()
        {
            if (!IsProxy) return false;
            if (Status != BidStatus.Placed) return false;
            if (!ValidUntil.HasValue) return true;

            return DateTime.UtcNow <= ValidUntil.Value;
        }

        public decimal GetRemainingProxyAmount()
        {
            if (!IsProxy || !ProxyMax.HasValue)
                return 0;

            return Math.Max(0, ProxyMax.Value - Amount);
        }

        public bool CanAutoIncrease(decimal requiredAmount, decimal increment)
        {
            if (!IsProxy || !IsProxyBidValid()) return false;
            if (!ProxyMax.HasValue) return false;

            var nextAmount = Math.Max(Amount + increment, requiredAmount);
            return nextAmount <= ProxyMax.Value;
        }

        public decimal CalculateNextProxyAmount(decimal currentHighestBid, decimal increment)
        {
            if (!IsProxy || !ProxyMax.HasValue) return 0;

            var nextAmount = currentHighestBid + increment;
            return Math.Min(nextAmount, ProxyMax.Value);
        }

        public bool IsExpired()
        {
            if (!ValidUntil.HasValue) return false;
            return DateTime.UtcNow > ValidUntil.Value;
        }

        public void UpdateAmount(decimal newAmount, string? reason = null)
        {
            if (Status != BidStatus.Placed)
                throw new InvalidOperationException("Yalnız aktiv bid-lər yenilənə bilər");

            if (newAmount <= 0)
                throw new ArgumentException("Yeni məbləğ sıfırdan böyük olmalıdır");

            if (IsProxy && ProxyMax.HasValue && newAmount > ProxyMax.Value)
                throw new InvalidOperationException("Yeni məbləğ proxy maksimumundan böyük ola bilməz");

            Amount = newAmount;
            if (!string.IsNullOrEmpty(reason))
            {
                Notes = string.IsNullOrEmpty(Notes) ? reason : $"{Notes}; {reason}";
            }

            MarkUpdated();
        }

        // ✅ ƏLAVƏ: YENİ PROXY BID METODLARI (REAL eBay MƏNTIQ)

        /// <summary>
        /// Rəqib bid-i outbid edə bilməsini yoxlayır (eBay məntiqi)
        /// </summary>
        public bool CanOutbid(decimal competitorBid, decimal minIncrement)
        {
            if (!IsProxy || !IsProxyBidValid())
                return false;

            if (!ProxyMax.HasValue)
                return false;

            // ✅ Proxy max-ı competitor + increment-dən böyükdürsə, outbid edə bilər
            return ProxyMax.Value >= (competitorBid + minIncrement);
        }

        /// <summary>
        /// Rəqib bid-i outbid etmək üçün lazım olan məbləği hesablayır
        /// </summary>
        public decimal CalculateNextProxyBidAmount(decimal competitorBid, decimal minIncrement)
        {
            if (!IsProxy || !ProxyMax.HasValue)
                return 0;

            // ✅ Real məntiqlə: Competitor bid + minimum increment
            var nextAmount = competitorBid + minIncrement;

            // ✅ Əgər proxy max-dan böyükdürsə, proxy max-ı qaytar
            if (nextAmount > ProxyMax.Value)
                return ProxyMax.Value;

            return nextAmount;
        }

        /// <summary>
        /// Proxy bid-də qalan capacity (neçə daha artıra bilər)
        /// </summary>
        public decimal GetProxyRemainingCapacity()
        {
            if (!IsProxy || !ProxyMax.HasValue)
                return 0;

            return Math.Max(0, ProxyMax.Value - Amount);
        }

        /// <summary>
        /// İki proxy bid arasında müqayisə - hansı daha güclüdür
        /// </summary>
        public int CompareProxyStrength(Bid otherProxyBid)
        {
            if (!IsProxy || !otherProxyBid.IsProxy)
                throw new InvalidOperationException("Hər iki bid proxy olmalıdır");

            if (!ProxyMax.HasValue || !otherProxyBid.ProxyMax.HasValue)
                return 0;

            return ProxyMax.Value.CompareTo(otherProxyBid.ProxyMax.Value);
        }

        /// <summary>
        /// Bu proxy bid-in başqa proxy bid ilə yarışa biləcəyini yoxlayır
        /// </summary>
        public bool CanCompeteWith(Bid otherProxyBid, decimal currentPrice, decimal minIncrement)
        {
            if (!IsProxy || !otherProxyBid.IsProxy)
                return false;

            if (!IsProxyBidValid() || !otherProxyBid.IsProxyBidValid())
                return false;

            var requiredToWin = currentPrice + minIncrement;
            return ProxyMax.HasValue && ProxyMax.Value >= requiredToWin;
        }

        #endregion

        #region Proxy Bid War Logic 
        /// Proxy bid war-da hansı bidding strategy-ni istifadə edəcəyini təyin edir
        public ProxyStrategy GetOptimalStrategy(decimal currentHighest, decimal minIncrement, IEnumerable<Bid> competingProxies)
        {
            if (!IsProxy || !ProxyMax.HasValue)
                return ProxyStrategy.None;

            var strongestCompetitor = competingProxies
                .Where(p => p.IsProxy && p.ProxyMax.HasValue && p.UserId != UserId)
                .OrderByDescending(p => p.ProxyMax.Value)
                .FirstOrDefault();

            if (strongestCompetitor == null)
                return ProxyStrategy.Conservative; // Rəqib yoxdur, yavaş-yavaş artır

            if (ProxyMax.Value > strongestCompetitor.ProxyMax.Value)
                return ProxyStrategy.Aggressive; // Güclüyük, maksimuma qədər getməyə hazır

            if (ProxyMax.Value == strongestCompetitor.ProxyMax.Value)
                return ProxyStrategy.Competitive; // Bərabər güc, vaxt prioriteti

            return ProxyStrategy.Defensive; // Zəif vəziyyət, minimum itki
        }

        #endregion
        #endregion
    }

    public enum ProxyStrategy
    {
        None,
        Conservative,    // Yavaş-yavaş artırma
        Competitive,     // Normal yarış
        Aggressive,      // Maksimuma qədər sürətli artırma
        Defensive        // Minimum itki strategiyası
    }
}   