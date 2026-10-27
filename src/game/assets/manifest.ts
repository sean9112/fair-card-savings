/** Respect Vite's base path so assets work both locally and under GitHub Pages. */
const assetUrl = (path: string) => import.meta.env.BASE_URL + path;

export const assetManifest = {
  images: {
    characters: {
      giraffe: assetUrl('assets/characters/animals/giraffe.png'),
      penguin: assetUrl('assets/characters/animals/penguin.png'),
      frog: assetUrl('assets/characters/animals/frog.png'),
      sloth: assetUrl('assets/characters/animals/sloth.png'),
      elephant: assetUrl('assets/characters/animals/elephant.png'),
      owl: assetUrl('assets/characters/animals/owl.png'),
    },
    environment: {},
    ui: {},
    fx: {},
  },
  atlases: {},
  spritesheets: {},
  tilemaps: {},
  audio: {
    music: {},
    soundEffects: {},
    voice: {},
  },
} as const;
