import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { pad } from '@/lib/wiki';
import { getBrand } from '@/lib/brand-server';

export const dynamic = 'force-dynamic';

export default async function RandomPage() {
  await getBrand();
  const { data } = await createClient().rpc('wiki_random');
  const row = (data as { category: string; number: number }[] | null)?.[0];
  if (!row) redirect('/');
  redirect(`/${row.category}/${pad(row.number)}`);
}
