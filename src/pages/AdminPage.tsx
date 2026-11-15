import React, { useEffect, useState } from 'react';
import {
  Check,
  Database,
  Edit3,
  FolderPlus,
  ImagePlus,
  LogOut,
  Mail,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AvailabilityStatus, Category, Product, SiteSettings } from '../types';
import { compressImageFile, formatProductPrice } from '../utils/whatsapp';
import { ResilientImage } from '../components/ResilientImage';
import { SeoHead } from '../components/SeoHead';
import { AdminPushNotificationsPanel } from '../components/AdminPushNotificationsPanel';

type AdminTab = 'products' | 'categories' | 'settings' | 'inquiries' | 'notifications';

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = [
  'In Stock',
  'Limited Piece',
  'Made to Order',
  'Out of Stock',
];

export function AdminPage() {
  const {
    user,
    authReady,
    isAdmin,
    adminCheckDone,
    isDbInitialized,
    categories,
    products,
    siteSettings,
    inquiries,
    signInWithGoogle,
    signOutUser,
    bootstrapDatabase,
    applySamplePkrPricing,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveSiteSettings,
    markInquiryReviewed,
    deleteInquiry,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [authError, setAuthError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (authReady && adminCheckDone && isAdmin && !isDbInitialized && !bootstrapping) {
      setBootstrapping(true);
      bootstrapDatabase()
        .then(() => {
          setBannerFeedback({
            type: 'success',
            message: 'Starter catalog and storefront settings have been published to Firestore.',
          });
        })
        .catch(() => {
          setBannerFeedback({
            type: 'error',
            message: 'Could not auto-initialize database. Please click Initialize Catalog.',
          });
        })
        .finally(() => setBootstrapping(false));
    }
  }, [authReady, adminCheckDone, isAdmin, isDbInitialized, bootstrapping, bootstrapDatabase]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setBannerFeedback({ type, message });
    setTimeout(() => {
      setBannerFeedback((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // ---------------- Product Form State ----------------
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPrice, setProdPrice] = useState('0');
  const [prodAvailability, setProdAvailability] = useState<AvailabilityStatus>('In Stock');
  const [prodFeatured, setProdFeatured] = useState(true);
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodSortOrder, setProdSortOrder] = useState('1');
  const [prodDescription, setProdDescription] = useState('');
  const [prodDetailsText, setProdDetailsText] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingProd, setSavingProd] = useState(false);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<string | null>(null);

  const openNewProductForm = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategoryId(categories[0]?.id || '');
    setProdPrice('0');
    setProdAvailability('In Stock');
    setProdFeatured(true);
    setProdBestSeller(false);
    setProdSortOrder(String(products.length + 1));
    setProdDescription('');
    setProdDetailsText('');
    setProdImages([]);
    setNewImageUrl('');
    setShowProductForm(true);
  };

  const openEditProductForm = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdCategoryId(prod.categoryId);
    setProdPrice(String(prod.price ?? 0));
    setProdAvailability(prod.availability);
    setProdFeatured(prod.featured);
    setProdBestSeller(prod.bestSeller);
    setProdSortOrder(String(prod.sortOrder ?? 0));
    setProdDescription(prod.description);
    setProdDetailsText(prod.details.join('\n'));
    setProdImages(prod.images);
    setNewImageUrl('');
    setShowProductForm(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - prodImages.length;
    if (remainingSlots <= 0) {
      showNotice('error', 'Maximum of 4 images per product reached.');
      return;
    }

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const compressed = await compressImageFile(files[i]);
        uploaded.push(compressed);
      }
      setProdImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'Failed to process uploaded image.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (prodImages.length >= 4) {
      showNotice('error', 'Maximum of 4 images per product.');
      return;
    }
    setProdImages((prev) => [...prev, trimmed]);
    setNewImageUrl('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCategoryId || !prodDescription.trim()) {
      showNotice('error', 'Please enter a product name, category, and description.');
      return;
    }
    if (prodImages.length === 0) {
      showNotice('error', 'Please upload or add at least one product image.');
      return;
    }

    setSavingProd(true);
    try {
      const detailsList = prodDetailsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      await saveProduct(
        {
          name: prodName,
          categoryId: prodCategoryId,
          price: Math.max(0, Number(prodPrice) || 0),
          description: prodDescription,
          details: detailsList,
          availability: prodAvailability,
          featured: prodFeatured,
          bestSeller: prodBestSeller,
          images: prodImages,
          sortOrder: Number(prodSortOrder) || 0,
        },
        editingProductId || undefined
      );
      setShowProductForm(false);
      showNotice(
        'success',
        editingProductId ? 'Product updated and saved.' : 'New product published.'
      );
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSavingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setConfirmDeleteProdId(null);
      showNotice('success', 'Product deleted from catalog.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to delete product.');
    }
  };

  // ---------------- Category Form State ----------------
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImage, setCatImage] = useState<string>('media:decorativeVase');
  const [catSortOrder, setCatSortOrder] = useState('1');
  const [savingCat, setSavingCat] = useState(false);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  const openNewCategoryForm = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCatImage('media:decorativeVase');
    setCatSortOrder(String(categories.length + 1));
    setShowCategoryForm(true);
  };

  const openEditCategoryForm = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description);
    setCatImage(cat.image);
    setCatSortOrder(String(cat.sortOrder ?? 0));
    setShowCategoryForm(true);
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setCatImage(compressed);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showNotice('error', 'Category name is required.');
      return;
    }
    setSavingCat(true);
    try {
      await saveCategory(
        {
          name: catName,
          slug: catSlug || catName,
          description: catDescription,
          image: catImage,
          sortOrder: Number(catSortOrder) || 0,
        },
        editingCategoryId || undefined
      );
      setShowCategoryForm(false);
      showNotice(
        'success',
        editingCategoryId ? 'Category updated.' : 'New category created.'
      );
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setConfirmDeleteCatId(null);
      showNotice('success', 'Category removed.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Unable to delete category.');
    }
  };

  // ---------------- Settings Form State ----------------
  const [settingsForm, setSettingsForm] = useState<Omit<SiteSettings, 'updatedAt'>>(
    siteSettings
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSettingsForm({
      brandName: siteSettings.brandName,
      heroHeadline: siteSettings.heroHeadline,
      heroSubtitle: siteSettings.heroSubtitle,
      promoTitle: siteSettings.promoTitle,
      promoSubtitle: siteSettings.promoSubtitle,
      promoCtaText: siteSettings.promoCtaText,
      aboutTitle: siteSettings.aboutTitle,
      aboutBody: siteSettings.aboutBody,
      whatsappNumber: siteSettings.whatsappNumber,
      phoneDisplay: siteSettings.phoneDisplay,
      emailDisplay: siteSettings.emailDisplay,
      addressDisplay: siteSettings.addressDisplay,
      instagramHandle: siteSettings.instagramHandle,
      facebookUrl: siteSettings.facebookUrl,
      pinterestUrl: siteSettings.pinterestUrl,
      currencySymbol: siteSettings.currencySymbol,
    });
  }, [siteSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSiteSettings(settingsForm);
      showNotice('success', 'Homepage content and contact settings saved globally.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Sign-in was cancelled or failed.'
      );
    }
  };

  // ---------------- Render Authentication Gate ----------------
  if (!authReady || !adminCheckDone) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 bg-[#171715]">
        <SeoHead title="Admin Dashboard | ANTIKER" description="ANTIKER owner dashboard." />
        <div className="text-sm text-[#B9B3A8]">Verifying administrator session...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#171715]">
        <SeoHead title="Admin Login | ANTIKER" description="ANTIKER owner authentication." />
        <div className="w-full max-w-md bg-[#22221F] border border-[#494335] p-8 sm:p-10 text-center space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
              Owner Portal
            </p>
            <h1 className="font-serif text-3xl text-[#F5F1E8]">ANTIKER Administration</h1>
            <p className="mt-2 text-sm text-[#B9B3A8] leading-relaxed">
              Sign in with your verified Google account to manage products, pricing,
              categories, homepage copy, and contact details.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-700 text-xs text-red-200 text-left">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            className="w-full py-3.5 px-6 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#CCA86B] transition-colors"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#171715]">
        <SeoHead title="Access Restricted | ANTIKER" description="Restricted admin access." />
        <div className="w-full max-w-md bg-[#22221F] border border-[#494335] p-8 sm:p-10 text-center space-y-5">
          <ShieldAlert className="w-8 h-8 text-[#B9975B] mx-auto" strokeWidth={1.5} />
          <h1 className="font-serif text-3xl text-[#F5F1E8]">Unauthorized Account</h1>
          <p className="text-sm text-[#B9B3A8] leading-relaxed">
            Signed in as <span className="font-medium text-[#F5F1E8]">{user.email}</span>,
            which does not have ANTIKER administrator privileges.
          </p>
          <button
            type="button"
            onClick={signOutUser}
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#494335] text-xs font-medium uppercase tracking-wider text-[#F5F1E8] hover:border-[#B9975B]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  const unreadInquiriesCount = inquiries.filter((i) => i.status === 'new').length;
  const inputClass =
    'w-full h-11 px-3 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/50 focus:outline-none focus:border-[#B9975B]';
  const textareaClass =
    'w-full p-3 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/50 focus:outline-none focus:border-[#B9975B]';

  return (
    <div className="min-h-[85vh] pb-20 bg-[#171715] text-[#F5F1E8]">
      <SeoHead
        title="Admin Dashboard | ANTIKER"
        description="Manage ANTIKER products, categories, pricing, and storefront content."
      />

      {/* Admin Top Header */}
      <section className="bg-[#22221F] border-b border-[#494335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#B9975B]">
              <ShieldCheck className="w-4 h-4" />
              <span>Authenticated Store Owner</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F5F1E8] mt-1">
              ANTIKER Management Console
            </h1>
            <p className="text-xs text-[#B9B3A8] mt-1">
              Signed in as {user.email} · Changes persist immediately to Firestore for all visitors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isDbInitialized && (
              <button
                type="button"
                disabled={bootstrapping}
                onClick={bootstrapDatabase}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] disabled:opacity-60"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{bootstrapping ? 'Initializing...' : 'Initialize Catalog DB'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#494335] text-xs font-medium uppercase tracking-wider text-[#F5F1E8] hover:border-[#B9975B]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-[#494335]/60">
          {[
            { id: 'products', label: `Products (${products.length})` },
            { id: 'categories', label: `Categories (${categories.length})` },
            { id: 'settings', label: 'Homepage & Contact' },
            {
              id: 'inquiries',
              label:
                unreadInquiriesCount > 0
                  ? `Inquiries (${unreadInquiriesCount} New)`
                  : `Inquiries (${inquiries.length})`,
            },
            {
              id: 'notifications',
              label: 'Push Notifications',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#B9975B] text-[#B9975B]'
                  : 'border-transparent text-[#B9B3A8] hover:text-[#F5F1E8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {bannerFeedback && (
          <div
            className={`mb-6 p-4 border text-sm flex items-center justify-between ${
              bannerFeedback.type === 'success'
                ? 'bg-[#292823] border-[#B9975B] text-[#F5F1E8]'
                : 'bg-red-950/60 border-red-700 text-red-200'
            }`}
          >
            <span>{bannerFeedback.message}</span>
            <button
              type="button"
              onClick={() => setBannerFeedback(null)}
              className="text-xs uppercase tracking-wider underline ml-4 text-[#B9975B]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================= PRODUCTS TAB ================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F1E8]">Catalog Pieces</h2>
                <p className="text-xs text-[#B9B3A8] mt-0.5">
                  Prices display in {siteSettings.currencySymbol}. Set price to 0 to display &ldquo;Price Upon Inquiry&rdquo;.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {isDbInitialized &&
                  (siteSettings.currencySymbol !== 'PKR' ||
                    products.some((p) => !p.price || p.price <= 0)) && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await applySamplePkrPricing();
                          showNotice('success', 'PKR currency and sample prices applied.');
                        } catch (err) {
                          showNotice(
                            'error',
                            err instanceof Error ? err.message : 'Unable to apply PKR prices.'
                          );
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#B9975B] text-[#B9975B] text-xs font-semibold uppercase tracking-wider hover:bg-[#B9975B]/10 whitespace-nowrap shrink-0"
                    >
                      <span>Apply Sample PKR Prices</span>
                    </button>
                  )}
                <button
                  type="button"
                  onClick={openNewProductForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {showProductForm && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-[#22221F] border border-[#B9975B] p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-[#494335] pb-4">
                  <h3 className="font-serif text-2xl text-[#F5F1E8]">
                    {editingProductId ? 'Edit Piece' : 'Add New Piece'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="text-xs uppercase tracking-wider text-[#B9B3A8] hover:text-[#F5F1E8]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Category *
                    </label>
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(e.target.value)}
                      className={inputClass}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Price ({siteSettings.currencySymbol}) · 0 = Inquiry
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Availability Status
                    </label>
                    <select
                      value={prodAvailability}
                      onChange={(e) =>
                        setProdAvailability(e.target.value as AvailabilityStatus)
                      }
                      className={inputClass}
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={prodSortOrder}
                      onChange={(e) => setProdSortOrder(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-5">
                    <label className="inline-flex items-center gap-2 text-sm text-[#F5F1E8] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodFeatured}
                        onChange={(e) => setProdFeatured(e.target.checked)}
                        className="accent-[#B9975B] w-4 h-4"
                      />
                      <span>Featured</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-[#F5F1E8] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodBestSeller}
                        onChange={(e) => setProdBestSeller(e.target.checked)}
                        className="accent-[#B9975B] w-4 h-4"
                      />
                      <span>Best Seller</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Description *
                    </label>
                    <textarea
                      rows={4}
                      required
                      maxLength={2000}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      className={textareaClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Product Details (One item per line, max 10)
                    </label>
                    <textarea
                      rows={4}
                      value={prodDetailsText}
                      onChange={(e) => setProdDetailsText(e.target.value)}
                      placeholder={'Dimensions: 34cm x 22cm\nMaterial: Patinated brass\nPlacement: Indoor console or wall'}
                      className={textareaClass}
                    />
                  </div>
                </div>

                {/* Image Upload & URL Manager */}
                <div className="space-y-3 pt-4 border-t border-[#494335]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-wider text-[#B9B3A8]">
                      Product Photography ({prodImages.length}/4 images) *
                    </span>
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#B9975B] text-xs font-medium uppercase tracking-wider text-[#B9975B] hover:bg-[#B9975B]/10 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProductImageUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste an image URL..."
                      className="flex-1 h-10 px-3 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 h-10 border border-[#494335] text-xs uppercase tracking-wider text-[#F5F1E8] hover:border-[#B9975B]"
                    >
                      Add URL
                    </button>
                  </div>

                  {prodImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      {prodImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative border border-[#494335] bg-[#171715] aspect-[4/3] overflow-hidden group"
                        >
                          <ResilientImage
                            src={img}
                            alt={`Upload preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setProdImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove image"
                            className="absolute top-1.5 right-1.5 p-1.5 bg-[#171715]/85 text-[#F5F1E8] hover:bg-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#494335]">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-5 py-2.5 border border-[#494335] text-xs uppercase tracking-wider text-[#B9B3A8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProd}
                    className="px-6 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] disabled:opacity-60"
                  >
                    {savingProd ? 'Saving...' : 'Save Piece'}
                  </button>
                </div>
              </form>
            )}

            {/* Products Table */}
            <div className="bg-[#22221F] border border-[#494335] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#494335] text-[11px] uppercase tracking-wider text-[#B9975B] bg-[#292823]">
                    <th className="py-3.5 px-4">Piece</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Showcase</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#494335]/60 text-sm">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#292823]/70">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-11 bg-[#171715] shrink-0 overflow-hidden border border-[#494335]">
                            <ResilientImage
                              src={prod.images[0] || ''}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium text-[#F5F1E8] max-w-[240px] truncate">
                            {prod.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#B9B3A8] whitespace-nowrap">
                        {prod.categoryName}
                      </td>
                      <td className="py-3.5 px-4 font-medium tabular-nums text-[#B9975B] whitespace-nowrap">
                        {formatProductPrice(prod.price, siteSettings.currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#B9B3A8] whitespace-nowrap">
                        {prod.availability}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#B9B3A8] whitespace-nowrap">
                        {[
                          prod.featured ? 'Featured' : null,
                          prod.bestSeller ? 'Best Seller' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Standard'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {confirmDeleteProdId === prod.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="px-2.5 py-1 bg-red-700 text-[#FFFFFF] text-xs"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProdId(null)}
                              className="px-2.5 py-1 border border-[#494335] text-xs text-[#B9B3A8]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProductForm(prod)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#494335] text-xs text-[#F5F1E8] hover:border-[#B9975B] hover:text-[#B9975B]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProdId(prod.id)}
                              aria-label={`Delete ${prod.name}`}
                              className="p-1.5 border border-[#494335] text-[#B9B3A8] hover:text-red-400 hover:border-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= CATEGORIES TAB ================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F1E8]">Manage Categories</h2>
                <p className="text-xs text-[#B9B3A8] mt-0.5">
                  Edit existing categories or add new decorative groupings.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewCategoryForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] whitespace-nowrap shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            {showCategoryForm && (
              <form
                onSubmit={handleSaveCategory}
                className="bg-[#22221F] border border-[#B9975B] p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-[#494335] pb-4">
                  <h3 className="font-serif text-2xl text-[#F5F1E8]">
                    {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="text-xs uppercase tracking-wider text-[#B9B3A8]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      maxLength={64}
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder="auto-generated-from-name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={catSortOrder}
                      onChange={(e) => setCatSortOrder(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-28 aspect-[4/3] border border-[#494335] bg-[#171715] overflow-hidden shrink-0">
                    <ResilientImage
                      src={catImage}
                      alt={catName || 'Category cover'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#B9975B] text-xs uppercase tracking-wider text-[#B9975B] cursor-pointer">
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Upload Cover Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="text"
                      value={catImage}
                      onChange={(e) => setCatImage(e.target.value)}
                      placeholder="Or paste cover image URL"
                      className="w-full h-10 px-3 bg-[#171715] border border-[#494335] text-xs text-[#F5F1E8]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#494335]">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="px-5 py-2.5 border border-[#494335] text-xs uppercase tracking-wider text-[#B9B3A8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="px-6 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B]"
                  >
                    {savingCat ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-[#292823] border border-[#494335] flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#22221F] overflow-hidden">
                      <ResilientImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <div className="text-[11px] uppercase tracking-wider text-[#B9975B] tabular-nums">
                        Order {cat.sortOrder} · {cat.slug}
                      </div>
                      <h3 className="font-serif text-xl text-[#F5F1E8] mt-1">{cat.name}</h3>
                      <p className="text-sm text-[#B9B3A8] mt-1 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 border-t border-[#494335] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openEditCategoryForm(cat)}
                      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#F5F1E8] hover:text-[#B9975B]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {confirmDeleteCatId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-xs text-red-400 font-medium underline"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatId(null)}
                          className="text-xs text-[#B9B3A8]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCatId(cat.id)}
                        className="text-xs text-[#B9B3A8] hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-[#22221F] border border-[#494335] p-6 sm:p-10 space-y-8 max-w-4xl"
          >
            <div>
              <h2 className="font-serif text-3xl text-[#F5F1E8]">
                Homepage Content &amp; Contact Settings
              </h2>
              <p className="text-sm text-[#B9B3A8] mt-1">
                Updates made here reflect immediately across the Homepage, Contact page,
                WhatsApp inquiry links, and Footer.
              </p>
            </div>

            <div className="space-y-5 pt-4 border-t border-[#494335]">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[#B9975B] font-semibold">
                Homepage Hero &amp; Editorial Copy
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={settingsForm.heroHeadline}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, heroHeadline: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={settingsForm.currencySymbol}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, currencySymbol: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                  Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={400}
                  value={settingsForm.heroSubtitle}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, heroSubtitle: e.target.value }))
                  }
                  className={textareaClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Promotional Banner Title
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={settingsForm.promoTitle}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, promoTitle: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Promotional CTA Button Label
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={settingsForm.promoCtaText}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, promoCtaText: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                  Promotional Banner Subtitle
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={400}
                  value={settingsForm.promoSubtitle}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, promoSubtitle: e.target.value }))
                  }
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                  About ANTIKER Heading
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={settingsForm.aboutTitle}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, aboutTitle: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                  About ANTIKER Story Copy
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  value={settingsForm.aboutBody}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, aboutBody: e.target.value }))
                  }
                  className={textareaClass}
                />
              </div>
            </div>

            <div className="space-y-5 pt-6 border-t border-[#494335]">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[#B9975B] font-semibold">
                WhatsApp, Contact &amp; Social Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    WhatsApp Number (Country code + digits, e.g. 923001234567)
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, whatsappNumber: e.target.value }))
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Display Phone Number
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={settingsForm.phoneDisplay}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, phoneDisplay: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    maxLength={120}
                    value={settingsForm.emailDisplay}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, emailDisplay: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={settingsForm.instagramHandle}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, instagramHandle: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                  Business Location / Showroom Address
                </label>
                <input
                  type="text"
                  maxLength={240}
                  value={settingsForm.addressDisplay}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, addressDisplay: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    maxLength={200}
                    value={settingsForm.facebookUrl}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, facebookUrl: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                    Pinterest URL
                  </label>
                  <input
                    type="url"
                    maxLength={200}
                    value={settingsForm.pinterestUrl}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, pinterestUrl: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#494335] flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-7 py-3 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#CCA86B] disabled:opacity-60"
              >
                {savingSettings ? 'Saving Settings...' : 'Save All Changes'}
              </button>
            </div>
          </form>
        )}

        {/* ================= INQUIRIES TAB ================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl text-[#F5F1E8]">Customer Inquiries</h2>
              <p className="text-xs text-[#B9B3A8] mt-0.5">
                Messages and newsletter signups submitted by visitors.
              </p>
            </div>

            {inquiries.length === 0 ? (
              <div className="bg-[#22221F] border border-[#494335] py-16 text-center">
                <Mail className="w-6 h-6 text-[#B9975B] mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-serif text-xl text-[#F5F1E8]">No inquiries yet</p>
                <p className="text-xs text-[#B9B3A8] mt-1">
                  Visitor messages sent via the Contact page or Newsletter will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-[#292823] border border-[#494335] p-6 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#B9975B]">
                          {inq.status === 'new' ? 'New Inquiry' : 'Reviewed'}
                        </div>
                        <h3 className="font-serif text-xl text-[#F5F1E8] mt-0.5">
                          {inq.subject}
                        </h3>
                        <p className="text-xs text-[#B9B3A8] mt-1">
                          From <span className="font-medium text-[#F5F1E8]">{inq.name}</span> ·{' '}
                          <a
                            href={`mailto:${inq.email}`}
                            className="underline hover:text-[#B9975B]"
                          >
                            {inq.email}
                          </a>
                          {inq.phone ? ` · ${inq.phone}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {inq.status === 'new' && (
                          <button
                            type="button"
                            onClick={() => markInquiryReviewed(inq.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Reviewed</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteInquiry(inq.id)}
                          aria-label="Delete inquiry"
                          className="p-2 border border-[#494335] text-[#B9B3A8] hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-[#B9B3A8] leading-relaxed pt-3 border-t border-[#494335]">
                      {inq.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= PUSH NOTIFICATIONS TAB ================= */}
        {activeTab === 'notifications' && (
          <AdminPushNotificationsPanel onNotice={showNotice} />
        )}
      </div>
    </div>
  );
}
