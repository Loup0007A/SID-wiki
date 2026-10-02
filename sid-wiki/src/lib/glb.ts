import { WebIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune } from '@gltf-transform/functions';

// Chargé à la demande (import dynamique) : ne pèse rien tant qu'on n'édite pas un modèle.
function io() {
  return new WebIO().registerExtensions(ALL_EXTENSIONS);
}

/** Même nom que celui vu par <model-viewer> / three.js (sans nom => animation_N). */
function animName(name: string, index: number) {
  return name || `animation_${index}`;
}

export async function listAnimations(bytes: Uint8Array): Promise<string[]> {
  const doc = await io().readBinary(bytes);
  return doc
    .getRoot()
    .listAnimations()
    .map((a, i) => animName(a.getName(), i));
}

/**
 * Allège un .glb exporté de Blender :
 *  - ne garde QUE l'animation (« action ») choisie, supprime toutes les autres ;
 *  - supprime les caméras ;
 *  - purge tout ce qui n'est plus utilisé (objets, matériaux, textures, données) et fusionne les doublons.
 */
export async function optimizeGlb(bytes: Uint8Array, keep: string | null): Promise<Uint8Array> {
  const doc = await io().readBinary(bytes);
  const root = doc.getRoot();

  root.listAnimations().forEach((a, i) => {
    if (keep === null || animName(a.getName(), i) !== keep) a.dispose();
  });
  root.listCameras().forEach((c) => c.dispose());

  await doc.transform(prune(), dedup());
  return io().writeBinary(doc);
}
