export default function AccessDenied() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center">
      <span className="stamp">Accès refusé</span>
      <p className="mt-4">
        Ton compte n’est pas actif. Si ta candidature est encore en attente, patiente jusqu’à la décision d’un Officier Recruteur.
      </p>
    </div>
  );
}
