using FluentValidation;
using GenericRepository;
using RentCarServer.Application.Services;
using RentCarServer.Domain.Customers;
using RentCarServer.Domain.Users;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Auth;
public sealed record LoginCommand(
    string EmailOrUserName,
    string Password) : IRequest<Result<LoginCommandResponse>>;


public sealed record LoginCommandResponse
{
    public string? Token { get; set; }
    public string? TFACode { get; set; }
}
public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(p => p.EmailOrUserName).NotEmpty().WithMessage("Geçerli bir mail ya da kullanıcı adı girin");
        RuleFor(p => p.Password).NotEmpty().WithMessage("Geçerli bir şifre girin");
    }
}

public sealed class LoginCommandHandler(
    IUserRepository userRepository,
    ICustomerRepository customerRepository,
    IMailService mailService,
    IUnitOfWork unitOfWork,
    IJwtProvider jwtProvider) : IRequestHandler<LoginCommand, Result<LoginCommandResponse>>
{
    public async Task<Result<LoginCommandResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var emailOrUserName = request.EmailOrUserName.Trim();
        var normalizedLogin = emailOrUserName.ToLower();

        var user = await userRepository.FirstOrDefaultAsync(p =>
            p.Email.Value.ToLower() == normalizedLogin
            || p.UserName.Value.ToLower() == normalizedLogin);

        if (user is null)
        {
            var customer = await customerRepository.FirstOrDefaultAsync(p =>
                p.Email.Value.ToLower() == normalizedLogin
                || p.IdentityNumber.Value.ToLower() == normalizedLogin
                || p.PhoneNumber.Value == emailOrUserName
                || p.FirstName.Value.ToLower() == normalizedLogin
                || p.FullName.Value.ToLower() == normalizedLogin);

            if (customer is null || !customer.VerifyPasswordHash(request.Password))
            {
                return Result<LoginCommandResponse>.Failure("Kullanıcı adı ya da şifre yanlış");
            }

            var customerToken = await jwtProvider.CreateTokenAsync(customer, cancellationToken);
            return new LoginCommandResponse() { Token = customerToken };
        }

        var checkPassword = user.VerifyPasswordHash(request.Password);

        if (!checkPassword)
        {
            return Result<LoginCommandResponse>.Failure("Kullanıcı adı ya da şifre yanlış");
        }

        if (!user.TFAStatus.Value)
        {
            var token = await jwtProvider.CreateTokenAsync(user, cancellationToken);

            var res = new LoginCommandResponse() { Token = token };
            return res;
        }
        else
        {
            user.CreateTFACode();

            userRepository.Update(user);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            string to = user.Email.Value;
            string subject = "Giriş onayı";
            string body = @$"Uygulama girmek için aşağıdaki kodu kullanabilirsiniz. Bu kod sadece 5 dakika geçerlidir. <p><h4>{user.TFAConfirmCode!.Value}</h4></p>";
            await mailService.SendAsync(to, subject, body);

            var res = new LoginCommandResponse() { TFACode = user.TFACode!.Value };
            return res;
        }
    }
}


