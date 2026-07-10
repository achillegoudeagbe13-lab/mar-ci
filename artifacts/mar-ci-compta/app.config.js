// app.config.js — configuration dynamique Expo
// Remplace app.json au build et injecte les variables d'environnement.
// Les valeurs EXPO_PUBLIC_* sont lues au moment du build (Metro / expo export).

const base = require("./app.json").expo;

const domain = process.env.EXPO_PUBLIC_DOMAIN || "";
const apiUrl  = process.env.EXPO_PUBLIC_API_URL  || "";

// Pour expo-router, on remplace l'origin Replit par le vrai domaine déployé.
const plugins = (base.plugins || []).map((p) => {
  if (Array.isArray(p) && p[0] === "expo-router") {
    const opts = { ...(p[1] || {}) };
    if (domain) opts.origin = `https://${domain}`;
    return ["expo-router", opts];
  }
  return p;
});

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...base,
    plugins,
    extra: {
      // Service unique : l'API est sur le même domaine que l'app.
      // apiUrl est lu par utils/api.ts → Constants.expoConfig.extra.apiUrl
      // Si vide, l'utilitaire API retombe sur window.location.origin (même domaine = OK).
      apiUrl: apiUrl || "",
    },
  },
};
