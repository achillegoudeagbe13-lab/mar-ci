import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/utils/api";

export type UserTier = "gratuit" | "premium" | "vip";
export type UserCountry = "togo" | "benin";

export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  date: string;
}

export interface AppUser {
  id: string;
  username: string;
  country: UserCountry;
  tier: UserTier;
  tierExpiry?: string | null;
  trialStart: string;
  blocked: boolean;
  notifications: AppNotification[];
  createdAt: string;
  whatsapp?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  users: AppUser[];
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, country: UserCountry, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserTier: (userId: string, tier: UserTier, days?: number) => Promise<void>;
  blockUser: (userId: string, blocked: boolean) => Promise<void>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (username: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendNotification: (targetId: string | "all", message: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  changePassword: (oldPwd: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  updateWhatsapp: (phone: string) => Promise<void>;
  updateAvatar: (base64: string) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  unreadCount: number;
  hasFiscalAccess: boolean;
  daysRemaining: number | null;
  fiscalExpired: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "marci_session_id";
const LOCAL_USERS_KEY = "marci_local_users";
const USER_PROFILE_CACHE = (id: string) => `marci_user_profile_${id}`;
const FREE_TRIAL_DAYS = 10;

// ─── Local fallback helpers ───────────────────────────────────────
async function localGetUser(id: string): Promise<AppUser | null> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  const users: (AppUser & { password: string })[] = raw ? JSON.parse(raw) : [];
  const found = users.find((u) => u.id === id);
  if (!found) return null;
  const { password: _p, ...safe } = found as any;
  return safe as AppUser;
}

async function localGetAllUsers(): Promise<AppUser[]> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  const users: any[] = raw ? JSON.parse(raw) : [];
  return users.map(({ password: _p, ...safe }: any) => safe as AppUser);
}

async function localLogin(username: string, password: string): Promise<AppUser | null> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  const users: (AppUser & { password: string })[] = raw ? JSON.parse(raw) : [];
  const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && (u as any).password === password);
  if (!found || found.blocked) return null;
  const { password: _p, ...safe } = found as any;
  return safe as AppUser;
}

