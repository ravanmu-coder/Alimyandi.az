using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoriaFinal.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class updateAuctioncar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuctionCars_Cars_CarId",
                table: "AuctionCars");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCars_LastBidTime",
                table: "AuctionCars",
                newName: "IX_AuctionCar_LastBidTime");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCars_IsActive",
                table: "AuctionCars",
                newName: "IX_AuctionCar_IsActive");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCars_AuctionId_LotNumber",
                table: "AuctionCars",
                newName: "IX_AuctionCar_AuctionId_LotNumber");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCars_AuctionId_CarId",
                table: "AuctionCars",
                newName: "IX_AuctionCar_AuctionId_CarId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 5, 21, 20, 15, 676, DateTimeKind.Utc).AddTicks(1682),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 10, 5, 13, 35, 26, 624, DateTimeKind.Utc).AddTicks(7780));

            migrationBuilder.AlterColumn<int>(
                name: "WinnerStatus",
                table: "AuctionCars",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "AuctionCondition",
                table: "AuctionCars",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "BuyersPremium",
                table: "AuctionCars",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DepositPaidAt",
                table: "AuctionCars",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LaneNumber",
                table: "AuctionCars",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentDueDate",
                table: "AuctionCars",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreBidCount",
                table: "AuctionCars",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresSellerApproval",
                table: "AuctionCars",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "RunOrder",
                table: "AuctionCars",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledTime",
                table: "AuctionCars",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SellerNotes",
                table: "AuctionCars",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StartPrice",
                table: "AuctionCars",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPrice",
                table: "AuctionCars",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnsoldReason",
                table: "AuctionCars",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "WinnerNotifiedAt",
                table: "AuctionCars",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuctionCar_AuctionCondition",
                table: "AuctionCars",
                column: "AuctionCondition");

            migrationBuilder.CreateIndex(
                name: "IX_AuctionCar_Lane_RunOrder",
                table: "AuctionCars",
                columns: new[] { "LaneNumber", "RunOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_AuctionCar_PaymentDueDate",
                table: "AuctionCars",
                column: "PaymentDueDate");

            migrationBuilder.CreateIndex(
                name: "IX_AuctionCar_WinnerStatus",
                table: "AuctionCars",
                column: "WinnerStatus");

            migrationBuilder.AddForeignKey(
                name: "FK_AuctionCars_Cars_CarId",
                table: "AuctionCars",
                column: "CarId",
                principalTable: "Cars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuctionCars_Cars_CarId",
                table: "AuctionCars");

            migrationBuilder.DropIndex(
                name: "IX_AuctionCar_AuctionCondition",
                table: "AuctionCars");

            migrationBuilder.DropIndex(
                name: "IX_AuctionCar_Lane_RunOrder",
                table: "AuctionCars");

            migrationBuilder.DropIndex(
                name: "IX_AuctionCar_PaymentDueDate",
                table: "AuctionCars");

            migrationBuilder.DropIndex(
                name: "IX_AuctionCar_WinnerStatus",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "AuctionCondition",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "BuyersPremium",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "DepositPaidAt",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "LaneNumber",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "PaymentDueDate",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "PreBidCount",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "RequiresSellerApproval",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "RunOrder",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "ScheduledTime",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "SellerNotes",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "StartPrice",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "TotalPrice",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "UnsoldReason",
                table: "AuctionCars");

            migrationBuilder.DropColumn(
                name: "WinnerNotifiedAt",
                table: "AuctionCars");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCar_LastBidTime",
                table: "AuctionCars",
                newName: "IX_AuctionCars_LastBidTime");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCar_IsActive",
                table: "AuctionCars",
                newName: "IX_AuctionCars_IsActive");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCar_AuctionId_LotNumber",
                table: "AuctionCars",
                newName: "IX_AuctionCars_AuctionId_LotNumber");

            migrationBuilder.RenameIndex(
                name: "IX_AuctionCar_AuctionId_CarId",
                table: "AuctionCars",
                newName: "IX_AuctionCars_AuctionId_CarId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 5, 13, 35, 26, 624, DateTimeKind.Utc).AddTicks(7780),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 10, 5, 21, 20, 15, 676, DateTimeKind.Utc).AddTicks(1682));

            migrationBuilder.AlterColumn<int>(
                name: "WinnerStatus",
                table: "AuctionCars",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_AuctionCars_Cars_CarId",
                table: "AuctionCars",
                column: "CarId",
                principalTable: "Cars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
