using RentCarServer.Application.Services;
using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Customers;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Customers;

public sealed record CustomerGetMineQuery : IRequest<Result<CustomerDto>>;

internal sealed class CustomerGetMineQueryHandler(
    ICustomerRepository repository,
    IClaimContext claimContext) : IRequestHandler<CustomerGetMineQuery, Result<CustomerDto>>
{
    public async Task<Result<CustomerDto>> Handle(CustomerGetMineQuery request, CancellationToken cancellationToken)
    {
        var customerId = new IdentityId(claimContext.GetUserId());
        var customer = await repository.FirstOrDefaultAsync(p => p.Id == customerId, cancellationToken);

        if (customer is null)
        {
            return Result<CustomerDto>.Failure("Müşteri bulunamadı");
        }

        return new CustomerDto
        {
            Id = customer.Id,
            FirstName = customer.FirstName.Value,
            LastName = customer.LastName.Value,
            FullName = customer.FullName.Value,
            IdentityNumber = customer.IdentityNumber.Value,
            DateOfBirth = customer.DateOfBirth.Value,
            PhoneNumber = customer.PhoneNumber.Value,
            Email = customer.Email.Value,
            DrivingLicenseIssuanceDate = customer.DrivingLicenseIssuanceDate.Value,
            FullAddress = customer.FullAddress.Value,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            CreatedBy = customer.CreatedBy,
            UpdatedAt = customer.UpdatedAt,
            UpdatedBy = customer.UpdatedBy != null ? customer.UpdatedBy.Value : null
        };
    }
}
