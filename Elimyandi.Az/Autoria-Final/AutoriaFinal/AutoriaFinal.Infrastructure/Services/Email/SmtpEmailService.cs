using AutoriaFinal.Contract.Services.Email;
using AutoriaFinal.Domain.Entities.Identity;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Infrastructure.Services.Email
{
    public class SmtpEmailService : IEmailService
    {
        private readonly EmailSettings _opts;
        public SmtpEmailService(IOptions<EmailSettings> opts)
        {
            _opts = opts.Value;

        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            using var message = new MailMessage(_opts.From, to, subject, body)
            {
                IsBodyHtml = true
            };
            using var client = new SmtpClient(_opts.SmtpHost, _opts.SmtpPort)
            {
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_opts.SmtpUser, _opts.SmtpPass),
                EnableSsl = _opts.EnableSsl
            };
            await client.SendMailAsync(message);
        }
    }
}
