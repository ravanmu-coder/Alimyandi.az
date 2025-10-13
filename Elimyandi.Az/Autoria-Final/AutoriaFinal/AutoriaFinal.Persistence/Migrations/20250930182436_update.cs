using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoriaFinal.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class update : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 30, 18, 24, 36, 262, DateTimeKind.Utc).AddTicks(2163),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 9, 26, 18, 48, 50, 762, DateTimeKind.Utc).AddTicks(1485));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 26, 18, 48, 50, 762, DateTimeKind.Utc).AddTicks(1485),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 9, 30, 18, 24, 36, 262, DateTimeKind.Utc).AddTicks(2163));
        }
    }
}
