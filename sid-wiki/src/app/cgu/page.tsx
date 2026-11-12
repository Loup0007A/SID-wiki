import type { Metadata } from 'next';
import { Cgu } from '@/components/legal/LegalContent';
import { getBrand } from '@/lib/brand-server';

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default async function CguPage() {
  await getBrand();
  return (
    <article className="card mx-auto max-w-3xl p-5 sm:p-8">
      <h1 className="mb-3 font-typewriter text-2xl font-bold text-olive-800">Conditions d&apos;utilisation</h1>
      <Cgu site="wiki" />
    </article>
  );
}
