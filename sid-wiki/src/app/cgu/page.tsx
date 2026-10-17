import type { Metadata } from 'next';
import { Cgu } from '@/components/legal/LegalContent';

export const metadata: Metadata = { title: "Conditions d'utilisation · Wiki du S.I.D." };

export default function CguPage() {
  return (
    <article className="card mx-auto max-w-3xl p-5 sm:p-8">
      <h1 className="title-grad mb-3 font-typewriter text-2xl font-bold text-olive-800">Conditions d&apos;utilisation</h1>
      <Cgu site="wiki" />
    </article>
  );
}
