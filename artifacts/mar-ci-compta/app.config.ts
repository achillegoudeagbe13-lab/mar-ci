import type { ConfigContext, ExpoConfig } from "expo/config";

const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN ?? "";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...(config.extra ?? {}),
    apiUrl: REPLIT_DEV_DOMAIN ? `https://${REPLIT_DEV_DOMAIN}` : "",
  },
});
