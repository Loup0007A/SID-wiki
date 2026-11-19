import { getBrand } from '@/lib/brand-server';
import ProposalsBoard from '@/components/ProposalsBoard';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  await getBrand();
  return <ProposalsBoard />;
}
