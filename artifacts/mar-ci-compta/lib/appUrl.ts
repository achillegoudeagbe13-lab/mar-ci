export function getAppShareUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "https://mar-ci-compta.replit.app";
}

export function getAppShareHost(): string {
  return getAppShareUrl().replace(/^https?:\/\//, "");
}
