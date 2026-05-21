using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Branches;
using RentCarServer.Domain.Roles;
using RentCarServer.Domain.Users;

namespace RentCarServer.Application.Users;
public sealed class UserDto : EntityDto
{
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string UserName { get; set; } = default!;
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = default!;
}

public static class UserExtensions
{
    public static IQueryable<UserDto> MapTo(
        this IQueryable<User> entities,
        IQueryable<Role> roles,
        IQueryable<Branch> branches
        )
    {
        var res = entities
            .Join(roles, m => m.RoleId, m => m.Id, (user, role)
                => new { User = user, Role = role })
            .Join(branches, m => m.User.BranchId, m => m.Id, (entity, branch)
                => new { entity.User, entity.Role, Branch = branch })
            .Select(s => new UserDto
            {
                Id = s.User.Id,
                FirstName = s.User.FirstName.Value,
                LastName = s.User.LastName.Value,
                FullName = s.User.FullName.Value,
                Email = s.User.Email.Value,
                UserName = s.User.UserName.Value,
                RoleId = s.User.RoleId,
                RoleName = s.Role.Name.Value,
                BranchId = s.User.BranchId,
                BranchName = s.Branch.Name.Value,
                IsActive = s.User.IsActive,
                CreatedAt = s.User.CreatedAt,
                CreatedBy = s.User.CreatedBy,
                CreatedFullName = string.Empty,
                UpdatedAt = s.User.UpdatedAt,
                UpdatedBy = s.User.UpdatedBy != null ? s.User.UpdatedBy.Value : null,
                UpdatedFullName = null,
            });

        return res;
    }

    public static IQueryable<UserDto> MapTo(
        this IQueryable<EntityWithAuditDto<User>> entities,
        IQueryable<Role> roles,
        IQueryable<Branch> branches
        )
    {
        var res = entities
            .Join(roles, m => m.Entity.RoleId, m => m.Id, (e, role)
                => new { e.Entity, e.CreatedUser, e.UpdatedUser, Role = role })
            .Join(branches, m => m.Entity.BranchId, m => m.Id, (entity, branch)
                => new { entity.Entity, entity.CreatedUser, entity.UpdatedUser, entity.Role, Branch = branch })
            .Select(s => new UserDto
            {
                Id = s.Entity.Id,
                FirstName = s.Entity.FirstName.Value,
                LastName = s.Entity.LastName.Value,
                FullName = s.Entity.FullName.Value,
                Email = s.Entity.Email.Value,
                UserName = s.Entity.UserName.Value,
                RoleId = s.Entity.RoleId,
                RoleName = s.Role.Name.Value,
                BranchId = s.Entity.BranchId,
                BranchName = s.Branch.Name.Value,
                IsActive = s.Entity.IsActive,
                CreatedAt = s.Entity.CreatedAt,
                CreatedBy = s.Entity.CreatedBy.Value,
                CreatedFullName = s.CreatedUser.FullName.Value,
                UpdatedAt = s.Entity.UpdatedAt,
                UpdatedBy = s.Entity.UpdatedBy != null ? s.Entity.UpdatedBy.Value : null,
                UpdatedFullName = s.UpdatedUser != null ? s.UpdatedUser.FullName.Value : null,
            });

        return res;
    }
}
