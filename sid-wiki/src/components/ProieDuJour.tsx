import Link from 'next/link';
import { pad } from '@/lib/wiki';

/**
 * Bandeau « Proie du jour » de l'accueil pendant la Grande Chasse (réglée sur
 * le Dossier Central, même affichage événementiel que les décors) : un mob
 * déjà découvert, le même pour tout le monde toute la journée.
 */

export type Prey = { number: number; title: string | null; summary: string | null; image_url: string | null };

const QUEST_URL = 'https://sid-quest.vercel.app';

/** Choix du jour (heure de Paris), stable pour la journée. */
export function preyOfTheDay(mobs: Prey[], now = new Date()): Prey | null {
  if (!mobs.length) return null;
  const day = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(now); // AAAA-MM-JJ
  let h = 0;
  for (const c of `chasse-${day}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return mobs[h % mobs.length];
}

export default function ProieDuJour({ prey }: { prey: Prey | null }) {
  return (
    <section className="proie mb-5 mt-3 overflow-hidden rounded-2xl" aria-label="La Grande Chasse">
      <div className="proie-inner flex items-center gap-4 p-4 sm:p-5">
        {prey && (
          <Link href={`/mobs/${pad(prey.number)}`} className="proie-frame flex-none self-start sm:self-auto" aria-label={`Fiche de ${prey.title ?? 'la proie du jour'}`}>
            {prey.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prey.image_url} alt="" className="h-16 w-16 rounded-xl object-cover sm:h-28 sm:w-28" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl sm:h-28 sm:w-28 sm:text-4xl">☠</span>
            )}
            <span className="proie-claws" aria-hidden />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="proie-kicker font-typewriter text-xs uppercase tracking-[0.18em]">🏹 La Grande Chasse est ouverte</p>
          {prey ? (
            <>
              <h2 className="mt-1 font-typewriter text-xl font-bold sm:text-2xl">
                Proie du jour :{' '}
                <Link href={`/mobs/${pad(prey.number)}`} className="proie-name hover:underline">
                  {prey.title ?? `Mob N° ${pad(prey.number)}`}
                </Link>
              </h2>
              {prey.summary && <p className="proie-summary mt-1 line-clamp-2 text-sm">{prey.summary}</p>}
            </>
          ) : (
            <h2 className="mt-1 font-typewriter text-xl font-bold sm:text-2xl">Les pistes sont fraîches, chasseur.</h2>
          )}
          <p className="proie-foot mt-2 text-xs">
            Sur le{' '}
            <a href={`${QUEST_URL}/dashboard`} className="underline decoration-dotted underline-offset-2">
              Dossier Central
            </a>
            , suis les traces de Brasombre : trois chasses, trois jours, et le titre de Grand Veneur est à toi.
          </p>
        </div>
      </div>
    </section>
  );
}
