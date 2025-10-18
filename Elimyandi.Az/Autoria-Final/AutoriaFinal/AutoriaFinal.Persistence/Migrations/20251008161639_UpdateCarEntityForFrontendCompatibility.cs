using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoriaFinal.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCarEntityForFrontendCompatibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Odometer",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "OdometerUnit",
                table: "Cars");

            migrationBuilder.RenameColumn(
                name: "PrimaryDamage",
                table: "Cars",
                newName: "DamageType");

            migrationBuilder.RenameColumn(
                name: "Fuel",
                table: "Cars",
                newName: "FuelType");

            migrationBuilder.RenameColumn(
                name: "Condition",
                table: "Cars",
                newName: "CarCondition");
            
            migrationBuilder.AddColumn<int>(
                name: "Mileage",
                table: "Cars",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "VideoUrls",
                table: "Cars",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<int>(
                name: "SecondaryDamage",
                table: "Cars",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "PhotoUrls",
                table: "Cars",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<bool>(
                name: "HasKeys",
                table: "Cars",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<int>(
                name: "CarCondition",
                table: "Cars",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Cars",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "AZN");

            migrationBuilder.AddColumn<string>(
                name: "MileageUnit",
                table: "Cars",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "km");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Cars",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 8, 16, 16, 39, 106, DateTimeKind.Utc).AddTicks(1680),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 10, 5, 22, 15, 44, 935, DateTimeKind.Utc).AddTicks(1287));

            migrationBuilder.CreateIndex(
                name: "IX_Cars_CarCondition",
                table: "Cars",
                column: "CarCondition");

            migrationBuilder.CreateIndex(
                name: "IX_Cars_FuelType",
                table: "Cars",
                column: "FuelType");

            migrationBuilder.CreateIndex(
                name: "IX_Cars_Make_Model",
                table: "Cars",
                columns: new[] { "Make", "Model" });

            migrationBuilder.CreateIndex(
                name: "IX_Cars_Price",
                table: "Cars",
                column: "Price");

            migrationBuilder.CreateIndex(
                name: "IX_Cars_Year",
                table: "Cars",
                column: "Year");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Cars_CarCondition",
                table: "Cars");

            migrationBuilder.DropIndex(
                name: "IX_Cars_FuelType",
                table: "Cars");

            migrationBuilder.DropIndex(
                name: "IX_Cars_Make_Model",
                table: "Cars");

            migrationBuilder.DropIndex(
                name: "IX_Cars_Price",
                table: "Cars");

            migrationBuilder.DropIndex(
                name: "IX_Cars_Year",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "CarCondition",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "MileageUnit",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Cars");

            migrationBuilder.RenameColumn(
                name: "Mileage",
                table: "Cars",
                newName: "PrimaryDamage");

            migrationBuilder.RenameColumn(
                name: "FuelType",
                table: "Cars",
                newName: "Fuel");

            migrationBuilder.RenameColumn(
                name: "DamageType",
                table: "Cars",
                newName: "Condition");

            migrationBuilder.AlterColumn<string>(
                name: "VideoUrls",
                table: "Cars",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000,
                oldDefaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "SecondaryDamage",
                table: "Cars",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhotoUrls",
                table: "Cars",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000,
                oldDefaultValue: "");

            migrationBuilder.AlterColumn<bool>(
                name: "HasKeys",
                table: "Cars",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Odometer",
                table: "Cars",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OdometerUnit",
                table: "Cars",
                type: "nvarchar(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "AuctionWinners",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 5, 22, 15, 44, 935, DateTimeKind.Utc).AddTicks(1287),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValue: new DateTime(2025, 10, 8, 16, 16, 39, 106, DateTimeKind.Utc).AddTicks(1680));
        }
    }
}
