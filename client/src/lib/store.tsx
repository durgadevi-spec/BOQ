import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getJSON, postJSON, apiFetch } from "./api";

export type Role = "admin" | "supplier" | "user" | "purchase_team" | "software_team";

export interface User { id: string; name?: string; email?: string; role: Role; shopId?: string }
export interface Shop { id: string; name: string; location?: string; phoneCountryCode?: string; contactNumber?: string; city?: string; state?: string; country?: string; pincode?: string; image?: string; rating?: number; categories?: string[]; gstNo?: string; ownerId?: string; disabled?: boolean }
export interface Material { id: string; name: string; code: string; rate: number; shopId?: string; unit?: string; category?: string; brandName?: string; modelNumber?: string; subCategory?: string; technicalSpecification?: string; image?: string; attributes?: any; disabled?: boolean }

interface DataContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
  shops: Shop[];
  materials: Material[];
  approvalRequests?: any[];
  supportMessages?: any[];
  addShop: (shop: Partial<Shop>) => Promise<void>;
  addMaterial: (mat: Partial<Material>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  approveShop?: (id: string) => Promise<any>;
  rejectShop?: (id: string, reason?: string|null) => Promise<any>;
  approveMaterial?: (id: string) => Promise<any>;
  rejectMaterial?: (id: string, reason?: string|null) => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getJSON('/shops');
        if (mounted && s?.shops) setShops(s.shops);
      } catch (e) { console.warn('load shops failed', e); }
      try {
        const m = await getJSON('/materials');
        if (mounted && m?.materials) setMaterials(m.materials);
      } catch (e) { console.warn('load materials failed', e); }
    })();
    return () => { mounted = false };
  }, []);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  const addShop = async (shop: Partial<Shop>) => {
    try {
      const data = await postJSON('/shops', shop);
      if (data?.shop) setShops((p) => [data.shop, ...p]);
      return;
    } catch (e) { console.warn('addShop failed', e); }
    setShops((p) => [{ id: Math.random().toString(), name: shop.name || 'New Shop', ...(shop as any) }, ...p]);
  };

  const addMaterial = async (mat: Partial<Material>) => {
    try {
      const data = await postJSON('/materials', mat);
      if (data?.material) setMaterials((p) => [data.material, ...p]);
      return;
    } catch (e) { console.warn('addMaterial failed', e); }
    setMaterials((p) => [{ id: Math.random().toString(), name: mat.name || 'New', code: mat.code || '', rate: mat.rate || 0, ...(mat as any) }, ...p]);
  };

  const deleteShop = async (id: string) => {
    try {
      const res = await apiFetch(`/shops/${id}`, { method: 'DELETE' });
      if (res.ok) setShops((p) => p.filter(s => s.id !== id));
    } catch (e) { console.warn('deleteShop failed', e); setShops((p) => p.filter(s => s.id !== id)); }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const res = await apiFetch(`/materials/${id}`, { method: 'DELETE' });
      if (res.ok) setMaterials((p) => p.filter(m => m.id !== id));
    } catch (e) { console.warn('deleteMaterial failed', e); setMaterials((p) => p.filter(m => m.id !== id)); }
  };

  const approveShop = async (id: string) => {
    try {
      const data = await postJSON(`/shops/${id}/approve`, {});
      try { const dd = await getJSON('/shops'); if (dd?.shops) setShops(dd.shops); } catch (e) { }
      return data?.shop;
    } catch (e) { console.warn('approveShop failed', e); }
    return null;
  };

  const rejectShop = async (id: string, reason?: string|null) => {
    try {
      const data = await postJSON(`/shops/${id}/reject`, { reason });
      try { const dd = await getJSON('/shops'); if (dd?.shops) setShops(dd.shops); } catch (e) { }
      return data?.shop;
    } catch (e) { console.warn('rejectShop failed', e); }
    return null;
  };

  const approveMaterial = async (id: string) => {
    try {
      const data = await postJSON(`/materials/${id}/approve`, {});
      try { const dd = await getJSON('/materials'); if (dd?.materials) setMaterials(dd.materials); } catch (e) { }
      return data?.material;
    } catch (e) { console.warn('approveMaterial failed', e); }
    return null;
  };

  const rejectMaterial = async (id: string, reason?: string|null) => {
    try {
      const data = await postJSON(`/materials/${id}/reject`, { reason });
      try { const dd = await getJSON('/materials'); if (dd?.materials) setMaterials(dd.materials); } catch (e) { }
      return data?.material;
    } catch (e) { console.warn('rejectMaterial failed', e); }
    return null;
  };

  const contextValue: DataContextType = {
    user,
    login,
    logout,
    shops,
    materials,
    approvalRequests,
    supportMessages,
    addShop,
    addMaterial,
    deleteShop,
    deleteMaterial,
    approveShop,
    rejectShop,
    approveMaterial,
    rejectMaterial,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
