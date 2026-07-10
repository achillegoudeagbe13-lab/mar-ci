import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/utils/api";

export type TransactionType = "entree" | "sortie";

export interface Transaction {
  id: string;
  type: TransactionType;
  montant: number;
  description: string;
  categorie: string;
  date: string;
  linkedStockId?: string;
  linkedStockQty?: number;
}

export interface StockItem {
  id: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  categorie: string;
}

export type AdContactType = "phone" | "email" | "web" | "whatsapp" | "laba";
export type AdTier = "gratuit" | "vip" | "premium";

export interface Ad {
  id: string;
  titre: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: string;
  cta: string;
  contact: string;
  contactType: AdContactType;
  imageUrl?: string | null;
  tier: AdTier;
  actif: boolean;
  dateAjout: string;
  ownerId?: string | null;
  ownerUsername?: string | null;
}

interface AppContextType {
  transactions: Transaction[];
  stocks: StockItem[];
  ads: Ad[];
  isDemoMode: boolean;
  addTransaction: (tx: Omit<Transaction, "id" | "date">) => void;
  addStock: (item: Omit<StockItem, "id">) => void;
  updateStock: (id: string, updates: Partial<StockItem>) => void;
  deleteStock: (id: string) => void;
  deleteTransaction: (id: string) => void;
  reduceStock: (stockId: string, qty: number) => void;
  addAd: (ad: Omit<Ad, "id" | "dateAjout">) => Promise<void>;
  updateAd: (id: string, updates: Partial<Ad>) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
  toggleDemoMode: (on: boolean) => Promise<void>;
  refreshAds: () => Promise<void>;
  soldeCaisse: number;
  totalEntrees: number;
  totalSorties: number;
  valeurMagasin: number;
}

const AppContext = createContext<AppContextType | null>(null);

const TX_KEY = (uid: string) => `marci_tx_${uid}`;
const ST_KEY = (uid: string) => `marci_stocks_${uid}`;
const ADS_CACHE_KEY = "marci_ads_cache";
const DEMO_MODE_KEY = "marci_demo_mode";

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "d1", type: "entree", montant: 150000, description: "Vente produits marché de Lomé", categorie: "Ventes", date: new Date().toISOString() },
  { id: "d2", type: "sortie", montant: 45000, description: "Achat fournitures bureau", categorie: "Achats", date: new Date(Date.now() - 86400000).toISOString() },
  { id: "d3", type: "entree", montant: 80000, description: "Prestation de service client", categorie: "Services", date: new Date(Date.now() - 172800000).toISOString() },
  { id: "d4", type: "sortie", montant: 12000, description: "Transport marchandises", categorie: "Transport", date: new Date(Date.now() - 259200000).toISOString() },
  { id: "d5", type: "entree", montant: 95000, description: "Vente lots textiles", categorie: "Ventes", date: new Date(Date.now() - 345600000).toISOString() },
];

const DEMO_STOCKS: StockItem[] = [
  { id: "ds1", nom: "Téléphones Samsung", quantite: 12, prixUnitaire: 85000, categorie: "Électronique" },
  { id: "ds2", nom: "Sacs en tissu", quantite: 2, prixUnitaire: 3500, categorie: "Textile" },
  { id: "ds3", nom: "Huile d'arachide (L)", quantite: 200, prixUnitaire: 900, categorie: "Alimentaire" },
  { id: "ds4", nom: "Chaussures sport", quantite: 1, prixUnitaire: 18000, categorie: "Textile" },
  { id: "ds5", nom: "Riz (sacs 25kg)", quantite: 40, prixUnitaire: 14000, categorie: "Alimentaire" },
];

