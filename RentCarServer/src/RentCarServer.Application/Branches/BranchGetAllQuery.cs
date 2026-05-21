using RentCarServer.Application.Behaviors;
using RentCarServer.Domain.Branches;
using TS.MediatR;

namespace RentCarServer.Application.Branches;
[Permission("branch:view")]
public sealed record BranchGetAllQuery : IRequest<IQueryable<BranchDto>>;

internal sealed class BranchGetAllQueryHandler(
    IBranchRepository branchRepository) : IRequestHandler<BranchGetAllQuery, IQueryable<BranchDto>>
{
    public Task<IQueryable<BranchDto>> Handle(BranchGetAllQuery request, CancellationToken cancellationToken) =>
        Task.FromResult(branchRepository.GetAll()
            .Select(branch => new RentCarServer.Domain.Abstractions.EntityWithAuditDto<Branch>
            {
                Entity = branch
            })
            .MapTo()
            .AsQueryable());
}
