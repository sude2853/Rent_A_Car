using Microsoft.EntityFrameworkCore;
using RentCarServer.Application.Branches;
using RentCarServer.Domain.Branches;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.WebAPI.Modules;

public sealed record BranchLocationDto(Guid Id, string Name);

public static class BranchModule
{
    public static void MapBranch(this IEndpointRouteBuilder builder)
    {
        var app = builder
            .MapGroup("/branches")
            .RequireRateLimiting("fixed")
            .RequireAuthorization()
            .WithTags("Branches");

        app.MapPost(string.Empty,
            async (BranchCreateCommand request, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(request, cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<string>>();

        app.MapPut(string.Empty,
            async (BranchUpdateCommand request, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(request, cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<string>>();

        app.MapDelete("{id}",
            async (Guid id, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(new BranchDeleteCommand(id), cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<string>>();

        app.MapGet(string.Empty,
            async (IBranchRepository branchRepository, CancellationToken cancellationToken) =>
            {
                var branchRows = await branchRepository.GetAll()
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.Name.Value)
                    .Select(p => new BranchLocationDto(p.Id.Value, p.Name.Value))
                    .ToListAsync(cancellationToken);

                var branches = branchRows
                    .GroupBy(p => p.Name)
                    .Select(p => p.First())
                    .OrderBy(p => p.Name)
                    .ToList();

                return Results.Ok(Result<List<BranchLocationDto>>.Succeed(branches));
            })
            .AllowAnonymous()
            .Produces<Result<List<BranchLocationDto>>>();

        app.MapGet("{id}",
            async (Guid id, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(new BranchGetQuery(id), cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<BranchDto>>();
    }
}
