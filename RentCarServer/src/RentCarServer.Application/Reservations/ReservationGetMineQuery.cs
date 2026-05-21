using RentCarServer.Application.Services;
using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Branches;
using RentCarServer.Domain.Categories;
using RentCarServer.Domain.Customers;
using RentCarServer.Domain.Extras;
using RentCarServer.Domain.ProtectionPackages;
using RentCarServer.Domain.Reservations;
using RentCarServer.Domain.Vehicles;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Reservations;

public sealed record ReservationGetMineQuery : IRequest<Result<List<ReservationDto>>>;

internal sealed class ReservationGetMineQueryHandler(
    IReservationRepository reservationRepository,
    ICustomerRepository customerRepository,
    IBranchRepository brancheRepository,
    IVehicleRepository vehicleRepository,
    ICategoryRepository categoryRepository,
    IProtectionPackageRepository protectionPackageRepository,
    IExtraRepository extraRepository,
    IClaimContext claimContext
    ) : IRequestHandler<ReservationGetMineQuery, Result<List<ReservationDto>>>
{
    public Task<Result<List<ReservationDto>>> Handle(ReservationGetMineQuery request, CancellationToken cancellationToken)
    {
        var customerId = new IdentityId(claimContext.GetUserId());
        var customers = customerRepository.GetAll().ToList();
        var branches = brancheRepository.GetAll().ToList();
        var vehicles = vehicleRepository.GetAll().ToList();
        var categories = categoryRepository.GetAll().ToList();
        var protectionPackages = protectionPackageRepository.GetAll().ToList();
        var extras = extraRepository.GetAll().ToList();

        var reservations = reservationRepository.GetAll()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAt)
            .ToList()
            .Select(reservation =>
            {
                var customer = customers.FirstOrDefault(x => x.Id == reservation.CustomerId);
                var branch = branches.FirstOrDefault(x => x.Id == reservation.PickUpLocationId);
                var vehicle = vehicles.FirstOrDefault(x => x.Id == reservation.VehicleId);
                var category = vehicle is null ? null : categories.FirstOrDefault(x => x.Id == vehicle.CategoryId);
                var protectionPackage = protectionPackages.FirstOrDefault(x => x.Id == reservation.ProtectionPackageId);

                return new ReservationDto
                {
                    Id = reservation.Id,
                    ReservationNumber = reservation.ReservationNumber.Value,
                    CustomerId = reservation.CustomerId,
                    Customer = new ReservationCustomerDto
                    {
                        Email = customer?.Email.Value ?? string.Empty,
                        FullAddress = customer?.FullAddress.Value ?? string.Empty,
                        FullName = customer?.FullName.Value ?? string.Empty,
                        IdentityNumber = customer?.IdentityNumber.Value ?? string.Empty,
                        PhoneNumber = customer?.PhoneNumber.Value ?? string.Empty
                    },
                    PickUpLocationId = reservation.PickUpLocationId,
                    PickUp = new ReservationPickUpDto
                    {
                        Name = branch?.Name.Value ?? string.Empty,
                        FullAddress = branch?.Address.FullAddress ?? string.Empty,
                        PhoneNumber = branch?.Contact.PhoneNumber1 ?? string.Empty
                    },
                    PickUpDate = reservation.PickUpDate.Value,
                    PickUpTime = reservation.PickUpTime.Value,
                    PickUpDateTime = reservation.PickUpDatetime.Value,
                    DeliveryDate = reservation.DeliveryDate.Value,
                    DeliveryTime = reservation.DeliveryTime.Value,
                    DeliveryDateTime = reservation.DeliveryDatetime.Value,
                    VehicleId = reservation.VehicleId.Value,
                    VehicleDailyPrice = reservation.VehicleDailyPrice.Value,
                    Vehicle = new ReservationVehicleDto
                    {
                        Id = vehicle?.Id ?? Guid.Empty,
                        Brand = vehicle?.Brand.Value ?? string.Empty,
                        Model = vehicle?.Model.Value ?? string.Empty,
                        ModelYear = vehicle?.ModelYear.Value ?? 0,
                        CategoryName = category?.Name.Value ?? string.Empty,
                        Color = vehicle?.Color.Value ?? string.Empty,
                        FuelConsumption = vehicle?.FuelConsumption.Value ?? 0,
                        SeatCount = vehicle?.SeatCount.Value ?? 0,
                        TractionType = vehicle?.TractionType.Value ?? string.Empty,
                        Kilometer = vehicle?.Kilometer.Value ?? 0,
                        ImageUrl = vehicle?.ImageUrl.Value ?? string.Empty,
                        Plate = vehicle?.Plate.Value ?? string.Empty
                    },
                    ProtectionPackageId = reservation.ProtectionPackageId.Value,
                    ProtectionPackagePrice = reservation.ProtectionPackagePrice.Value,
                    ProtectionPackageName = protectionPackage?.Name.Value ?? "Seçilen Güvence Paketi",
                    ReservationExtras = reservation.ReservationExtras.Select(reservationExtra =>
                    {
                        var extra = extras.FirstOrDefault(x => x.Id == reservationExtra.ExtraId);
                        return new ReservationExtraDto
                        {
                            ExtraId = reservationExtra.ExtraId,
                            ExtraName = extra?.Name.Value ?? GetExtraName(reservationExtra.ExtraId),
                            Price = reservationExtra.Price
                        };
                    }).ToList(),
                    Note = reservation.Note.Value,
                    Histories = reservation.Histories.ToList(),
                    Total = reservation.Total.Value,
                    TotalDay = reservation.TotalDay.Value,
                    Status = reservation.Status.Value,
                    PaymentInformation = reservation.PaymentInformation,
                    PickUpForm = reservation.PickUpForm.ToSummaryDto(),
                    DeliveryForm = reservation.DeliveryForm.ToSummaryDto(),
                    IsActive = reservation.IsActive,
                    CreatedAt = reservation.CreatedAt,
                    CreatedBy = reservation.CreatedBy.Value,
                    CreatedFullName = customer?.FullName.Value ?? string.Empty,
                    UpdatedAt = reservation.UpdatedAt,
                    UpdatedBy = reservation.UpdatedBy != null ? reservation.UpdatedBy.Value : null,
                    UpdatedFullName = null
                };
            })
            .ToList();

        return Task.FromResult(Result<List<ReservationDto>>.Succeed(reservations));
    }

    private static string GetExtraName(Guid extraId)
        => extraId.ToString() switch
        {
            "88888888-8888-8888-8888-888888888888" => "Mini Hasar Güvencesi",
            "99999999-9999-9999-9999-999999999999" => "Kış Lastiği",
            "33333333-3333-3333-3333-333333333333" => "Genç Sürücü Paketi",
            "44444444-4444-4444-4444-444444444444" => "Banka Kartı ile Kiralama",
            "55555555-5555-5555-5555-555555555555" => "Depozitosuz Kiralama",
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" => "Koltuk Adaptörü",
            "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" => "Çocuk Koltuğu",
            "cccccccc-cccc-cccc-cccc-cccccccccccc" => "Bebek Koltuğu",
            _ => "Ekstra Hizmet"
        };
}
