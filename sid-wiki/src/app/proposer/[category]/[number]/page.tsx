import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isCategory, parseNumber, type EntryFull } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';
import ProposalForm from '@/components/ProposalForm';
import { getBrand } from '@/lib/brand-server';

export const dynamic = 'force-dynamic';

export default async function ProposePage(props: { params: Promise<{ category: string; number: string }> }) {
  const params = await props.params;
  await getBrand();
  const n = parseNumber(params.number);
  if (!isCategory(params.category) || n === null) notFound();
  const { data, error } = await (await createClient()).rpc('wiki_get', { p_category: params.category, p_number: n });
  if (error) return <AccessDenied />;
  if (!data) notFound();
  const e = data as EntryFull;
  if (!e.discovered) notFound();
  return (
    <ProposalForm
      initial={{
        category: e.category,
        number: e.number,
        title: e.title ?? '',
        summary: e.summary ?? '',
        content: e.content ?? '',
        tags: e.tags ?? [],
        infobox: (e.infobox ?? []).filter((r) => r.label),
      }}
    />
  );
}
