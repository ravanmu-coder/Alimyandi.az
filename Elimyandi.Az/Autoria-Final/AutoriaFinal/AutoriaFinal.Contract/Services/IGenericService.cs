using AutoriaFinal.Domain.Entities.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Services
{
    public interface IGenericService<TEntity, TGetDto, TDetailDto, TCreateDto, TUpdateDto>
     where TEntity : BaseEntity, new()
     where TGetDto : class
     where TDetailDto : class
     where TCreateDto : class
     where TUpdateDto : class
    {
        Task<IEnumerable<TGetDto>> GetAllAsync();
        Task<TDetailDto> GetByIdAsync(Guid id);
        Task<TDetailDto> AddAsync(TCreateDto dto);
        Task<TDetailDto> UpdateAsync( Guid id, TUpdateDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
