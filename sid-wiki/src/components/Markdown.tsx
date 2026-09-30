'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EntryLink from './EntryLink';
import { isCategory, preprocessWikiLinks } from '@/lib/wiki';

/**
 * Rendu markdown sûr (pas de HTML brut). Les liens internes
 * [[armes/012]] / [[armes/012|texte]] ou /armes/012 reçoivent un aperçu au survol.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-stone max-w-none prose-headings:font-typewriter prose-headings:text-olive-800 prose-a:text-olive-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            const m = href?.match(/^\/(lieux|armes|mobs|objets)\/(\d{1,3})$/);
            if (m && isCategory(m[1])) {
              return (
                <EntryLink category={m[1]} number={parseInt(m[2], 10)}>
                  {children}
                </EntryLink>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            );
          },
        }}
      >
        {preprocessWikiLinks(children)}
      </ReactMarkdown>
    </div>
  );
}
