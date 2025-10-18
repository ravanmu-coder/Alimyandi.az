using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class AuctionCar : BaseEntity
    {
        public Guid AuctionId { get; set; }
        public Guid CarId { get; set; }
        public string LotNumber { get; set; } = default!;
        public int? ItemNumber { get; set; }
        public decimal StartPrice { get; set; } = 0; 
        public decimal? ReservePrice { get; set; }  
        public decimal CurrentPrice { get; set; } = 0;
        public decimal? HammerPrice { get; set; } 
        public decimal? BuyersPremium { get; set; }  
        public decimal? TotalPrice { get; set; }     
        public decimal? SoldPrice { get; set; }      
        public decimal MinPreBid { get; set; }      
        public bool IsReserveMet { get; set; }
        public DateTime? LastBidTime { get; set; }
        public int BidCount { get; set; } = 0;
        public int PreBidCount { get; set; } = 0;

        public bool IsActive { get; set; } = false;
        public DateTime? ActiveStartTime { get; set; }
        public int? LaneNumber { get; set; }        
        public int? RunOrder { get; set; }          
        public DateTime? ScheduledTime { get; set; }  

        public AuctionWinnerStatus WinnerStatus { get; set; } = AuctionWinnerStatus.Pending;
        public AuctionCarCondition AuctionCondition { get; set; } = AuctionCarCondition.PreAuction;
        public bool RequiresSellerApproval { get; set; } = true; // Seller must approve winner

        public DateTime? WinnerNotifiedAt { get; set; }
        public DateTime? DepositPaidAt { get; set; }
        public DateTime? PaymentDueDate { get; set; }
        public string? UnsoldReason { get; set; }
        public string? SellerNotes { get; set; }

        public Car Car { get; set; } = default!;
        public Auction Auction { get; set; } = default!;
        public AuctionWinner? AuctionWinner { get; set; }
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();

        public AuctionCar() { }

        #region Rich Data Model

        public static AuctionCar Create(
            Guid auctionId,
            Guid carId,
            string lotNumber,
            decimal estimatedRetailValue,
            int? itemNumber = null,
            int? laneNumber = null,
            bool requiresSellerApproval = true)
        {
            if (string.IsNullOrWhiteSpace(lotNumber))
                throw new ArgumentException("Lot nömrəsi boş ola bilməz", nameof(lotNumber));

            if (estimatedRetailValue <= 0)
                throw new ArgumentException("ERV sıfırdan böyük olmalıdır", nameof(estimatedRetailValue));

            var startPrice = Math.Round(estimatedRetailValue * 0.80m, 2); // 80% of ERV
            var reservePrice = Math.Round(estimatedRetailValue * 0.90m, 2); // 90% of ERV
            var minPreBid = startPrice; 

            return new AuctionCar
            {
                Id = Guid.NewGuid(),
                AuctionId = auctionId,
                CarId = carId,
                LotNumber = lotNumber,
                ItemNumber = itemNumber,
                StartPrice = startPrice,
                ReservePrice = reservePrice,
                MinPreBid = minPreBid,
                CurrentPrice = startPrice, // Start with StartPrice
                LaneNumber = laneNumber,
                RequiresSellerApproval = requiresSellerApproval,
                AuctionCondition = AuctionCarCondition.PreAuction,
                PaymentDueDate = DateTime.UtcNow.AddDays(7), // 7 days to pay
                CreatedAt = DateTime.UtcNow
            };
        }

        public void SetPricing(decimal estimatedRetailValue)
        {
            if (estimatedRetailValue <= 0)
                throw new InvalidOperationException("ERV sıfırdan böyük olmalıdır");

            StartPrice = Math.Round(estimatedRetailValue * 0.80m, 2);
            ReservePrice = Math.Round(estimatedRetailValue * 0.90m, 2);
            MinPreBid = StartPrice;
            CurrentPrice = StartPrice;
            MarkUpdated();
        }

        public void UpdateCurrentPrice(decimal bidAmount)
        {
            if (bidAmount < CurrentPrice)
                throw new InvalidOperationException("Bid cari qiymətdən aşağı ola bilməz");

            var previousPrice = CurrentPrice;
            CurrentPrice = bidAmount;
            LastBidTime = DateTime.UtcNow;
            BidCount++;

            // Reserve check
            if (ReservePrice.HasValue && CurrentPrice >= ReservePrice.Value)
            {
                IsReserveMet = true;
            }

            MarkUpdated();
        }

        public void MarkAsActive(int timerSeconds = 10)
        {
            IsActive = true;
            ActiveStartTime = DateTime.UtcNow;
            AuctionCondition = AuctionCarCondition.LiveAuction;
            MarkUpdated();
        }

        public void MarkAsInactive()
        {
            IsActive = false;
            ActiveStartTime = null;
            MarkUpdated();
        }

        public void MarkWon(decimal winningBid, decimal buyersPremiumRate = 0.10m)
        {
            if (winningBid <= 0)
                throw new InvalidOperationException("Winning bid sıfırdan böyük olmalıdır");

            HammerPrice = winningBid;
            BuyersPremium = Math.Round(winningBid * buyersPremiumRate, 2);
            TotalPrice = HammerPrice + BuyersPremium;
            SoldPrice = TotalPrice;

            UpdateCurrentPrice(winningBid);
            WinnerStatus = RequiresSellerApproval ? AuctionWinnerStatus.AwaitingSellerApproval : AuctionWinnerStatus.Won;
            AuctionCondition = AuctionCarCondition.Sold;
            WinnerNotifiedAt = DateTime.UtcNow;

            MarkAsInactive();
            MarkUpdated();
        }

        public void MarkUnsold(string reason = "Reserve not met")
        {
            WinnerStatus = AuctionWinnerStatus.Unsold;
            AuctionCondition = AuctionCarCondition.Unsold;
            UnsoldReason = reason;
            MarkAsInactive();
            MarkUpdated();
        }

        public void ApproveWinner()
        {
            if (WinnerStatus != AuctionWinnerStatus.AwaitingSellerApproval)
                throw new InvalidOperationException("Seller approval yalnız AwaitingSellerApproval statusunda edilə bilər");

            WinnerStatus = AuctionWinnerStatus.SellerApproved;
            AuctionCondition = AuctionCarCondition.AwaitingPayment;
            MarkUpdated();
        }

        public void RejectWinner(string reason)
        {
            if (WinnerStatus != AuctionWinnerStatus.AwaitingSellerApproval)
                throw new InvalidOperationException("Seller rejection yalnız AwaitingSellerApproval statusunda edilə bilər");

            WinnerStatus = AuctionWinnerStatus.SellerRejected;
            AuctionCondition = AuctionCarCondition.Unsold;
            UnsoldReason = reason;
            MarkUpdated();
        }

        public void MarkDepositPaid()
        {
            if (WinnerStatus != AuctionWinnerStatus.SellerApproved)
                throw new InvalidOperationException("Deposit yalnız SellerApproved statusunda ödənə bilər");

            WinnerStatus = AuctionWinnerStatus.DepositPaid;
            AuctionCondition = AuctionCarCondition.AwaitingFullPayment;
            DepositPaidAt = DateTime.UtcNow;
            MarkUpdated();
        }

        public void CompletePayment()
        {
            if (WinnerStatus != AuctionWinnerStatus.DepositPaid)
                throw new InvalidOperationException("Full payment yalnız DepositPaid statusunda edilə bilər");

            WinnerStatus = AuctionWinnerStatus.PaymentComplete;
            AuctionCondition = AuctionCarCondition.ReadyForPickup;
            MarkUpdated();
        }

        public void CompleteSale()
        {
            if (WinnerStatus != AuctionWinnerStatus.PaymentComplete)
                throw new InvalidOperationException("Sale yalnız PaymentComplete statusunda complete edilə bilər");

            WinnerStatus = AuctionWinnerStatus.Completed;
            AuctionCondition = AuctionCarCondition.Completed;
            MarkUpdated();
        }

        // ✅ TIMER LOGIC
        public bool IsTimeExpired(int timerSeconds)
        {
            if (!IsActive) return false;

            var referenceTime = LastBidTime ?? ActiveStartTime ?? DateTime.UtcNow;
            return (DateTime.UtcNow - referenceTime).TotalSeconds >= timerSeconds;
        }

        public decimal CalculateNextMinimumBid()
        {
            var increment = CurrentPrice switch
            {
                <= 500 => 25m,
                <= 1000 => 50m,
                <= 5000 => 100m,
                <= 10000 => 250m,
                _ => 500m
            };
            return CurrentPrice + increment;
        }

        public bool HasPreBids() => Bids.Any(b => b.IsPreBid);
        public bool HasValidBids() => Bids.Any(b => !b.IsPreBid && b.Status == BidStatus.Placed);
        public Bid? GetHighestPreBid() => Bids.Where(b => b.IsPreBid).OrderByDescending(b => b.Amount).FirstOrDefault();
        public Bid? GetHighestBid() => Bids.OrderByDescending(b => b.Amount).FirstOrDefault();
        public bool CanStartAuction() => HasPreBids() || StartPrice > 0;
        public bool IsPaymentOverdue() => PaymentDueDate.HasValue && DateTime.UtcNow > PaymentDueDate.Value;
        public decimal GetTotalAmountDue() => TotalPrice ?? HammerPrice ?? CurrentPrice;
        #endregion

    }

}