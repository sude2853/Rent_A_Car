using RentCarServer.Domain.Branches;
using RentCarServer.Domain.Categories;
using RentCarServer.Domain.Vehicles;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Vehicles;

public sealed record VehiclePublicGetAllQuery : IRequest<Result<List<VehicleDto>>>;

internal sealed class VehiclePublicGetAllQueryHandler(
    IVehicleRepository vehicleRepository,
    IBranchRepository branchRepository,
    ICategoryRepository categoryRepository) : IRequestHandler<VehiclePublicGetAllQuery, Result<List<VehicleDto>>>
{
    public Task<Result<List<VehicleDto>>> Handle(VehiclePublicGetAllQuery request, CancellationToken cancellationToken)
    {
        var vehicles = vehicleRepository
            .GetAll()
            .Join(branchRepository.GetAll(), vehicle => vehicle.BranchId.Value, branch => branch.Id, (vehicle, branch) => new { Vehicle = vehicle, Branch = branch })
            .Join(categoryRepository.GetAll(), vehicle => vehicle.Vehicle.CategoryId.Value, category => category.Id, (vehicle, category) => new { vehicle.Vehicle, vehicle.Branch, Category = category })
            .Where(vehicle => vehicle.Vehicle.IsActive)
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
                Features = s.Vehicle.Features.Select(feature => feature.Value).ToList(),
                IsActive = s.Vehicle.IsActive,
                CreatedAt = s.Vehicle.CreatedAt,
                CreatedBy = s.Vehicle.CreatedBy,
                CreatedFullName = string.Empty,
                UpdatedAt = s.Vehicle.UpdatedAt,
                UpdatedBy = s.Vehicle.UpdatedBy != null ? s.Vehicle.UpdatedBy.Value : null,
                UpdatedFullName = null
            })
            .ToList();

        return Task.FromResult(Result<List<VehicleDto>>.Succeed(vehicles));
    }
}
