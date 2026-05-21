using FluentValidation;
using GenericRepository;
using RentCarServer.Domain.Customers;
using RentCarServer.Domain.Shared;
using RentCarServer.Domain.Users.ValueObjects;
using TS.MediatR;
using TS.Result;

namespace RentCarServer.Application.Auth;

public sealed record RegisterCustomerCommand(
    string FirstName,
    string LastName,
    string UserName,
    string Email,
    string PhoneNumber1,
    string? PhoneNumber2,
    string Password,
    string ConfirmPassword) : IRequest<Result<string>>;

public sealed class RegisterCustomerCommandValidator : AbstractValidator<RegisterCustomerCommand>
{
    public RegisterCustomerCommandValidator()
    {
        RuleFor(p => p.FirstName).NotEmpty().WithMessage("Ad alanı boş olamaz.");
        RuleFor(p => p.LastName).NotEmpty().WithMessage("Soyad alanı boş olamaz.");
        RuleFor(p => p.UserName).NotEmpty().WithMessage("Kullanıcı adı boş olamaz.");
        RuleFor(p => p.Email)
            .NotEmpty().WithMessage("E-posta adresi boş olamaz.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.")
            .Must(NotContainTurkishCharacters).WithMessage("E-posta adresinde Türkçe karakter kullanılamaz.");
        RuleFor(p => p.PhoneNumber1).NotEmpty().WithMessage("Telefon numarası boş olamaz.");
        RuleFor(p => p.Password)
            .NotEmpty().WithMessage("Şifre boş olamaz.")
            .Must(IsPasswordStrongEnough).WithMessage("Şifre en az orta güçte olmalıdır. En az 6 karakter, bir büyük harf ve bir rakam kullanın.");
        RuleFor(p => p.ConfirmPassword)
            .Equal(p => p.Password).WithMessage("Şifreler aynı olmalıdır.");
    }

    private static bool NotContainTurkishCharacters(string email)
    {
        return !email.Any(c => "çğıöşüÇĞİÖŞÜ".Contains(c));
    }

    private static bool IsPasswordStrongEnough(string password)
    {
        var score = 0;
        if (password.Length >= 6) score++;
        if (password.Any(char.IsUpper)) score++;
        if (password.Any(char.IsDigit)) score++;
        if (password.Any(c => !char.IsLetterOrDigit(c))) score++;
        return score >= 2;
    }
}

internal sealed class RegisterCustomerCommandHandler(
    ICustomerRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<RegisterCustomerCommand, Result<string>>
{
    public async Task<Result<string>> Handle(RegisterCustomerCommand request, CancellationToken cancellationToken)
    {
        var userName = request.UserName.Trim();
        var email = request.Email.Trim();

        bool userNameExists = await repository.AnyAsync(
            x => x.IdentityNumber.Value == userName, cancellationToken);
        if (userNameExists)
        {
            return Result<string>.Failure("Bu kullanıcı adı ile kayıtlı müşteri var.");
        }

        bool emailExists = await repository.AnyAsync(
            x => x.Email.Value == email, cancellationToken);
        if (emailExists)
        {
            return Result<string>.Failure("Bu e-posta adresi ile kayıtlı müşteri var.");
        }

        DateOnly today = DateOnly.FromDateTime(DateTime.Today);
        string fullAddress = string.IsNullOrWhiteSpace(request.PhoneNumber2)
            ? "Kayıt ekranından oluşturuldu"
            : $"Telefon 2: {request.PhoneNumber2}";

        Customer customer = new(
            new FirstName(request.FirstName),
            new LastName(request.LastName),
            new IdentityNumber(userName),
            new DateOfBirth(today),
            new PhoneNumber(request.PhoneNumber1),
            new Email(email),
            new DrivingLicenseIssuanceDate(today),
            new FullAddress(fullAddress),
            new Password(request.Password),
            true);

        repository.Add(customer);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return "Müşteri başarıyla kaydedildi";
    }
}
