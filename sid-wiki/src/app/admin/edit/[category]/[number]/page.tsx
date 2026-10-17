import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isCategory, parseNumber } from '@/lib/wiki';
import EntryForm, { type FormEntry } from '@/components/EntryForm';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { category: string; number: string } }) {
  if (!isCategory(params.category)) notFound();
  const category = params.category;

  const supabase = createClient();
  const { data: isAdmin } = await supabase.rpc('wiki_is_admin');
  if (isAdmin !== true) redirect('/');

  const { data: stand } = await supabase.rpc('wiki_stand_image_get');
  const standImage = typeof stand === 'string' && stand ? stand : null;

  if (params.number === 'new') {
    const { data: next } = await supabase.rpc('wiki_next_number', { p_category: category });
    if (next === null || next === undefined) {
      return <p className="card p-6">Cette catégorie est pleine (000–999).</p>;
    }
    const empty: FormEntry = {
      id: null,
      category,
      number: next as number,
      title: '',
      summary: '',
      content: '',
      image_url: null,
      tags: [],
      discovered: false,
      discovered_by: null,
      rarity: null,
      infobox: [],
      model_url: null,
      model_animation: null,
      gear_shape: null,
      gear_color: null,
      gear_dx: 0,
      gear_dy: 0,
      gear_scale: 1,
      gear_rot: 0,
      gear_placement: null,
      links: [],
    };
    return <EntryForm initial={empty} standImage={standImage} />;
  }

  const n = parseNumber(params.number);
  if (n === null) notFound();

  const { data: entry } = await supabase
    .from('wiki_entries')
    .select('*')
    .eq('category', category)
    .eq('number', n)
    .maybeSingle();
  if (!entry) notFound();

  const { data: out } = await supabase.from('wiki_entry_links').select('to_id').eq('from_id', entry.id);
  const { data: inc } = await supabase.from('wiki_entry_links').select('from_id').eq('to_id', entry.id);
  const ids = Array.from(new Set([...(out ?? []).map((l) => l.to_id), ...(inc ?? []).map((l) => l.from_id)]));

  let links: FormEntry['links'] = [];
  if (ids.length) {
    const { data: linked } = await supabase.from('wiki_entries').select('id, category, number, title').in('id', ids);
    links = (linked ?? []).map((l) => ({ id: l.id, category: l.category, number: l.number, title: l.title }));
  }

  return (
    <EntryForm
      initial={{
        id: entry.id,
        category: entry.category,
        number: entry.number,
        title: entry.title,
        summary: entry.summary,
        content: entry.content,
        image_url: entry.image_url,
        tags: entry.tags ?? [],
        discovered: entry.discovered,
        discovered_by: entry.discovered_by ?? null,
        rarity: entry.rarity ?? null,
        infobox: Array.isArray(entry.infobox) ? entry.infobox : [],
        model_url: entry.model_url ?? null,
        model_animation: entry.model_animation ?? null,
        gear_shape: entry.gear_shape ?? null,
        gear_color: entry.gear_color ?? null,
        gear_dx: Number(entry.gear_dx ?? 0) || 0,
        gear_dy: Number(entry.gear_dy ?? 0) || 0,
        gear_scale: Number(entry.gear_scale ?? 1) || 1,
        gear_rot: Number(entry.gear_rot ?? 0) || 0,
        gear_placement: entry.gear_placement && typeof entry.gear_placement === 'object' && !Array.isArray(entry.gear_placement) ? entry.gear_placement : null,
        links,
      }}
      standImage={standImage}
    />
  );
}
