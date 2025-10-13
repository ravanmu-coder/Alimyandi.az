using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner;
using AutoriaFinal.Contract.Services.Auctions;
using AutoriaFinal.Domain.Entities.Auctions;
using AutoriaFinal.Domain.Enums.AuctionEnums;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services.Auctions
{
    public class AuctionWinnerService : GenericService<
        AuctionWinner,
        AuctionWinnerGetDto,
        AuctionWinnerDetailDto,
        AuctionWinnerCreateDto,
        AuctionWinnerUpdateDto>, IAuctionWinnerService
    {
        #region Dependencies & Constructor

        private readonly IAuctionWinnerRepository _auctionWinnerRepository;
        private readonly IBidRepository _bidRepository;
        private readonly IAuctionCarRepository _auctionCarRepository;
        private readonly IAuctionRepository _auctionRepository;

        public AuctionWinnerService(
            IAuctionWinnerRepository auctionWinnerRepository,
            IBidRepository bidRepository,
            IAuctionCarRepository auctionCarRepository,
            IAuctionRepository auctionRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<AuctionWinnerService> logger)
            : base(auctionWinnerRepository, mapper, unitOfWork, logger)
        {
            _auctionWinnerRepository = auctionWinnerRepository;
            _bidRepository = bidRepository;
            _auctionCarRepository = auctionCarRepository;
            _auctionRepository = auctionRepository;
        }

        #endregion
        #region Override Generic Methods

        public override async Task<AuctionWinnerDetailDto> AddAsync(AuctionWinnerCreateDto dto)
        {
            _logger.LogInformation("🏆 Creating winner: AuctionCar {AuctionCarId}, User {UserId}, Amount ${Amount}",
                dto.AuctionCarId, dto.UserId, dto.Amount);

            var existingWinner = await _auctionWinnerRepository.GetByAuctionCarIdAsync(dto.AuctionCarId);
            if (existingWinner != null)
                throw new ConflictException($"Winner already assigned for AuctionCar {dto.AuctionCarId}");

            var auctionCar = await _auctionCarRepository.GetByIdAsync(dto.AuctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", dto.AuctionCarId);

            var winningBid = await _bidRepository.GetByIdAsync(dto.WinningBidId);
            if (winningBid == null || winningBid.UserId != dto.UserId)
                throw new BadRequestException("Invalid winning bid or user mismatch");

            var winner = AuctionWinner.Create(
                dto.AuctionCarId,
                dto.UserId,
                dto.WinningBidId,
                dto.Amount,
                dto.PaymentDueDays);

            if (!string.IsNullOrEmpty(dto.Notes))
                winner.Notes = dto.Notes;

            if (dto.CustomPaymentDueDate.HasValue)
                winner.PaymentDueDate = dto.CustomPaymentDueDate.Value;

            var createdWinner = await _auctionWinnerRepository.AddAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ WINNER CREATED: {WinnerId} - Car: {LotNumber}, Amount: ${Amount}, User: {UserId}",
                createdWinner.Id, auctionCar.LotNumber, dto.Amount, dto.UserId);

            return await GetDetailedWinnerAsync(createdWinner.Id);
        }

        public override async Task<AuctionWinnerDetailDto> UpdateAsync(Guid id, AuctionWinnerUpdateDto dto)
        {
            _logger.LogInformation("🔄 Updating winner: {WinnerId}, Reason: {Reason}", id, dto.UpdateReason);

            var winner = await _auctionWinnerRepository.GetByIdAsync(id);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", id);

            if (dto.PaidAmount.HasValue && dto.PaidAmount.Value > 0)
            {
                winner.MarkPaid(dto.PaidAmount.Value, dto.PaymentReference, dto.Notes);
                _logger.LogInformation("💰 Payment recorded: {WinnerId}, Amount: ${Amount}", id, dto.PaidAmount.Value);
            }

            if (dto.PaymentDueDate.HasValue)
                winner.PaymentDueDate = dto.PaymentDueDate.Value;

            if (!string.IsNullOrEmpty(dto.Notes))
                winner.Notes = dto.Notes;

            if (dto.WinnerConfirmedAt.HasValue)
                winner.WinnerConfirmedAt = dto.WinnerConfirmedAt.Value;

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ WINNER UPDATED: {WinnerId} - {Reason}", id, dto.UpdateReason);

            return await GetDetailedWinnerAsync(id);
        }

        #endregion

        #region Winner Assignment & Management

        public async Task<AuctionWinnerDetailDto> AssignWinnerAsync(Guid auctionCarId)
        {
            _logger.LogInformation("🎯 Auto-assigning winner for AuctionCar: {AuctionCarId}", auctionCarId);

            var existingWinner = await _auctionWinnerRepository.GetByAuctionCarIdAsync(auctionCarId);
            if (existingWinner != null)
                throw new ConflictException($"Winner already assigned for AuctionCar {auctionCarId}");

            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var highestBid = auctionCar.GetHighestBid();
            if (highestBid == null)
            {
                _logger.LogWarning("❌ No bids found for AuctionCar: {AuctionCarId}", auctionCarId);
                throw new BadRequestException("No bids found for this auction car");
            }

            var isReserveMet = !auctionCar.ReservePrice.HasValue ||
                              highestBid.Amount >= auctionCar.ReservePrice.Value;

            if (!isReserveMet)
            {
                _logger.LogInformation("❌ Reserve not met: Car {LotNumber}, Highest: ${Bid}, Reserve: ${Reserve}",
                    auctionCar.LotNumber, highestBid.Amount, auctionCar.ReservePrice);

                auctionCar.MarkUnsold();
                await _auctionCarRepository.UpdateAsync(auctionCar);
                await _unitOfWork.SaveChangesAsync();

                throw new AuctionBusinessException(auctionCar.LotNumber, "Reserve price not met - marked as unsold");
            }

            var winner = AuctionWinner.Create(
                auctionCarId,
                highestBid.UserId,
                highestBid.Id,
                highestBid.Amount);

            auctionCar.MarkWon(highestBid.Amount);

            await _auctionWinnerRepository.AddAsync(winner);
            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("🏆 WINNER AUTO-ASSIGNED: {WinnerId} - Car: {LotNumber}, User: {UserId}, Amount: ${Amount}",
                winner.Id, auctionCar.LotNumber, highestBid.UserId, highestBid.Amount);

            return await GetDetailedWinnerAsync(winner.Id);
        }

        public async Task<AuctionWinnerDetailDto> AssignWinnerManuallyAsync(Guid auctionCarId, Guid userId, Guid winningBidId, decimal amount)
        {
            _logger.LogInformation("👤 Manual winner assignment: Car {AuctionCarId}, User {UserId}, Amount ${Amount}",
                auctionCarId, userId, amount);

            var existingWinner = await _auctionWinnerRepository.GetByAuctionCarIdAsync(auctionCarId);
            if (existingWinner != null)
                throw new ConflictException($"Winner already assigned for AuctionCar {auctionCarId}");

            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            var bid = await _bidRepository.GetByIdAsync(winningBidId);
            if (bid == null || bid.UserId != userId || bid.AuctionCarId != auctionCarId)
                throw new BadRequestException("Invalid bid for this assignment");

            var winner = AuctionWinner.Create(auctionCarId, userId, winningBidId, amount);
            auctionCar.MarkWon(amount);

            await _auctionWinnerRepository.AddAsync(winner);
            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("🎯 WINNER MANUALLY ASSIGNED: {WinnerId} - Car: {LotNumber}, User: {UserId}",
                winner.Id, auctionCar.LotNumber, userId);

            return await GetDetailedWinnerAsync(winner.Id);
        }

        public async Task<AuctionWinnerDetailDto?> AssignSecondChanceWinnerAsync(Guid auctionCarId, Guid originalWinnerId)
        {
            _logger.LogInformation("🥈 Assigning second chance winner: Car {AuctionCarId}, Original {OriginalWinnerId}",
                auctionCarId, originalWinnerId);

            var originalWinner = await _auctionWinnerRepository.GetByIdAsync(originalWinnerId);
            if (originalWinner == null || originalWinner.AuctionCarId != auctionCarId)
                throw new BadRequestException("Invalid original winner");

            if (!originalWinner.IsEligibleForReAuction())
                throw new BadRequestException("Original winner is not eligible for re-auction");

            var secondChanceCandidate = await _auctionWinnerRepository.GetSecondChanceCandidateAsync(auctionCarId);
            if (secondChanceCandidate == null)
            {
                _logger.LogInformation("❌ No second chance candidate found for AuctionCar: {AuctionCarId}", auctionCarId);
                return null;
            }

            originalWinner.Cancel("Second chance winner assigned", null);
            await _auctionWinnerRepository.UpdateAsync(originalWinner);

            await _auctionWinnerRepository.AddAsync(secondChanceCandidate);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("🥈 SECOND CHANCE WINNER ASSIGNED: {WinnerId} - User: {UserId}, Amount: ${Amount}",
                secondChanceCandidate.Id, secondChanceCandidate.UserId, secondChanceCandidate.Amount);

            return await GetDetailedWinnerAsync(secondChanceCandidate.Id);
        }

        public async Task<AuctionWinnerDetailDto?> GetWinnerByIdAsync(Guid winnerId)
        {
            return await GetDetailedWinnerAsync(winnerId);
        }

        public async Task<AuctionWinnerDetailDto?> GetWinnerByAuctionCarIdAsync(Guid auctionCarId)
        {
            var winner = await _auctionWinnerRepository.GetByAuctionCarIdAsync(auctionCarId);
            if (winner == null) return null;

            return await GetDetailedWinnerAsync(winner.Id);
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetUserWinnersAsync(Guid userId)
        {
            _logger.LogInformation("📊 Getting user winners: {UserId}", userId);

            var winners = await _auctionWinnerRepository.GetByUserIdAsync(userId);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} winners for user: {UserId}", dtos.Count(), userId);
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersByAuctionAsync(Guid auctionId)
        {
            _logger.LogInformation("📊 Getting winners for auction: {AuctionId}", auctionId);

            var winners = await _auctionWinnerRepository.GetWinnersByAuctionAsync(auctionId);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} winners for auction: {AuctionId}", dtos.Count(), auctionId);
            return dtos;
        }

        #endregion

        #region Payment Processing & Tracking

        public async Task<AuctionWinnerDetailDto> RecordPaymentAsync(Guid winnerId, decimal amount, string? paymentReference = null, string? notes = null)
        {
            _logger.LogInformation("💳 Recording payment: Winner {WinnerId}, Amount ${Amount}", winnerId, amount);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            if (winner.PaymentStatus == PaymentStatus.Cancelled)
                throw new BadRequestException("Cannot record payment for cancelled winner");

            winner.MarkPaid(amount, paymentReference, notes);

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            var paymentStatusText = winner.IsFullyPaid() ? "FULL PAYMENT" : "PARTIAL PAYMENT";
            _logger.LogInformation("✅ {Status} RECORDED: {WinnerId} - Amount: ${Amount}, Total: ${Total}/${Required}",
                paymentStatusText, winnerId, amount, winner.PaidAmount, winner.Amount);

            return await GetDetailedWinnerAsync(winnerId);
        }

        public async Task<AuctionWinnerDetailDto> RecordPartialPaymentAsync(Guid winnerId, decimal amount, string? paymentReference = null, string? notes = null)
        {
            return await RecordPaymentAsync(winnerId, amount, paymentReference, notes);
        }

        public async Task<bool> IsPaymentOverdueAsync(Guid winnerId)
        {
            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            return winner.IsPaymentOverdue();
        }

        public async Task<decimal> GetRemainingPaymentAmountAsync(Guid winnerId)
        {
            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            return winner.GetRemainingAmount();
        }

        public async Task<decimal> GetPaymentProgressAsync(Guid winnerId)
        {
            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            return winner.GetPaymentProgress();
        }

        public async Task<AuctionWinnerDetailDto> ExtendPaymentDueDateAsync(Guid winnerId, int additionalDays, string reason, Guid extendedByUserId)
        {
            _logger.LogInformation("📅 Extending payment due date: Winner {WinnerId}, Days +{Days}, Reason: {Reason}",
                winnerId, additionalDays, reason);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            winner.ExtendPaymentDueDate(additionalDays, reason, extendedByUserId);

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ PAYMENT EXTENDED: {WinnerId} - New due date: {DueDate}",
                winnerId, winner.PaymentDueDate);

            return await GetDetailedWinnerAsync(winnerId);
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetOverduePaymentsAsync()
        {
            _logger.LogInformation("⚠️ Getting overdue payments");

            var overdueWinners = await _auctionWinnerRepository.GetOverduePaymentsAsync();
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(overdueWinners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} overdue payments", dtos.Count());
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetUnpaidWinnersAsync(Guid userId)
        {
            _logger.LogInformation("💸 Getting unpaid winners for user: {UserId}", userId);

            var unpaidWinners = await _auctionWinnerRepository.GetUnpaidWinnersAsync(userId);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(unpaidWinners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} unpaid winners for user: {UserId}", dtos.Count(), userId);
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersByPaymentStatusAsync(PaymentStatus paymentStatus)
        {
            _logger.LogInformation("📈 Getting winners by payment status: {Status}", paymentStatus);

            var winners = await _auctionWinnerRepository.GetWinnersByPaymentStatusAsync(paymentStatus);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} winners with status: {Status}", dtos.Count(), paymentStatus);
            return dtos;
        }

        #endregion

        #region Seller Confirmation Process

        public async Task<AuctionWinnerDetailDto> ConfirmWinnerAsync(Guid winnerId, Guid confirmedByUserId, string? confirmationNotes = null)
        {
            _logger.LogInformation("✅ Confirming winner: {WinnerId} by user {ConfirmedBy}", winnerId, confirmedByUserId);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            winner.Confirm(confirmedByUserId, confirmationNotes);

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("🎉 WINNER CONFIRMED: {WinnerId} by user {ConfirmedBy}", winnerId, confirmedByUserId);

            return await GetDetailedWinnerAsync(winnerId);
        }

        public async Task<AuctionWinnerDetailDto> RejectWinnerAsync(Guid winnerId, Guid rejectedByUserId, string rejectionReason)
        {
            _logger.LogInformation("❌ Rejecting winner: {WinnerId} by user {RejectedBy}, Reason: {Reason}",
                winnerId, rejectedByUserId, rejectionReason);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            winner.Reject(rejectedByUserId, rejectionReason);

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("🚫 WINNER REJECTED: {WinnerId} by user {RejectedBy} - Reason: {Reason}",
                winnerId, rejectedByUserId, rejectionReason);

            return await GetDetailedWinnerAsync(winnerId);
        }

        public async Task<AuctionWinnerDetailDto> CancelWinnerAsync(Guid winnerId, string? reason = null, Guid? cancelledByUserId = null)
        {
            _logger.LogInformation("🚫 Cancelling winner: {WinnerId}, Reason: {Reason}", winnerId, reason);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            winner.Cancel(reason, cancelledByUserId);

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("❌ WINNER CANCELLED: {WinnerId} - Reason: {Reason}", winnerId, reason);

            return await GetDetailedWinnerAsync(winnerId);
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetPendingConfirmationsBySellerAsync(Guid sellerId)
        {
            _logger.LogInformation("⏳ Getting pending confirmations for seller: {SellerId}", sellerId);

            var pendingWinners = await _auctionWinnerRepository.GetPendingConfirmationsBySellerAsync(sellerId);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(pendingWinners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} pending confirmations for seller: {SellerId}", dtos.Count(), sellerId);
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetRejectedWinnersBySellerAsync(Guid sellerId)
        {
            _logger.LogInformation("❌ Getting rejected winners by seller: {SellerId}", sellerId);

            var rejectedWinners = await _auctionWinnerRepository.GetRejectedWinnersBySellerAsync(sellerId);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(rejectedWinners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} rejected winners by seller: {SellerId}", dtos.Count(), sellerId);
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetSellerSalesAsync(Guid sellerId)
        {
            _logger.LogInformation("💰 Getting sales for seller: {SellerId}", sellerId);

            var sales = await _auctionWinnerRepository.GetSellerSalesAsync(sellerId);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(sales);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} sales for seller: {SellerId}", dtos.Count(), sellerId);
            return dtos;
        }

        #endregion

        #region Notification & Reminder Management

        public async Task<bool> SendPaymentReminderAsync(Guid winnerId)
        {
            _logger.LogInformation("📧 Sending payment reminder: {WinnerId}", winnerId);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            if (!winner.CanSendPaymentReminder())
            {
                _logger.LogInformation("⚠️ Payment reminder not eligible: {WinnerId}", winnerId);
                return false;
            }

            winner.RecordPaymentReminderSent();

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ PAYMENT REMINDER SENT: {WinnerId} - Count: {Count}",
                winnerId, winner.PaymentReminderCount);

            return true;
        }

        public async Task<int> SendBulkPaymentRemindersAsync(int daysBefore = 2)
        {
            _logger.LogInformation("📧 Sending bulk payment reminders: {DaysBefore} days before", daysBefore);

            var winnersForReminder = await _auctionWinnerRepository.GetWinnersForPaymentReminderAsync(daysBefore);
            int sentCount = 0;

            foreach (var winner in winnersForReminder)
            {
                if (winner.CanSendPaymentReminder())
                {
                    winner.RecordPaymentReminderSent();
                    await _auctionWinnerRepository.UpdateAsync(winner);
                    sentCount++;
                }
            }

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ BULK REMINDERS SENT: {SentCount}/{TotalCount}",
                sentCount, winnersForReminder.Count());

            return sentCount;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersForPaymentReminderAsync(int daysBefore = 2)
        {
            _logger.LogInformation("🔔 Getting winners for payment reminder: {DaysBefore} days", daysBefore);

            var winners = await _auctionWinnerRepository.GetWinnersForPaymentReminderAsync(daysBefore);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} winners for reminder", dtos.Count());
            return dtos;
        }

        public async Task RecordPaymentReminderSentAsync(Guid winnerId)
        {
            _logger.LogInformation("📝 Recording payment reminder sent: {WinnerId}", winnerId);

            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            winner.RecordPaymentReminderSent();

            await _auctionWinnerRepository.UpdateAsync(winner);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ Reminder recorded: {WinnerId} - Count: {Count}",
                winnerId, winner.PaymentReminderCount);
        }

        #endregion

        #region Business Analytics & Statistics

        public async Task<decimal> GetUserSuccessRateAsync(Guid userId)
        {
            _logger.LogInformation("📊 Calculating user success rate: {UserId}", userId);

            var successRate = await _auctionWinnerRepository.GetUserSuccessRateAsync(userId);

            _logger.LogInformation("✅ User success rate: {UserId} = {Rate}%", userId, successRate);
            return successRate;
        }

        public async Task<TimeSpan> GetUserAveragePaymentTimeAsync(Guid userId)
        {
            _logger.LogInformation("⏱️ Calculating user average payment time: {UserId}", userId);

            var averageTime = await _auctionWinnerRepository.GetUserAveragePaymentTimeAsync(userId);

            _logger.LogInformation("✅ User average payment time: {UserId} = {Days:F1} days",
                userId, averageTime.TotalDays);

            return averageTime;
        }

        public async Task<decimal> GetTotalSalesAmountAsync(Guid auctionId)
        {
            _logger.LogInformation("💰 Calculating total sales amount: {AuctionId}", auctionId);

            var totalAmount = await _auctionWinnerRepository.GetTotalSalesAmountAsync(auctionId);

            _logger.LogInformation("✅ Total sales amount: {AuctionId} = ${Amount:N2}", auctionId, totalAmount);
            return totalAmount;
        }

        public async Task<decimal> GetOverallCollectionRateAsync()
        {
            _logger.LogInformation("📈 Calculating overall collection rate");

            var collectionRate = await _auctionWinnerRepository.GetOverallCollectionRateAsync();

            _logger.LogInformation("✅ Overall collection rate: {Rate}%", collectionRate);
            return collectionRate;
        }

        public async Task<IEnumerable<TopBuyerDto>> GetTopBuyersAsync(int count = 10)
        {
            _logger.LogInformation("🏆 Getting top buyers: {Count}", count);

            var topBuyersData = await _auctionWinnerRepository.GetTopBuyersDataAsync(count);
            var topBuyers = _mapper.Map<IEnumerable<TopBuyerDto>>(topBuyersData);

            _logger.LogInformation("✅ Found {Count} top buyers", topBuyers.Count());
            return topBuyers;
        }

        public async Task<WinnerStatisticsDto> GetWinnerStatisticsAsync(Guid? auctionId = null, DateTime? fromDate = null, DateTime? toDate = null)
        {
            _logger.LogInformation("📊 Generating winner statistics: Auction {AuctionId}, From {From}, To {To}",
                auctionId, fromDate, toDate);

            var statisticsData = await _auctionWinnerRepository.GetWinnerStatisticsDataAsync(auctionId, fromDate, toDate);
            var statistics = _mapper.Map<WinnerStatisticsDto>(statisticsData);

            statistics.FromDate = fromDate ?? DateTime.MinValue;
            statistics.ToDate = toDate ?? DateTime.MaxValue;
            statistics.AuctionId = auctionId;

            _logger.LogInformation("✅ Statistics generated: {TotalWinners} winners, {CompletionRate:F1}% completion",
                statistics.TotalWinners, statistics.CompletionRate);

            return statistics;
        }

        #endregion

        #region Re-auction & Second Chance Management

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetCandidatesForReAuctionAsync()
        {
            _logger.LogInformation("🔄 Getting candidates for re-auction");

            var candidates = await _auctionWinnerRepository.GetCandidatesForReAuctionAsync();
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(candidates);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} re-auction candidates", dtos.Count());
            return dtos;
        }

        public async Task<AuctionWinnerDetailDto?> GetSecondChanceCandidateAsync(Guid auctionCarId)
        {
            _logger.LogInformation("🔍 Finding second chance candidate: {AuctionCarId}", auctionCarId);

            var candidate = await _auctionWinnerRepository.GetSecondChanceCandidateAsync(auctionCarId);
            if (candidate == null)
            {
                _logger.LogInformation("❌ No second chance candidate found: {AuctionCarId}", auctionCarId);
                return null;
            }

            var dto = _mapper.Map<AuctionWinnerDetailDto>(candidate);
            await EnrichWinnerDetailDto(dto);

            _logger.LogInformation("✅ Second chance candidate found: User {UserId}, Amount ${Amount}",
                candidate.UserId, candidate.Amount);

            return dto;
        }

        public async Task<bool> InitiateReAuctionAsync(Guid auctionCarId, string reason)
        {
            _logger.LogInformation("🔄 Initiating re-auction: {AuctionCarId}, Reason: {Reason}",
                auctionCarId, reason);

            var existingWinner = await _auctionWinnerRepository.GetByAuctionCarIdAsync(auctionCarId);
            if (existingWinner == null)
                throw new NotFoundException("AuctionWinner", auctionCarId);

            if (!existingWinner.IsEligibleForReAuction())
                throw new BadRequestException("Winner is not eligible for re-auction");

            var auctionCar = await _auctionCarRepository.GetByIdAsync(auctionCarId);
            if (auctionCar == null)
                throw new NotFoundException("AuctionCar", auctionCarId);

            existingWinner.Cancel($"Re-auction initiated: {reason}", null);
            auctionCar.WinnerStatus = AuctionWinnerStatus.Pending;

            await _auctionWinnerRepository.UpdateAsync(existingWinner);
            await _auctionCarRepository.UpdateAsync(auctionCar);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("✅ RE-AUCTION INITIATED: {AuctionCarId} - Previous winner cancelled",
                auctionCarId);

            return true;
        }

        public async Task<bool> IsEligibleForReAuctionAsync(Guid winnerId)
        {
            var winner = await _auctionWinnerRepository.GetByIdAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            return winner.IsEligibleForReAuction();
        }

        #endregion

        #region Search & Filter Operations

        public async Task<IEnumerable<AuctionWinnerGetDto>> SearchWinnersAsync(WinnerSearchCriteriaDto criteria)
        {
            _logger.LogInformation("🔍 Searching winners with criteria: Page {Page}, Size {PageSize}",
                criteria.Page, criteria.PageSize);

            var domainCriteria = _mapper.Map<WinnerSearchCriteria>(criteria);
            var winners = await _auctionWinnerRepository.SearchWinnersAsync(domainCriteria);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} winners matching criteria", dtos.Count());
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetWinnersByAmountRangeAsync(decimal minAmount, decimal maxAmount)
        {
            _logger.LogInformation("💲 Getting winners by amount range: ${Min:N2} - ${Max:N2}", minAmount, maxAmount);

            var winners = await _auctionWinnerRepository.GetWinnersByAmountRangeAsync(minAmount, maxAmount);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} winners in amount range", dtos.Count());
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetPaidWinnersInPeriodAsync(DateTime fromDate, DateTime toDate)
        {
            _logger.LogInformation("📅 Getting paid winners in period: {From:yyyy-MM-dd} to {To:yyyy-MM-dd}", fromDate, toDate);

            var winners = await _auctionWinnerRepository.GetPaidWinnersInPeriodAsync(fromDate, toDate);
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} paid winners in period", dtos.Count());
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetPartiallyPaidWinnersAsync()
        {
            _logger.LogInformation("💸 Getting partially paid winners");

            var winners = await _auctionWinnerRepository.GetPartiallyPaidWinnersAsync();
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} partially paid winners", dtos.Count());
            return dtos;
        }

        public async Task<IEnumerable<AuctionWinnerGetDto>> GetFailedPaymentWinnersAsync()
        {
            _logger.LogInformation("❌ Getting failed payment winners");

            var winners = await _auctionWinnerRepository.GetFailedPaymentWinnersAsync();
            var dtos = _mapper.Map<IEnumerable<AuctionWinnerGetDto>>(winners);

            foreach (var dto in dtos)
            {
                await EnrichWinnerGetDto(dto);
            }

            _logger.LogInformation("✅ Found {Count} failed payment winners", dtos.Count());
            return dtos;
        }

        #endregion

        #region Bulk Operations & Maintenance

        public async Task<int> MarkOverduePaymentsAsync()
        {
            _logger.LogInformation("⚠️ Marking overdue payments");

            var markedCount = await _auctionWinnerRepository.MarkOverduePaymentsAsync();

            _logger.LogInformation("✅ OVERDUE PAYMENTS MARKED: {Count} winners", markedCount);
            return markedCount;
        }

        public async Task<int> ArchiveCompletedWinnersAsync(DateTime cutoffDate)
        {
            _logger.LogInformation("📦 Archiving completed winners before: {CutoffDate:yyyy-MM-dd}", cutoffDate);

            var archivedCount = await _auctionWinnerRepository.ArchiveCompletedWinnersAsync(cutoffDate);

            _logger.LogInformation("✅ WINNERS ARCHIVED: {Count} completed winners", archivedCount);
            return archivedCount;
        }

        public async Task<WinnerIntegrityReportDto> ValidateWinnerDataIntegrityAsync()
        {
            _logger.LogInformation("🔍 Validating winner data integrity");

            var report = new WinnerIntegrityReportDto
            {
                GeneratedAt = DateTime.UtcNow,
                GeneratedByUserId = Guid.Parse("9f8bbe66-5499-4790-8e3e-011a4cbda67d") // ravanmu-coder
            };

            var allWinners = await _auctionWinnerRepository.GetAllAsync();
            report.TotalWinnersChecked = allWinners.Count();

            foreach (var winner in allWinners)
            {
                if (winner.Amount <= 0)
                {
                    report.Issues.Add(new WinnerIntegrityReportDto.IntegrityIssue
                    {
                        WinnerId = winner.Id,
                        IssueType = "InvalidAmount",
                        Description = "Winner amount is zero or negative",
                        Severity = "High",
                        RecommendedAction = "Review and correct winner amount"
                    });
                    report.InvalidAmounts++;
                }

                if (winner.PaidAmount.HasValue && winner.PaidAmount.Value > winner.Amount)
                {
                    report.Issues.Add(new WinnerIntegrityReportDto.IntegrityIssue
                    {
                        WinnerId = winner.Id,
                        IssueType = "PaymentAmountMismatch",
                        Description = "Paid amount exceeds winner amount",
                        Severity = "Critical",
                        RecommendedAction = "Review payment records"
                    });
                    report.PaymentAmountMismatches++;
                }
            }

            report.IssuesFound = report.Issues.Count;
            report.HasCriticalIssues = report.Issues.Any(i => i.Severity == "Critical");

            _logger.LogInformation("✅ INTEGRITY REPORT GENERATED: {IssuesFound} issues found, {CriticalIssues} critical",
                report.IssuesFound, report.HasCriticalIssues);

            return report;
        }

        #endregion

        #region Private Helper Methods

        private async Task<AuctionWinnerDetailDto> GetDetailedWinnerAsync(Guid winnerId)
        {
            var winner = await _auctionWinnerRepository.GetWinnerWithFullDetailsAsync(winnerId);
            if (winner == null)
                throw new NotFoundException("AuctionWinner", winnerId);

            var dto = _mapper.Map<AuctionWinnerDetailDto>(winner);
            await EnrichWinnerDetailDto(dto);
            return dto;
        }

        private async Task EnrichWinnerDetailDto(AuctionWinnerDetailDto dto)
        {
            // Calculate time-based fields
            dto.TimeSinceAssigned = DateTime.UtcNow - dto.AssignedAt;
            if (dto.PaymentDueDate.HasValue)
            {
                dto.TimeToPaymentDue = dto.PaymentDueDate.Value - DateTime.UtcNow;
                dto.IsOverdue = DateTime.UtcNow > dto.PaymentDueDate.Value;
                dto.DaysOverdue = dto.IsOverdue ? (DateTime.UtcNow - dto.PaymentDueDate.Value).Days : 0;
            }

            if (dto.WinnerConfirmedAt.HasValue)
            {
                dto.TimeSinceConfirmed = DateTime.UtcNow - dto.WinnerConfirmedAt.Value;
            }

            // Set action flags based on current state
            dto.RequiresConfirmation = !dto.WinnerConfirmedAt.HasValue && dto.PaymentStatus != "Cancelled";
            dto.RequiresPayment = dto.PaymentStatus == "Pending" || dto.PaymentStatus == "PartiallyPaid";
            dto.IsReadyForDelivery = dto.IsFullyPaid && dto.WinnerConfirmedAt.HasValue;
            dto.IsCompleted = dto.PaymentStatus == "Paid";

            // Set action capabilities
            dto.CanConfirm = dto.RequiresConfirmation;
            dto.CanReject = dto.RequiresConfirmation;
            dto.CanMakePayment = dto.RequiresPayment;
            dto.CanCancel = dto.PaymentStatus != "Paid" && dto.PaymentStatus != "Cancelled";
          //  dto.CanSendReminder = dto.RequiresPayment && !dto.IsOverdue;
            //dto.CanExtendPaymentDue = dto.RequiresPayment;




            
            await Task.CompletedTask;
        }

        private async Task EnrichWinnerGetDto(AuctionWinnerGetDto dto)
        {
            // Calculate time-based display fields
            var timeSpan = DateTime.UtcNow - dto.AssignedAt;
            dto.TimeAgo = timeSpan.TotalDays switch
            {
                < 1 => $"{(int)timeSpan.TotalHours} saat əvvəl",
                < 7 => $"{(int)timeSpan.TotalDays} gün əvvəl",
                < 30 => $"{(int)timeSpan.TotalDays} gün əvvəl",
                _ => dto.AssignedAt.ToString("dd.MM.yyyy")
            };

            if (dto.PaymentDueDate.HasValue)
            {
                var daysUntilDue = (dto.PaymentDueDate.Value - DateTime.UtcNow).Days;
                dto.DaysUntilDue = daysUntilDue;
                dto.PaymentDueStatus = daysUntilDue switch
                {
                    < 0 => $"{Math.Abs(daysUntilDue)} gün gecikmiş",
                    0 => "Bu gün",
                    1 => "Sabah",
                    <= 3 => $"{daysUntilDue} gün qalıb",
                    _ => $"{daysUntilDue} gün qalıb"
                };
            }

            // Set UI-specific fields
            dto.StatusColor = dto.PaymentStatus switch
            {
                "Paid" => "success",
                "Pending" => "warning",
                "PartiallyPaid" => "info",
                "Cancelled" => "danger",
                "Failed" => "danger",
                _ => "secondary"
            };

            dto.StatusIcon = dto.PaymentStatus switch
            {
                "Paid" => "fas fa-check-circle",
                "Pending" => "fas fa-clock",
                "PartiallyPaid" => "fas fa-chart-pie",
                "Cancelled" => "fas fa-times-circle",
                "Failed" => "fas fa-exclamation-triangle",
                _ => "fas fa-question-circle"
            };

            dto.RemainingAmount = dto.Amount - (dto.PaidAmount ?? 0);
            dto.RequiresAction = dto.IsOverdue || (dto.PaymentStatus == "Pending" && dto.DaysUntilDue <= 3);
            dto.RequiredAction = dto.IsOverdue ? "Gecikmiş ödəniş" :
                                dto.PaymentStatus == "Pending" ? "Ödəniş et"
                                : "Yoxdur";

            dto.CanSendReminder = dto.PaymentStatus is "Pending" or "PartiallyPaid";
            dto.CanOfferSecondChance = dto.IsOverdue && dto.PaymentStatus == "Pending";

            await Task.CompletedTask;
        }

        #endregion
    }
}
