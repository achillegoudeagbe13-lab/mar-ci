import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, marciUsersTable, marciAdsTable } from "@workspace/db";

const router = Router();
const RECOVERY_CODE = "Mar-ci 2026";

// ─── AUTH ────────────────────────────────────────────────────────
router.post("/marci/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return void res.status(400).json({ error: "Champs requis." });
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.username, username.trim()));
  const user = rows[0];
  if (!user || user.password !== password) return void res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
  if (user.blocked) return void res.status(403).json({ error: "Compte suspendu. Contactez l'administrateur." });
  const { password: _, ...safe } = user;
  return void res.json({ ...safe, notifications: JSON.parse(safe.notifications ?? "[]") });
});

router.post("/marci/auth/register", async (req, res) => {
  const { username, password, country, whatsapp } = req.body ?? {};
  if (!username || !password) return void res.status(400).json({ error: "Champs requis." });
  if (username.trim().length < 3) return void res.status(400).json({ error: "Le nom doit avoir au moins 3 caractères." });
  if (password.length < 4) return void res.status(400).json({ error: "Le mot de passe doit avoir au moins 4 caractères." });
  if (username.toLowerCase() === "admin") return void res.status(400).json({ error: "Ce nom d'utilisateur est réservé." });
  const existing = await db.select({ id: marciUsersTable.id }).from(marciUsersTable).where(eq(marciUsersTable.username, username.trim()));
  if (existing.length > 0) return void res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris." });
  const id = `${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();
  await db.insert(marciUsersTable).values({
    id, username: username.trim(), password, country: country ?? "togo",
    tier: "gratuit", trialStart: now, blocked: false,
    notifications: "[]", whatsapp: whatsapp ?? null, createdAt: now,
  });
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, id));
  const user = rows[0];
  const { password: _, ...safe } = user;
  return void res.status(201).json({ ...safe, notifications: [] });
});

router.post("/marci/auth/reset-password", async (req, res) => {
  const { username, code, newPassword } = req.body ?? {};
  if (!username || !code || !newPassword) return void res.status(400).json({ error: "Champs requis." });
  if (code !== RECOVERY_CODE) return void res.status(403).json({ error: "Code de déblocage incorrect. Contactez l'administrateur." });
  if (newPassword.length < 4) return void res.status(400).json({ error: "Le mot de passe doit avoir au moins 4 caractères." });
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.username, username.trim()));
  if (!rows[0]) return void res.status(404).json({ error: "Aucun compte trouvé avec ce nom." });
  await db.update(marciUsersTable).set({ password: newPassword }).where(eq(marciUsersTable.id, rows[0].id));
  return void res.json({ success: true });
});

// ─── USERS (admin) ───────────────────────────────────────────────
router.get("/marci/users", async (_req, res) => {
  const rows = await db.select().from(marciUsersTable);
  const safe = rows.map(({ password: _, ...u }) => ({ ...u, notifications: JSON.parse(u.notifications ?? "[]") }));
  return void res.json(safe);
});

router.get("/marci/users/:id", async (req, res) => {
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, req.params.id));
  if (!rows[0]) return void res.status(404).json({ error: "Utilisateur non trouvé." });
  const { password: _, ...safe } = rows[0];
  return void res.json({ ...safe, notifications: JSON.parse(safe.notifications ?? "[]") });
});

router.put("/marci/users/:id/tier", async (req, res) => {
  const { tier, tierExpiry } = req.body ?? {};
  if (!tier) return void res.status(400).json({ error: "Champ 'tier' requis." });
  await db.update(marciUsersTable).set({ tier, tierExpiry: tierExpiry ?? null }).where(eq(marciUsersTable.id, req.params.id));
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, req.params.id));
  if (!rows[0]) return void res.status(404).json({ error: "Utilisateur non trouvé." });
  const { password: _, ...safe } = rows[0];
  return void res.json({ ...safe, notifications: JSON.parse(safe.notifications ?? "[]") });
});

router.put("/marci/users/:id/block", async (req, res) => {
  const { blocked } = req.body ?? {};
  await db.update(marciUsersTable).set({ blocked: !!blocked }).where(eq(marciUsersTable.id, req.params.id));
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, req.params.id));
  if (!rows[0]) return void res.status(404).json({ error: "Utilisateur non trouvé." });
  const { password: _, ...safe } = rows[0];
  return void res.json({ ...safe, notifications: JSON.parse(safe.notifications ?? "[]") });
});

router.put("/marci/users/:id/password", async (req, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, req.params.id));
  if (!rows[0]) return void res.status(404).json({ error: "Utilisateur non trouvé." });
  if (rows[0].password !== oldPassword) return void res.status(400).json({ error: "Ancien mot de passe incorrect." });
  await db.update(marciUsersTable).set({ password: newPassword }).where(eq(marciUsersTable.id, req.params.id));
  return void res.json({ success: true });
});

router.put("/marci/users/:id/admin-password", async (req, res) => {
  const { newPassword } = req.body ?? {};
  if (!newPassword || newPassword.length < 4) return void res.status(400).json({ error: "Mot de passe trop court (min. 4 caractères)." });
  await db.update(marciUsersTable).set({ password: newPassword }).where(eq(marciUsersTable.id, req.params.id));
  return void res.json({ success: true });
});

router.put("/marci/users/:id/whatsapp", async (req, res) => {
  const { whatsapp } = req.body ?? {};
  await db.update(marciUsersTable).set({ whatsapp }).where(eq(marciUsersTable.id, req.params.id));
  return void res.json({ success: true });
});

router.put("/marci/users/:id/avatar", async (req, res) => {
  const { avatarUrl } = req.body ?? {};
  if (!avatarUrl) return void res.status(400).json({ error: "avatarUrl requis." });
  await db.update(marciUsersTable).set({ avatarUrl }).where(eq(marciUsersTable.id, req.params.id));
  return void res.json({ success: true });
});

router.post("/marci/notifications", async (req, res) => {
  const { targetId, message } = req.body ?? {};
  if (!message) return void res.status(400).json({ error: "Message vide." });
  const notif = { id: `${Date.now()}`, message, read: false, date: new Date().toISOString() };
  const users = targetId === "all"
    ? await db.select().from(marciUsersTable)
    : await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, targetId));
  for (const u of users) {
    const existing = JSON.parse(u.notifications ?? "[]");
    await db.update(marciUsersTable).set({ notifications: JSON.stringify([notif, ...existing]) }).where(eq(marciUsersTable.id, u.id));
  }
  return void res.json({ success: true, sent: users.length });
});

router.put("/marci/users/:id/notifications/read", async (req, res) => {
  const rows = await db.select().from(marciUsersTable).where(eq(marciUsersTable.id, req.params.id));
  if (!rows[0]) return void res.status(404).json({ error: "Utilisateur non trouvé." });
  const notifs = JSON.parse(rows[0].notifications ?? "[]");
  await db.update(marciUsersTable).set({ notifications: JSON.stringify(notifs.map((n: Record<string, unknown>) => ({ ...n, read: true }))) }).where(eq(marciUsersTable.id, req.params.id));
  return void res.json({ success: true });
});

// ─── ADS ─────────────────────────────────────────────────────────
router.get("/marci/ads", async (_req, res) => {
  const rows = await db.select().from(marciAdsTable);
  return void res.json(rows);
});

router.post("/marci/ads", async (req, res) => {
  const body = req.body ?? {};
  const id = `${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  await db.insert(marciAdsTable).values({ ...body, id, dateAjout: new Date().toISOString() });
  const rows = await db.select().from(marciAdsTable).where(eq(marciAdsTable.id, id));
  return void res.status(201).json(rows[0]);
});

router.put("/marci/ads/:id", async (req, res) => {
  const { id: _id, dateAjout: _d, ...updates } = req.body ?? {};
  await db.update(marciAdsTable).set(updates).where(eq(marciAdsTable.id, req.params.id));
  const rows = await db.select().from(marciAdsTable).where(eq(marciAdsTable.id, req.params.id));
  if (!rows[0]) return void res.status(404).json({ error: "Annonce non trouvée." });
  return void res.json(rows[0]);
});

router.delete("/marci/ads/:id", async (req, res) => {
  const { ownerId } = req.query as { ownerId?: string };
  const where = ownerId
    ? and(eq(marciAdsTable.id, req.params.id), eq(marciAdsTable.ownerId, ownerId))
    : eq(marciAdsTable.id, req.params.id);
  await db.delete(marciAdsTable).where(where);
  return void res.status(204).end();
});

export default router;