async function localRegister(username: string, password: string, country: UserCountry, phone?: string): Promise<AppUser> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  const users: any[] = raw ? JSON.parse(raw) : [];
  const id = `${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();
  const newUser = {
    id, username: username.trim(), password, country, tier: "gratuit" as UserTier,
    trialStart: now, blocked: false, notifications: [], createdAt: now, whatsapp: phone ?? null,
  };
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([...users, newUser]));
  const { password: _p, ...safe } = newUser as any;
  return safe as AppUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sessionId = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionId && sessionId !== "__admin__") {
          try {
            const userData = await api.get<AppUser>(`/marci/users/${sessionId}`);
            if (!userData.blocked) {
              setUser(userData);
              // Keep local cache fresh (avatarUrl, tier, etc.)
              await AsyncStorage.setItem(USER_PROFILE_CACHE(sessionId), JSON.stringify(userData));
            }
          } catch {
            // Try the cached profile first (has avatarUrl, latest tier…)
            const cached = await AsyncStorage.getItem(USER_PROFILE_CACHE(sessionId)).catch(() => null);
            const localUser = cached ? JSON.parse(cached) : await localGetUser(sessionId);
            if (localUser && !localUser.blocked) setUser(localUser);
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (username.toLowerCase() === "admin" && password === "1105") {
      setIsAdmin(true);
      setUser(null);
      return { success: true };
    }
    try {
      const userData = await api.post<AppUser>("/marci/auth/login", { username, password });
      setUser(userData);
      setIsAdmin(false);
      await AsyncStorage.multiSet([
        [SESSION_KEY, userData.id],
        [USER_PROFILE_CACHE(userData.id), JSON.stringify(userData)],
      ]);
      return { success: true };
    } catch (e: any) {
      const localUser = await localLogin(username, password);
      if (localUser) {
        setUser(localUser);
        setIsAdmin(false);
        await AsyncStorage.setItem(SESSION_KEY, localUser.id);
        return { success: true };
      }
      return { success: false, error: e.message ?? "Connexion impossible. Vérifiez votre connexion internet." };
    }
  }, []);

  const register = useCallback(async (username: string, password: string, country: UserCountry, phone?: string): Promise<{ success: boolean; error?: string }> => {
    if (username.trim().length < 3) return { success: false, error: "Le nom doit avoir au moins 3 caractères." };
    if (password.length < 4) return { success: false, error: "Le mot de passe doit avoir au moins 4 caractères." };
    if (username.toLowerCase() === "admin") return { success: false, error: "Ce nom d'utilisateur est réservé." };
    try {
      const userData = await api.post<AppUser>("/marci/auth/register", { username, password, country, whatsapp: phone });
      setUser(userData);
      setIsAdmin(false);
      await AsyncStorage.setItem(SESSION_KEY, userData.id);
      return { success: true };
    } catch (e: any) {
      try {
        const allLocal = await localGetAllUsers();
        if (allLocal.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, error: "Ce nom d'utilisateur est déjà pris." };
        }
        const newUser = await localRegister(username, password, country, phone);
        setUser(newUser);
        setIsAdmin(false);
        await AsyncStorage.setItem(SESSION_KEY, newUser.id);
        return { success: true };
      } catch {
        return { success: false, error: e.message ?? "Inscription impossible." };
      }
    }
  }, []);

  const logout = useCallback(async () => {
    // Only clear authentication state — never touch ads, transactions, or stocks.
    // Those live in AppContext and must NOT be wiped by a logout.
    setUser(null);
    setIsAdmin(false);
    // Note: setUsers([]) intentionally removed. The public users list is
    // not session-private data; clearing it breaks the Pub tab ad filter.
    await AsyncStorage.multiRemove([SESSION_KEY, "marci_splash_done"]);
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const data = await api.get<AppUser[]>("/marci/users");
      setUsers(data);
    } catch {
      const local = await localGetAllUsers();
      setUsers(local);
    }
  }, []);

  const updateUserTier = useCallback(async (userId: string, tier: UserTier, days?: number) => {
    const tierExpiry = (tier === "premium" && days)
      ? new Date(Date.now() + days * 86400000).toISOString()
      : undefined;
    try {
      const updated = await api.put<AppUser>(`/marci/users/${userId}/tier`, { tier, tierExpiry });
      setUsers((prev) => prev.map((u) => u.id === userId ? updated : u));
      if (user?.id === userId) setUser(updated);
    } catch (e: any) {
      throw new Error(e.message ?? "Erreur lors de la mise à jour du tier.");
    }
  }, [user]);

  const blockUser = useCallback(async (userId: string, blocked: boolean) => {
    try {
      const updated = await api.put<AppUser>(`/marci/users/${userId}/block`, { blocked });
      setUsers((prev) => prev.map((u) => u.id === userId ? updated : u));
    } catch (e: any) {
      throw new Error(e.message ?? "Erreur lors du blocage.");
    }
  }, []);

  const adminResetPassword = useCallback(async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.put(`/marci/users/${userId}/admin-password`, { newPassword });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message ?? "Erreur lors de la réinitialisation." };
    }
  }, []);

  const resetPassword = useCallback(async (username: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post("/marci/auth/reset-password", { username, code, newPassword });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message ?? "Erreur lors de la réinitialisation." };
    }
  }, []);

  const sendNotification = useCallback(async (targetId: string | "all", message: string) => {
    try {
      await api.post("/marci/notifications", { targetId, message });
      await fetchAllUsers();
      if (user && (targetId === "all" || targetId === user.id)) {
        const fresh = await api.get<AppUser>(`/marci/users/${user.id}`);
        setUser(fresh);
      }
    } catch { /* Ignore */ }
  }, [user, fetchAllUsers]);

  const markNotificationsRead = useCallback(async () => {
    if (!user) return;
    const readAll = user.notifications.map((n) => ({ ...n, read: true }));
    setUser({ ...user, notifications: readAll });
    try {
      await api.put(`/marci/users/${user.id}/notifications/read`, {});
    } catch { /* Ignore */ }
  }, [user]);

  const changePassword = useCallback(async (oldPwd: string, newPwd: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Non connecté." };
    if (newPwd.length < 4) return { success: false, error: "Minimum 4 caractères requis." };
    try {
      await api.put(`/marci/users/${user.id}/password`, { oldPassword: oldPwd, newPassword: newPwd });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message ?? "Erreur lors du changement de mot de passe." };
    }
  }, [user]);

  const updateWhatsapp = useCallback(async (phone: string) => {
    if (!user) return;
    try {
      await api.put(`/marci/users/${user.id}/whatsapp`, { whatsapp: phone });
      setUser({ ...user, whatsapp: phone });
    } catch {
      setUser({ ...user, whatsapp: phone });
    }
  }, [user]);

  const updateAvatar = useCallback(async (base64: string) => {
    if (!user) return;
    try {
      await api.put(`/marci/users/${user.id}/avatar`, { avatarUrl: base64 });
    } catch { /* store locally even if API fails */ }
    const updated = { ...user, avatarUrl: base64 };
    setUser(updated);
    // Keep local profile cache up-to-date so avatar survives offline re-login
    await AsyncStorage.setItem(USER_PROFILE_CACHE(user.id), JSON.stringify(updated));
  }, [user]);

  const getFiscalAccess = () => {
    if (!user) return { hasFiscalAccess: false, daysRemaining: null as number | null, fiscalExpired: false };
    if (user.tier === "vip") return { hasFiscalAccess: true, daysRemaining: null as number | null, fiscalExpired: false };
    if (user.tier === "premium") {
      if (!user.tierExpiry) return { hasFiscalAccess: true, daysRemaining: null as number | null, fiscalExpired: false };
      const days = Math.ceil((new Date(user.tierExpiry).getTime() - Date.now()) / 86400000);
      return { hasFiscalAccess: days > 0, daysRemaining: Math.max(0, days), fiscalExpired: days <= 0 };
    }
    const trialDays = Math.ceil((new Date(user.trialStart).getTime() + FREE_TRIAL_DAYS * 86400000 - Date.now()) / 86400000);
    return { hasFiscalAccess: trialDays > 0, daysRemaining: Math.max(0, trialDays) as number | null, fiscalExpired: trialDays <= 0 };
  };

  const { hasFiscalAccess, daysRemaining, fiscalExpired } = getFiscalAccess();
  const unreadCount = user?.notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <AuthContext.Provider value={{
      user, users, isAdmin, isLoading,
      login, register, logout,
      updateUserTier, blockUser, adminResetPassword, resetPassword,
      sendNotification, markNotificationsRead,
      changePassword, updateWhatsapp, updateAvatar, fetchAllUsers,
      unreadCount, hasFiscalAccess, daysRemaining, fiscalExpired,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export { FREE_TRIAL_DAYS };
