using GenericRepository;
using RentCarServer.Application.Services;
using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Branches;
using RentCarServer.Domain.Roles;
using RentCarServer.Domain.Shared;
using RentCarServer.Domain.Users;
using RentCarServer.Domain.Users.ValueObjects;

namespace RentCarServer.WebAPI;

public static class ExtensionMethods
{
    public static async Task CreateFirstUser(this WebApplication app)
    {
        using var scoped = app.Services.CreateScope();
        var srv = scoped.ServiceProvider;
        var userRepository = srv.GetRequiredService<IUserRepository>();
        var roleRepository = srv.GetRequiredService<IRoleRepository>();
        var branchRepository = srv.GetRequiredService<IBranchRepository>();
        var unitOfWork = srv.GetRequiredService<IUnitOfWork>();

        Branch? branch = await branchRepository.FirstOrDefaultAsync(i => i.Name.Value == "Isparta Merkez Şube" || i.Name.Value == "Merkez Şube");
        Role? role = await roleRepository.FirstOrDefaultAsync(i => i.Name.Value == "sys_admin");

        var legacyBranchNames = new Dictionary<string, string>
        {
            ["Merkez Şube"] = "Isparta Merkez Şube",
            ["Kayseri Havalimanı"] = "Isparta Süleyman Demirel Havalimanı",
            ["Kayseri Otogar"] = "Isparta Otogar",
            ["Talas Şube"] = "Isparta Çünür Şube",
            ["Forum Kayseri"] = "Isparta Meydan AVM",
            ["Erciyes Üniversitesi"] = "Süleyman Demirel Üniversitesi"
        };

        var branchSeeds = new (string Name, string City, string District, string Detail, string Phone1, string Phone2, string Email)[]
        {
            ("Isparta Merkez Şube", "Isparta", "MERKEZ", "Cumhuriyet Mahallesi, merkez teslim noktası", "2462251015", "2462251016", "info@rentcar.com"),
            ("Isparta Süleyman Demirel Havalimanı", "Isparta", "MERKEZ", "Süleyman Demirel Havalimanı gelen yolcu terminali", "2465595050", "2465595051", "airport@rentcar.com"),
            ("Isparta Otogar", "Isparta", "MERKEZ", "Isparta şehirlerarası otobüs terminali teslim noktası", "2462323030", "2462323031", "otogar@rentcar.com"),
            ("Isparta Çünür Şube", "Isparta", "MERKEZ", "Çünür Mahallesi teslim noktası", "2462372020", "2462372021", "cunur@rentcar.com"),
            ("Isparta Meydan AVM", "Isparta", "MERKEZ", "Meydan AVM teslim noktası", "2462224040", "2462224041", "meydan@rentcar.com"),
            ("Süleyman Demirel Üniversitesi", "Isparta", "MERKEZ", "Süleyman Demirel Üniversitesi kampüs teslim noktası", "2462183838", "2462183839", "sdu@rentcar.com")
        };

        foreach (var legacy in legacyBranchNames)
        {
            var oldBranch = await branchRepository.FirstOrDefaultAsync(i => i.Name.Value == legacy.Key);
            var seed = branchSeeds.FirstOrDefault(i => i.Name == legacy.Value);
            if (oldBranch is null || string.IsNullOrWhiteSpace(seed.Name))
            {
                continue;
            }

            oldBranch.SetName(new Name(seed.Name));
            oldBranch.SetAddress(new Address(seed.City, seed.District, seed.Detail));
            oldBranch.SetContact(new Contact(seed.Phone1, seed.Phone2, seed.Email));
            branchRepository.Update(oldBranch);

            if (legacy.Value == "Isparta Merkez Şube")
            {
                branch = oldBranch;
            }
        }

        foreach (var item in branchSeeds)
        {
            if (await branchRepository.AnyAsync(i => i.Name.Value == item.Name))
            {
                continue;
            }

            Name name = new(item.Name);
            Address address = new(item.City, item.District, item.Detail);
            Contact contact = new(item.Phone1, item.Phone2, item.Email);
            var newBranch = new Branch(name, address, contact, true);
            branchRepository.Add(newBranch);

            if (item.Name == "Isparta Merkez Şube")
            {
                branch = newBranch;
            }
        }

        branch ??= await branchRepository.FirstOrDefaultAsync(i => i.Name.Value == "Isparta Merkez Şube");

        if (role is null)
        {
            Name name = new("sys_admin");
            role = new(name, true);
            roleRepository.Add(role);
        }

        if (!(await userRepository.AnyAsync(p => p.UserName.Value == "admin")))
        {
            FirstName firstName = new("Elif");
            LastName lastName = new("Sude");
            Email email = new("elifsude@gmail.com");
            UserName userName = new("admin");
            Password password = new("1");
            IdentityId branchId = branch.Id;
            IdentityId roleId = role.Id;

            var user = new User(
                firstName,
                lastName,
                email,
                userName,
                password,
                branchId,
                roleId,
                true);

            userRepository.Add(user);
        }

        await unitOfWork.SaveChangesAsync();
    }

    public static async Task CleanRemovedPermissionsFromRoleAsync(this WebApplication app)
    {
        using var scoped = app.Services.CreateScope();
        var srv = scoped.ServiceProvider;
        var service = srv.GetRequiredService<PermissionCleanerSevice>();
        await service.CleanRemovedPermissionsFromRolesAsync();
    }
}
