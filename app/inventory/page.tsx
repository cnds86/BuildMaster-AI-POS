
'use client';
import React from 'react';
import { Inventory } from '../../components/Inventory';
import { useGlobal } from '../../context/GlobalContext';

export default function InventoryPage() {
  const { 
    products, 
    units, 
    categories, 
    warehouses, 
    sales, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useGlobal();

  return (
    <div className="h-full">
      <Inventory 
        products={products}
        units={units}
        categories={categories}
        warehouses={warehouses}
        sales={sales}
        onAddProduct={addProduct}
        onUpdateProduct={updateProduct}
        onDeleteProduct={deleteProduct}
      />
    </div>
  );
}
