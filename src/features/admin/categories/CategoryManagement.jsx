import React, { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import './CategoryManagement.css';
import {
  getCurrentUser,
  kategoriPeralatanApi,
  peralatanApi,
} from '../../../shared/services/api.js';
import { useToast } from '../../../app/providers/ToastContext.jsx';
import { getUserRole } from '../../../shared/utils/permissions.js';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../../shared/components/ui/index.js';
import CategoryDetails from './components/CategoryDetails.jsx';
import CategoryEditModal from './components/CategoryEditModal.jsx';
import CategoryGrid from './components/CategoryGrid.jsx';
import { countEquipmentByCategory } from './categoryData.js';

export default function CategoryManagement() {
  const { success, error: showError } = useToast();
  const canEditEquipment = getUserRole(getCurrentUser()) === 'admin';
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setLoadError('');

    try {
      const categoryResponse = await kategoriPeralatanApi.getAll();
      const equipmentResponse = canEditEquipment
        ? await peralatanApi.getAll()
        : { data: [] };
      const equipment = equipmentResponse.data || [];

      setCategories(categoryResponse.data || []);
      setCounts(countEquipmentByCategory(equipment));
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat data kategori peralatan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveCategory(event) {
    event.preventDefault();
    if (!editingCategory) return;

    setSaving(true);
    try {
      const response = await kategoriPeralatanApi.update(editingCategory.id, {
        nama_kategori: editingCategory.nama_kategori,
        description: editingCategory.description,
      });
      setCategories((currentCategories) => currentCategories.map((category) => (
        category.id === response.data.id ? response.data : category
      )));
      setEditingCategory(null);
      success('Kategori berhasil diperbarui.');
    } catch (err) {
      showError(err.message || 'Gagal memperbarui kategori.');
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find(
    (category) => Number(category.id) === Number(selectedCategoryId),
  );

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        title="Klasifikasi Kategori Peralatan"
        subtitle="Standar klasifikasi, tata kelola metrologis, dan regulasi kepatuhan peralatan laboratorium uji"
        eyebrow="ISO/IEC 17025:2017"
      />

      {loading ? (
        <LoadingState message="Memuat kategori peralatan..." />
      ) : loadError ? (
        <ErrorState
          title="Gagal memuat kategori peralatan"
          message={loadError}
          onRetry={loadData}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Kategori peralatan belum tersedia"
          description="Belum ada data kategori peralatan untuk ditampilkan."
          icon={<Box size={32} />}
        />
      ) : (
        <div className="category-management">
          <CategoryGrid
            categories={categories}
            counts={counts}
            selectedCategoryId={selectedCategoryId}
            canEdit={canEditEquipment}
            onSelect={setSelectedCategoryId}
            onEdit={(category) => setEditingCategory({ ...category })}
          />
          <CategoryDetails category={selectedCategory} />
        </div>
      )}

      <CategoryEditModal
        category={editingCategory}
        saving={saving}
        onChange={setEditingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={saveCategory}
      />
    </div>
  );
}
