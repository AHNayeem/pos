"use client";

import React, { useState, useTransition, useMemo } from "react";
import { ProductService } from "@/services";
import type { Product, ProductVariant, Category, Brand } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface ProductManagementProps {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
}

type ProductFormData = {
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  imageUrl: string;
  isActive: boolean;
};

type VariantFormData = {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  costPrice: string;
  sellingPrice: string;
  taxRate: string;
  unit: string;
  isActive: boolean;
};

const emptyProduct: ProductFormData = {
  name: "",
  description: "",
  categoryId: "",
  brandId: "",
  imageUrl: "",
  isActive: true,
};

const emptyVariant: VariantFormData = {
  name: "",
  sku: "",
  barcode: "",
  costPrice: "",
  sellingPrice: "",
  taxRate: "0",
  unit: "pcs",
  isActive: true,
};

export default function ProductManagement({ initialProducts, categories, brands }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(emptyProduct);
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<VariantFormData>(emptyVariant);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { addToast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(q) && !product.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (categoryFilter && product.categoryId !== categoryFilter) return false;
      if (brandFilter && product.brandId !== brandFilter) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, brandFilter]);

  const resetForms = () => {
    setProductForm(emptyProduct);
    setVariants([]);
    setEditingVariantIndex(null);
    setVariantForm(emptyVariant);
  };

  const openCreate = () => {
    setEditingProduct(null);
    resetForms();
    setIsModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId,
      brandId: product.brandId,
      imageUrl: product.imageUrl || "",
      isActive: product.isActive,
    });
    setVariants(
      product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode || "",
        costPrice: String(v.costPrice),
        sellingPrice: String(v.sellingPrice),
        taxRate: String(v.taxRate),
        unit: v.unit,
        isActive: v.isActive,
      }))
    );
    setEditingVariantIndex(null);
    setVariantForm(emptyVariant);
    setIsModalOpen(true);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setVariantForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addVariant = () => {
    if (!variantForm.name || !variantForm.sku || !variantForm.sellingPrice) {
      addToast("Variant name, SKU, and selling price are required", "error");
      return;
    }
    setVariants((prev) => {
      if (editingVariantIndex !== null) {
        const next = [...prev];
        next[editingVariantIndex] = { ...variantForm };
        return next;
      }
      return [...prev, { ...variantForm, id: `var-${Date.now()}` }];
    });
    setVariantForm(emptyVariant);
    setEditingVariantIndex(null);
  };

  const editVariant = (index: number) => {
    setEditingVariantIndex(index);
    setVariantForm(variants[index]);
  };

  const deleteVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    if (editingVariantIndex === index) {
      setEditingVariantIndex(null);
      setVariantForm(emptyVariant);
    } else if (editingVariantIndex !== null && editingVariantIndex > index) {
      setEditingVariantIndex(editingVariantIndex - 1);
    }
  };

  const buildVariant = (v: VariantFormData): ProductVariant => ({
    id: v.id || `var-${Date.now()}`,
    productId: editingProduct?.id || `prod-${Date.now()}`,
    name: v.name,
    sku: v.sku,
    barcode: v.barcode || undefined,
    costPrice: parseFloat(v.costPrice) || 0,
    sellingPrice: parseFloat(v.sellingPrice) || 0,
    taxRate: parseFloat(v.taxRate) || 0,
    unit: v.unit,
    attributes: {},
    isActive: v.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingProduct) {
          const updated = await ProductService.updateProduct(editingProduct.id, {
            name: productForm.name,
            description: productForm.description || undefined,
            categoryId: productForm.categoryId,
            brandId: productForm.brandId,
            imageUrl: productForm.imageUrl || undefined,
            variants: variants.map(buildVariant),
            isActive: productForm.isActive,
          });
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          addToast("Product updated successfully", "success");
        } else {
          const created = await ProductService.createProduct({
            name: productForm.name,
            description: productForm.description || undefined,
            categoryId: productForm.categoryId,
            brandId: productForm.brandId,
            imageUrl: productForm.imageUrl || undefined,
            variants: variants.map(buildVariant),
            isActive: productForm.isActive,
          });
          setProducts((prev) => [...prev, created]);
          addToast("Product created successfully", "success");
        }
        setIsModalOpen(false);
        resetForms();
      } catch {
        addToast(editingProduct ? "Failed to update product" : "Failed to create product", "error");
      }
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await ProductService.archiveProduct(deleteTarget.id);
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        addToast("Product deactivated successfully", "success");
        setDeleteTarget(null);
      } catch {
        addToast("Failed to deactivate product", "error");
      }
    });
  };

  const getCategoryName = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name || "—";
  const getBrandName = (brandId: string) => brands.find((b) => b.id === brandId)?.name || "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your product catalog, variants, SKU, and barcode</p>
        </div>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Variants</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No products found. Create your first product to get started.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {getCategoryName(product.categoryId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {getBrandName(product.brandId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.variants.length}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={product.isActive ? "success" : "error"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(product)}
                        className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {product.isActive && (
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForms(); }} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingProduct ? "Edit Product" : "Create Product"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductChange}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <TextArea
                  placeholder="Product description"
                  value={productForm.description}
                  onChange={(value) => setProductForm((prev) => ({ ...prev, description: value }))}
                />
              </div>
              <div>
                <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={productForm.categoryId}
                  onChange={handleProductChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="brandId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                <select
                  id="brandId"
                  name="brandId"
                  value={productForm.brandId}
                  onChange={handleProductChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="imageUrl" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
                <Input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={productForm.imageUrl}
                  onChange={handleProductChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Variants</h4>
                <Button type="button" size="sm" variant="outline" onClick={() => { setEditingVariantIndex(null); setVariantForm(emptyVariant); }}>
                  Add Variant
                </Button>
              </div>

              {variants.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">SKU</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Unit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {variants.map((variant, index) => (
                        <tr key={variant.id || index}>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 dark:text-white">{variant.name}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{variant.sku}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{variant.sellingPrice}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{variant.unit}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                            <button type="button" onClick={() => editVariant(index)} className="mr-2 text-blue-600 hover:text-blue-800 dark:text-blue-400">Edit</button>
                            <button type="button" onClick={() => deleteVariant(index)} className="text-red-600 hover:text-red-800 dark:text-red-400">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(editingVariantIndex !== null || variants.length === 0) && (
                <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h5 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    {editingVariantIndex !== null ? "Edit Variant" : "Add Variant"}
                  </h5>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="v-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <Input
                        type="text"
                        id="v-name"
                        name="name"
                        value={variantForm.name}
                        onChange={handleVariantChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="v-sku" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">SKU</label>
                      <Input
                        type="text"
                        id="v-sku"
                        name="sku"
                        value={variantForm.sku}
                        onChange={handleVariantChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="v-barcode" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Barcode</label>
                      <Input
                        type="text"
                        id="v-barcode"
                        name="barcode"
                        value={variantForm.barcode}
                        onChange={handleVariantChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="v-costPrice" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Cost Price</label>
                      <Input
                        type="number"
                        id="v-costPrice"
                        name="costPrice"
                        value={variantForm.costPrice}
                        onChange={handleVariantChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="v-sellingPrice" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Selling Price</label>
                      <Input
                        type="number"
                        id="v-sellingPrice"
                        name="sellingPrice"
                        value={variantForm.sellingPrice}
                        onChange={handleVariantChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="v-taxRate" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
                      <Input
                        type="number"
                        id="v-taxRate"
                        name="taxRate"
                        value={variantForm.taxRate}
                        onChange={handleVariantChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="v-unit" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Unit</label>
                      <Input
                        type="text"
                        id="v-unit"
                        name="unit"
                        value={variantForm.unit}
                        onChange={handleVariantChange}
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <input
                          id="v-isActive"
                          type="checkbox"
                          checked={variantForm.isActive}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="v-isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditingVariantIndex(null); setVariantForm(emptyVariant); }}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={addVariant}>
                      {editingVariantIndex !== null ? "Update Variant" : "Add Variant"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); resetForms(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingProduct ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Deactivate Product</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to deactivate <span className="font-medium">{deleteTarget?.name}</span>? This action can be reversed by editing the product.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={isPending}>
              {isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
