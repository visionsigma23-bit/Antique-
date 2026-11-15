import { Category, Product, SiteSettings } from '../types';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'ANTIKER',
  heroHeadline: 'ART THAT TELLS A STORY.',
  heroSubtitle:
    'Discover timeless decorative pieces that bring character and elegance to every space.',
  promoTitle: 'Curated Accents for Thoughtful Interiors',
  promoSubtitle:
    'Explore sculptural vessels, wall planters, and artistic showpieces selected to anchor quiet, enduring living spaces.',
  promoCtaText: 'Inquire with Our Concierge',
  aboutTitle: 'A World of Timeless Elegance.',
  aboutBody:
    'ANTIKER curates decorative objects, sculptural accents, and heirloom-inspired home décor for interiors that value warmth, texture, and enduring character. Each piece—from ornate wall planters and patinated vessels to ornamental figurines—is chosen for its tactile finish and balanced proportions, bringing serene gallery poise into everyday living.',
  whatsappNumber: '15550192834',
  phoneDisplay: '+1 (555) 019-2834 [Placeholder]',
  emailDisplay: 'concierge@antiker-decor.example',
  addressDisplay: 'Showroom Address Placeholder — Update in Admin Dashboard',
  instagramHandle: '@antiker.decor',
  facebookUrl: 'https://facebook.com',
  pinterestUrl: 'https://pinterest.com',
  currencySymbol: 'PKR',
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'antique-wall-decor',
    name: 'Antique Wall Décor',
    slug: 'antique-wall-decor',
    description: 'Ornate wall-mounted planters, relief medallions, and botanical sconces.',
    image: 'media:wallPlanter',
    sortOrder: 1,
  },
  {
    id: 'decorative-vases',
    name: 'Decorative Vases',
    slug: 'decorative-vases',
    description: 'Patinated amphoras, textured terracotta vessels, and sculptural floor urns.',
    image: 'media:decorativeVase',
    sortOrder: 2,
  },
  {
    id: 'artistic-showpieces',
    name: 'Artistic Showpieces',
    slug: 'artistic-showpieces',
    description: 'Armillary spheres, carved stone urns, and architectural tabletop focal points.',
    image: 'media:artisticShowpiece',
    sortOrder: 3,
  },
  {
    id: 'sculptures-statues',
    name: 'Sculptures & Statues',
    slug: 'sculptures-statues',
    description: 'Classical busts, patinated bronze figures, and gallery plinth sculptures.',
    image: 'media:sculptureStatue',
    sortOrder: 4,
  },
  {
    id: 'home-accessories',
    name: 'Home Accessories',
    slug: 'home-accessories',
    description: 'Brass taper holders, engraved catchall trays, and carved travertine bowls.',
    image: 'media:homeAccessories',
    sortOrder: 5,
  },
  {
    id: 'collectible-decor',
    name: 'Collectible Décor',
    slug: 'collectible-decor',
    description: 'Heirloom-style table timepieces, glazed ceramic figurines, and mantel curiosities.',
    image: 'media:collectibleDecor',
    sortOrder: 6,
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'botanical-bronze-wall-planter',
    name: 'Scrollwork Bronze Wall Planter with Botanicals',
    categoryId: 'antique-wall-decor',
    categoryName: 'Antique Wall Décor',
    price: 14500,
    description:
      'An ornate wall-mounted decorative planter in an aged bronze-and-brass patina, paired with lifelike cascading eucalyptus and fern foliage. Designed to bring vertical texture and classical warmth to entryways, sunrooms, or reading alcoves.',
    details: [
      'Category: Wall Planter & Artificial Botanical Arrangement',
      'Finish: Aged bronze and brushed antique brass patina',
      'Mounting: Integrated rear keyhole bracket for flush wall display',
      'Care: Dust foliage gently with a soft dry cloth; indoor placement recommended',
    ],
    availability: 'In Stock',
    featured: true,
    bestSeller: true,
    images: ['media:wallPlanter'],
    sortOrder: 1,
  },
  {
    id: 'patinated-amphora-vase',
    name: 'Two-Handled Patinated Amphora Vase',
    categoryId: 'decorative-vases',
    categoryName: 'Decorative Vases',
    price: 18500,
    description:
      'A classic twin-handled decorative amphora vessel finished in weathered verdigris bronze and textured earthen relief. Anchors console tables, fireplace mantels, or open shelving with quiet architectural presence.',
    details: [
      'Silhouette: Twin-handled classical amphora vessel',
      'Surface: Textured earth tone with aged bronze collar patina',
      'Placement: Console table, credenza, or pedestal centerpiece',
      'Usage: Suitable for dry botanical stems or standalone sculptural display',
    ],
    availability: 'In Stock',
    featured: true,
    bestSeller: true,
    images: ['media:decorativeVase'],
    sortOrder: 2,
  },
  {
    id: 'celestial-armillary-alabaster-pair',
    name: 'Brass Armillary Sphere & Carved Stone Vessel',
    categoryId: 'artistic-showpieces',
    categoryName: 'Artistic Showpieces',
    price: 26000,
    description:
      'An expressive tabletop showpiece pairing a finely calibrated antique-brass armillary sphere with a carved cream stone lidded urn. Created as an enduring study-room or salon focal point.',
    details: [
      'Composition: Brass meridian rings on lion-paw tripod base & carved urn',
      'Finish: Hand-rubbed antique brass and warm veined stone tone',
      'Ideal For: Library desks, mantelpieces, and curated gallery shelves',
      'Note: Sample catalog entry — dimensions and exact pricing editable in Admin',
    ],
    availability: 'Limited Piece',
    featured: true,
    bestSeller: true,
    images: ['media:artisticShowpiece'],
    sortOrder: 3,
  },
  {
    id: 'classical-bronze-bust-statue',
    name: 'Classical Patinated Bust & Seated Lyre Figurine',
    categoryId: 'sculptures-statues',
    categoryName: 'Sculptures & Statues',
    price: 29500,
    description:
      'Sculptural decorative figures finished in deep museum-grade bronze patina with subtle verdigris highlights, resting upon dark honed plinths. Designed to introduce serene neoclassical poise to bookshelves and sideboards.',
    details: [
      'Subject: Classical portrait bust and seated lyre figurine',
      'Finish: Deep charcoal-bronze patina with subtle verdigris accents',
      'Base: Dark honed stone plinth for stable surface placement',
      'Note: Sample catalog entry — specifications editable in Admin',
    ],
    availability: 'Limited Piece',
    featured: true,
    bestSeller: false,
    images: ['media:sculptureStatue'],
    sortOrder: 4,
  },
  {
    id: 'heirloom-brass-candle-tray-set',
    name: 'Engraved Brass Tray, Taper Holders & Stone Bowl',
    categoryId: 'home-accessories',
    categoryName: 'Home Accessories',
    price: 16500,
    description:
      'A harmonized table vignette featuring turned antique-brass taper candle holders, an etched ornamental catchall tray with snuffer, and a chiseled travertine bowl accented with dried botanicals.',
    details: [
      'Includes: Turned brass candlesticks, etched tray, and carved stone bowl',
      'Palette: Warm brushed brass and natural porous travertine tones',
      'Styling: Ready for dining tables, entry consoles, or coffee tables',
      'Care: Wipe brass lightly with a dry microfiber cloth',
    ],
    availability: 'In Stock',
    featured: true,
    bestSeller: true,
    images: ['media:homeAccessories'],
    sortOrder: 5,
  },
  {
    id: 'brass-dome-timepiece-horses',
    name: 'Domed Brass Mantel Clock & Ceramic Horse Pair',
    categoryId: 'collectible-decor',
    categoryName: 'Collectible Décor',
    price: 34000,
    description:
      'A refined shelf arrangement combining a pillared antique-brass domed table clock with a matched pair of crackle-glazed equestrian figurines. Crafted to lend heirloom warmth to timber shelving and parlor mantels.',
    details: [
      'Pieces: Glass-domed brass table timepiece and twin horse figurines',
      'Finish: Aged brass frame with Roman numeral dial and crackle glaze',
      'Display: Sized for timber mantels, bookcases, and vitrine cabinets',
      'Note: Sample catalog entry — details editable in Admin',
    ],
    availability: 'Made to Order',
    featured: true,
    bestSeller: false,
    images: ['media:collectibleDecor'],
    sortOrder: 6,
  },
];

export interface SampleTestimonial {
  id: string;
  quote: string;
  author: string;
  context: string;
  isSample: true;
}

export const SAMPLE_TESTIMONIALS: SampleTestimonial[] = [
  {
    id: 'sample-1',
    quote:
      'The patinated bronze wall planter transformed our entry alcove immediately. Having direct WhatsApp guidance on proportions and finish made choosing the piece effortless.',
    author: 'Elena Vance [Sample Review]',
    context: 'Residential Interior Styling',
    isSample: true,
  },
  {
    id: 'sample-2',
    quote:
      'Every piece feels intentionally selected rather than mass-produced. The amphora vase and brass candle holders anchor our dining credenza with remarkable warmth.',
    author: 'Marcus Sterling [Sample Review]',
    context: 'Hospitality & Salon Client',
    isSample: true,
  },
  {
    id: 'sample-3',
    quote:
      'Prompt responses, careful packaging, and finishes that look even richer in natural morning light than in photography.',
    author: 'Nadia Al-Mansoor [Sample Review]',
    context: 'Private Residence Collector',
    isSample: true,
  },
];
