using GenericRepository;
using RentCarServer.Domain.Customers;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Auth;

public sealed record CheckCustomerUserNameQuery(string UserName) : IRequest<Result<bool>>;

internal sealed class CheckCustomerUserNameQueryHandler(
    ICustomerRepository repository) : IRequestHandler<CheckCustomerUserNameQuery, Result<bool>>
{
    public async Task<Result<bool>> Handle(CheckCustomerUserNameQuery request, CancellationToken cancellationToken)
    {
        var userName = request.UserName.Trim();
        if (string.IsNullOrWhiteSpace(userName))
        {
            return Result<bool>.Failure("Kullanıcı adı boş olamaz.");
        }

        var exists = await repository.AnyAsync(
            x => x.IdentityNumber.Value == userName, cancellationToken);

        return !exists;
    }
}
