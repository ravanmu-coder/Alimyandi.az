using AutoMapper;
using AutoriaFinal.Application.Exceptions;
using AutoriaFinal.Contract.Services;
using AutoriaFinal.Domain.Entities.Abstractions;
using AutoriaFinal.Domain.Repositories;
using AutoriaFinal.Domain.Repositories.Auctions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Application.Services
{
    public class GenericService<TEntity, TGetDto, TDetailDto, TCreateDto, TUpdateDto>
    : IGenericService<TEntity, TGetDto, TDetailDto, TCreateDto, TUpdateDto>
    where TEntity : BaseEntity, new()
    where TGetDto : class, new()
    where TDetailDto : class, new()
    where TCreateDto : class, new()
    where TUpdateDto : class, new()
    {
        protected readonly IGenericRepository<TEntity> _repository;
        protected readonly IUnitOfWork _unitOfWork;
        protected readonly IMapper _mapper;
        protected readonly ILogger<GenericService<TEntity,TGetDto,TDetailDto,TCreateDto,TUpdateDto>> _logger;
        public GenericService(
            IGenericRepository<TEntity> repository,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            ILogger<GenericService<TEntity, TGetDto, TDetailDto, TCreateDto, TUpdateDto>> logger)
        {
            _repository = repository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<IEnumerable<TGetDto>> GetAllAsync()
        {
            _logger.LogInformation("Fetching all {EntityName} records", typeof(TEntity).Name);

            var entities = await _repository.GetAllAsync();
            var activeEntities = entities.Where(e => !e.IsDeleted);

            _logger.LogInformation("Retrieved {Count} {EntityName} records", activeEntities.Count(), typeof(TEntity).Name);
            return _mapper.Map<IEnumerable<TGetDto>>(activeEntities);
        }

        public async Task<TDetailDto> GetByIdAsync(Guid id)
        {
            _logger.LogInformation("Fetching {EntityName} with ID {Id}", typeof(TEntity).Name, id);

            var entity = await _repository.GetByIdAsync(id);
            if (entity is null)
            {
                _logger.LogWarning("{EntityName} with ID {Id} not found", typeof(TEntity).Name, id);
                throw new BadRequestException($"{typeof(TEntity).Name} with ID {id} not found");
            }

            _logger.LogInformation("{EntityName} with ID {Id} retrieved successfully", typeof(TEntity).Name, id);
            return _mapper.Map<TDetailDto>(entity);
        }

        public virtual async Task<TDetailDto> AddAsync(TCreateDto dto)
        {
            _logger.LogInformation("Adding new {EntityName}", typeof(TEntity).Name);

            if (dto is null)
            {
                _logger.LogWarning("Failed to add {EntityName}: DTO is null", typeof(TEntity).Name);
                throw new BadRequestException("Input data cannot be null.");
            }

            var entity = _mapper.Map<TEntity>(dto);
            await _repository.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("{EntityName} with ID {Id} added successfully", typeof(TEntity).Name, entity.Id);
            return _mapper.Map<TDetailDto>(entity);
        }

        public virtual async Task<TDetailDto> UpdateAsync(Guid id, TUpdateDto dto)
        {
            _logger.LogInformation("Updating {EntityName} with ID {Id}", typeof(TEntity).Name, id);

            if (dto is null)
            {
                _logger.LogWarning("Failed to update {EntityName}: DTO is null", typeof(TEntity).Name);
                throw new BadRequestException("Update DTO cannot be null");
            }

            var existing = await _repository.GetByIdAsync(id);
            if (existing is null)
            {
                _logger.LogWarning("{EntityName} with ID {Id} not found for update", typeof(TEntity).Name, id);
                throw new BadRequestException($"{typeof(TEntity).Name} with ID {id} not found");
            }

            _mapper.Map(dto, existing);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("{EntityName} with ID {Id} updated successfully", typeof(TEntity).Name, id);
            return _mapper.Map<TDetailDto>(existing);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            _logger.LogInformation("Deleting {EntityName} with ID {Id}", typeof(TEntity).Name, id);

            var existing = await _repository.GetByIdAsync(id);
            if (existing is null)
            {
                _logger.LogWarning("{EntityName} with ID {Id} not found for deletion", typeof(TEntity).Name, id);
                throw new BadRequestException($"{typeof(TEntity).Name} with ID {id} not found");
            }

            existing.MarkDeleted();
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("{EntityName} with ID {Id} deleted successfully", typeof(TEntity).Name, id);
            return true;
        }


    }

}