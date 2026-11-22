import { getBrand } from '@/lib/brand-server';
import { isCategory } from '@/lib/wiki';
import ProposalForm from '@/components/ProposalForm';

export const dynamic = 'force-dynamic';

/** Proposer une nouvelle fiche (?categorie=mobs pour partir d'une catégorie). */
export default async function ProposeNewPage(props: { searchParams: Promise<{ categorie?: string }> }) {
  const searchParams = await props.searchParams;
  await getBrand();
  const c = searchParams.categorie;
  return (
    <ProposalForm
      initial={{
        category: c && isCategory(c) ? c : 'mobs',
        number: null,
        title: '',
        summary: '',
        content: '## Description\n\n',
        tags: [],
        infobox: [],
      }}
    />
  );
}
