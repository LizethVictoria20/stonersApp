import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle, Archive, Boxes, FileUp, History, Pencil, Plus, Search, Tags, Trash2, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  InventoryItem, Product, ProductCategory, ProductPrice, ProductVariant,
} from '../../types';

type View = 'catalog' | 'inventory' | 'movements';

const money = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(value || 0);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white';
const labelClass = 'mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-neutral-400';

interface ProductDraft {
  name: string; sku: string; barcode: string; description: string; categoryId: string;
  brand: string; unit: string; imageUrl: string; status: Product['status']; taxRate: number;
  regulatoryRegistration: string; cost: number; salePrice: number;
}

const emptyProduct: ProductDraft = {
  name: '', sku: '', barcode: '', description: '', categoryId: '', brand: '', unit: 'unidad',
  imageUrl: '', status: 'active', taxRate: 0, regulatoryRegistration: '', cost: 0, salePrice: 0,
};

export const ProductManager: React.FC = () => {
  const {
    currentUser, stores, productCategories, products, productVariants, productPrices,
    inventory, inventoryMovements, saveCategory, saveProductBundle, deactivateProduct,
    deleteProduct, deleteProducts, adjustInventory,
  } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canSeeCosts = currentUser.role === 'admin' || currentUser.role === 'contador';
  const canSeeStockQuantity = currentUser.role !== 'vendedor';
  const [view, setView] = useState<View>('catalog');
  const [search, setSearch] = useState('');
  const [productOpen, setProductOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const fileRef = useRef<HTMLInputElement>(null);

  const variantsByProduct = useMemo(() => new Map(productVariants.map(item => [item.productId, item])), [productVariants]);
  const pricesByVariant = useMemo(() => new Map(productPrices.map(item => [item.variantId, item])), [productPrices]);
  const filteredProducts = products.filter(product => {
    const variant = variantsByProduct.get(product.id);
    const needle = search.toLowerCase();
    return !needle || `${product.name} ${product.sku} ${variant?.barcode || ''} ${product.categoryName}`.toLowerCase().includes(needle);
  });
  const availableStock = (variantId: string) => inventory.filter(item => item.variantId === variantId).reduce((sum, item) => sum + item.quantity - item.reservedQuantity, 0);
  const lowStock = inventory.filter(item => item.quantity - item.reservedQuantity <= item.minStock);
  const visibleProductIds = filteredProducts.map(item => item.id);
  const allVisibleSelected = visibleProductIds.length > 0 && visibleProductIds.every(id => selectedProductIds.includes(id));

  useEffect(() => {
    const availableIds = new Set(products.map(item => item.id));
    setSelectedProductIds(current => current.filter(id => availableIds.has(id)));
  }, [products]);

  useEffect(() => {
    if (!canSeeStockQuantity && view !== 'catalog') setView('catalog');
  }, [canSeeStockQuantity, view]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(current => current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId]);
  };

  const toggleAllVisibleProducts = () => {
    setSelectedProductIds(current => {
      if (allVisibleSelected) return current.filter(id => !visibleProductIds.includes(id));
      return [...new Set([...current, ...visibleProductIds])];
    });
  };

  const openProduct = (product?: Product) => {
    if (!product) {
      setEditingProductId(null);
      setDraft({ ...emptyProduct, categoryId: productCategories[0]?.id || '' });
    } else {
      const variant = variantsByProduct.get(product.id);
      const price = variant ? pricesByVariant.get(variant.id) : undefined;
      setEditingProductId(product.id);
      setDraft({
        name: product.name, sku: variant?.sku || product.sku, barcode: variant?.barcode || '',
        description: product.description, categoryId: product.categoryId, brand: product.brand,
        unit: product.unit, imageUrl: product.imageUrl || '', status: product.status,
        taxRate: product.taxRate, regulatoryRegistration: product.regulatoryRegistration || '',
        cost: price?.cost || 0, salePrice: price?.salePrice || 0,
      });
    }
    setProductOpen(true);
  };

  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const existing = editingProductId ? products.find(item => item.id === editingProductId) : undefined;
    const existingVariant = existing ? variantsByProduct.get(existing.id) : undefined;
    const existingPrice = existingVariant ? pricesByVariant.get(existingVariant.id) : undefined;
    const category = productCategories.find(item => item.id === draft.categoryId);
    const productId = existing?.id || makeId('prd');
    const variantId = existingVariant?.id || makeId('var');
    const product: Product = {
      id: productId, sku: draft.sku.trim(), name: draft.name.trim(), description: draft.description.trim(),
      categoryId: category?.id || '', categoryName: category?.name || 'Sin categoría', brand: draft.brand.trim(),
      unit: draft.unit.trim() || 'unidad', imageUrl: draft.imageUrl.trim() || undefined, status: draft.status,
      taxRate: Number(draft.taxRate), regulatoryRegistration: draft.regulatoryRegistration.trim() || undefined,
      createdAt: existing?.createdAt || now, updatedAt: now,
    };
    const variant: ProductVariant = {
      id: variantId, productId, name: 'Presentación estándar', sku: draft.sku.trim(),
      barcode: draft.barcode.trim() || undefined, attributes: {}, active: draft.status === 'active',
    };
    const price: ProductPrice = {
      id: existingPrice?.id || makeId('price'), productId, variantId, cost: Number(draft.cost),
      salePrice: Number(draft.salePrice), taxRate: Number(draft.taxRate), updatedAt: now,
    };
    setSavingProduct(true);
    try {
      await saveProductBundle(product, variant, price);
      setProductOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo guardar el producto en Supabase.');
    } finally {
      setSavingProduct(false);
    }
  };

  const confirmDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente ${product.name}?\n\nSe borrarán sus precios, existencias y movimientos de inventario. Las ventas históricas se conservarán. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setDeletingProductId(product.id);
    try {
      await deleteProduct(product.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const confirmBulkDelete = async () => {
    const selectedProducts = products.filter(item => selectedProductIds.includes(item.id));
    if (!selectedProducts.length) return;
    const confirmed = window.confirm(
      `¿Eliminar definitivamente ${selectedProducts.length} productos?\n\nSe borrarán sus precios, existencias y movimientos de inventario. Las ventas históricas se conservarán. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      const deleted = await deleteProducts(selectedProducts.map(item => item.id));
      setSelectedProductIds([]);
      window.alert(`${deleted} productos fueron eliminados definitivamente.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudieron eliminar los productos seleccionados.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const importProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportingProducts(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      const categoryCache = new Map<string, ProductCategory>(productCategories.map(item => [item.name.toLowerCase(), item]));
      let imported = 0;
      const errors: string[] = [];
      for (const [index, row] of rows.entries()) {
        const name = String(row.nombre || row.producto || row.name || '').trim();
        const sku = String(row.sku || '').trim();
        if (!name || !sku) {
          errors.push(`Fila ${index + 2}: falta nombre o SKU.`);
          continue;
        }
        const categoryName = String(row.categoria || row.category || 'Sin categoría').trim();
        let category = categoryCache.get(categoryName.toLowerCase());
        if (!category) {
          category = { id: makeId(`cat-${index}`), name: categoryName, slug: slugify(categoryName), active: true };
          try {
            await saveCategory(category);
            categoryCache.set(categoryName.toLowerCase(), category);
          } catch (error) {
            errors.push(`Fila ${index + 2} (${sku}): no se pudo guardar la categoría. ${error instanceof Error ? error.message : ''}`);
            continue;
          }
        }
        const now = new Date().toISOString();
        const productId = makeId(`prd-${index}`);
        const variantId = makeId(`var-${index}`);
        try {
          await saveProductBundle(
            { id: productId, sku, name, description: String(row.descripcion || ''), categoryId: category.id, categoryName: category.name, brand: String(row.marca || ''), unit: String(row.unidad || 'unidad'), status: 'active', taxRate: Number(row.iva || 0), regulatoryRegistration: String(row.registro_sanitario || '') || undefined, createdAt: now, updatedAt: now },
            { id: variantId, productId, name: String(row.presentacion || 'Presentación estándar'), sku, barcode: String(row.codigo_barras || '') || undefined, attributes: {}, active: true },
            { id: makeId(`price-${index}`), productId, variantId, cost: Number(row.costo || 0), salePrice: Number(row.precio || row.precio_venta || 0), taxRate: Number(row.iva || 0), updatedAt: now },
          );
          imported += 1;
        } catch (error) {
          errors.push(`Fila ${index + 2} (${sku}): ${error instanceof Error ? error.message : 'error al guardar'}`);
        }
      }
      const summary = `${imported} de ${rows.length} productos fueron guardados en Supabase.`;
      window.alert(errors.length ? `${summary}\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... y ${errors.length - 10} errores más.` : ''}` : summary);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo leer el archivo.');
    } finally {
      setImportingProducts(false);
      event.target.value = '';
    }
  };

  const views: Array<{ id: View; label: string; icon: React.ComponentType<{ className?: string }>; admin?: boolean }> = [
    { id: 'catalog', label: 'Catálogo', icon: Archive },
    { id: 'inventory', label: 'Inventario', icon: Boxes },
    { id: 'movements', label: 'Movimientos', icon: History, admin: true },
  ];

  const summaryCards: Array<[string, string | number, string]> = [
    ['Productos activos', products.filter(item => item.status === 'active').length, 'text-emerald-600'],
    ...(canSeeStockQuantity ? [
      ['Unidades disponibles', inventory.reduce((sum, item) => sum + item.quantity - item.reservedQuantity, 0), 'text-teal-600'] as [string, number, string],
      ['Stock bajo', lowStock.length, lowStock.length ? 'text-amber-600' : 'text-slate-600'] as [string, number, string],
    ] : []),
    ['Valor inventario', canSeeCosts ? money(inventory.reduce((sum, item) => sum + item.quantity * (pricesByVariant.get(item.variantId)?.cost || 0), 0)) : 'Restringido', 'text-indigo-600'],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Operación comercial</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Productos e inventario</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Catálogo, precios, existencias y trazabilidad por tienda.</p>
        </div>
        {isAdmin && <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importProducts} />
          <button disabled={importingProducts} onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:cursor-wait disabled:opacity-50 dark:border-neutral-700"><FileUp className="h-4 w-4" /> {importingProducts ? 'Guardando…' : 'Importar Excel'}</button>
          <button onClick={() => openProduct()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Nuevo producto</button>
        </div>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/60"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className={`mt-1 text-xl font-black ${color}`}>{value}</p></div>)}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
        {views.filter(item => canSeeStockQuantity && (!item.admin || isAdmin || (item.id === 'movements' && canSeeCosts)) || item.id === 'catalog').map(item => <button key={item.id} onClick={() => setView(item.id)} className={`flex min-w-max items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${view === item.id ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
      </div>

      {view === 'catalog' && <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre, SKU o código de barras" className={`${fieldClass} pl-9`} /></div>
          {isAdmin && <div className="flex flex-wrap gap-2">
            {selectedProductIds.length > 0 && <button disabled={bulkDeleting} onClick={() => void confirmBulkDelete()} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"><Trash2 className="h-4 w-4" /> {bulkDeleting ? 'Eliminando…' : `Eliminar seleccionados (${selectedProductIds.length})`}</button>}
            <button disabled={bulkDeleting} onClick={() => setCategoryOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold disabled:opacity-50 dark:border-neutral-700"><Tags className="h-4 w-4" /> Nueva categoría</button>
          </div>}
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="border-b border-slate-200 text-[10px] uppercase text-slate-400 dark:border-neutral-800"><tr>{isAdmin && <th className="w-10 p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisibleProducts} disabled={!visibleProductIds.length || bulkDeleting} aria-label="Seleccionar todos los productos visibles" className="h-4 w-4 accent-emerald-600" /></th>}<th className="p-3">Producto</th><th className="p-3">SKU / código</th><th className="p-3">Precio</th>{canSeeCosts && <th className="p-3">Costo / margen</th>}<th className="p-3">{canSeeStockQuantity ? 'Disponible' : 'Disponibilidad'}</th><th className="p-3">Estado</th>{isAdmin && <th className="p-3" />}</tr></thead><tbody>
          {filteredProducts.map(product => { const variant = variantsByProduct.get(product.id); const price = variant ? pricesByVariant.get(variant.id) : undefined; const margin = price?.salePrice ? ((price.salePrice - price.cost) / price.salePrice) * 100 : 0; const deleting = deletingProductId === product.id || bulkDeleting; const selected = selectedProductIds.includes(product.id); const stock = variant ? availableStock(variant.id) : 0; return <tr key={product.id} className={`border-b border-slate-100 dark:border-neutral-800/70 ${selected ? 'bg-emerald-50/70 dark:bg-emerald-950/20' : ''}`}>{isAdmin && <td className="p-3"><input type="checkbox" checked={selected} onChange={() => toggleProductSelection(product.id)} disabled={deleting} aria-label={`Seleccionar ${product.name}`} className="h-4 w-4 accent-emerald-600" /></td>}<td className="p-3"><p className="font-extrabold text-slate-900 dark:text-white">{product.name}</p><p className="text-[10px] text-slate-400">{product.categoryName} · {product.brand || 'Sin marca'}</p></td><td className="p-3 font-mono"><p>{variant?.sku || product.sku}</p><p className="text-[10px] text-slate-400">{variant?.barcode || 'Sin código'}</p></td><td className="p-3 font-extrabold">{money(price?.promoPrice || price?.salePrice || 0)}</td>{canSeeCosts && <td className="p-3"><p>{money(price?.cost || 0)}</p><p className={margin < 20 ? 'text-amber-600' : 'text-emerald-600'}>{margin.toFixed(1)}%</p></td>}<td className="p-3 font-black">{canSeeStockQuantity ? stock : <span className={stock > 0 ? 'text-emerald-600' : 'text-slate-400'}>{stock > 0 ? 'Disponible' : 'Sin existencias'}</span>}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{product.status === 'active' ? 'Activo' : product.status}</span></td>{isAdmin && <td className="p-3"><div className="flex gap-1"><button disabled={deleting} onClick={() => openProduct(product)} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-neutral-800" title="Editar"><Pencil className="h-4 w-4" /></button><button disabled={deleting} onClick={() => window.confirm(`¿Descontinuar ${product.name}?`) && deactivateProduct(product.id)} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-40" title="Descontinuar"><X className="h-4 w-4" /></button><button disabled={deleting} onClick={() => void confirmDeleteProduct(product)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-40" title="Eliminar definitivamente" aria-label={`Eliminar definitivamente ${product.name}`}><Trash2 className="h-4 w-4" /></button></div></td>}</tr>; })}
        </tbody></table>{filteredProducts.length === 0 && <p className="p-10 text-center text-sm text-slate-400">No hay productos para mostrar.</p>}</div>
      </section>}

      {view === 'inventory' && canSeeStockQuantity && <InventoryView inventory={inventory} isAdmin={isAdmin} onAdjust={() => setStockOpen(true)} />}
      {view === 'movements' && <MovementView movements={inventoryMovements} />}

      {productOpen && <Modal title={editingProductId ? 'Editar producto' : 'Nuevo producto'} onClose={() => setProductOpen(false)}><form onSubmit={submitProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre *"><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className={fieldClass} /></Field>
        <Field label="SKU *"><input required value={draft.sku} onChange={e => setDraft({ ...draft, sku: e.target.value })} className={fieldClass} /></Field>
        <Field label="Categoría"><select value={draft.categoryId} onChange={e => setDraft({ ...draft, categoryId: e.target.value })} className={fieldClass}><option value="">Sin categoría</option>{productCategories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Marca"><input value={draft.brand} onChange={e => setDraft({ ...draft, brand: e.target.value })} className={fieldClass} /></Field>
        <Field label="Costo"><input type="number" min="0" value={draft.cost} onChange={e => setDraft({ ...draft, cost: Number(e.target.value) })} className={fieldClass} /></Field>
        <Field label="Precio de venta *"><input required type="number" min="0" value={draft.salePrice} onChange={e => setDraft({ ...draft, salePrice: Number(e.target.value) })} className={fieldClass} /></Field>
        <Field label="IVA %"><input type="number" min="0" max="100" value={draft.taxRate} onChange={e => setDraft({ ...draft, taxRate: Number(e.target.value) })} className={fieldClass} /></Field>
        <Field label="Estado"><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Product['status'] })} className={fieldClass}><option value="active">Activo</option><option value="out_of_stock">Agotado</option><option value="suspended">Suspendido</option><option value="discontinued">Descontinuado</option></select></Field>
        <Field label="Imagen"><input type="url" value={draft.imageUrl} onChange={e => setDraft({ ...draft, imageUrl: e.target.value })} className={fieldClass} /></Field>
        <div className="sm:col-span-2"><Field label="Descripción"><textarea rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className={fieldClass} /></Field></div>
        <Actions onCancel={() => setProductOpen(false)} label={savingProduct ? 'Guardando…' : 'Guardar producto'} disabled={savingProduct} />
      </form></Modal>}

      {categoryOpen && <CategoryModal onClose={() => setCategoryOpen(false)} onSave={saveCategory} />}
      {stockOpen && <StockModal inventory={inventory} products={products} variants={productVariants} stores={stores} onClose={() => setStockOpen(false)} onSave={adjustInventory} />}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label><span className={labelClass}>{label}</span>{children}</label>;
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black dark:text-white">{title}</h2><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-neutral-900"><X className="h-5 w-5" /></button></div>{children}</div></div>;
const Actions: React.FC<{ onCancel: () => void; label: string; disabled?: boolean }> = ({ onCancel, label, disabled = false }) => <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-neutral-800 sm:col-span-2"><button type="button" disabled={disabled} onClick={onCancel} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold disabled:opacity-50 dark:bg-neutral-800">Cancelar</button><button type="submit" disabled={disabled} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60">{label}</button></div>;

const InventoryView = ({ inventory, isAdmin, onAdjust }: { inventory: InventoryItem[]; isAdmin: boolean; onAdjust: () => void }) => <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/60">{isAdmin && <div className="mb-4 flex justify-end"><button onClick={onAdjust} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Ajustar existencias</button></div>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{inventory.map(item => { const available = item.quantity - item.reservedQuantity; const low = available <= item.minStock; return <article key={item.id} className={`rounded-2xl border p-4 ${low ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20' : 'border-slate-200 dark:border-neutral-800'}`}><div className="flex justify-between"><div><p className="font-black dark:text-white">{item.productName}</p><p className="text-[10px] text-slate-400">{item.sku} · {item.storeName}</p></div>{low && <AlertTriangle className="h-5 w-5 text-amber-500" />}</div><div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] uppercase text-slate-400">Disponible</p><p className="text-2xl font-black">{available}</p></div><p className="text-[10px] text-slate-400">Mín. {item.minStock} · Máx. {item.maxStock}</p></div></article>; })}</div>{!inventory.length && <p className="p-10 text-center text-sm text-slate-400">Todavía no hay existencias registradas.</p>}</section>;
const MovementView = ({ movements }: { movements: ReturnType<typeof useApp>['inventoryMovements'] }) => <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/60"><div className="space-y-2">{movements.slice(0, 100).map(item => <article key={item.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black dark:text-white">{item.productName} · {item.storeName}</p><p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString('es-CO')} · {item.userName} · {item.reason}</p></div><div className="text-right"><p className={`font-black ${item.quantity >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{item.quantity >= 0 ? '+' : ''}{item.quantity}</p><p className="text-[10px] text-slate-400">{item.previousQuantity} → {item.newQuantity}</p></div></article>)}</div></section>;

const CategoryModal = ({ onClose, onSave }: { onClose: () => void; onSave: (item: ProductCategory) => Promise<void> }) => { const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [saving, setSaving] = useState(false); return <Modal title="Nueva categoría" onClose={onClose}><form onSubmit={async e => { e.preventDefault(); setSaving(true); try { await onSave({ id: makeId('cat'), name, slug: slugify(name), description, active: true }); onClose(); } catch (error) { window.alert(error instanceof Error ? error.message : 'No se pudo guardar la categoría en Supabase.'); } finally { setSaving(false); } }} className="grid gap-3"><Field label="Nombre *"><input required value={name} onChange={e => setName(e.target.value)} className={fieldClass} /></Field><Field label="Descripción"><textarea value={description} onChange={e => setDescription(e.target.value)} className={fieldClass} /></Field><Actions onCancel={onClose} label={saving ? 'Guardando…' : 'Guardar categoría'} disabled={saving} /></form></Modal>; };
const StockModal = ({ inventory, products, variants, stores, onClose, onSave }: { inventory: InventoryItem[]; products: Product[]; variants: ProductVariant[]; stores: ReturnType<typeof useApp>['stores']; onClose: () => void; onSave: ReturnType<typeof useApp>['adjustInventory'] }) => { const [variantId, setVariantId] = useState(variants[0]?.id || ''); const [storeId, setStoreId] = useState(stores[0]?.id || ''); const [delta, setDelta] = useState(0); const [reason, setReason] = useState('Conteo físico'); return <Modal title="Ajustar existencias" onClose={onClose}><form onSubmit={e => { e.preventDefault(); const variant = variants.find(v => v.id === variantId)!; const product = products.find(p => p.id === variant.productId)!; const store = stores.find(s => s.id === storeId)!; const existing = inventory.find(i => i.variantId === variantId && i.storeId === storeId); onSave(existing || { id: `${storeId}:${variantId}`, storeId, storeName: store.name, productId: product.id, variantId, sku: variant.sku, productName: product.name, quantity: 0, reservedQuantity: 0, minStock: 2, maxStock: 100, updatedAt: new Date().toISOString() }, delta, reason); onClose(); }} className="grid gap-3 sm:grid-cols-2"><Field label="Producto"><select required value={variantId} onChange={e => setVariantId(e.target.value)} className={fieldClass}>{variants.filter(v => v.active).map(v => <option key={v.id} value={v.id}>{products.find(p => p.id === v.productId)?.name} · {v.sku}</option>)}</select></Field><Field label="Tienda"><select required value={storeId} onChange={e => setStoreId(e.target.value)} className={fieldClass}>{stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="Cambio de cantidad (+/-)"><input required type="number" value={delta} onChange={e => setDelta(Number(e.target.value))} className={fieldClass} /></Field><Field label="Motivo"><input required value={reason} onChange={e => setReason(e.target.value)} className={fieldClass} /></Field><Actions onCancel={onClose} label="Aplicar ajuste" /></form></Modal>; };
