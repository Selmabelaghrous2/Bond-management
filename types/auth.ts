export type AppRole = "admin" | "backoffice" | "analyste" | "systeme";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  backoffice: "Back Office",
  analyste: "Analyste Financier",
  systeme: "Système Externe",
};

export const ROLE_ROUTES: Record<AppRole, string> = {
  admin: "/admin",
  backoffice: "/backoffice",
  analyste: "/analyste",
  systeme: "/systeme-externe",
};
