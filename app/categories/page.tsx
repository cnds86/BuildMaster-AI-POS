
'use client';
import { CategoryManagement } from '../../components/CategoryManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useGlobal();

  return (
    <CategoryManagement 
      categories={categories}
      onAddCategory={addCategory}
      onUpdateCategory={updateCategory}
      onDeleteCategory={deleteCategory}
    />
  );
}
