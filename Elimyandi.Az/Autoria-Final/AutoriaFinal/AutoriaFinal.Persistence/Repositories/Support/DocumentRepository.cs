using AutoriaFinal.Domain.Entities.Support;
using AutoriaFinal.Domain.Repositories.Support;
using AutoriaFinal.Persistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Persistence.Repositories.Support
{
    public class DocumentRepository : GenericRepository<Document>, IDocumentRepository
    {
        public DocumentRepository(AppDbContext context) : base(context)
        {
        }
    }
}
