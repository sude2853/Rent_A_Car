using RentCarServer.Application.Behaviors;
using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Branches;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Branches;
[Permission("branch:view")]
public sealed record BranchGetQuery(
    Guid Id) : IRequest<Result<BranchDto>>;

internal sealed class BranchGetQueryHandler(
    IBranchRepository branchRepository) : IRequestHandler<BranchGetQuery, Result<BranchDto>>
{
    public Task<Result<BranchDto>> Handle(BranchGetQuery request, CancellationToken cancellationToken)
    {
        var branch = branchRepository
            .GetAll()
            .AsEnumerable()
            .FirstOrDefault(i => i.Id.Value == request.Id);

        if (branch is null)
        {
            return Task.FromResult(Result<BranchDto>.Failure("Şube bulunamadı"));
        }

        var dto = new[] { new EntityWithAuditDto<Branch> { Entity = branch } }
            .AsQueryable()
            .MapTo()
            .First();

        return Task.FromResult(Result<BranchDto>.Succeed(dto));
    }
}
