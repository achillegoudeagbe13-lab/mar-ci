import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marciUsersTable = pgTable("marci_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  country: text("country").notNull().default("togo"),
  tier: text("tier").notNull().default("gratuit"),
  tierExpiry: text("tier_expiry"),
  trialStart: text("trial_start").notNull(),
  blocked: boolean("blocked").notNull().default(false),
  notifications: text("notifications").notNull().default("[]"),
  whatsapp: text("whatsapp"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull(),
});

export const marciAdsTable = pgTable("marci_ads", {
  id: text("id").primaryKey(),
  titre: text("titre").notNull(),
  description: text("description").notNull().default(""),
  badge: text("badge").notNull().default("PARTENAIRE"),
  badgeColor: text("badge_color").notNull().default("#f97316"),
  icon: text("icon").notNull().default("star"),
  cta: text("cta").notNull().default("Contacter"),
  contact: text("contact").notNull().default(""),
  contactType: text("contact_type").notNull().default("whatsapp"),
  imageUrl: text("image_url"),
  tier: text("tier").notNull().default("gratuit"),
  actif: boolean("actif").notNull().default(true),
  ownerId: text("owner_id"),
  ownerUsername: text("owner_username"),
  dateAjout: text("date_ajout").notNull(),
});

export const insertMarciAdSchema = createInsertSchema(marciAdsTable).omit({ id: true, dateAjout: true });
export type InsertMarciAd = z.infer<typeof insertMarciAdSchema>;
export type MarciAd = typeof marciAdsTable.$inferSelect;
export type MarciUser = typeof marciUsersTable.$inferSelect;
