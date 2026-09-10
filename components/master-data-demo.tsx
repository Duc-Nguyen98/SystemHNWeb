'use client';
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { SKU_FIXTURES, SKU_BRANDS, SKU_MODELS, type Sku } from '@/lib/sku-demo';
import {
  createCatalogFixtures,
  catalogImpact,
  validateCatalog,
  type CatalogRecord,
  type CatalogType,
} from '@/lib/catalog-demo';

type SharedData = {
  skus: Sku[];
  setSkus: Dispatch<SetStateAction<Sku[]>>;
  catalogs: CatalogRecord[];
  saveCatalog: (draft: CatalogRecord) => CatalogRecord | null;
};
const DemoContext = createContext<SharedData | null>(null);
export function MasterDataDemoProvider({ children }: { children: ReactNode }) {
  const [skus, setSkus] = useState(() => SKU_FIXTURES.map((s) => ({ ...s })));
  const [catalogs, setCatalogs] = useState(() =>
    createCatalogFixtures(SKU_BRANDS, SKU_MODELS),
  );
  function saveCatalog(draft: CatalogRecord) {
    const before = catalogs.find((r) => r.id === draft.id);
    if (
      (before && before.revision !== draft.revision) ||
      Object.keys(validateCatalog(draft, catalogs)).length ||
      catalogImpact(before, draft, catalogs, skus).blocked
    )
      return null;
    const saved = {
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      id: draft.id || `${draft.type}:demo-${crypto.randomUUID()}`,
      reference: draft.reference || draft.code.trim(),
      revision: (before?.revision || 0) + 1,
    };
    setCatalogs((old) =>
      before
        ? old.map((r) => (r.id === before.id ? saved : r))
        : [...old, saved],
    );
    return saved;
  }
  return (
    <DemoContext.Provider value={{ skus, setSkus, catalogs, saveCatalog }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useMasterDataDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('Master data DEMO provider is missing.');
  const { catalogs } = value;
  const collator = new Intl.Collator('vi', {
    numeric: true,
    sensitivity: 'accent',
  });
  const brandName = (ref: string) =>
    catalogs.find((r) => r.type === 'brand' && r.reference === ref)?.name ||
    'Chưa có';
  const brands = catalogs
    .filter((r) => r.type === 'brand')
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((r) => ({ value: r.reference, label: r.name, active: r.active }));
  const models = catalogs
    .filter((r) => r.type === 'model')
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((r) => ({
      value: r.reference,
      brand: r.brand,
      active: r.active,
      label: r.name,
    }));
  const modelsFor = (brand: string) =>
    models.filter((m) => m.brand === brand && m.active);
  const referenceLabel = (type: CatalogType, ref: string) =>
    catalogs.find((r) => r.type === type && r.reference === ref)?.name || ref;
  const referenceValue = (type: CatalogType, label: string) => {
    const matches = catalogs.filter((r) => r.type === type && r.name === label);
    return matches.length === 1 ? matches[0].reference : label;
  };
  return {
    ...value,
    brandName,
    brands,
    models,
    modelsFor,
    referenceLabel,
    referenceValue,
  };
}
