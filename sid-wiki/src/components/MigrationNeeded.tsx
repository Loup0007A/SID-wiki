/** Affiché quand une fonction de la base manque : la migration correspondante n'a pas encore été exécutée. */
export default function MigrationNeeded({ file }: { file: string }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center">
      <span className="stamp">Bientôt disponible !</span>
      <p className="mt-4">
        Cette page a besoin d’une mise à jour de la base. Un admin doit exécuter{' '}
        <code className="rounded bg-[color:var(--felt-2)] px-1.5 py-0.5 font-typewriter text-xs">supabase/migrations/{file}</code> dans le SQL Editor de Supabase.
      </p>
    </div>
  );
}

/** Erreur PostgREST « fonction introuvable » (migration non exécutée, ou cache de schéma pas encore rechargé). */
export function isMissingFunction(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST202' || error?.code === '42883';
}
