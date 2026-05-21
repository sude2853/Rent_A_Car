using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Branches;
using RentCarServer.Domain.Categories;
using RentCarServer.Domain.Customers;
using RentCarServer.Domain.Extras;
using RentCarServer.Domain.ProtectionPackages;
using RentCarServer.Domain.Reservations;
using RentCarServer.Domain.Reservations.Forms;
using RentCarServer.Domain.Reservations.Forms.ValueObjects;
using RentCarServer.Domain.Reservations.ValueObjects;
using RentCarServer.Domain.Vehicles;

namespace RentCarServer.Application.Reservations;

public sealed class ReservationPickUpDto
{
    public string Name { get; set; } = default!;
    public string FullAddress { get; set; } = default!;
    public string PhoneNumber { get; set; } = default!;
}
public sealed class ReservationCustomerDto
{
    public string FullName { get; set; } = default!;
    public string IdentityNumber { get; set; } = default!;
    public string PhoneNumber { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string FullAddress { get; set; } = default!;
}
public sealed class ReservationVehicleDto
{
    public Guid Id { get; set; } = default!;
    public string Brand { get; set; } = default!;
    public string Model { get; set; } = default!;
    public int ModelYear { get; set; } = default!;
    public string Color { get; set; } = default!;
    public string CategoryName { get; set; } = default!;
    public decimal FuelConsumption { get; set; } = default!;
    public int SeatCount { get; set; } = default!;
    public string TractionType { get; set; } = default!;
    public int Kilometer { get; set; } = default!;
    public string ImageUrl { get; set; } = default!;
    public string Plate { get; set; } = default!;
}
public sealed class ReservationExtraDto
{
    public Guid ExtraId { get; set; }
    public string ExtraName { get; set; } = default!;
    public decimal Price { get; set; }
}
public sealed class ReservationFormSummaryDto
{
    public int Kilometer { get; set; }
    public List<string> Supplies { get; set; } = [];
    public List<string> ImageUrls { get; set; } = [];
    public List<Damage> Damages { get; set; } = [];
    public string Note { get; set; } = default!;
}
public sealed class ReservationDto : EntityDto
{
    public string ReservationNumber { get; set; } = default!;
    public Guid CustomerId { get; set; } = default!;
    public ReservationCustomerDto Customer { get; set; } = default!;
    public Guid PickUpLocationId { get; set; } = default!;
    public ReservationPickUpDto PickUp { get; set; } = default!;
    public DateOnly PickUpDate { get; set; } = default!;
    public TimeOnly PickUpTime { get; set; } = default!;
    public DateTimeOffset PickUpDateTime { get; set; } = default!;
    public DateOnly DeliveryDate { get; set; } = default!;
    public TimeOnly DeliveryTime { get; set; } = default!;
    public DateTimeOffset DeliveryDateTime { get; set; } = default!;
    public Guid VehicleId { get; set; } = default!;
    public decimal VehicleDailyPrice { get; set; } = default!;
    public ReservationVehicleDto Vehicle { get; set; } = default!;
    public Guid ProtectionPackageId { get; set; } = default!;
    public decimal ProtectionPackagePrice { get; set; } = default!;
    public string ProtectionPackageName { get; set; } = default!;
    public List<ReservationExtraDto> ReservationExtras { get; set; } = default!;
    public string Note { get; set; } = default!;
    public decimal Total { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int TotalDay { get; set; } = default!;
    public PaymentInformation PaymentInformation { get; set; } = default!;
    public List<ReservationHistory> Histories { get; set; } = default!;
    public ReservationFormSummaryDto PickUpForm { get; set; } = default!;
    public ReservationFormSummaryDto DeliveryForm { get; set; } = default!;
}

public static class ReservationFormSummaryMapper
{
    public static ReservationFormSummaryDto ToSummaryDto(this Form form)
    {
        return new ReservationFormSummaryDto
        {
            Kilometer = form.Kilometer.Value,
            Supplies = form.Supplies.Select(s => s.Value).ToList(),
            ImageUrls = form.ImageUrls.Select(s => s.Value).ToList(),
            Damages = form.Damages.ToList(),
            Note = form.Note.Value
        };
    }
}

public static class ReservationExtensions
{
    public static IQueryable<ReservationDto> MapTo(
        this IQueryable<EntityWithAuditDto<Reservation>> entities,
             IQueryable<Customer> customers,
             IQueryable<Branch> branches,
             IQueryable<Vehicle> vehicles,
             IQueryable<Category> categories,
             IQueryable<ProtectionPackage> protectionPackages,
             IQueryable<Extra> extras
       )
    {
        var customerMap = customers.ToDictionary(x => x.Id.Value);
        var branchMap = branches.ToDictionary(x => x.Id.Value);
        var vehicleMap = vehicles.ToDictionary(x => x.Id.Value);
        var categoryMap = categories.ToDictionary(x => x.Id.Value);
        var protectionPackageMap = protectionPackages.ToDictionary(x => x.Id.Value);
        var extraMap = extras.ToDictionary(x => x.Id.Value);

        var res = entities
            .AsEnumerable()
            .Select(s =>
            {
                var reservation = s.Entity;
                customerMap.TryGetValue(reservation.CustomerId.Value, out var customer);
                branchMap.TryGetValue(reservation.PickUpLocationId.Value, out var branch);
                protectionPackageMap.TryGetValue(reservation.ProtectionPackageId.Value, out var protectionPackage);
                vehicleMap.TryGetValue(reservation.VehicleId.Value, out var vehicle);

                Category? category = null;
                if (vehicle is not null)
                {
                    categoryMap.TryGetValue(vehicle.CategoryId.Value, out category);
                }

                return new ReservationDto
            {
                Id = reservation.Id,
                ReservationNumber = reservation.ReservationNumber.Value,
                CustomerId = reservation.CustomerId,
                Customer = new ReservationCustomerDto
                {
                    Email = customer?.Email.Value ?? string.Empty,
                    FullAddress = customer?.FullAddress.Value ?? string.Empty,
                    FullName = customer?.FullName.Value ?? "Müşteri bilgisi yok",
                    IdentityNumber = customer?.IdentityNumber.Value ?? string.Empty,
                    PhoneNumber = customer?.PhoneNumber.Value ?? string.Empty
                },
                PickUpLocationId = reservation.PickUpLocationId,
                PickUp = new ReservationPickUpDto
                {
                    Name = branch?.Name.Value ?? "Şube bilgisi yok",
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
                    Id = vehicle?.Id.Value ?? reservation.VehicleId.Value,
                    Brand = vehicle?.Brand.Value ?? "Araç bilgisi yok",
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
                ProtectionPackageName = protectionPackage?.Name.Value ?? "Güvence bilgisi yok",
                ReservationExtras = reservation.ReservationExtras.Select(re =>
                {
                    extraMap.TryGetValue(re.ExtraId, out var extra);
                    return new ReservationExtraDto
                    {
                        ExtraId = re.ExtraId,
                        ExtraName = extra?.Name.Value ?? "Ekstra bilgisi yok",
                        Price = re.Price
                    };
                }).ToList(),
                Note = reservation.Note.Value,
                Histories = reservation.Histories.ToList(),
                Total = reservation.Total.Value,
                TotalDay = reservation.TotalDay.Value,
                Status = reservation.Status.Value,
                PaymentInformation = reservation.PaymentInformation,
                IsActive = reservation.IsActive,
                CreatedAt = reservation.CreatedAt,
                CreatedBy = reservation.CreatedBy.Value,
                CreatedFullName = s.CreatedUser?.FullName.Value ?? string.Empty,
                UpdatedAt = reservation.UpdatedAt,
                UpdatedBy = reservation.UpdatedBy != null ? reservation.UpdatedBy.Value : null,
                UpdatedFullName = s.UpdatedUser != null ? s.UpdatedUser.FullName.Value : null,
                PickUpForm = reservation.PickUpForm.ToSummaryDto(),
                DeliveryForm = reservation.DeliveryForm.ToSummaryDto(),
            };
            });
        return res.AsQueryable();
    }
}
