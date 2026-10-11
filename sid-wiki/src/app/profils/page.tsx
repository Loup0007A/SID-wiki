import { createClient } from '@/lib/supabase/server';
import { parseGear, type ProfileSummary } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';
import Icon from '@/components/Icon';
import MigrationNeeded, { isMissingFunction } from '@/components/MigrationNeeded';
import ProfilesView from '@/components/ProfilesView';

export const dynamic = 'force-dynamic';

export default async function ProfilesPage() {
  const { data, error } = await createClient().rpc('wiki_profiles_list');
  if (isMissingFunction(error)) return <MigrationNeeded file="0206_wiki_profiles.sql" />;
  if (error) return <AccessDenied />;

  const profiles = ((data ?? []) as ProfileSummary[]).map((p) => ({ ...p, gear: parseGear(p.gear) }));

  return (
    <div>
      <h1 className="title-grad mb-1 font-typewriter text-2xl font-bold text-olive-800 sm:text-3xl">
        <Icon name="profils" /> Profils des chasseurs
      </h1>
      <p className="mb-5 text-olive-700">
        Chaque chasseur a son porte-armure : casque, plastron, jambières, bottes, une arme dans chaque main et un arc dans le dos. Ouvre le tien pour l’équiper !
      </p>
      <ProfilesView profiles={profiles} />
    </div>
  );
}