export const DEMO_ADS: Ad[] = [
  { id: "__demo_a1__", titre: "Samsung Store Lomé", ownerId: "__demo__", description: "Téléphones, tablettes et accessoires Samsung. Livraison rapide dans tout le Togo.", badge: "TECHNOLOGIE", badgeColor: "#2563eb", icon: "smartphone", cta: "Contacter sur WhatsApp", contact: "90000001", contactType: "whatsapp", tier: "premium", actif: true, dateAjout: new Date().toISOString() },
  { id: "__demo_a2__", titre: "Boutique Sacs & Mode Fatou", ownerId: "__demo__", description: "Sacs tendance, pagnes et accessoires de mode. Qualité garantie, prix doux.", badge: "MODE", badgeColor: "#ec4899", icon: "shopping-bag", cta: "Voir les modèles sur WhatsApp", contact: "90000002", contactType: "whatsapp", tier: "vip", actif: true, dateAjout: new Date().toISOString() },
  { id: "__demo_a3__", titre: "Pharmacie Centrale Cotonou", ownerId: "__demo__", description: "Médicaments, produits de santé et parapharmacie. Ouvert 7j/7.", badge: "SANTÉ", badgeColor: "#22c55e", icon: "heart", cta: "Appeler maintenant", contact: "90000003", contactType: "phone", tier: "premium", actif: true, dateAjout: new Date().toISOString() },
  { id: "__demo_a4__", titre: "Transport Express Lomé", ownerId: "__demo__", description: "Livraison de marchandises dans tout le Togo. Rapide, sécurisé et traçable.", badge: "TRANSPORT", badgeColor: "#f59e0b", icon: "truck", cta: "Réserver une livraison", contact: "90000004", contactType: "whatsapp", tier: "vip", actif: true, dateAjout: new Date().toISOString() },
  { id: "__demo_a5__", titre: "BTP & Construction Bénin", ownerId: "__demo__", description: "Ciment, fer à béton, matériaux de qualité. Devis gratuit en 24h.", badge: "BÂTIMENT", badgeColor: "#78716c", icon: "tool", cta: "Demander un devis", contact: "90000005", contactType: "whatsapp", tier: "gratuit", actif: true, dateAjout: new Date().toISOString() },
];

interface Props {
  children: React.ReactNode;
  userId?: string;
}

