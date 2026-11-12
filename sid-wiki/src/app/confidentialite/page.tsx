import type { Metadata } from 'next';
import { Privacy } from '@/components/legal/LegalContent';
import { getBrand } from '@/lib/brand-server';

export const metadata: Metadata = { title: 'Confidentialité' };

export default async function PrivacyPage() {
  await getBrand();
  return (
    <article className="card mx-auto max-w-3xl p-5 sm:p-8">
      <h1 className="mb-3 font-typewriter text-2xl font-bold text-olive-800">Confidentialité</h1>
      <Privacy site="wiki" />
    </article>
  );
}
