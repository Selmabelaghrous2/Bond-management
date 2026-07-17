
export const admin= {
  id: "admin",
  name: "Administrateur",
  description: "Configure et supervise la plateforme : utilisateurs, droits d'accès et référentiels.",
  role: "admin",
  icon: "ShieldCheck",
  color: "brass",
  requiresLogin: true,
  route: "/admin",
  useCases: [
    { id: "UC-07", title: "Se connecter" },
    { id: "UC-08", title: "Gérer les utilisateurs" },
    { id: "UC-09", title: "Gérer les rôles et les permissions" },
  ],
};

export const backOffice = {
  id: "back-office",
  name: "Gestionnaire Back Office",
  description: "Gère le cycle de vie complet des obligations : saisie, mise à jour, calculs et reporting.",
  role: "backoffice",
  icon: "Briefcase",
  color: "navy",
  requiresLogin: true,
  route: "/back-office",
  useCases: [
    { id: "UC-01", title: "Se connecter" },
    { id: "UC-02", title: "Gérer les obligations" },
    { id: "UC-03", title: "Mettre à jour les données" },
  ],
};

export const analysteFinancier = {
  id: "analyste",
  name: "Analyste Financier",
  description: "Étudie les courbes de taux, les échéanciers et les prix de marché pour évaluer les obligations.",
  role: "analyste",
  icon: "LineChart",
  color: "navy",
  requiresLogin: true,
  route: "/analyste",
  useCases: [
    { id: "UC-13", title: "Se connecter" },
    { id: "UC-14", title: "Consulter les courbes" },
    { id: "UC-15", title: "Analyser les obligations" },
  ],
};

export const systemeExterne = {
  id: "systeme-externe",
  name: "Système Externe",
  description: "Consulte la documentation API et les services exposés par la plateforme.",
  role: "systeme",
  icon: "Plug",
  color: "brass",
  requiresLogin: false,
  route: "/systeme-externe",
  useCases: [
    { id: "UC-19", title: "Consulter la documentation API" },
    { id: "UC-20", title: "Appeler les services exposés" },
  ],
};

export default {admin,backOffice,analysteFinancier,systemeExterne};
