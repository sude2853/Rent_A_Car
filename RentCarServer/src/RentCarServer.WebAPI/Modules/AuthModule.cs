using RentCarServer.Application.Auth;
using TS.MediatR;
using TS.Result;
namespace RentCarServer.WebAPI.Modules;

public static class AuthModule
{
    public static void MapAuth(this IEndpointRouteBuilder builder)
    {
        var app = builder.MapGroup("/auth").WithTags("Auth");

        app.MapPost("/login",
            async (LoginCommand request, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(request, cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<LoginCommandResponse>>()
            .RequireRateLimiting("login-fixed");

        app.MapPost("/login-with-tfa",
            async (LoginWithTFACommand request, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(request, cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<LoginCommandResponse>>()
            .RequireRateLimiting("login-fixed");

        app.MapPost("/forgot-password/{email}",
            async (string email, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(new ForgotPasswordCommand(email), cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<string>>()
            .RequireRateLimiting("forgot-password-fixed");

        app.MapPost("/reset-password",
           async (ResetPasswordCommand request, ISender sender, CancellationToken cancellationToken) =>
           {
               var res = await sender.Send(request, cancellationToken);
               return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
           })
           .Produces<Result<string>>()
           .RequireRateLimiting("reset-password-fixed");

        app.MapGet("/check-forgot-password-code/{forgotPasswordCode}",
           async (Guid forgotPasswordCode, ISender sender, CancellationToken cancellationToken) =>
           {
               var res = await sender.Send(new CheckForgotPasswordCodeCommand(forgotPasswordCode), cancellationToken);
               return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
           })
           .Produces<Result<string>>()
           .RequireRateLimiting("check-forgot-password-code-fixed");

        app.MapGet("/check-user-name/{userName}",
            async (string userName, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(new CheckCustomerUserNameQuery(userName), cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.UnprocessableEntity(res);
            })
            .Produces<Result<bool>>();

        app.MapPost("/register",
            async (RegisterCustomerCommand request, ISender sender, CancellationToken cancellationToken) =>
            {
                var res = await sender.Send(request, cancellationToken);
                return res.IsSuccessful ? Results.Ok(res) : Results.InternalServerError(res);
            })
            .Produces<Result<string>>();
    }
}
