/**
 * Affiché tout de suite pendant que la page se prépare côté serveur (au clic
 * sur un lien, ou à l'ouverture) : la barre du haut reste en place, et on voit
 * immédiatement que la page arrive au lieu d'attendre sur l'ancienne.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement de la page" className="wiki-loading">
      <div className="skeleton mb-3 h-8 w-56 rounded-xl" />
      <div className="skeleton mb-6 h-4 w-80 max-w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="skeleton mt-3 h-5 w-2/3 rounded-lg" />
            <div className="skeleton mt-2 h-3 w-1/2 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
