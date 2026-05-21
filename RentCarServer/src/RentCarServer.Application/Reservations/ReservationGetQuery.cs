using Microsoft.EntityFrameworkCore;
using RentCarServer.Application.Behaviors;
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
[Permission("reservation:view")]
public sealed record ReservationGetQuery(
    Guid Id) : IRequest<Result<ReservationDto>>;

internal sealed class ReservationGetQueryHandler(
    IReservationRepository reservationRepository,
    ICustomerRepository customerRepository,
    IBranchRepository brancheRepository,
    IVehicleRepository vehicleRepository,
    ICategoryRepository categoryRepository,
    IProtectionPackageRepository protectionPackageRepository,
    IExtraRepository extraRepository
    ) : IRequestHandler<ReservationGetQuery, Result<ReservationDto>>
{
    public Task<Result<ReservationDto>> Handle(ReservationGetQuery request, CancellationToken cancellationToken)
    {
        var res = reservationRepository.GetAllWithAudit().MapTo(
            customerRepository.GetAll(),
            brancheRepository.GetAll(),
            vehicleRepository.GetAll(),
            categoryRepository.GetAll(),
            protectionPackageRepository.GetAll(),
            extraRepository.GetAll())
            .Where(i => i.Id == request.Id)
            .FirstOrDefault();

        if (res is null)
        {
            return Task.FromResult(Result<ReservationDto>.Failure("Rezervasyon bulunamadı"));
        }

        return Task.FromResult(Result<ReservationDto>.Succeed(res));
    }
}
