using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Branches;
using RentCarServer.Domain.Categories;
using RentCarServer.Domain.Vehicles;

namespace RentCarServer.Application.Vehicles;

public sealed class VehicleDto : EntityDto
{
    public string Brand { get; set; } = default!;
    public string Model { get; set; } = default!;
    public int ModelYear { get; set; }
    public string Color { get; set; } = default!;
    public string Plate { get; set; } = default!;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = default!;
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public string VinNumber { get; set; } = default!;
    public string EngineNumber { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string ImageUrl { get; set; } = default!;
    public string FuelType { get; set; } = default!;
    public string Transmission { get; set; } = default!;
    public decimal EngineVolume { get; set; }
    public int EnginePower { get; set; }
    public string TractionType { get; set; } = default!;
    public decimal FuelConsumption { get; set; }
    public int SeatCount { get; set; }
    public int Kilometer { get; set; }
    public decimal DailyPrice { get; set; }
    public decimal WeeklyDiscountRate { get; set; }
    public decimal MonthlyDiscountRate { get; set; }
    public string InsuranceType { get; set; } = default!;
    public DateOnly LastMaintenanceDate { get; set; }
    public int LastMaintenanceKm { get; set; }
    public int NextMaintenanceKm { get; set; }
    public DateOnly InspectionDate { get; set; }
    public DateOnly InsuranceEndDate { get; set; }
    public DateOnly? CascoEndDate { get; set; }
    public string TireStatus { get; set; } = default!;
    public string GeneralStatus { get; set; } = default!;
    public List<string> Features { get; set; } = new();
}

public static class VehicleExtensions
{
    public static IQueryable<VehicleDto> MapTo(
        this IQueryable<Vehicle> entities,
        IQueryable<Branch> branches,
        IQueryable<Category> categories
        )
    {
        return entities
        .Join(branches, m => m.BranchId.Value, m => m.Id, (vehicle, branch) => new { Vehicle = vehicle, Branch = branch })
        .Join(categories, m => m.Vehicle.CategoryId.Value, m => m.Id, (r, category) => new { r.Vehicle, r.Branch, Category = category })
            .Select(s => new VehicleDto
            {
                Id = s.Vehicle.Id,
                Brand = s.Vehicle.Brand.Value,
                Model = s.Vehicle.Model.Value,
                ModelYear = s.Vehicle.ModelYear.Value,
                Color = s.Vehicle.Color.Value,
                Plate = s.Vehicle.Plate.Value,
                CategoryId = s.Vehicle.CategoryId,
                CategoryName = s.Category.Name.Value,
                BranchId = s.Vehicle.BranchId,
                BranchName = s.Branch.Name.Value,
                VinNumber = s.Vehicle.VinNumber.Value,
                EngineNumber = s.Vehicle.EngineNumber.Value,
                Description = s.Vehicle.Description.Value,
                ImageUrl = s.Vehicle.ImageUrl.Value,
                FuelType = s.Vehicle.FuelType.Value,
                Transmission = s.Vehicle.Transmission.Value,
                EngineVolume = s.Vehicle.EngineVolume.Value,
                EnginePower = s.Vehicle.EnginePower.Value,
                TractionType = s.Vehicle.TractionType.Value,
                FuelConsumption = s.Vehicle.FuelConsumption.Value,
                SeatCount = s.Vehicle.SeatCount.Value,
                Kilometer = s.Vehicle.Kilometer.Value,
                DailyPrice = s.Vehicle.DailyPrice.Value,
                WeeklyDiscountRate = s.Vehicle.WeeklyDiscountRate.Value,
                MonthlyDiscountRate = s.Vehicle.MonthlyDiscountRate.Value,
                InsuranceType = s.Vehicle.InsuranceType.Value,
                LastMaintenanceDate = s.Vehicle.LastMaintenanceDate.Value,
                LastMaintenanceKm = s.Vehicle.LastMaintenanceKm.Value,
                NextMaintenanceKm = s.Vehicle.NextMaintenanceKm.Value,
                InspectionDate = s.Vehicle.InspectionDate.Value,
                InsuranceEndDate = s.Vehicle.InsuranceEndDate.Value,
                CascoEndDate = s.Vehicle.CascoEndDate != null ? s.Vehicle.CascoEndDate.Value : null,
                TireStatus = s.Vehicle.TireStatus.Value,
                GeneralStatus = s.Vehicle.GeneralStatus.Value,
                Features = s.Vehicle.Features.Select(f => f.Value).ToList(),
                IsActive = s.Vehicle.IsActive,
                CreatedAt = s.Vehicle.CreatedAt,
                CreatedBy = s.Vehicle.CreatedBy,
                CreatedFullName = string.Empty,
                UpdatedAt = s.Vehicle.UpdatedAt,
                UpdatedBy = s.Vehicle.UpdatedBy != null ? s.Vehicle.UpdatedBy.Value : null,
                UpdatedFullName = null,
            });
    }

