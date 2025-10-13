using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoriaFinal.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedAuction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 5, 13, 35, 26, 624, DateTimeKind.Utc).AddTicks(7780),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 9, 30, 18, 24, 36, 262, DateTimeKind.Utc).AddTicks(2163));

            migrationBuilder.AddColumn<bool>(
                name: "AutoStart",
                table: "Auctions",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "CarsWithPreBidsCount",
                table: "Auctions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PreBidEndTimeUtc",
                table: "Auctions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PreBidStartTimeUtc",
                table: "Auctions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalCarsCount",
                table: "Auctions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Auctions_AutoStart",
                table: "Auctions",
                column: "AutoStart");

            migrationBuilder.CreateIndex(
                name: "IX_Auctions_PreBidStartTimeUtc",
                table: "Auctions",
                column: "PreBidStartTimeUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Auctions_Status_AutoStart",
                table: "Auctions",
                columns: new[] { "Status", "AutoStart" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Auctions_AutoStart",
                table: "Auctions");

            migrationBuilder.DropIndex(
                name: "IX_Auctions_PreBidStartTimeUtc",
                table: "Auctions");

            migrationBuilder.DropIndex(
                name: "IX_Auctions_Status_AutoStart",
                table: "Auctions");

            migrationBuilder.DropColumn(
                name: "AutoStart",
                table: "Auctions");

            migrationBuilder.DropColumn(
                name: "CarsWithPreBidsCount",
                table: "Auctions");

            migrationBuilder.DropColumn(
                name: "PreBidEndTimeUtc",
                table: "Auctions");

            migrationBuilder.DropColumn(
                name: "PreBidStartTimeUtc",
                table: "Auctions");

            migrationBuilder.DropColumn(
                name: "TotalCarsCount",
                table: "Auctions");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 30, 18, 24, 36, 262, DateTimeKind.Utc).AddTicks(2163),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 10, 5, 13, 35, 26, 624, DateTimeKind.Utc).AddTicks(7780));
        }
    }
}
