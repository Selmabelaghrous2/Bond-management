import Link from "next/link";
import { ArrowRight, Building2, Layers, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section — Corporate / FinTech (gris & orange) */}
      <section className="relative isolate overflow-hidden bg-black px-6 py-20 sm:py-28">
        {/* Animated grid backdrop */}
        <div
          className="animate-grid-pan pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #f28c28 1px, transparent 1px), linear-gradient(to bottom, #f28c28 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Accent blobs — orange sur noir */}
        <div className="animate-float-slow pointer-events-none absolute -left-24 top-10 h-72 w-72 bg-[#f28c28]/20 blur-[110px]" />
        <div className="animate-float-slower pointer-events-none absolute -right-16 bottom-0 h-80 w-80 bg-[#f28c28]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-left">
          <h1 className="animate-fade-in-up mt-2 font-sans text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Plateforme de gestion des{" "}
            <span className="bg-gradient-to-r from-[#f28c28] to-[#f8b56a] bg-clip-text text-transparent">
              obligations
            </span>
          </h1>

    
          <div className="animate-fade-in-up hero-delay-3 mt-10 flex flex-col items-start justify-start gap-4 sm:flex-row">
            <Link
              href="/auth"
              className="group inline-flex items-center gap-2 border border-[#f28c28] bg-[#f28c28] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e07b12]"
            >
              Accéder à mon espace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#fonctionnalites"
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:bg-white/5"
            >
              Découvrir la plateforme
            </a>
          </div>

          <div className="animate-fade-in-up hero-delay-4 mx-0 mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              { icon: Building2, label: "Multi-entité", value: "Full web" },
              { icon: ShieldCheck, label: "Conformité", value: "Automatisée" },
              { icon: Zap, label: "Livraison", value: "Agile" },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-start gap-1.5">
                <stat.icon className="h-4 w-4 text-[#f28c28]" />
                <p className="text-sm font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-4xl font-bold text-gray-900">
            Fonctionnalités Principales
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Gestion Complète",
                description: "Gestion intégrée front to back de vos portefeuilles d'obligations",
              },
              {
                title: "Analyse en Temps Réel",
                description: "Valorisation et analyse de portefeuille en temps réel versus benchmark",
              },
              {
                title: "Conformité Réglementaire",
                description: "Respect automatisé des normes et réglementations financières",
              },
              {
                title: "Simulation Avancée",
                description: "Outils de simulation et analyse « What-if » pour vos stratégies",
              },
              {
                title: "Automatisation",
                description: "Automatisation des processus Middle/Back office",
              },
              {
                title: "Reporting Intégré",
                description: "Contribution et attribution des performances",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6 hover:border-[#f28c28] hover:bg-white transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-3 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="border-y border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-4xl font-bold text-gray-900">Plateforme</h2>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              { label: "Multi-entité", value: "Full web" },
              { label: "Cross Asset", value: "Front to back" },
              { label: "Qualité/Prix", value: "Compétitif" },
              { label: "Méthodologie", value: "Agile et flexible" },
            ].map((item, idx) => (
              <div key={idx} className="border-l-4 border-[#f28c28] pl-6">
                <p className="text-sm font-semibold text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-12 text-center sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900">Prêt à commencer ?</h2>
          <p className="mt-2 text-lg text-gray-600">
            Connectez-vous pour accéder à votre espace de gestion
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-md border border-[#f28c28] px-6 py-3 text-sm font-semibold text-[#f28c28] transition hover:bg-[#f28c28] hover:text-white"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-800 text-gray-300">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-white">À propos</h3>
              <p className="mt-2 text-sm leading-relaxed">
                Plateforme de gestion des obligations destinée aux acteurs des marchés des capitaux.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Navigation</h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <Link href="/" className="hover:text-[#f28c28] transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/auth" className="hover:text-[#f28c28] transition-colors">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link href="/systeme-externe" className="hover:text-[#f28c28] transition-colors">
                    API / Système externe
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p>
                  <strong>Téléphone:</strong>
                  <br />
                  +212 (0) 5XX XXX XXX
                </p>
                <p>
                  <strong>Email:</strong>
                  <br />
                  <a
                    href="mailto:contact@bond-management.com"
                    className="hover:text-[#f28c28] transition-colors"
                  >
                    contact@bond-management.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="my-4 border-t border-gray-700" />

          <div className="flex flex-col items-center justify-between text-sm md:flex-row">
            <p className="text-gray-400">© 2026 Bond Management. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
