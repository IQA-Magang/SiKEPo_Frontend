import { CheckCircle2, FileCheck, Layers } from 'lucide-react';
import { Card } from '../../../../shared/components/ui/index.js';
import { getCategoryMeta } from '../categoryData.js';

export default function CategoryDetails({ category }) {
  const meta = getCategoryMeta(category?.id || 1);
  const Icon = meta.icon;

  return (
    <Card
      as="section"
      className="category-management__details"
      style={{ '--category-color': meta.color, '--category-background': meta.bg, '--category-border': meta.border }}
    >
      <header className="category-management__details-heading">
        <span className="category-management__details-icon">
          <Icon size={24} />
        </span>
        <div>
          <h2 className="category-management__details-title">
            {category?.nama_kategori || category?.label || 'Kategori peralatan'}
          </h2>
          <span className="category-management__standard">{meta.standard}</span>
        </div>
      </header>

      <p className="category-management__details-description">
        {category?.description || category?.desc || 'Deskripsi kategori belum tersedia.'}
      </p>

      <div className="category-management__requirements">
        <section className="category-management__requirement-card">
          <h3>
            <FileCheck size={16} />
            Persyaratan Kepatuhan ISO/IEC 17025
          </h3>
          <ul>
            {meta.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </section>
        <section className="category-management__requirement-card">
          <h3>
            <Layers size={16} />
            Parameter &amp; Atribut Data Khusus
          </h3>
          <ul className="category-management__field-list">
            {meta.specificFields.map((field) => (
              <li key={field}>
                <CheckCircle2 size={13} />
                {field}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Card>
  );
}
