using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.AuctionCar;
using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Auctions
{
    public class AuctionCarService : GenericService<
        AuctionCar,
        AuctionCarGetDto,
        AuctionCarDetailDto,
        AuctionCarCreateDto,
        AuctionCarUpdateDto>, IAuctionCarService
    {
        private readonly IAuctionCarRepository _auctionCarRepository;
        private readonly IBidRepository _bidRepository;
        private readonly IAuctionRepository _auctionRepository;
        private readonly ICarRepository _carRepository;
        private readonly IAuctionWinnerRepository _auctionWinnerRepository;

        public AuctionCarService(
            IAuctionCarRepository auctionCarRepository,
            IBidRepository bidRepository,
            IAuctionRepository auctionRepository,
            ICarRepository carRepository,
            IAuctionWinnerRepository auctionWinnerRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<AuctionCarService> logger)
            : base(auctionCarRepository, mapper, unitOfWork, logger)
        {
            _auctionCarRepository = auctionCarRepository;
            _bidRepository = bidRepository;
            _auctionRepository = auctionRepository;
            _carRepository = carRepository;
            _auctionWinnerRepository = auctionWinnerRepository;
        }

        #region Override Generic Methods

        public override async Task<AuctionCarDetailDto> AddAsync(AuctionCarCreateDto dto)
        {
            _logger.LogInformation("🚗➕ Creating new auction car - , Auction: {AuctionId}, Car: {CarId}, Lot: {LotNumber}, ERV: ${ERV} - Time: 2025-10-05 19:39:02",
                dto.AuctionId, dto.CarId, dto.LotNumber, dto.EstimatedRetailValue);

            if (dto == null)
                throw new BadRequestException("AuctionCar create data cannot be null");

            var auction = await _auctionRepository.GetByIdAsync(dto.AuctionId);
            if (auction == null)
            {
                _logger.LogError("❌ Auction not found: {AuctionId} - User: .mu-coder", dto.AuctionId);
                throw new NotFoundException("Auction", dto.AuctionId);
            }

            var car = await _carRepository.GetByIdAsync(dto.CarId);
            if (car == null)
            {
                _logger.LogError("❌ Car not found: {CarId} - User: .mu-coder", dto.CarId);
                throw new NotFoundException("Car", dto.CarId);
            }

            var existingLot = await _auctionCarRepository.GetByLotNumberAsync(dto.LotNumber);
            if (existingLot != null)
            {
                _logger.LogError("❌ Lot number already exists: {LotNumber} -.", dto.LotNumber);
                throw new ConflictException($"Lot nömrəsi {dto.LotNumber} artıq mövcuddur");
            }

            var auctionCar = AuctionCar.Create(
                dto.AuctionId,
                dto.CarId,
                dto.LotNumber,
                dto.EstimatedRetailValue,
                dto.ItemNumber,
                dto.LaneNumber,
                dto.RequiresSellerApproval
            );

            if (dto.RunOrder.HasValue)
                auctionCar.RunOrder = dto.RunOrder;

            if (dto.ScheduledTime.HasValue)
                auctionCar.ScheduledTime = dto.ScheduledTime;

            if (!string.IsNullOrEmpty(dto.SellerNotes))
                auctionCar.SellerNotes = dto.SellerNotes;

            var createdAuctionCar = await _auctionCarRepository.AddAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Auction car created successfully , Lot: {LotNumber}, StartPrice: ${StartPrice}, Reserve: ${Reserve}",
                dto.LotNumber, createdAuctionCar.StartPrice, createdAuctionCar.ReservePrice);

            return await GetCarWithFullDetailsAsync(createdAuctionCar.Id);
        }

        public override async Task<AuctionCarDetailDto> UpdateAsync(Guid id, AuctionCarUpdateDto dto)
        {
            _logger.LogInformation("✏️ Updating auction car -., AuctionCarId: {AuctionCarId}", id);

            if (dto == null)
                throw new BadRequestException("Update data cannot be null");

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(id);
            if (auctionCar == null)
            {
                _logger.LogError("❌ AuctionCar not found: {AuctionCarId}", id);
                throw new NotFoundException("AuctionCar", id);
            }

            if (auctionCar.IsActive)
            {
                _logger.LogError("❌ Cannot update active auction car: {LotNumber} ", auctionCar.LotNumber);
                throw new AuctionBusinessException(auctionCar.LotNumber, "Cannot update active auction car");
            }

            if (dto.EstimatedRetailValue.HasValue)
            {
                var hasBids = auctionCar.Bids.Any(b => b.Status == BidStatus.Placed);
                if (hasBids && !dto.StartPriceOverride.HasValue)
                {
                    _logger.LogWarning("⚠️ Cannot auto-recalculate pricing - bids exist for {LotNumber} -.", auctionCar.LotNumber);
                    throw new AuctionBusinessException(auctionCar.LotNumber, "Cannot change ERV after bids are placed without manual price override");
                }

                auctionCar.SetPricing(dto.EstimatedRetailValue.Value);
            }

            if (dto.StartPriceOverride.HasValue)
            {
                auctionCar.StartPrice = dto.StartPriceOverride.Value;
                auctionCar.CurrentPrice = dto.StartPriceOverride.Value;
            }

            if (dto.ReservePriceOverride.HasValue)
                auctionCar.ReservePrice = dto.ReservePriceOverride.Value;

            if (dto.LaneNumber.HasValue)
                auctionCar.LaneNumber = dto.LaneNumber;

            if (dto.RunOrder.HasValue)
                auctionCar.RunOrder = dto.RunOrder;

            if (dto.ScheduledTime.HasValue)
                auctionCar.ScheduledTime = dto.ScheduledTime;

            if (dto.RequiresSellerApproval.HasValue)
                auctionCar.RequiresSellerApproval = dto.RequiresSellerApproval.Value;

            if (!string.IsNullOrEmpty(dto.SellerNotes))
                auctionCar.SellerNotes = dto.SellerNotes;

            var updatedAuctionCar = await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Auction car updated successfully -., Lot: {LotNumber}", auctionCar.LotNumber);

            return await GetCarWithFullDetailsAsync(updatedAuctionCar.Id);
        }

        public new async Task<bool> DeleteAsync(Guid id)
        {
            _logger.LogInformation("🗑️ Deleting auction car -., AuctionCarId: {AuctionCarId}", id);

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(id);
            if (auctionCar == null)
            {
                _logger.LogError("❌ AuctionCar not found for deletion: {AuctionCarId} -.", id);
                throw new NotFoundException("AuctionCar", id);
            }

            var bidCount = auctionCar.Bids.Count(b => b.Status == BidStatus.Placed);
            if (bidCount > 0)
            {
                _logger.LogError("❌ Cannot delete auction car with bids: {LotNumber}, BidCount: {BidCount} -.",
                    auctionCar.LotNumber, bidCount);
                throw new AuctionBusinessException(auctionCar.LotNumber, $"Cannot delete car that has {bidCount} bids");
            }

            var auction = await _auctionRepository.GetByIdAsync(auctionCar.AuctionId);
            if (auction?.Status == AuctionStatus.Running)
            {
                _logger.LogError("❌ Cannot delete car from running auction: {LotNumber} -.", auctionCar.LotNumber);
                throw new AuctionBusinessException(auctionCar.LotNumber, "Cannot delete car from running auction");
            }

            var result = await base.DeleteAsync(id);

            _logger.LogInformation("✅ Auction car deleted successfully -., Lot: {LotNumber}", auctionCar.LotNumber);

            return result;
        }

        #endregion

        #region Lifecycle Management

        // ✅ DÜZƏLDILMIŞ PrepareCarForAuctionAsync()
        public async Task<AuctionCarDetailDto> PrepareCarForAuctionAsync(Guid auctionCarId, Guid currentUserId)
        {
            _logger.LogInformation("🏁 Preparing car for auction - User: ravanmu-coder, AuctionCarId: {AuctionCarId}", auctionCarId);

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
            {
                _logger.LogError("❌ AuctionCar not found for preparation: {AuctionCarId} - User: ravanmu-coder", auctionCarId);
                throw new NotFoundException("AuctionCar", auctionCarId);
            }

            // ✅ FİX: PreAuction və ya ReadyForAuction olmağına icazə ver
            if (auctionCar.AuctionCondition != AuctionCarCondition.PreAuction &&
                auctionCar.AuctionCondition != AuctionCarCondition.ReadyForAuction)
            {
                _logger.LogError("❌ Car not in PreAuction/ReadyForAuction condition: {LotNumber}, Current: {Condition} - User: ravanmu-coder",
                    auctionCar.LotNumber, auctionCar.AuctionCondition);
                throw new AuctionBusinessException(auctionCar.LotNumber, $"Car is not in PreAuction/ReadyForAuction condition");
            }

            var preBidCount = await _auctionCarRepository.GetTotalPreBidCountAsync(auctionCarId);

            // ✅ FİX: StartPrice və ya pre-bid olması kifayətdir
            if (preBidCount == 0 && auctionCar.StartPrice <= 0)
            {
                _logger.LogError("❌ Cannot prepare car without StartPrice or pre-bids: {LotNumber} ", auctionCar.LotNumber);
                throw new AuctionBusinessException(auctionCar.LotNumber, "Car must have StartPrice or pre-bids to be prepared");
            }

            if (preBidCount == 0)
            {
                auctionCar.CurrentPrice = auctionCar.StartPrice;
                _logger.LogInformation("💰 Using StartPrice: ${StartPrice} for {LotNumber} ",
                    auctionCar.StartPrice, auctionCar.LotNumber);
            }
            else
            {
                var highestPreBid = await _auctionCarRepository.GetHighestPreBidAmountAsync(auctionCarId);
                auctionCar.CurrentPrice = Math.Max(highestPreBid, auctionCar.StartPrice);
                _logger.LogInformation("💰 Using highest pre-bid: ${PreBid} for {LotNumber} ",
                    auctionCar.CurrentPrice, auctionCar.LotNumber);
            }

            auctionCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
            auctionCar.PreBidCount = preBidCount;

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Car prepared for auction  Lot: {LotNumber}, PreBids: {PreBids}, StartPrice: ${StartPrice}",
                auctionCar.LotNumber, preBidCount, auctionCar.CurrentPrice);

            return await GetCarWithFullDetailsAsync(auctionCarId, currentUserId);
        }

        // ✅ DÜZƏLDILMIŞ ActivateCarAsync()
        public async Task<AuctionCarDetailDto> ActivateCarAsync(Guid auctionCarId, Guid currentUserId)
        {
            _logger.LogInformation("🎯 Activating car for live auction - User: ravanmu-coder, AuctionCarId: {AuctionCarId}", auctionCarId);

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
            {
                _logger.LogError("❌ AuctionCar not found for activation: {AuctionCarId} - User: ravanmu-coder", auctionCarId);
                throw new NotFoundException("AuctionCar", auctionCarId);
            }

            // ✅ FİX: ReadyForAuction və ya PreAuction-dan aktiv etməyə icazə ver
            if (auctionCar.AuctionCondition != AuctionCarCondition.ReadyForAuction &&
                auctionCar.AuctionCondition != AuctionCarCondition.PreAuction)
            {
                _logger.LogInformation("⚠️ Auto-preparing car from {CurrentCondition} to ReadyForAuction: {LotNumber} - User: ravanmu-coder",
                    auctionCar.AuctionCondition, auctionCar.LotNumber);

                // Auto-prepare car
                auctionCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
            }

            var auction = await _auctionRepository.GetByIdAsync(auctionCar.AuctionId);
            if (auction?.Status != AuctionStatus.Running)
            {
                _logger.LogError("❌ Cannot activate car - auction not running: {AuctionId} - User: ravanmu-coder", auctionCar.AuctionId);
                throw new AuctionBusinessException(auctionCar.LotNumber, "Cannot activate car when auction is not running");
            }

            // ✅ Əvvəlki aktiv car-ı deaktiv et
            var currentActiveCar = await _auctionCarRepository.GetActiveAuctionCarAsync(auctionCar.AuctionId);
            if (currentActiveCar != null && currentActiveCar.Id != auctionCarId)
            {
                currentActiveCar.MarkAsInactive();
                currentActiveCar.AuctionCondition = AuctionCarCondition.ReadyForAuction;
                await _auctionCarRepository.UpdateAsync(currentActiveCar);
                _logger.LogInformation("🔄 Deactivated previous active car: {PreviousLotNumber} - User: ravanmu-coder",
                    currentActiveCar.LotNumber);
            }

            // ✅ Yeni car-ı aktiv et
            auctionCar.MarkAsActive();
            auctionCar.AuctionCondition = AuctionCarCondition.LiveAuction;

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Car activated for live auction - User: ravanmu-coder, Lot: {LotNumber}, Price: ${CurrentPrice}",
               auctionCar.LotNumber, auctionCar.CurrentPrice);

            return await GetCarWithFullDetailsAsync(auctionCarId, currentUserId);
        }

        //public async Task<AuctionCarDetailDto> EndCarAuctionAsync(Guid auctionCarId, Guid currentUserId, string? reason = null)
        //{
        //    _logger.LogInformation("⏹️ Ending auction for car -., AuctionCarId: {AuctionCarId}, Reason: {Reason}",
        //        auctionCarId, reason ?? "Timer expired");

        //    var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
        //    if (auctionCar == null)
        //    {
        //        _logger.LogError("❌ AuctionCar not found for ending: {AuctionCarId} -.", auctionCarId);
        //        throw new NotFoundException("AuctionCar", auctionCarId);
        //    }

        //    if (auctionCar.AuctionCondition != AuctionCarCondition.LiveAuction)
        //    {
        //        _logger.LogError("❌ Car not in live auction: {LotNumber}, Current: {Condition} -.",
        //            auctionCar.LotNumber, auctionCar.AuctionCondition);
        //        throw new AuctionBusinessException(auctionCar.LotNumber, $"Car is not in live auction");
        //    }

        //    var highestBid = auctionCar.Bids
        //        .Where(b => !b.IsPreBid && b.Status == BidStatus.Placed)
        //        .OrderByDescending(b => b.Amount)
        //        .ThenByDescending(b => b.PlacedAtUtc)
        //        .FirstOrDefault();

        //    if (highestBid != null && highestBid.Amount > 0)
        //    {
        //        var isReserveMet = !auctionCar.ReservePrice.HasValue ||
        //                          highestBid.Amount >= auctionCar.ReservePrice.Value;

        //        if (isReserveMet)
        //        {
        //            auctionCar.MarkWon(highestBid.Amount, 0.10m);

        //            var winner = AuctionWinner.Create(
        //                auctionCar.Id,
        //                highestBid.UserId,
        //                highestBid.Id,
        //                highestBid.Amount
        //            );

        //            await _auctionWinnerRepository.AddAsync(winner);

        //            _logger.LogInformation("🏆 Car WON -., Lot: {LotNumber}, Winner: {UserId}, Hammer: ${Amount}, Total: ${Total}",
        //                auctionCar.LotNumber, highestBid.UserId, auctionCar.HammerPrice, auctionCar.TotalPrice);
        //        }
        //        else
        //        {
        //            auctionCar.MarkUnsold($"Reserve not met (${auctionCar.ReservePrice} required, ${highestBid.Amount} offered)");

        //            _logger.LogInformation("❌ Car NO SALE -., Lot: {LotNumber}, Reserve: ${Reserve}, HighBid: ${Bid}",
        //                auctionCar.LotNumber, auctionCar.ReservePrice, highestBid.Amount);
        //        }
        //    }
        //    else
        //    {
        //        auctionCar.MarkUnsold("No valid bids received");

        //        _logger.LogInformation("❌ Car NO SALE -., Lot: {LotNumber}, Reason: No bids", auctionCar.LotNumber);
        //    }

        //    await _auctionCarRepository.UpdateAsync(auctionCar);
        //    await _unitOfWork.SaveChangesAsync();

        //    return await GetCarWithFullDetailsAsync(auctionCarId, currentUserId);
        //}
        public async Task<AuctionCarDetailDto> EndCarAuctionAsync(Guid auctionCarId)
        {
            _logger.LogInformation("⏹️ Ending auction for car - User: ravanmu-coder, AuctionCarId: {AuctionCarId}", auctionCarId);

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (auctionCar.AuctionCondition != AuctionCarCondition.LiveAuction)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Car is not in live auction");

            var highestBid = auctionCar.Bids
                .Where(b => !b.IsPreBid && b.Status == BidStatus.Placed)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.PlacedAtUtc)
                .FirstOrDefault();

            if (highestBid != null && highestBid.Amount > 0)
            {
                var isReserveMet = !auctionCar.ReservePrice.HasValue ||
                                  highestBid.Amount >= auctionCar.ReservePrice.Value;

                if (isReserveMet)
                {
                    // ✅ CAR WON - Calculate buyer's premium (10%)
                    auctionCar.MarkWon(highestBid.Amount, 0.10m);

                    // Create auction winner record
                    var winner = AuctionWinner.Create(
                        auctionCar.Id,
                        highestBid.UserId,
                        highestBid.Id,
                        highestBid.Amount
                    );

                    await _auctionWinnerRepository.AddAsync(winner);

                    _logger.LogInformation("🏆 Car WON - User: ravanmu-coder, Lot: {LotNumber}, Winner: {UserId}, Hammer: ${Amount}, Total: ${Total}",
                        auctionCar.LotNumber, highestBid.UserId, auctionCar.HammerPrice, auctionCar.TotalPrice);
                }
                else
                {
                    // ❌ NO SALE - Reserve not met
                    auctionCar.MarkUnsold($"Reserve not met (${auctionCar.ReservePrice} required, ${highestBid.Amount} offered)");

                    _logger.LogInformation("❌ Car NO SALE - User: ravanmu-coder, Lot: {LotNumber}, Reserve: ${Reserve}, HighBid: ${Bid}",
                        auctionCar.LotNumber, auctionCar.ReservePrice, highestBid.Amount);
                }
            }
            else
            {
                // ❌ NO SALE - No valid bids
                auctionCar.MarkUnsold("No valid bids received");

                _logger.LogInformation("❌ Car NO SALE - User: ravanmu-coder, Lot: {LotNumber}, Reason: No bids", auctionCar.LotNumber);
            }

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AuctionCarDetailDto>(auctionCar);
        }
        public async Task<AuctionCarDetailDto> MarkCarUnsoldAsync(Guid auctionCarId, string reason, Guid currentUserId)
        {
            _logger.LogInformation("❌ Marking car as unsold -., AuctionCarId: {AuctionCarId}, Reason: {Reason}",
                auctionCarId, reason);

            if (string.IsNullOrWhiteSpace(reason))
                throw new BadRequestException("Unsold reason is required");

            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
            {
                _logger.LogError("❌ AuctionCar not found for unsold marking: {AuctionCarId} -.", auctionCarId);
                throw new NotFoundException("AuctionCar", auctionCarId);
            }

            auctionCar.MarkUnsold(reason);

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Car marked as unsold -., Lot: {LotNumber}, Reason: {Reason}",
                auctionCar.LotNumber, reason);

            return await GetCarWithFullDetailsAsync(auctionCarId, currentUserId);
        }

        #endregion

        #region Pre-Bid Management

        public async Task<bool> HasRequiredPreBidsAsync(Guid auctionCarId)
        {
            _logger.LogInformation("🔍 Checking pre-bid requirements -., AuctionCarId: {AuctionCarId}", auctionCarId);

            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var preBidCount = await _auctionCarRepository.GetTotalPreBidCountAsync(auctionCarId);
            var hasRequiredPreBids = preBidCount > 0 || auctionCar.StartPrice > 0;

            _logger.LogInformation("📊 Pre-bid check result -., Lot: {LotNumber}, PreBids: {PreBids}, CanStart: {CanStart}",
                auctionCar.LotNumber, preBidCount, hasRequiredPreBids);

            return hasRequiredPreBids;
        }

        public async Task<BidDetailDto?> GetHighestPreBidAsync(Guid auctionCarId)
        {
            _logger.LogInformation("💰 Getting highest pre-bid -., AuctionCarId: {AuctionCarId}", auctionCarId);

            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var highestPreBid = await _bidRepository.GetHighestPreBidAsync(auctionCarId);
            if (highestPreBid == null)
            {
                _logger.LogInformation("📭 No pre-bids found -., Lot: {LotNumber}", auctionCar.LotNumber);
                return null;
            }

            return _mapper.Map<BidDetailDto>(highestPreBid);
        }

        public async Task<bool> HasUserPreBidAsync(Guid auctionCarId, Guid userId)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            return await _auctionCarRepository.HasUserPreBidAsync(auctionCarId, userId);
        }

        public async Task<IEnumerable<BidGetDto>> GetPreBidsAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var preBids = await _bidRepository.GetPreBidsAsync(auctionCarId);
            return _mapper.Map<IEnumerable<BidGetDto>>(preBids);
        }

        #endregion

        #region Price Management

        public async Task<AuctionCarDetailDto> UpdateCurrentPriceAsync(Guid auctionCarId, decimal newPrice, Guid bidderId)
        {
            _logger.LogInformation("💰 Updating current price -., AuctionCarId: {AuctionCarId}, NewPrice: ${NewPrice}",
                auctionCarId, newPrice);

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (!auctionCar.IsActive)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Car is not currently active in auction");

            if (newPrice <= auctionCar.CurrentPrice)
                throw new BadRequestException($"New bid ${newPrice} must be greater than current price ${auctionCar.CurrentPrice}");

            var nextMinBid = auctionCar.CalculateNextMinimumBid();
            if (newPrice < nextMinBid)
                throw new BadRequestException($"Minimum bid increment not met. Required: ${nextMinBid}");

            auctionCar.UpdateCurrentPrice(newPrice);

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Price updated successfully -., Lot: {LotNumber}, Price: ${NewPrice}",
               auctionCar.LotNumber, newPrice);

            return await GetCarWithFullDetailsAsync(auctionCarId, bidderId);
        }

        public async Task<bool> IsReservePriceMetAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            return auctionCar.IsReserveMet;
        }

        public async Task<decimal> CalculateNextMinimumBidAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            return auctionCar.CalculateNextMinimumBid();
        }

        #endregion

        #region Timer Management

        public async Task<AuctionCarTimerDto> GetCarTimerInfoAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var auction = await _auctionRepository.GetByIdAsync(auctionCar.AuctionId);
            var timerSeconds = auction?.TimerSeconds ?? 10;

            var isExpired = auctionCar.IsTimeExpired(timerSeconds);
            var remainingTime = 0;

            if (auctionCar.IsActive && !isExpired)
            {
                var lastActionTime = auctionCar.LastBidTime ?? auctionCar.ActiveStartTime ?? DateTime.UtcNow;
                var elapsed = (DateTime.UtcNow - lastActionTime).TotalSeconds;
                remainingTime = Math.Max(0, (int)(timerSeconds - elapsed));
            }

            return new AuctionCarTimerDto
            {
                AuctionCarId = auctionCarId,
                LotNumber = auctionCar.LotNumber,
                RemainingTimeSeconds = remainingTime,
                IsExpired = isExpired,
                LastBidTime = auctionCar.LastBidTime,
                IsActive = auctionCar.IsActive,
                ShowFinalCall = remainingTime <= 30 && remainingTime > 0,
                IsInCriticalTime = remainingTime <= 10 && remainingTime > 0,
                CurrentPrice = auctionCar.CurrentPrice,
                NextMinimumBid = auctionCar.CalculateNextMinimumBid(),
                IsReserveMet = auctionCar.IsReserveMet
            };
        }

        public async Task UpdateLastBidTimeAsync(Guid auctionCarId, DateTime bidTime, Guid bidderId)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (!auctionCar.IsActive)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Cannot update bid time for inactive car");

            auctionCar.LastBidTime = bidTime;
            auctionCar.MarkUpdated();

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> IsCarTimerExpiredAsync(Guid auctionCarId, int timerSeconds)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            return auctionCar.IsTimeExpired(timerSeconds);
        }

        #endregion

        #region Post-Auction Management

        public async Task<AuctionCarDetailDto> ApproveWinnerAsync(Guid auctionCarId, Guid sellerId, string? approvalNotes = null)
        {
            _logger.LogInformation("✅ Approving winner -., AuctionCarId: {AuctionCarId}, Seller: {SellerId}",
                auctionCarId, sellerId);

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithFullDetailsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (auctionCar.WinnerStatus != AuctionWinnerStatus.AwaitingSellerApproval)
                throw new AuctionBusinessException(auctionCar.LotNumber, $"Car is not awaiting seller approval");

            if (auctionCar.Car.OwnerId != sellerId.ToString())
                throw new UnauthorizedException($"User {sellerId} is not the owner of car {auctionCar.LotNumber}");

            auctionCar.ApproveWinner();
            if (!string.IsNullOrEmpty(approvalNotes))
                auctionCar.SellerNotes = approvalNotes;

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return await GetCarWithFullDetailsAsync(auctionCarId, sellerId);
        }

        public async Task<AuctionCarDetailDto> RejectWinnerAsync(Guid auctionCarId, Guid sellerId, string rejectionReason)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
                throw new BadRequestException("Rejection reason is required");

            var auctionCar = await _auctionCarRepository.GetAuctionCarWithFullDetailsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (auctionCar.WinnerStatus != AuctionWinnerStatus.AwaitingSellerApproval)
                throw new AuctionBusinessException(auctionCar.LotNumber, $"Car is not awaiting seller approval");

            if (auctionCar.Car.OwnerId != sellerId.ToString())
                throw new UnauthorizedException($"User {sellerId} is not the owner of car {auctionCar.LotNumber}");

            auctionCar.RejectWinner(rejectionReason);

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return await GetCarWithFullDetailsAsync(auctionCarId, sellerId);
        }

        public async Task<AuctionCarDetailDto> MarkDepositPaidAsync(Guid auctionCarId, decimal depositAmount, Guid buyerId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithFullDetailsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (auctionCar.WinnerStatus != AuctionWinnerStatus.SellerApproved)
                throw new AuctionBusinessException(auctionCar.LotNumber, $"Car is not in seller approved status");

            if (depositAmount <= 0)
                throw new BadRequestException("Deposit amount must be greater than zero");

            var requiredDeposit = (auctionCar.HammerPrice ?? 0) * 0.10m;
            if (depositAmount < requiredDeposit)
                throw new BadRequestException($"Minimum deposit of ${requiredDeposit:F2} required");

            if (auctionCar.AuctionWinner?.UserId != buyerId)
                throw new UnauthorizedException($"User {buyerId} is not the winner of car {auctionCar.LotNumber}");

            auctionCar.MarkDepositPaid();

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return await GetCarWithFullDetailsAsync(auctionCarId, buyerId);
        }

        public async Task<AuctionCarDetailDto> CompletePaymentAsync(Guid auctionCarId, decimal totalAmount, Guid buyerId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithFullDetailsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            if (auctionCar.WinnerStatus != AuctionWinnerStatus.DepositPaid)
                throw new AuctionBusinessException(auctionCar.LotNumber, "Deposit must be paid first");

            if (totalAmount != auctionCar.TotalPrice)
                throw new BadRequestException($"Payment amount does not match total due");

            if (auctionCar.AuctionWinner?.UserId != buyerId)
                throw new UnauthorizedException($"User {buyerId} is not the winner");

            auctionCar.CompletePayment();

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return await GetCarWithFullDetailsAsync(auctionCarId, buyerId);
        }

        #endregion

        #region Lane Management

        public async Task<AuctionCarDetailDto> AssignToLaneAsync(Guid auctionCarId, int laneNumber, int runOrder, DateTime scheduledTime, Guid currentUserId)
        {
            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var isAvailable = await _auctionCarRepository.IsLaneSlotAvailableAsync(laneNumber, scheduledTime, runOrder);
            if (!isAvailable)
                throw new ConflictException($"Lane {laneNumber} slot {runOrder} is not available");

            auctionCar.LaneNumber = laneNumber;
            auctionCar.RunOrder = runOrder;
            auctionCar.ScheduledTime = scheduledTime;

            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            return await GetCarWithFullDetailsAsync(auctionCarId, currentUserId);
        }

        public async Task<IEnumerable<AuctionCarGetDto>> GetCarsByLaneAsync(int laneNumber, DateTime? scheduleDate = null)
        {
            var cars = await _auctionCarRepository.GetCarsByLaneAsync(laneNumber, scheduleDate);
            return _mapper.Map<IEnumerable<AuctionCarGetDto>>(cars);
        }

        #endregion

        #region Statistics

        public async Task<AuctionCarStatsDto> GetCarBidStatsAsync(Guid auctionCarId)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithBidsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var totalBids = await _bidRepository.GetTotalBidCountAsync(auctionCarId);
            var preBids = auctionCar.Bids.Count(b => b.IsPreBid);
            var uniqueBidders = await _bidRepository.GetUniqueBiddersCountAsync(auctionCarId);

            return new AuctionCarStatsDto
            {
                AuctionCarId = auctionCarId,
                LotNumber = auctionCar.LotNumber,
                TotalBids = totalBids,
                PreBids = preBids,
                LiveBids = totalBids - preBids,
                UniqueBidders = uniqueBidders,
                StartPrice = auctionCar.StartPrice,
                CurrentPrice = auctionCar.CurrentPrice,
                HighestBid = auctionCar.CurrentPrice,
                IsReserveMet = auctionCar.IsReserveMet,
                WinnerStatus = auctionCar.WinnerStatus.ToString(),
                AuctionCondition = auctionCar.AuctionCondition.ToString()
            };
        }

        public async Task<decimal> GetSellThroughRateAsync(Guid auctionId)
        {
            return await _auctionCarRepository.GetSellThroughRateAsync(auctionId);
        }

        #endregion

        #region Query Methods

        public async Task<AuctionCarDetailDto> GetCarWithFullDetailsAsync(Guid auctionCarId, Guid? currentUserId = null)
        {
            var auctionCar = await _auctionCarRepository.GetAuctionCarWithFullDetailsAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var dto = _mapper.Map<AuctionCarDetailDto>(auctionCar);

            // Hide reserve price from buyers
            if (currentUserId.HasValue && auctionCar.Car.OwnerId != currentUserId.ToString())
            {
                dto.ReservePrice = null;
                dto.ShowReservePrice = false;
            }
            else
            {
                dto.ShowReservePrice = true;
            }

            if (auctionCar.IsActive)
            {
                var timerInfo = await GetCarTimerInfoAsync(auctionCarId);
                dto.RemainingTimeSeconds = timerInfo.RemainingTimeSeconds;
                dto.IsTimeExpired = timerInfo.IsExpired;
                dto.NextMinimumBid = timerInfo.NextMinimumBid;
            }

            return dto;
        }

        public async Task<IEnumerable<AuctionCarGetDto>> GetCarsByAuctionIdAsync(Guid auctionId, Guid? currentUserId = null)
        {
            var cars = await _auctionCarRepository.GetByAuctionIdAsync(auctionId);
            var dtos = _mapper.Map<IEnumerable<AuctionCarGetDto>>(cars);

            foreach (var dto in dtos)
            {
                dto.NextMinimumBid = dto.CurrentPrice switch
                {
                    <= 500 => dto.CurrentPrice + 25,
                    <= 1000 => dto.CurrentPrice + 50,
                    <= 5000 => dto.CurrentPrice + 100,
                    <= 10000 => dto.CurrentPrice + 250,
                    _ => dto.CurrentPrice + 500
                };
            }

            return dtos;
        }

        public async Task<AuctionCarDetailDto?> GetCarByLotNumberAsync(string lotNumber, Guid? currentUserId = null)
        {
            var auctionCar = await _auctionCarRepository.GetByLotNumberAsync(lotNumber);
            if (auctionCar == null)
                return null;

            return await GetCarWithFullDetailsAsync(auctionCar.Id, currentUserId);
        }

        public async Task<AuctionCarDetailDto?> GetActiveCarForAuctionAsync(Guid auctionId)
        {
            var activeCar = await _auctionCarRepository.GetActiveAuctionCarAsync(auctionId);
            if (activeCar == null)
                return null;

            return await GetCarWithFullDetailsAsync(activeCar.Id);
        }

        public async Task<AuctionCarDetailDto?> GetNextCarForAuctionAsync(Guid auctionId, string currentLotNumber)
        {
            var nextCar = await _auctionCarRepository.GetNextAuctionCarAsync(auctionId, currentLotNumber);
            if (nextCar == null)
                return null;

            return await GetCarWithFullDetailsAsync(nextCar.Id);
        }

        public async Task<IEnumerable<AuctionCarGetDto>> GetCarsReadyForAuctionAsync(Guid auctionId)
        {
            var carsReady = await _auctionCarRepository.GetCarsReadyForAuctionAsync(auctionId);
            return _mapper.Map<IEnumerable<AuctionCarGetDto>>(carsReady);
        }

        public async Task<IEnumerable<AuctionCarGetDto>> GetUnsoldCarsAsync(Guid auctionId)
        {
            var unsoldCars = await _auctionCarRepository.GetUnsoldAuctionCarsAsync(auctionId);
            return _mapper.Map<IEnumerable<AuctionCarGetDto>>(unsoldCars);
        }

        public async Task<IEnumerable<AuctionCarGetDto>> GetCarsAwaitingApprovalAsync(Guid auctionId)
        {
            var awaitingCars = await _auctionCarRepository.GetSoldCarsAwaitingApprovalAsync(auctionId);
            return _mapper.Map<IEnumerable<AuctionCarGetDto>>(awaitingCars);
        }

        public async Task<IEnumerable<AuctionCarGetDto>> GetUserWonCarsAsync(Guid userId, Guid auctionId)
        {
            var wonCars = await _auctionCarRepository.GetUserWonCarsAsync(userId, auctionId);
            return _mapper.Map<IEnumerable<AuctionCarGetDto>>(wonCars);
        }
        public async Task<IEnumerable<VehicleFinderAuctionStatusDto>> GetAuctionStatusForCarsAsync(IEnumerable<Guid> carIds)
        {
            var ids = (carIds ?? Enumerable.Empty<Guid>()).Where(id => id != Guid.Empty).Distinct().ToList();
            if (!ids.Any()) return Enumerable.Empty<VehicleFinderAuctionStatusDto>();

            // Repo qaytaracaq yalnız live auction car-ları
            var activeAuctionCars = (await _auctionCarRepository.GetActiveAuctionCarsByCarIdsAsync(ids)).ToList();

            var now = DateTime.UtcNow;

            // Map et və missing carId-lər üçün default false qaytar
            var results = new List<VehicleFinderAuctionStatusDto>();

            // Quick lookup map by CarId (bəzən bir car birdən çox auction entry-də ola bilər — seçimi siz təyin edin; burada ilkini götürürük)
            var grouped = activeAuctionCars.GroupBy(ac => ac.CarId).ToDictionary(g => g.Key, g => g.First());

            foreach (var carId in ids)
            {
                if (grouped.TryGetValue(carId, out var ac))
                {
                    int? remaining = null;
                    // Hesablama məntiqi: əgər AuctionCar.ActiveStartTime və Auction.TimerSeconds mövcuddursa, ondan istifadə et
                    try
                    {
                        if (ac.ActiveStartTime.HasValue && ac.Auction != null && ac.Auction.TimerSeconds > 0)
                        {
                            var end = ac.ActiveStartTime.Value.AddSeconds(ac.Auction.TimerSeconds);
                            var diff = end - now;
                            remaining = diff.TotalSeconds > 0 ? (int)diff.TotalSeconds : 0;
                        }
                        else if (ac.Auction?.EndTimeUtc != null)
                        {
                            var diff2 = ac.Auction.EndTimeUtc - now;
                            remaining = diff2.TotalSeconds > 0 ? (int)diff2.TotalSeconds : 0;
                        }
                    }
                    catch
                    {
                        remaining = null;
                    }

                    results.Add(new VehicleFinderAuctionStatusDto
                    {
                        CarId = carId,
                        IsInAuction = true,
                        AuctionId = ac.AuctionId,
                        AuctionStatus = ac.Auction?.Status.ToString(),
                        AuctionIsLive = ac.Auction?.IsLive ?? false,
                        AuctionCarCondition = ac.AuctionCondition.ToString(),
                        LotNumber = ac.LotNumber,
                        CurrentPrice = ac.CurrentPrice,
                        RemainingTimeSeconds = remaining
                    });
                }
                else
                {
                    // Car auction-da deyil
                    results.Add(new VehicleFinderAuctionStatusDto
                    {
                        CarId = carId,
                        IsInAuction = false
                    });
                }
            }

            return results;
        }
        #endregion
    }
}