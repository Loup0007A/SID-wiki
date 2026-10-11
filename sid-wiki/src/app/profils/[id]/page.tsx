import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, GEAR_SLOTS, isCategory, pad, parseGear, type ProfileFull } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';
import ArmorStand from '@/components/ArmorStand';
import Icon from '@/components/Icon';
import MigrationNeeded, { isMissingFunction } from '@/components/MigrationNeeded';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProfilePage({ params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) notFound();

  const { data, error } = await createClient().rpc('wiki_profile_get', { p_id: params.id });
  if (isMissingFunction(error)) return <MigrationNeeded file="0206_wiki_profiles.sql" />;
  if (error) return <AccessDenied />;
  if (!data) notFound();

  const profile = data as ProfileFull;
  const gear = parseGear(profile.gear);
  const discoveries = (profile.discoveries ?? []).filter((d) => isCategory(String(d.category)));

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-3 font-typewriter text-xs text-olive-700">
        <Link href="/" className="hover:underline">Accueil</Link> /{' '}
        <Link href="/profils" className="hover:underline">Profils</Link> / @{profile.nickname}
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="title-grad font-typewriter text-2xl font-bold text-olive-800 sm:text-3xl">@{profile.nickname}</h1>
          <p className="text-sm text-olive-700">
            {gear.length}/{GEAR_SLOTS.length} emplacement{gear.length > 1 ? 's' : ''} équipé{gear.length > 1 ? 's' : ''} · 🏆 {profile.discoveries_total} découverte
            {profile.discoveries_total > 1 ? 's' : ''}
          </p>
        </div>
        {profile.is_me ? (
          <span className="stamp">Ton profil</span>
        ) : profile.can_edit ? (
          <span className="stamp">Modifiable (admin)</span>
        ) : null}
      </div>

      <ArmorStand profileId={profile.id} canEdit={profile.can_edit} initialGear={gear} />

      <section className="card mt-4 p-5">
        <h2 className="mb-3 font-typewriter text-xl font-bold text-olive-800">🏆 Ses découvertes</h2>
        {discoveries.length === 0 ? (
          <p className="italic text-olive-700">Aucune découverte créditée pour l’instant.</p>
        ) : (
          <>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {discoveries.map((d) => (
                <li key={`${d.category}${d.number}`} className="flex items-center gap-3 border-b border-white/10 py-2">
                  {d.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_url} alt="" className="h-10 w-10 flex-none rounded-lg border border-white/15 object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/[0.1] text-xl">
                      <Icon name={d.category} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <Link href={`/${d.category}/${pad(d.number)}`} className="font-bold text-olive-700 hover:underline">
                      {d.title}
                    </Link>
                    <div className="text-xs text-olive-700/80">
                      {CATEGORY_LABELS[d.category].label} · N° {pad(d.number)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {profile.discoveries_total > discoveries.length && (
              <p className="mt-3 text-sm text-olive-700">… et {profile.discoveries_total - discoveries.length} de plus.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
