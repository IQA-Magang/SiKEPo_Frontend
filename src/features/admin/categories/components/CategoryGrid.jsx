import { Edit3 } from 'lucide-react';
import { Badge, Button } from '../../../../shared/components/ui/index.js';
import { getCategoryMeta } from '../categoryData.js';

export default function CategoryGrid({
  categories,
  counts,
  selectedCategoryId,
  canEdit,
  onSelect,
  onEdit,
}) {
  return (
    <div className="category-management__grid">
      {categories.map((category) => {
        const meta = getCategoryMeta(category.id);
        const Icon = meta.icon;
        const isSelected = Number(selectedCategoryId) === Number(category.id);
        const name = category.nama_kategori || category.label;
        const description = category.description || category.desc || 'Deskripsi kategori belum tersedia.';

        return (
          <article
            key={category.id}
            className={`category-management__item${isSelected ? ' is-selected' : ''}`}
            style={{
              '--category-color': meta.color,
              '--category-background': meta.bg,
              '--category-border': meta.border,
            }}
          >
            <button
              type="button"
              className="category-management__select"
              onClick={() => onSelect(category.id)}
              aria-pressed={isSelected}
            >
              <span className="category-management__item-heading">
                <span className="category-management__icon">
                  <Icon size={20} />
                </span>
                <Badge tone="neutral">
                  {counts[category.id] || 0} unit
                </Badge>
              </span>
              <span className="category-management__name">{name}</span>
              <span className="category-management__description">{description}</span>
            </button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 size={14} />}
                onClick={() => onEdit(category)}
                title={`Edit kategori ${name}`}
              >
                Edit
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
