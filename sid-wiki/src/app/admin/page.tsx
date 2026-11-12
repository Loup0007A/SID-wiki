import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/AdminDashboard';
import { getBrand } from '@/lib/brand-server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await getBrand();
  const supabase = createClient();
  const { data: isAdmin } = await supabase.rpc('wiki_is_admin');
  if (isAdmin !== true) redirect('/');
  return <AdminDashboard />;
}
