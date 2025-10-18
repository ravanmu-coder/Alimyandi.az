using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AutoriaFinal.Domain.Entities.Auctions
{
    public class Auction : BaseEntity
    {
        public string Name { get; set; } = default!;
        public Guid LocationId { get; set; }

        public DateTime StartTimeUtc { get; set; }
        public DateTime EndTimeUtc { get; set; }
        public AuctionStatus Status { get; set; } = AuctionStatus.Draft;

        public DateTime? PreBidStartTimeUtc { get; set; } // Pre-bid toplanma başlama vaxtı
        public DateTime? PreBidEndTimeUtc { get; set; }   // Pre-bid toplanma bitmə vaxtı

        public decimal MinBidIncrement { get; set; } = 100;
        public decimal? StartPrice { get; set; }
        public int TimerSeconds { get; set; } = 30; 
        public string? CurrentCarLotNumber { get; set; }
        public bool IsLive { get; set; } = false;
        public int ExtendedCount { get; set; } = 0;
        public int MaxCarDurationMinutes { get; set; } = 30;
        public DateTime? CurrentCarStartTime { get; set; }

        public int TotalCarsCount { get; set; } = 0;
        public int CarsWithPreBidsCount { get; set; } = 0;
        public bool AutoStart { get; set; } = true; // Background service tərəfindən avtomatik start

        public Guid? CreatedByUserId { get; set; }
        public Location Location { get; set; } = default!;
        public ICollection<AuctionCar> AuctionCars { get; set; } = new List<AuctionCar>();

        public Auction() { }
                        
        #region Rich Data model
        public static Auction Create(
            string name,
            Guid locationId,
            Guid createdByUserId,
            DateTime startTime,
            int timerSeconds = 30, 
            decimal minBidIncrement = 100,
            bool autoStart = true)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Auction adı boş ola bilməz", nameof(name));

            if (startTime <= DateTime.UtcNow.AddMinutes(30)) // Minimum 30 dəqiqə əvvəlcədən
                throw new ArgumentException("Auction başlama vaxtı minimum 30 dəqiqə sonra olmalıdır", nameof(startTime));

            var preBidStart = DateTime.UtcNow.AddMinutes(5); 
            var preBidEnd = startTime.AddMinutes(-30); 

            return new Auction
            {
                Id = Guid.NewGuid(),
                Name = name,
                LocationId = locationId,
                CreatedByUserId = createdByUserId,
                StartTimeUtc = startTime,
                EndTimeUtc = startTime.AddHours(4), 
                PreBidStartTimeUtc = preBidStart,
                PreBidEndTimeUtc = preBidEnd,
                TimerSeconds = timerSeconds,
                MinBidIncrement = minBidIncrement,
                AutoStart = autoStart,
                CreatedAt = DateTime.UtcNow
            };
        }

        // Schedule with validation
        public void Schedule(DateTime start, DateTime end)
        {
            if (Status != AuctionStatus.Draft)
                throw new InvalidOperationException("Yalnız Draft auction schedule edilə bilər.");

            if (start <= DateTime.UtcNow.AddMinutes(15))
                throw new InvalidOperationException("Auction minimum 15 dəqiqə sonra başlamalıdır.");

            if (start >= end)
                throw new InvalidOperationException("Başlama vaxtı bitmə vaxtından əvvəl olmalıdır.");

            StartTimeUtc = start;
            EndTimeUtc = end;
            PreBidStartTimeUtc = DateTime.UtcNow.AddMinutes(2);
            PreBidEndTimeUtc = start.AddMinutes(-15);

            Status = AuctionStatus.Scheduled;
            MarkUpdated();
        }

        // Ready for pre-bids
        public void MakeReady()
        {
            if (Status != AuctionStatus.Scheduled)
                throw new InvalidOperationException("Yalnız Scheduled auction Ready edilə bilər.");

            if (AuctionCars.Count < 1)
                throw new InvalidOperationException("Auction-da minimum 1 maşın olmalıdır.");

            Status = AuctionStatus.Ready;
            TotalCarsCount = AuctionCars.Count;

            foreach (var car in AuctionCars.Where(c => c.AuctionCondition == AuctionCarCondition.PreAuction))
            {
                car.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                car.MarkUpdated();
            }

            MarkUpdated();
        }
        public void Start()
        {
            if (Status != AuctionStatus.Ready && Status != AuctionStatus.Scheduled)
                throw new InvalidOperationException("Auction yalnız Ready və ya Scheduled vəziyyətdə start edilə bilər.");

            if (AuctionCars.Count < 1) 
                throw new InvalidOperationException("Auction-da minimum 1 maşın olmalıdır.");

            if (Status == AuctionStatus.Scheduled)
            {
                MakeReady();
            }

            Status = AuctionStatus.Running;
            IsLive = true;
            var firstCar = SelectFirstCarToStart();
            if (firstCar != null)
            {
                ActivateFirstCar(firstCar);
            }

            MarkUpdated();
        }
        private AuctionCar? SelectFirstCarToStart()
        {
            var carWithPreBids = AuctionCars
                .Where(ac => ac.Bids.Any(b => b.IsPreBid))
                .OrderByDescending(ac => ac.Bids.Where(b => b.IsPreBid).Max(b => b.Amount))
                .ThenBy(ac => ac.LotNumber)
                .FirstOrDefault();

            if (carWithPreBids != null)
                return carWithPreBids;

            return AuctionCars.OrderBy(ac => ac.LotNumber).FirstOrDefault();
        }

        private void ActivateFirstCar(AuctionCar car)
        {
            CurrentCarLotNumber = car.LotNumber;
            CurrentCarStartTime = DateTime.UtcNow;

            car.AuctionCondition = AuctionCarCondition.LiveAuction;
            car.MarkAsActive();

            // Pre-bid varsa ən yüksəyini götür
            var highestPreBid = car.Bids
                .Where(b => b.IsPreBid && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .FirstOrDefault();

            if (highestPreBid != null)
            {
                SetStartPrice(highestPreBid.Amount);
                car.UpdateCurrentPrice(highestPreBid.Amount);
            }
            else
            {
                SetStartPrice(car.StartPrice); 
                car.UpdateCurrentPrice(car.StartPrice);
            }
        }

        public void MoveToNextCar()
        {
            if (Status != AuctionStatus.Running)
                throw new InvalidOperationException("Yalnız işləyən auction-da maşın dəyişdirilə bilər.");

            // Cari maşını deaktiv et
            var currentCar = AuctionCars.FirstOrDefault(ac => ac.LotNumber == CurrentCarLotNumber);
            currentCar?.MarkAsInactive();

            var nextCar = FindNextCar();

            if (nextCar != null)
            {
                ActivateNextCar(nextCar);
            }
            else
            {
                End();
            }

            MarkUpdated();
        }

        private AuctionCar? FindNextCar()
        {
            // Hələ auction olmamış maşınları tap
            var remainingCars = AuctionCars
                .Where(ac => ac.WinnerStatus == AuctionWinnerStatus.Pending)
                .Where(ac => string.Compare(ac.LotNumber, CurrentCarLotNumber) > 0)
                .OrderBy(ac => ac.LotNumber);

            return remainingCars.FirstOrDefault();
        }

        private void ActivateNextCar(AuctionCar car)
        {
            CurrentCarLotNumber = car.LotNumber;
            CurrentCarStartTime = DateTime.UtcNow;

            car.AuctionCondition = AuctionCarCondition.LiveAuction;
            car.MarkAsActive();

            // Pre-bid varsa ən yüksəyini götür
            var highestPreBid = car.Bids
                .Where(b => b.IsPreBid && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .FirstOrDefault();

            if (highestPreBid != null)
            {
                SetStartPrice(highestPreBid.Amount);
                car.UpdateCurrentPrice(highestPreBid.Amount);
            }
            else
            {
                SetStartPrice(car.StartPrice);
                car.UpdateCurrentPrice(car.StartPrice);
            }
        }
        public void End()
        {
            if (Status != AuctionStatus.Running)
                throw new InvalidOperationException("Auction yalnız Running vəziyyətdə bitirilə bilər.");

            Status = AuctionStatus.Ended;
            IsLive = false;
            EndTimeUtc = DateTime.UtcNow;
            CurrentCarLotNumber = null;
            CurrentCarStartTime = null;

            // Statistikalar
            CarsWithPreBidsCount = AuctionCars.Count(ac => ac.Bids.Any(b => b.IsPreBid));

            MarkUpdated();
        }

        public void SetStartPrice(decimal amount)
        {
            if (Status != AuctionStatus.Scheduled && Status != AuctionStatus.Running && Status != AuctionStatus.Ready)
                throw new InvalidOperationException("StartPrice yalnız Scheduled, Ready və Running vəziyyətində təyin edilə bilər.");

            if (amount <= 0)
                throw new InvalidOperationException("StartPrice sıfırdan böyük olmalıdır.");

            StartPrice = amount;
            MarkUpdated();
        }

        public bool IsReadyToStart()
        {
            return Status == AuctionStatus.Ready &&
                   StartTimeUtc <= DateTime.UtcNow &&
                   AuctionCars.Any() &&
                   AuctionCars.Count >= 2;
        }

        public bool IsReadyToMakeReady()
        {
            return Status == AuctionStatus.Scheduled &&
                   PreBidStartTimeUtc.HasValue &&
                   PreBidStartTimeUtc.Value <= DateTime.UtcNow &&
                   AuctionCars.Any();
        }

        public void ExtendAuction(int additionalMinutes)
        {
            if (Status != AuctionStatus.Running)
                throw new InvalidOperationException("Yalnız işləyən auction uzaldıla bilər.");

            if (additionalMinutes <= 0)
                throw new ArgumentException("Əlavə vaxt müsbət olmalıdır.");

            EndTimeUtc = EndTimeUtc.AddMinutes(additionalMinutes);
            ExtendedCount++;
            MarkUpdated();
        }

        public void Cancel()
        {
            if (Status == AuctionStatus.Ended || Status == AuctionStatus.Settled)
                throw new InvalidOperationException("Bitmiş və ya yekunlaşmış auction ləğv edilə bilməz.");

            Status = AuctionStatus.Cancelled;
            IsLive = false;
            MarkUpdated();
        }
        #endregion
    }
}