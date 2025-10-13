using AutoMapper;
using AutoriaFinal.Contract.Dtos.Auctions.Auction;
using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Dtos.Auctions.Car;
using AutoriaFinal.Contract.Dtos.Auctions.Location;
using AutoriaFinal.Contract.Dtos.Identity;
using AutoriaFinal.Contract.Dtos.Identity.Token;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Profiles
{
    public class CustomProfile : Profile
    {
        public CustomProfile()
        {
            #region Auctions
            #region Auction Mappings - CLEAN VERSION

            // ========== AuctionGetDto ==========
            CreateMap<Auction, AuctionGetDto>()
    // Basic scalar mappings (explicit for clarity)
    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
    .ForMember(dest => dest.StartTimeUtc, opt => opt.MapFrom(src => src.StartTimeUtc))
    .ForMember(dest => dest.EndTimeUtc, opt => opt.MapFrom(src => src.EndTimeUtc))
    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
    .ForMember(dest => dest.IsLive, opt => opt.MapFrom(src => src.IsLive))

    // Price / increment fields
    .ForMember(dest => dest.StartPrice, opt => opt.MapFrom(src => src.StartPrice))
    .ForMember(dest => dest.MinBidIncrement, opt => opt.MapFrom(src => src.MinBidIncrement))

    // Current lot info
    .ForMember(dest => dest.CurrentCarLotNumber,
               opt => opt.MapFrom(src => src.CurrentCarLotNumber))

    // Counts (null-safe)
    .ForMember(dest => dest.TotalCarsCount,
               opt => opt.MapFrom(src => src.AuctionCars != null ? src.AuctionCars.Count : 0))
    .ForMember(dest => dest.CarsWithPreBidsCount,
               opt => opt.MapFrom(src => src.AuctionCars != null
                    ? src.AuctionCars.Count(ac => ac.Bids != null && ac.Bids.Any(b => b.IsPreBid))
                    : 0))

    // Location fields
    .ForMember(dest => dest.LocationId,
               opt => opt.MapFrom(src => src.LocationId))
    .ForMember(dest => dest.LocationName,
               opt => opt.MapFrom(src => src.Location != null ? src.Location.Name : null))

    .ReverseMap();

            // ========== AuctionDetailDto ==========
            CreateMap<Auction, AuctionDetailDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.IsReadyToStart, opt => opt.MapFrom(src => src.IsReadyToStart()))
                .ForMember(dest => dest.IsReadyToMakeReady, opt => opt.MapFrom(src => src.IsReadyToMakeReady()))
                .ForMember(dest => dest.TimeUntilStart, opt => opt.MapFrom(src =>
                    src.StartTimeUtc > DateTime.UtcNow ? src.StartTimeUtc - DateTime.UtcNow : (TimeSpan?)null))
                .ForMember(dest => dest.TimeUntilEnd, opt => opt.MapFrom(src =>
                    src.EndTimeUtc > DateTime.UtcNow ? src.EndTimeUtc - DateTime.UtcNow : (TimeSpan?)null))
                .ForMember(dest => dest.TotalCarsCount, opt => opt.Ignore())
                .ForMember(dest => dest.CarsWithPreBidsCount, opt => opt.Ignore())
                .ForMember(dest => dest.SoldCarsCount, opt => opt.Ignore())
                .ForMember(dest => dest.UnsoldCarsCount, opt => opt.Ignore())
                .ForMember(dest => dest.TotalSalesAmount, opt => opt.Ignore())
                .ReverseMap();

            // ========== AuctionCreateDto ==========
            CreateMap<AuctionCreateDto, Auction>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.IsLive, opt => opt.Ignore())
                .ForMember(dest => dest.CurrentCarLotNumber, opt => opt.Ignore())
                .ForMember(dest => dest.CurrentCarStartTime, opt => opt.Ignore())
                .ForMember(dest => dest.ExtendedCount, opt => opt.Ignore())
                .ForMember(dest => dest.PreBidStartTimeUtc, opt => opt.Ignore())
                .ForMember(dest => dest.PreBidEndTimeUtc, opt => opt.Ignore())
                .ForMember(dest => dest.TotalCarsCount, opt => opt.Ignore())
                .ForMember(dest => dest.CarsWithPreBidsCount, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.Location, opt => opt.Ignore())
                .ForMember(dest => dest.AuctionCars, opt => opt.Ignore())
                .ReverseMap();

            // ========== AuctionUpdateDto ==========
            CreateMap<AuctionUpdateDto, Auction>()
                .ReverseMap();

            // ========== AuctionStatisticsDto ==========
            CreateMap<Auction, AuctionStatisticsDto>()
                .ForMember(dest => dest.AuctionId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.AuctionName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.AuctionStartTime, opt => opt.MapFrom(src => src.StartTimeUtc))
                .ForMember(dest => dest.AuctionEndTime, opt => opt.MapFrom(src =>
                    src.Status == Domain.Enums.AuctionEnums.AuctionStatus.Ended ? src.EndTimeUtc : (DateTime?)null))
                .ForMember(dest => dest.TotalCars, opt => opt.Ignore())
                .ForMember(dest => dest.SoldCars, opt => opt.Ignore())
                .ForMember(dest => dest.UnsoldCars, opt => opt.Ignore())
                .ForMember(dest => dest.TotalSalesAmount, opt => opt.Ignore())
                .ForMember(dest => dest.AverageSalePrice, opt => opt.Ignore())
                .ForMember(dest => dest.TotalBids, opt => opt.Ignore())
                .ForMember(dest => dest.UniqueBidders, opt => opt.Ignore())
                .ForMember(dest => dest.AuctionDuration, opt => opt.Ignore())
                .ReverseMap();

            // ========== AuctionTimerInfo ==========
            CreateMap<Auction, AuctionTimerInfo>()
                .ForMember(dest => dest.AuctionId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.CurrentCarLotNumber, opt => opt.MapFrom(src => src.CurrentCarLotNumber))
                .ForMember(dest => dest.TimerSeconds, opt => opt.MapFrom(src => src.TimerSeconds))
                .ForMember(dest => dest.CarStartTime, opt => opt.MapFrom(src => src.CurrentCarStartTime))
                .ForMember(dest => dest.LastBidTime, opt => opt.Ignore())
                .ForMember(dest => dest.RemainingSeconds, opt => opt.Ignore())
                .ForMember(dest => dest.IsExpired, opt => opt.Ignore())
                .ReverseMap();

            #endregion
            #region AuctionCar
            CreateMap<AuctionCarCreateDto, AuctionCar>()
               .ForMember(dest => dest.Id, opt => opt.Ignore())
               .ForMember(dest => dest.HammerPrice, opt => opt.Ignore())
               .ForMember(dest => dest.CurrentPrice, opt => opt.Ignore())
               .ForMember(dest => dest.IsReserveMet, opt => opt.Ignore())
               .ForMember(dest => dest.IsActive, opt => opt.Ignore())
               .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
               .ForMember(dest => dest.UpdatedAtUtc, opt => opt.Ignore())
               .ReverseMap();

            CreateMap<AuctionCar, AuctionCarGetDto>().ReverseMap();

            CreateMap<AuctionCar, AuctionCarDetailDto>().ReverseMap();

            CreateMap<AuctionCarUpdateDto, AuctionCar>().ReverseMap();
            CreateMap<AuctionCar, AuctionCarTimerDto>().ReverseMap();
            #endregion
            #region Bids
            // Create
            CreateMap<BidCreateDto, Bid>()
                .ForMember(dest => dest.Id, opt => opt.Ignore()) // Entity-də yaranır
                .ForMember(dest => dest.PlacedAtUtc, opt => opt.Ignore()) // Service səviyyəsində set edilir
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ReverseMap();

            // Update
            CreateMap<BidUpdateDto, Bid>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.PlacedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ReverseMap();

            // Get (siyahı üçün)
            CreateMap<Bid, BidGetDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.BidType, opt => opt.MapFrom(src => src.BidType.ToString()))
                .ReverseMap();

            // Detail (detallı görünüş üçün)
            CreateMap<Bid, BidDetailDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.BidType, opt => opt.MapFrom(src => src.BidType.ToString()))
                .ReverseMap();

            // History (auction üzrə bütün tarixçəni çıxarmaq üçün)
            CreateMap<Bid, BidHistoryDto>().ReverseMap();
            CreateMap<BidderSummaryDto, ApplicationUser>().ReverseMap();

            // Stats
            CreateMap<BidStatsDto, Bid>().ReverseMap();

            // Summary (istifadəçi üzrə ümumi bid statistika)
            CreateMap<BidSummaryDto, Bid>().ReverseMap();

            // ProxyBid
            CreateMap<ProxyBidDto, Bid>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.PlacedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ReverseMap();

            #endregion
            #region Car - ✅ TAM YENİLƏNMİŞ MAPPING

            // ========== CarGetDto Mapping ==========
            CreateMap<Car, CarGetDto>()
                // Basic properties - direct mapping
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Vin, opt => opt.MapFrom(src => src.Vin))
                .ForMember(dest => dest.VinMasked, opt => opt.MapFrom(src =>
                    src.Vin.Length >= 8 ? $"{src.Vin.Substring(0, 4)}****{src.Vin.Substring(src.Vin.Length - 4)}" : src.Vin))
                .ForMember(dest => dest.Year, opt => opt.MapFrom(src => src.Year))
                .ForMember(dest => dest.Make, opt => opt.MapFrom(src => src.Make))
                .ForMember(dest => dest.Model, opt => opt.MapFrom(src => src.Model))
                .ForMember(dest => dest.BodyStyle, opt => opt.MapFrom(src => src.BodyStyle))
                .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color))

                // ✅ Direct mapping - same field names now
                .ForMember(dest => dest.Mileage, opt => opt.MapFrom(src => src.Mileage))
                .ForMember(dest => dest.MileageUnit, opt => opt.MapFrom(src => src.MileageUnit))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price))
                .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Currency))

                // ✅ Enum mappings - direct mapping
                .ForMember(dest => dest.FuelType, opt => opt.MapFrom(src => src.FuelType))
                .ForMember(dest => dest.DamageType, opt => opt.MapFrom(src => src.DamageType))
                .ForMember(dest => dest.Transmission, opt => opt.MapFrom(src => src.Transmission))
                .ForMember(dest => dest.DriveTrain, opt => opt.MapFrom(src => src.DriveTrain))
                .ForMember(dest => dest.CarCondition, opt => opt.MapFrom(src => src.CarCondition))
                .ForMember(dest => dest.TitleType, opt => opt.MapFrom(src => src.TitleType))
                .ForMember(dest => dest.SecondaryDamage, opt => opt.MapFrom(src => src.SecondaryDamage))
                .ForMember(dest => dest.HasKeys, opt => opt.MapFrom(src => src.HasKeys))
                .ForMember(dest => dest.TitleState, opt => opt.MapFrom(src => src.TitleState))
                .ForMember(dest => dest.EstimatedRetailValue, opt => opt.MapFrom(src => src.EstimatedRetailValue))

                // Media processing
                .ForMember(dest => dest.ImagePath, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.PhotoUrls)
                        ? src.PhotoUrls.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                        : null))
                .ForMember(dest => dest.ThumbnailUrl, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.PhotoUrls)
                        ? src.PhotoUrls.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).FirstOrDefault()
                        : null))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.PhotoUrls)
                        ? src.PhotoUrls.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToArray()
                        : Array.Empty<string>()))

                // Owner & Location
                .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.OwnerId))
                .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? (src.Owner.FirstName + " " + src.Owner.LastName).Trim() : null))
                .ForMember(dest => dest.OwnerContact, opt => opt.MapFrom(src => src.Owner != null ? (src.Owner.PhoneNumber ?? src.Owner.Email) : null))
                .ForMember(dest => dest.LocationId, opt => opt.MapFrom(src => src.LocationId))
                .ForMember(dest => dest.LocationName, opt => opt.MapFrom(src => src.Location != null ? src.Location.Name : null))
                .ForMember(dest => dest.LocationAddress, opt => opt.MapFrom(src => src.Location != null ? src.Location.AddressLine1 : null))

                // Status
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Available")) // Default status
                .ForMember(dest => dest.IsAvailableForAuction, opt => opt.MapFrom(src => true)) // Default availability

                // Dates
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.UpdatedAtUtc, opt => opt.MapFrom(src => src.UpdatedAtUtc))

                // Auction fields - default null for now
                .ForMember(dest => dest.LotNumber, opt => opt.MapFrom(src => (int?)null))
                .ForMember(dest => dest.ReservePrice, opt => opt.MapFrom(src => (decimal?)null))
                .ForMember(dest => dest.StartPrice, opt => opt.MapFrom(src => (decimal?)null));

            // ========== CarDetailDto Mapping ==========
            CreateMap<Car, CarDetailDto>()
                // Basic properties
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Vin, opt => opt.MapFrom(src => src.Vin))
                .ForMember(dest => dest.Year, opt => opt.MapFrom(src => src.Year))
                .ForMember(dest => dest.Make, opt => opt.MapFrom(src => src.Make))
                .ForMember(dest => dest.Model, opt => opt.MapFrom(src => src.Model))
                .ForMember(dest => dest.BodyStyle, opt => opt.MapFrom(src => src.BodyStyle))
                .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color))

                // ✅ Direct mapping - same field names
                .ForMember(dest => dest.Mileage, opt => opt.MapFrom(src => src.Mileage))
                .ForMember(dest => dest.MileageUnit, opt => opt.MapFrom(src => src.MileageUnit))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price))
                .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Currency))

                // ✅ Enum mappings - direct mapping
                .ForMember(dest => dest.FuelType, opt => opt.MapFrom(src => src.FuelType))
                .ForMember(dest => dest.DamageType, opt => opt.MapFrom(src => src.DamageType))
                .ForMember(dest => dest.Transmission, opt => opt.MapFrom(src => src.Transmission))
                .ForMember(dest => dest.DriveTrain, opt => opt.MapFrom(src => src.DriveTrain))
                .ForMember(dest => dest.CarCondition, opt => opt.MapFrom(src => src.CarCondition))
                .ForMember(dest => dest.TitleType, opt => opt.MapFrom(src => src.TitleType))
                .ForMember(dest => dest.SecondaryDamage, opt => opt.MapFrom(src => src.SecondaryDamage))
                .ForMember(dest => dest.HasKeys, opt => opt.MapFrom(src => src.HasKeys))
                .ForMember(dest => dest.TitleState, opt => opt.MapFrom(src => src.TitleState))
                .ForMember(dest => dest.EstimatedRetailValue, opt => opt.MapFrom(src => src.EstimatedRetailValue))

                // Media - detailed
                .ForMember(dest => dest.PhotoUrls, opt => opt.MapFrom(src => src.PhotoUrls))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.PhotoUrls)
                        ? src.PhotoUrls.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToArray()
                        : Array.Empty<string>()))
                .ForMember(dest => dest.VideoUrls, opt => opt.MapFrom(src => src.VideoUrls))
                .ForMember(dest => dest.Videos, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.VideoUrls)
                        ? src.VideoUrls.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim()).ToArray()
                        : Array.Empty<string>()))

                // Owner & Location
                .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.OwnerId))
                .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? (src.Owner.FirstName + " " + src.Owner.LastName).Trim() : null))
                .ForMember(dest => dest.OwnerContact, opt => opt.MapFrom(src => src.Owner != null ? (src.Owner.PhoneNumber ?? src.Owner.Email) : null))
                .ForMember(dest => dest.LocationId, opt => opt.MapFrom(src => src.LocationId))
                .ForMember(dest => dest.LocationName, opt => opt.MapFrom(src => src.Location != null ? src.Location.Name : null))
                .ForMember(dest => dest.LocationAddress, opt => opt.MapFrom(src => src.Location != null ? src.Location.AddressLine1 : null))

                // Dates
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.UpdatedAtUtc, opt => opt.MapFrom(src => src.UpdatedAtUtc))

                // Auction fields - default null for now
                .ForMember(dest => dest.LotNumber, opt => opt.MapFrom(src => (int?)null))
                .ForMember(dest => dest.ReservePrice, opt => opt.MapFrom(src => (decimal?)null))
                .ForMember(dest => dest.StartPrice, opt => opt.MapFrom(src => (decimal?)null));

            // ========== CarCreateDto to Car Mapping - ✅ TAM DÜZƏLDILDI ==========
            CreateMap<CarCreateDto, Car>()
                // Entity framework properties - ignore
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())

                // Navigation properties - ignore  
                .ForMember(dest => dest.Owner, opt => opt.Ignore())
                .ForMember(dest => dest.Location, opt => opt.Ignore())
                .ForMember(dest => dest.Documents, opt => opt.Ignore())

                // File properties - ignore (handled in service)
                .ForMember(dest => dest.PhotoUrls, opt => opt.Ignore())
                .ForMember(dest => dest.VideoUrls, opt => opt.Ignore())

                // Owner - set in service
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore())

                // ✅ Direct mappings - same field names
                .ForMember(dest => dest.Vin, opt => opt.MapFrom(src => src.Vin))
                .ForMember(dest => dest.Year, opt => opt.MapFrom(src => src.Year))
                .ForMember(dest => dest.Make, opt => opt.MapFrom(src => src.Make))
                .ForMember(dest => dest.Model, opt => opt.MapFrom(src => src.Model))
                .ForMember(dest => dest.BodyStyle, opt => opt.MapFrom(src => src.BodyStyle))
                .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price))
                .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Currency))
                .ForMember(dest => dest.Mileage, opt => opt.MapFrom(src => src.Mileage))
                .ForMember(dest => dest.MileageUnit, opt => opt.MapFrom(src => src.MileageUnit))
                .ForMember(dest => dest.LocationId, opt => opt.MapFrom(src => src.LocationId))

                // ✅ Enum mappings - same field names
                .ForMember(dest => dest.FuelType, opt => opt.MapFrom(src => src.FuelType))
                .ForMember(dest => dest.DamageType, opt => opt.MapFrom(src => src.DamageType))
                .ForMember(dest => dest.Transmission, opt => opt.MapFrom(src => src.Transmission))
                .ForMember(dest => dest.DriveTrain, opt => opt.MapFrom(src => src.DriveTrain))
                .ForMember(dest => dest.CarCondition, opt => opt.MapFrom(src => src.CarCondition))
                .ForMember(dest => dest.TitleType, opt => opt.MapFrom(src => src.TitleType))
                .ForMember(dest => dest.SecondaryDamage, opt => opt.MapFrom(src => src.SecondaryDamage))
                .ForMember(dest => dest.HasKeys, opt => opt.MapFrom(src => src.HasKeys))
                .ForMember(dest => dest.TitleState, opt => opt.MapFrom(src => src.TitleState))
                .ForMember(dest => dest.EstimatedRetailValue, opt => opt.MapFrom(src => src.EstimatedRetailValue))
                .ReverseMap()
                .ForMember(src => src.Image, opt => opt.Ignore())
                .ForMember(src => src.ImagePath, opt => opt.Ignore())
                .ForMember(src => src.Video, opt => opt.Ignore())
                .ForMember(src => src.VideoPath, opt => opt.Ignore())
                .ForMember(src => src.OwnerId, opt => opt.Ignore());

            // ========== CarUpdateDto Mapping ==========
            CreateMap<CarUpdateDto, Car>()
                .ForMember(dest => dest.PhotoUrls, opt => opt.Ignore())
                .ForMember(dest => dest.VideoUrls, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.Owner, opt => opt.Ignore())
                .ForMember(dest => dest.Location, opt => opt.Ignore())
                .ForMember(dest => dest.Documents, opt => opt.Ignore())
                .ReverseMap()
                .ForMember(src => src.ImageCar, opt => opt.Ignore());
            #endregion
            #region Location

            // Location entity-dən LocationGetDto-ya (Siyahı üçün)
            CreateMap<Location, LocationGetDto>();

            // Location entity-dən LocationDetailDto-ya (Detallı görünüş üçün)
            CreateMap<Location, LocationDetailDto>();

            // LocationCreateDto-dan Location entity-sinə (Yeni Location yaratmaq üçün)
            CreateMap<LocationCreateDto, Location>();

            // LocationUpdateDto-dan Location entity-sinə (Mövcud Location-u yeniləmək üçün)
            CreateMap<LocationUpdateDto, Location>();

            #endregion
            #endregion

            #region Identity

            //  Register
            CreateMap<RegisterDto, ApplicationUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.Phone))
                .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth))
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ReverseMap();

            //  Login
            CreateMap<LoginDto, ApplicationUser>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ReverseMap();

            //  Forgot Password
            CreateMap<ForgotPasswordDto, ApplicationUser>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ReverseMap();

            //  Reset Password
            CreateMap<ResetPasswordDto, ApplicationUser>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ReverseMap();

            //  Resend Confirmation
            CreateMap<ResendConfirmationDto, ApplicationUser>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ReverseMap();

            //  Update User
            CreateMap<UpdateUserDto, ApplicationUser>()
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.Phone))
                .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth))
                .ForMember(dest => dest.ProfilePicture, opt => opt.MapFrom(src => src.ProfilePicture))
                .ReverseMap();

            //  User
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.ProfilePicture, opt => opt.MapFrom(src => src.ProfilePicture))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth))
                .ReverseMap();

            //  Auth Response
            CreateMap<ApplicationUser, AuthResponseDto>()
                .ForMember(dest => dest.User, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Token, opt => opt.Ignore())
                .ForMember(dest => dest.ExpiresAt, opt => opt.Ignore())
                .ReverseMap();

            //  Token Generation
            CreateMap<TokenGenerationRequest, AuthResponseDto>()
               .ForMember(dest => dest.User, opt => opt.Ignore())
               .ForMember(dest => dest.Token, opt => opt.Ignore())
               .ForMember(dest => dest.ExpiresAt, opt => opt.MapFrom(src => src.ExpiresAt))
               .ReverseMap();

            //  Validate Token (Request & Response)
            CreateMap<ValidateTokenRequest, ValidateTokenResponse>()
                .ReverseMap();

            #endregion
        }
    }
}