import heroAntiqueInterior from '../assets/images/hero_antique_interior_1794757619048.jpg';
import heroDarkBoutique from '../assets/images/hero_dark_antique_boutique_1794758706266.jpg';
import aboutDarkVignette from '../assets/images/about_dark_vignette_1794758706243.jpg';
import productWallPlanter from '../assets/images/product_wall_planter_1794757619179.jpg';
import productDecorativeVase from '../assets/images/product_decorative_vase_1794757619711.jpg';
import productArtisticShowpiece from '../assets/images/product_artistic_showpiece_1794757620434.jpg';
import productSculptureStatue from '../assets/images/product_sculpture_statue_1794757620973.jpg';
import productHomeAccessories from '../assets/images/product_home_accessories_1794757621114.jpg';
import productCollectibleDecor from '../assets/images/product_collectible_decor_1794757622121.jpg';
import promoCuratedGallery from '../assets/images/promo_curated_gallery_1794757622851.jpg';

export const ANTIKER_MEDIA = {
  hero: heroDarkBoutique,
  heroLight: heroAntiqueInterior,
  aboutDark: aboutDarkVignette,
  wallPlanter: productWallPlanter,
  decorativeVase: productDecorativeVase,
  artisticShowpiece: productArtisticShowpiece,
  sculptureStatue: productSculptureStatue,
  homeAccessories: productHomeAccessories,
  collectibleDecor: productCollectibleDecor,
  promoGallery: promoCuratedGallery,
} as const;

export type AntikerMediaKey = keyof typeof ANTIKER_MEDIA;

export function resolveMediaSrc(src: string): string {
  if (!src) return '';
  if (src.startsWith('media:')) {
    const key = src.slice(6) as AntikerMediaKey;
    return ANTIKER_MEDIA[key] || '';
  }
  return src;
}
