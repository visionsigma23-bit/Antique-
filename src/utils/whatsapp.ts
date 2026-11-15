import { Product, SiteSettings } from '../types';

export function sanitizeWhatsAppNumber(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export function formatProductPrice(price: number, currencySymbol = 'PKR'): string {
  if (!price || price <= 0) {
    return 'Price Upon Inquiry';
  }
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
  const symbol = (currencySymbol || 'PKR').trim();
  const needsSpace = /^[A-Za-z]+$/.test(symbol);
  return needsSpace ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
}

export function getProductCanonicalUrl(productId: string): string {
  if (typeof window === 'undefined') {
    return `/product/${productId}`;
  }
  return `${window.location.origin}/product/${productId}`;
}

export function buildProductWhatsAppUrl(
  product: Product,
  settings: SiteSettings,
  quantity = 1
): string {
  const digits = sanitizeWhatsAppNumber(settings.whatsappNumber) || '15550192834';
  const productUrl = getProductCanonicalUrl(product.id);
  const priceText = formatProductPrice(product.price, settings.currencySymbol);
  const message = [
    `Hello ANTIKER,`,
    `I would like to inquire about:`,
    `• Product: ${product.name}`,
    `• Category: ${product.categoryName}`,
    `• Quantity: ${quantity}`,
    `• Listed Price: ${priceText}`,
    `• Link: ${productUrl}`,
  ].join('\n');

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralWhatsAppUrl(settings: SiteSettings, customTopic?: string): string {
  const digits = sanitizeWhatsAppNumber(settings.whatsappNumber) || '15550192834';
  const topic = customTopic
    ? `Hello ANTIKER, I would like to inquire about: ${customTopic}`
    : `Hello ANTIKER, I would like to speak with your concierge regarding your decorative collection.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(topic)}`;
}

/**
 * Compresses an uploaded image file to a JPEG data URL <= ~180KB
 * so multiple images can be persisted cleanly inside Firestore documents.
 */
export function compressImageFile(file: File, maxDimension = 1100, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Step down quality if still large for Firestore document safety
        let currentQuality = quality;
        while (dataUrl.length > 240000 && currentQuality > 0.35) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }
        if (dataUrl.length > 280000) {
          reject(new Error('Image is still too large after compression. Please choose a smaller file.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `item-${Date.now()}`;
}
