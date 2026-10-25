import { createClient } from '@/lib/supabase/server';
import { parseGear, type ProfileSummary } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';
import Icon from '@/components/Icon';
import MigrationNeeded, { isMissingFunction } from '@/components/MigrationNeeded';
import ProfilesView from '@/components/ProfilesView';

export const dynamic = 'force-dynamic';

export default async function ProfilesPage() {
  const supabase = createClient();
  const [{ data, error }, { data: stand }] = await Promise.all([supabase.rpc('wiki_profiles_list'), supabase.rpc('wiki_stand_image_get')]);
  if (isMissingFunction(error)) return <MigrationNeeded file="0206_wiki_profiles.sql" />;
  if (error) return <AccessDenied />;

  const profiles = ((data ?? []) as ProfileSummary[]).map((p) => ({ ...p, gear: parseGear(p.gear) }));

  return (
    <div>
      <h1 className="mb-1 font-typewriter text-[2.1rem] leading-tight text-olive-900 sm:text-[2.6rem]">
        <Icon name="profils" /> Profils des chasseurs
      </h1>
      <p className="mb-5 text-olive-700">
        Chaque chasseur a son porte-armure : casque, plastron, jambières, bottes, une arme dans chaque main et un arc dans le dos. Ouvre le tien pour l’équiper !
      </p>
      <ProfilesView profiles={profiles} standImage={typeof stand === 'string' && stand ? stand : null} />
    </div>
  );
}
