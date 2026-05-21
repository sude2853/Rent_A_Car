using RentCarServer.Domain.Abstractions;
using RentCarServer.Domain.Categories;

namespace RentCarServer.Application.Categories;

public sealed class CategoryDto : EntityDto
{
    public string Name { get; set; } = default!;
}

public static class CategoryExtensions
{
    public static IQueryable<CategoryDto> MapToGet(this IQueryable<Category> entities)
    {
        return entities.Select(s => new CategoryDto
        {
            Id = s.Id,
            Name = s.Name.Value,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            CreatedBy = s.CreatedBy,
            CreatedFullName = string.Empty,
            UpdatedAt = s.UpdatedAt,
            UpdatedBy = s.UpdatedBy != null ? s.UpdatedBy.Value : null,
            UpdatedFullName = null,
        });
    }

    public static IQueryable<CategoryDto> MapToGet(this IQueryable<EntityWithAuditDto<Category>> entities)
    {
        return entities.Select(s => new CategoryDto
        {
            Id = s.Entity.Id,
            Name = s.Entity.Name.Value,
            IsActive = s.Entity.IsActive,
            CreatedAt = s.Entity.CreatedAt,
            CreatedBy = s.Entity.CreatedBy,
            CreatedFullName = s.CreatedUser.FullName.Value,
            UpdatedAt = s.Entity.UpdatedAt,
            UpdatedBy = s.Entity.UpdatedBy != null ? s.Entity.UpdatedBy.Value : null,
            UpdatedFullName = s.UpdatedUser != null ? s.UpdatedUser.FullName.Value : null,
        });
    }
}