    public static IQueryable<VehicleDto> MapTo(
        this IQueryable<EntityWithAuditDto<Vehicle>> entities,
        IQueryable<Branch> branches,
        IQueryable<Category> categories
        )
    {
        return entities
        .Join(branches, m => m.Entity.BranchId.Value, m => m.Id, (r, branch) => new { r.Entity, r.CreatedUser, r.UpdatedUser, Branch = branch })
        .Join(categories, m => m.Entity.CategoryId.Value, m => m.Id, (r, category) => new { r.Entity, r.CreatedUser, r.UpdatedUser, r.Branch, Category = category })
            .Select(s => new VehicleDto
            {
                Id = s.Entity.Id,
                Brand = s.Entity.Brand.Value,
                Model = s.Entity.Model.Value,
                ModelYear = s.Entity.ModelYear.Value,
                Color = s.Entity.Color.Value,
                Plate = s.Entity.Plate.Value,
                CategoryId = s.Entity.CategoryId,
                CategoryName = s.Category.Name.Value,
                BranchId = s.Entity.BranchId,
                BranchName = s.Branch.Name.Value,
                VinNumber = s.Entity.VinNumber.Value,
                EngineNumber = s.Entity.EngineNumber.Value,
                Description = s.Entity.Description.Value,
                ImageUrl = s.Entity.ImageUrl.Value,
                FuelType = s.Entity.FuelType.Value,
                Transmission = s.Entity.Transmission.Value,
                EngineVolume = s.Entity.EngineVolume.Value,
                EnginePower = s.Entity.EnginePower.Value,
                TractionType = s.Entity.TractionType.Value,
                FuelConsumption = s.Entity.FuelConsumption.Value,
                SeatCount = s.Entity.SeatCount.Value,
                Kilometer = s.Entity.Kilometer.Value,
                DailyPrice = s.Entity.DailyPrice.Value,
                WeeklyDiscountRate = s.Entity.WeeklyDiscountRate.Value,
                MonthlyDiscountRate = s.Entity.MonthlyDiscountRate.Value,
                InsuranceType = s.Entity.InsuranceType.Value,
                LastMaintenanceDate = s.Entity.LastMaintenanceDate.Value,
                LastMaintenanceKm = s.Entity.LastMaintenanceKm.Value,
                NextMaintenanceKm = s.Entity.NextMaintenanceKm.Value,
                InspectionDate = s.Entity.InspectionDate.Value,
                InsuranceEndDate = s.Entity.InsuranceEndDate.Value,
                CascoEndDate = s.Entity.CascoEndDate != null ? s.Entity.CascoEndDate.Value : null,
                TireStatus = s.Entity.TireStatus.Value,
                GeneralStatus = s.Entity.GeneralStatus.Value,
                Features = s.Entity.Features.Select(f => f.Value).ToList(),
                IsActive = s.Entity.IsActive,
                CreatedAt = s.Entity.CreatedAt,
                CreatedBy = s.Entity.CreatedBy,
                CreatedFullName = s.CreatedUser.FullName.Value,
                UpdatedAt = s.Entity.UpdatedAt,
                UpdatedBy = s.Entity.UpdatedBy != null ? s.Entity.UpdatedBy.Value : null,
                UpdatedFullName = s.UpdatedUser != null ? s.UpdatedUser.FullName.Value : null,
            });
    }
}
