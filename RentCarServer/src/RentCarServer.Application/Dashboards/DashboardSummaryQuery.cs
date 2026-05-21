using Microsoft.EntityFrameworkCore;
using RentCarServer.Application.Services;
using RentCarServer.Domain.Customers;
using RentCarServer.Domain.Reservations;
using RentCarServer.Domain.Reservations.ValueObjects;
using RentCarServer.Domain.Vehicles;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Dashboards;

public sealed record DashboardSummaryQuery : IRequest<Result<DashboardSummaryDto>>;

public sealed class DashboardSummaryDto
{
    public int ActiveReservationCount { get; set; }
    public int VehicleCount { get; set; }
    public int CustomerCount { get; set; }
    public decimal CurrentMonthIncome { get; set; }
    public List<DashboardChartItemDto> LastSevenDaysIncome { get; set; } = new();
    public List<DashboardChartItemDto> LastSevenDaysReservation { get; set; } = new();
}

public sealed class DashboardChartItemDto
{
    public string Date { get; set; } = default!;
    public decimal Total { get; set; }
}

internal sealed class DashboardSummaryQueryHandler(
    IReservationRepository reservationRepository,
    IVehicleRepository vehicleRepository,
    ICustomerRepository customerRepository,
    IClaimContext claimContext) : IRequestHandler<DashboardSummaryQuery, Result<DashboardSummaryDto>>
{
    public async Task<Result<DashboardSummaryDto>> Handle(DashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var branchId = claimContext.GetBranchId();
        var isSysAdmin = claimContext.GetRoleName() == "sys_admin";

        var reservationQuery = reservationRepository.GetAll();
        var vehicleQuery = vehicleRepository.GetAll();

        if (!isSysAdmin)
        {
            reservationQuery = reservationQuery.Where(p => p.PickUpLocationId == branchId);
            vehicleQuery = vehicleQuery.Where(p => p.BranchId == branchId);
        }

        var now = DateTimeOffset.Now;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, now.Offset);
        var lastSevenDaysStart = now.Date.AddDays(-6);

        var reservations = await reservationQuery
            .Where(p => p.CreatedAt >= lastSevenDaysStart || p.CreatedAt >= monthStart)
            .Select(p => new
            {
                p.CreatedAt,
                Total = p.Total.Value,
                Status = p.Status.Value
            })
            .ToListAsync(cancellationToken);

        var activeReservationCount = await reservationQuery
            .Where(p => p.Status.Value != Status.Completed.Value && p.Status.Value != Status.Canceled.Value)
            .CountAsync(cancellationToken);

        var dto = new DashboardSummaryDto
        {
            ActiveReservationCount = activeReservationCount,
            VehicleCount = await vehicleQuery.CountAsync(cancellationToken),
            CustomerCount = await customerRepository.GetAll().CountAsync(cancellationToken),
            CurrentMonthIncome = reservations
                .Where(p => p.CreatedAt >= monthStart && p.Status != Status.Canceled.Value)
                .Sum(p => p.Total)
        };

        for (var date = lastSevenDaysStart; date <= now.Date; date = date.AddDays(1))
        {
            var dayReservations = reservations
                .Where(p => p.CreatedAt.Date == date && p.Status != Status.Canceled.Value)
                .ToList();

            dto.LastSevenDaysIncome.Add(new DashboardChartItemDto
            {
                Date = date.ToString("dd.MM.yyyy"),
                Total = dayReservations.Sum(p => p.Total)
            });

            dto.LastSevenDaysReservation.Add(new DashboardChartItemDto
            {
                Date = date.ToString("dd.MM.yyyy"),
                Total = dayReservations.Count
            });
        }

        return dto;
    }
}
