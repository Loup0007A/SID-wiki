import Link from 'next/link';
import EntryKeys from '@/components/EntryKeys';
import ListenButton from '@/components/ListenButton';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, isCategory, pad, parseNumber, type EntryFull } from '@/lib/wiki';
import Markdown from '@/components/Markdown';
import Mention from '@/components/Mention';
import Comments from '@/components/Comments';
import EntryLink from '@/components/EntryLink';
import AccessDenied from '@/components/AccessDenied';
import Infobox from '@/components/Infobox';
import Rarity from '@/components/Rarity';
import ModelViewer from '@/components/ModelViewer';
import FavoriteButton from '@/components/FavoriteButton';
import EntryTools from '@/components/EntryTools';
import ReportButton from '@/components/ReportButton';
import PersonalNote from '@/components/PersonalNote';
import ViewTracker from '@/components/ViewTracker';
import Icon from '@/components/Icon';
import { getBrand } from '@/lib/brand-server';
import SightingsMap from '@/components/SightingsMap';

export const dynamic = 'force-dynamic';

export default async function EntryPage(props: { params: Promise<{ category: string; number: string }> }) {
  const params = await props.params;
  await getBrand();
  const n = parseNumber(params.number);
  if (!isCategory(params.category) || n === null) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('wiki_get', { p_category: params.category, p_number: n });
  if (error) return <AccessDenied />;
  if (!data) notFound();

  const entry = data as EntryFull;
  // Contributeurs (propositions acceptées, migration 0211) : absent avant la migration.
  const { data: contribData } = entry.discovered
    ? await supabase.rpc('wiki_contributors', { p_category: entry.category, p_number: n })
    : { data: null };
  const contributors = ((contribData ?? []) as { nickname: string; count: number }[]).filter((c) => c.nickname);
  const isAdmin = entry.id !== null;
  const label = CATEGORY_LABELS[entry.category];
  const showMasked = !entry.discovered;
  const infoRows = (entry.infobox ?? []).filter((r) => r.label);

  const actions = (
    <div className="no-print flex flex-wrap items-center gap-2">
      <FavoriteButton category={entry.category} number={entry.number} initial={entry.favorited} />
      <EntryTools title={entry.title ?? ''} />
      {entry.discovered && (
        <Link href={`/comparer?a=${entry.category}/${pad(entry.number)}`} className="btn-ghost">
          Comparer
        </Link>
      )}
      <ListenButton title={entry.title ?? ''} summary={entry.summary ?? null} rows={infoRows} content={entry.content ?? null} />
      {isAdmin && (
        <Link href={`/admin/edit/${entry.category}/${pad(entry.number)}`} className="btn-ghost">
          Modifier
        </Link>
      )}
      <Link href={`/proposer/${entry.category}/${pad(entry.number)}`} className="btn-ghost">
        <Icon name="propose" /> Proposer une modification
      </Link>
    </div>
  );

  return (
    <article className={`cat-${entry.category}`}>
      <nav className="no-print mb-5 text-sm text-olive-700" aria-label="Fil d’Ariane">
        <Link href="/" className="hover:text-ink hover:underline">Accueil</Link>
        <span className="mx-2 text-olive-600">/</span>
        <Link href={`/${entry.category}`} className="hover:text-ink hover:underline">{label.label}</Link>
        <span className="mx-2 text-olive-600">/</span>
        <span className="text-olive-800">N° {pad(entry.number)}</span>
      </nav>

      {showMasked ? (
        <div className="mx-auto max-w-xl rounded-xl border-[1.5px] border-dashed border-[color:var(--rule-2)] px-6 py-12 text-center">
          <p className="catno text-[5.5rem] leading-none opacity-60">{pad(entry.number)}</p>
          <p className="mt-2 font-typewriter text-5xl text-[color:var(--cat)] opacity-40">?</p>
          <p className="mt-4 text-olive-800">
            {label.singular} n° {pad(entry.number)} : personne ne l’a encore croisé.
          </p>
          <span className="stamp mt-4">À découvrir en chasse</span>
          {isAdmin && (
            <div className="mt-6">
              <Link href={`/admin/edit/${entry.category}/${pad(entry.number)}`} className="btn-ghost">
                Modifier (admin)
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="entry-grid">
          {/* En-tête (téléphone : numéro + nom ; ordinateur : nom seulement) */}
          <header className="entry-head">
            <p className="catno text-[2.6rem] leading-none lg:hidden">
              <span className="mr-1 align-top font-typewriter text-base text-olive-600">N°</span>
              {pad(entry.number)}
            </p>
            <h1 className="mt-1 font-typewriter text-[2.1rem] leading-[1.08] text-olive-900 sm:text-[2.7rem] lg:mt-0">{entry.title}</h1>
            {entry.rarity ? <Rarity value={entry.rarity} className="mt-2 text-sm lg:hidden" /> : null}
            {entry.summary && <p className="mt-3 max-w-[60ch] text-[1.08rem] italic leading-relaxed text-olive-800">{entry.summary}</p>}
          </header>

          {/* Modèle 3D s'il y en a un, sinon l'image (l'image ne revient que si le
              modèle ne peut pas être chargé). L'image reste utilisée dans l'aperçu
              des liens et dans les listes (cartes du classement). */}
          <div className="entry-media">
            {entry.model_url ? (
              <>
                {/* Le fichier du modèle commence à se télécharger tout de suite, en
                    même temps que la page (au lieu d'attendre la visionneuse 3D). */}
                <link rel="preload" href={entry.model_url} as="fetch" crossOrigin="anonymous" />
                <ModelViewer
                  src={entry.model_url}
                  animation={entry.model_animation}
                  showAnimationPicker={false}
                  fallbackImage={entry.image_url}
                  fallbackAlt={entry.title ?? ''}
                />
              </>
            ) : (
              entry.image_url && (
                <figure>
                  <div className="mount mount-hero">
                    <span className="mount-corner tl" aria-hidden />
                    <span className="mount-corner tr" aria-hidden />
                    <span className="mount-corner bl" aria-hidden />
                    <span className="mount-corner br" aria-hidden />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.image_url} alt={entry.title ?? ''} className="mount-img max-h-[30rem] w-full object-cover" />
                  </div>
                  <figcaption className="specimen-label hero-label">
                    <span className="specimen-pin" aria-hidden />
                    <span className="flex items-center justify-between gap-2">
                      <span className="specimen-no">
                        {label.singular} n° {pad(entry.number)}
                      </span>
                      <Rarity value={entry.rarity} className="specimen-rarity text-xs" />
                    </span>
                    <span className="specimen-name">{entry.title}</span>
                  </figcaption>
                </figure>
              )
            )}
          </div>

          {/* Fiche signalétique : numéro, rareté, tags, découvreur, infos, actions */}
          <section aria-label="Informations de la fiche" className="entry-meta panel space-y-5 p-4 sm:p-5">
            <div className="hidden lg:block">
              <p className="font-typewriter text-sm text-olive-600">
                <Link href={`/${entry.category}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                  <Icon name={entry.category} /> {label.singular}
                </Link>
              </p>
              <p className="catno mt-1 text-[5.6rem] leading-[0.85]">{pad(entry.number)}</p>
              {entry.rarity ? <Rarity value={entry.rarity} className="mt-3 text-base" /> : null}
            </div>

            {entry.discoverer && (
              <p className="text-sm text-olive-800">
                <span className="stamp mr-1">Découvert</span> par <Mention nickname={entry.discoverer} />
              </p>
            )}

            {contributors.length > 0 && (
              <p className="text-sm text-olive-800">
                <span className="label !mb-1 block">Avec les contributions de</span>
                {contributors.map((c, i) => (
                  <span key={c.nickname}>
                    {i > 0 && ', '}
                    <Mention nickname={c.nickname} />
                  </span>
                ))}
              </p>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <Link key={t} href={`/${entry.category}?tag=${encodeURIComponent(t)}`} className="chip">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <Infobox rows={infoRows} rarity={null} />
            {actions}
          </section>

          <div className="entry-body min-w-0">
            {entry.content && <Markdown toc>{entry.content}</Markdown>}

            {entry.related.length > 0 && (
              <section className="mt-10 border-t border-[color:var(--rule)] pt-5">
                <h2 className="mb-3 font-typewriter text-xl text-olive-900">Voir aussi</h2>
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {entry.related.map((r) => (
                    <li key={`${r.category}/${r.number}`}>
                      <EntryLink category={r.category} number={r.number}>
                        {r.title ?? '?'}
                      </EntryLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <SightingsMap category={entry.category} number={entry.number} />

            <div className="mt-8">
              <ReportButton category={entry.category} number={entry.number} />
            </div>

            <PersonalNote category={entry.category} number={entry.number} />

            <ViewTracker category={entry.category} number={entry.number} title={entry.title ?? ''} />

            <Comments category={entry.category} number={entry.number} />
          </div>
        </div>
      )}

      <EntryKeys
        prev={entry.prev !== null ? `/${entry.category}/${pad(entry.prev)}` : null}
        next={entry.next !== null ? `/${entry.category}/${pad(entry.next)}` : null}
      />
      <div className="no-print mt-10 flex justify-between gap-2 border-t border-[color:var(--rule)] pt-5">
        {entry.prev !== null ? (
          <Link href={`/${entry.category}/${pad(entry.prev)}`} className="group text-olive-700 hover:text-ink">
            <span className="block text-xs">Fiche précédente <kbd className="kbd-hint">←</kbd></span>
            <span className="catno text-2xl">← {pad(entry.prev)}</span>
          </Link>
        ) : (
          <span />
        )}
        {entry.next !== null ? (
          <Link href={`/${entry.category}/${pad(entry.next)}`} className="group text-right text-olive-700 hover:text-ink">
            <span className="block text-xs"><kbd className="kbd-hint">→</kbd> Fiche suivante</span>
            <span className="catno text-2xl">{pad(entry.next)} →</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
