import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-5xl text-[50px] font-extrabold italic leading-tight tracking-tight text-black">
            Plateforme de gestion des{" "}
            <span className="text-[#f28c28]">
              obligations bancaires
            </span>
          </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-400">
  Une plateforme moderne dédiée à la gestion du cycle de vie des
  obligations bancaires, permettant d'assurer le suivi des émissions,
  la gestion des portefeuilles, la conformité réglementaire et
  l'automatisation des opérations financières.
</p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/auth"
              className="rounded-md bg-[#f28c28] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#de7b17]"
            >
              Accéder à la plateforme
            </Link>

            <a
              href="#fonctionnalites"
              className="rounded-md border border-gray-600 px-7 py-3 text-sm font-semibold text-gray-400 transition hover:border-[#f28c28] hover:text-white"
            >
              Découvrir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

   {/* Features Section */}
<section
  id="fonctionnalites"
  className="bg-white px-4 py-12"
>
  <div className="mx-auto max-w-6xl">
    <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
      Fonctionnalités principales
    </h2>

    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {[
        {
          title: "Gestion complète",
          description:
            "Gestion intégrée du cycle de vie des obligations bancaires.",
        },
        {
          title: "Suivi en temps réel",
          description:
            "Consultation des données et valorisation des portefeuilles en temps réel.",
        },
        {
          title: "Conformité",
          description:
            "Contrôle automatisé des exigences réglementaires.",
        },
        {
          title: "Simulation",
          description:
            "Analyse de scénarios et aide à la prise de décision.",
        },
        {
          title: "Automatisation",
          description:
            "Automatisation des processus Front, Middle et Back Office.",
        },
        {
          title: "Reporting",
          description:
            "Rapports et tableaux de bord de suivi des performances.",
        },
      ].map((feature, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#f28c28] hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {feature.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* Platform Section */}
<section className="bg-gray-50 px-4 py-12">
  <div className="mx-auto max-w-6xl">
    <h2 className="mb-8 text-3xl font-bold text-gray-900">
      Plateforme
    </h2>

    <div className="grid gap-5 md:grid-cols-2">
      {[
        {
          label: "Architecture",
          value: "Application Web",
        },
        {
          label: "Gestion",
          value: "Front • Middle • Back Office",
        },
        {
          label: "Sécurité",
          value: "Contrôle d'accès et traçabilité",
        },
        {
          label: "Méthodologie",
          value: "Agile et évolutive",
        },
      ].map((item, index) => (
        <div
          key={index}
          className="rounded-lg border-l-4 border-[#f28c28] bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {item.label}
          </p>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* CTA */}
      <section className="bg-white px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-gray-900">
            Accédez à votre espace
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Connectez-vous afin de gérer vos obligations bancaires dans un
            environnement sécurisé et performant.
          </p>

          <Link
            href="/auth"
            className="mt-10 inline-block rounded-md bg-[#f28c28] px-8 py-4 font-semibold text-white transition hover:bg-[#de7b17]"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-white">
                À propos
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-400">
                Plateforme de gestion des obligations bancaires destinée aux
                établissements financiers pour assurer une gestion fiable,
                sécurisée et conforme aux exigences réglementaires.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                Navigation
              </h3>

              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/"
                    className="transition hover:text-[#f28c28]"
                  >
                    Accueil
                  </Link>
                </li>

                <li>
                  <Link
                    href="/auth"
                    className="transition hover:text-[#f28c28]"
                  >
                    Connexion
                  </Link>
                </li>

                <li>
                  <Link
                    href="/systeme-externe"
                    className="transition hover:text-[#f28c28]"
                  >
                    API / Système externe
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                Contact
              </h3>

              <div className="mt-4 space-y-4 text-sm">
                <p>
                  <strong>Téléphone</strong>
                  <br />
                  +212 (0) 5XX XXX XXX
                </p>

                <p>
                  <strong>Email</strong>
                  <br />
                  <a
                    href="mailto:contact@bond-management.com"
                    className="transition hover:text-[#f28c28]"
                  >
                    contact@bond-management.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
            © 2026 Bond Management. Tous droits réservés.
          </div>
        </div>
      </footer>
    </main>
  );
}