export function AppProvider({ children, userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [realAds, setRealAds] = useState<Ad[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const ads = isDemoMode ? [...DEMO_ADS, ...realAds] : realAds;

  // ─── EFFECT 1 : Ads — runs ONCE on mount, fully independent of session ──
  // Always hits the API directly (PostgreSQL). Cache is used only as emergency
  // fallback and is purged automatically if corrupted (quota exceeded by base64).
  useEffect(() => {
    (async () => {
      try {
        const apiAds = await api.get<Ad[]>("/marci/ads");
        setRealAds(apiAds);
        // Best-effort cache update — ignore quota errors silently
        AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(apiAds)).catch(() => {});
      } catch {
        // API unreachable — try local cache
        try {
          const cached = await AsyncStorage.getItem(ADS_CACHE_KEY);
          if (cached) setRealAds(JSON.parse(cached));
        } catch {
          // Cache corrupted (e.g. base64 quota exceeded) — purge and wait for API
          AsyncStorage.removeItem(ADS_CACHE_KEY).catch(() => {});
        }
      }
    })();
  }, []);

  // ─── EFFECT 2 : Per-user data (TX + stocks) — re-runs on login/logout ──
  // On logout (userId = undefined), we do NOT clear existing data.
  // Data is only replaced when a real userId is present.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const demoRaw = await AsyncStorage.getItem(DEMO_MODE_KEY).catch(() => null);
      const demoOn = demoRaw === "true";
      if (cancelled) return;
      setIsDemoMode(demoOn);

      // Only load per-user data when a user is actually logged in
      if (!userId) return;

      const [txRaw, stRaw] = await Promise.all([
        AsyncStorage.getItem(TX_KEY(userId)).catch(() => null),
        AsyncStorage.getItem(ST_KEY(userId)).catch(() => null),
      ]);
      if (!cancelled) {
        setTransactions(demoOn ? DEMO_TRANSACTIONS : txRaw ? JSON.parse(txRaw) : []);
        setStocks(demoOn ? DEMO_STOCKS : stRaw ? JSON.parse(stRaw) : []);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const refreshAds = useCallback(async () => {
    try {
      const apiAds = await api.get<Ad[]>("/marci/ads");
      setRealAds(apiAds);
      await AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(apiAds));
    } catch {
      const cached = await AsyncStorage.getItem(ADS_CACHE_KEY).catch(() => null);
      if (cached) setRealAds(JSON.parse(cached));
    }
  }, []);

  const saveTx = useCallback(async (txs: Transaction[]) => {
    if (!userId) return;
    await AsyncStorage.setItem(TX_KEY(userId), JSON.stringify(txs));
  }, [userId]);

  const saveSt = useCallback(async (sts: StockItem[]) => {
    if (!userId) return;
    await AsyncStorage.setItem(ST_KEY(userId), JSON.stringify(sts));
  }, [userId]);

  // ─── Demo mode ───────────────────────────────────────────────
  const toggleDemoMode = useCallback(async (on: boolean) => {
    await AsyncStorage.setItem(DEMO_MODE_KEY, on ? "true" : "false");
    setIsDemoMode(on);
    if (on) {
      setTransactions(DEMO_TRANSACTIONS);
      setStocks(DEMO_STOCKS);
    } else if (userId) {
      const [txRaw, stRaw] = await Promise.all([
        AsyncStorage.getItem(TX_KEY(userId)).catch(() => null),
        AsyncStorage.getItem(ST_KEY(userId)).catch(() => null),
      ]);
      setTransactions(txRaw ? JSON.parse(txRaw) : []);
      setStocks(stRaw ? JSON.parse(stRaw) : []);
    } else {
      setTransactions([]);
      setStocks([]);
    }
  }, [userId]);

  // ─── Ads (API + cache) ────────────────────────────────────────
  const addAd = useCallback(async (ad: Omit<Ad, "id" | "dateAjout">) => {
    try {
      const created = await api.post<Ad>("/marci/ads", ad);
      setRealAds((prev) => {
        const u = [created, ...prev];
        AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(u));
        return u;
      });
    } catch {
      // Local fallback
      const id = `${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
      const newAd: Ad = { ...ad, id, dateAjout: new Date().toISOString() };
      setRealAds((prev) => {
        const u = [newAd, ...prev];
        AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(u));
        return u;
      });
    }
  }, []);

  const updateAd = useCallback(async (id: string, updates: Partial<Ad>) => {
    try {
      const updated = await api.put<Ad>(`/marci/ads/${id}`, updates);
      setRealAds((prev) => {
        const u = prev.map((a) => a.id === id ? updated : a);
        AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(u));
        return u;
      });
    } catch {
      setRealAds((prev) => {
        const u = prev.map((a) => a.id === id ? { ...a, ...updates } : a);
        AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(u));
        return u;
      });
    }
  }, []);

  const deleteAd = useCallback(async (id: string) => {
    // Optimistic update
    setRealAds((prev) => {
      const u = prev.filter((a) => a.id !== id);
      AsyncStorage.setItem(ADS_CACHE_KEY, JSON.stringify(u));
      return u;
    });
    try {
      await api.del(`/marci/ads/${id}`);
    } catch {
      // Already removed from local state; re-fetch to ensure consistency
      refreshAds();
    }
  }, [refreshAds]);

  // ─── Transactions ─────────────────────────────────────────────
  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "date">) => {
    const newTx: Transaction = {
      ...tx,
      id: `${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
    };
    setTransactions((prev) => { const u = [newTx, ...prev]; if (!isDemoMode) saveTx(u); return u; });
  }, [saveTx, isDemoMode]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => { const u = prev.filter((t) => t.id !== id); if (!isDemoMode) saveTx(u); return u; });
  }, [saveTx, isDemoMode]);

  // ─── Stocks ───────────────────────────────────────────────────
  const addStock = useCallback((item: Omit<StockItem, "id">) => {
    const newItem: StockItem = { ...item, id: `${Date.now()}${Math.random().toString(36).substr(2, 5)}` };
    setStocks((prev) => { const u = [newItem, ...prev]; if (!isDemoMode) saveSt(u); return u; });
  }, [saveSt, isDemoMode]);

  const updateStock = useCallback((id: string, updates: Partial<StockItem>) => {
    setStocks((prev) => { const u = prev.map((s) => s.id === id ? { ...s, ...updates } : s); if (!isDemoMode) saveSt(u); return u; });
  }, [saveSt, isDemoMode]);

  const deleteStock = useCallback((id: string) => {
    setStocks((prev) => { const u = prev.filter((s) => s.id !== id); if (!isDemoMode) saveSt(u); return u; });
  }, [saveSt, isDemoMode]);

  const reduceStock = useCallback((stockId: string, qty: number) => {
    setStocks((prev) => {
      const u = prev.map((s) => s.id === stockId ? { ...s, quantite: Math.max(0, s.quantite - qty) } : s);
      if (!isDemoMode) saveSt(u);
      return u;
    });
  }, [saveSt, isDemoMode]);

  const totalEntrees = transactions.filter((t) => t.type === "entree").reduce((s, t) => s + t.montant, 0);
  const totalSorties = transactions.filter((t) => t.type === "sortie").reduce((s, t) => s + t.montant, 0);
  const soldeCaisse = totalEntrees - totalSorties;
  const valeurMagasin = stocks.reduce((s, i) => s + i.quantite * i.prixUnitaire, 0);

  return (
    <AppContext.Provider value={{
      transactions, stocks, ads, isDemoMode,
      addTransaction, addStock, updateStock, deleteStock, deleteTransaction, reduceStock,
      addAd, updateAd, deleteAd, toggleDemoMode, refreshAds,
      soldeCaisse, totalEntrees, totalSorties, valeurMagasin,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
