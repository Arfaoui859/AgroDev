import React, { useCallback, useState } from 'react';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { cardPad, flex1, screenStyles, spaceBetween, stackSm, stackTopMd } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import { labelSemibold, subtleCaption, titleBase, xsSemibold } from '../theme/typographyStyles';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScreenHeading } from '../components/ui/ScreenHeading';
import { SearchBar } from '../components/ui/SearchBar';
import { ProvenanceBar } from '../components/ui/ProvenanceBar';
import { StateCard } from '../components/ui/StateCard';
import { createMarketplaceInquiry, createMarketplaceListing, deleteMarketplaceListing, getAgriculturalCatalog, getMarketPrices, getMarketplaceInquiries, getMarketplaceListings, getMyMarketplaceListings, updateMarketplaceInquiryStatus, updateMarketplaceListing, updateMarketplaceListingStatus, uploadMarketplaceImage } from '../api/client';
import { AgriculturalCatalogProduct, MarketplaceInquiry, MarketplaceListing, MarketPriceItem, ProvenanceMeta } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../components/ui/Button';

/**
 * Market prices read from the platform's stored `market_prices` records.
 * These are platform records, not an independently verified market feed, so the
 * provenance badge says so and no trend is shown when the backend does not
 * provide one (changePercent is null).
 */
export const MarketplaceScreen: React.FC = () => {
  const { t, x, isRtl, language } = useLanguage();
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [inquiries, setInquiries] = useState<MarketplaceInquiry[]>([]);
  const [activeInquiryListing, setActiveInquiryListing] = useState<string | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editListingTitle, setEditListingTitle] = useState('');
  const [editListingPrice, setEditListingPrice] = useState('');
  const [editListingCategory, setEditListingCategory] = useState('');
  const [editListingSaving, setEditListingSaving] = useState(false);
  const [catalog, setCatalog] = useState<AgriculturalCatalogProduct[]>([]);
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const [sellerFormOpen, setSellerFormOpen] = useState(false);
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [sellerType, setSellerType] = useState<NonNullable<MarketplaceListing['listingType']>>('agricultural_input');
  const [sellerTitle, setSellerTitle] = useState('');
  const [sellerCategory, setSellerCategory] = useState('');
  const [sellerDescription, setSellerDescription] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');
  const [sellerQuantity, setSellerQuantity] = useState('');
  const [sellerUnit, setSellerUnit] = useState('kg');
  const [sellerLocation, setSellerLocation] = useState('');
  const [sellerGovernorate, setSellerGovernorate] = useState('');
  const [harvestCrop, setHarvestCrop] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [sellerImage, setSellerImage] = useState<{ uri: string; mimeType?: string } | null>(null);
  const [listingsUnavailable, setListingsUnavailable] = useState(false);
  // Default to an honest "stored, not verified" label; the load replaces it with
  // the backend's own provenance. Never default to `isRealData: true`.
  const [meta, setMeta] = useState<ProvenanceMeta>({ provenance: 'database', isRealData: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<'home' | 'inquiries' | 'myListings' | 'catalog' | 'harvest' | 'listings' | 'prices'>('home');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadPrices = useCallback(async () => {
    // Prices and seller listings are separate backend capabilities. A failure
    // in one must not suppress useful data returned by the other.
    const [priceOutcome, listingsOutcome, catalogOutcome, myListingsOutcome, inquiriesOutcome] = await Promise.all([
      getMarketPrices().then((data) => ({ data })).catch((error: unknown) => ({ error })),
      getMarketplaceListings().then((data) => ({ data })).catch((error: unknown) => ({ error })),
      getAgriculturalCatalog().then((data) => ({ data })).catch((error: unknown) => ({ error })),
      getMyMarketplaceListings().then((data) => ({ data })).catch((error: unknown) => ({ error })),
      getMarketplaceInquiries().then((data) => ({ data })).catch((error: unknown) => ({ error })),
    ]);

    if ('data' in priceOutcome) {
      const res = priceOutcome.data;
      setPrices(res.data?.prices ?? []);
      if (res.data?.meta) setMeta(res.data.meta);
      setError(res.error);
      setFromCache(res.fromCache);
    } else {
      setPrices([]);
      setError(priceOutcome.error instanceof Error ? priceOutcome.error.message : 'Market prices request failed');
      setFromCache(false);
    }

    if ('data' in listingsOutcome) {
      setListings(listingsOutcome.data.data.listings);
      setListingsUnavailable(listingsOutcome.data.unavailable);
    } else {
      setListings([]);
      setListingsUnavailable(true);
    }

    if ('data' in catalogOutcome) {
      setCatalog(catalogOutcome.data.data);
      setCatalogUnavailable(Boolean(catalogOutcome.data.error));
    } else {
      setCatalog([]);
      setCatalogUnavailable(true);
    }
    setMyListings('data' in myListingsOutcome ? myListingsOutcome.data.data : []);
    setInquiries('data' in inquiriesOutcome ? inquiriesOutcome.data.data : []);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await loadPrices();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPrices]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPrices();
    } finally {
      setRefreshing(false);
    }
  };

  const pickSellerImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(language === 'ar' ? 'إذن الصور مطلوب' : language === 'fr' ? 'Autorisation requise' : 'Permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.82 });
    if (!result.canceled && result.assets[0]) setSellerImage({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? 'image/jpeg' });
  };

  const publishSellerListing = async () => {
    if (sellerTitle.trim().length < 3 || !sellerCategory.trim()) {
      Alert.alert(language === 'ar' ? 'أكمل اسم المنتج والصنف' : language === 'fr' ? 'Nom et catégorie requis' : 'Title and category are required');
      return;
    }
    if (sellerPrice.trim() && (!Number.isFinite(Number(sellerPrice)) || Number(sellerPrice) < 0)) {
      Alert.alert(language === 'ar' ? 'السعر غير صحيح' : language === 'fr' ? 'Prix invalide' : 'Invalid price');
      return;
    }
    if (sellerType === 'harvest' && (!harvestCrop.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(harvestDate))) {
      Alert.alert(language === 'ar' ? 'نوع المحصول وتاريخ الحصاد مطلوبان' : language === 'fr' ? 'Culture et date de récolte requises' : 'Crop and harvest date are required (YYYY-MM-DD)');
      return;
    }
    setSellerSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (sellerImage) {
        const uploaded = await uploadMarketplaceImage(sellerImage.uri, sellerImage.mimeType);
        if (!uploaded.url) throw new Error(uploaded.error || 'Image upload failed');
        imageUrls = [uploaded.url];
      }
      const result = await createMarketplaceListing({
        listing_type: sellerType, title: sellerTitle.trim(), category: sellerCategory.trim(),
        description: sellerDescription.trim() || undefined,
        price: sellerPrice.trim() ? Number(sellerPrice) : null,
        quantity: sellerQuantity.trim() ? Number(sellerQuantity) : null,
        currency: 'TND', unit: sellerUnit.trim() || undefined,
        location: sellerLocation.trim() || undefined, governorate: sellerGovernorate.trim() || undefined,
        image_urls: imageUrls,
        harvest_crop: sellerType === 'harvest' ? harvestCrop.trim() : undefined,
        expected_harvest_date: sellerType === 'harvest' ? harvestDate : undefined,
      });
      if (!result.data) throw new Error(result.error || 'Could not publish listing');
      setSellerTitle(''); setSellerCategory(''); setSellerDescription(''); setSellerPrice('');
      setSellerQuantity(''); setSellerLocation(''); setSellerGovernorate(''); setHarvestCrop('');
      setHarvestDate(''); setSellerImage(null); setSellerFormOpen(false);
      Alert.alert(language === 'ar' ? 'تم نشر العرض' : language === 'fr' ? 'Annonce publiée' : 'Listing published');
      await loadPrices();
    } catch (e) {
      Alert.alert(language === 'ar' ? 'تعذر نشر العرض' : language === 'fr' ? 'Publication impossible' : 'Could not publish listing',
        e instanceof Error ? e.message : 'Please sign in and try again.');
    } finally {
      setSellerSubmitting(false);
    }
  };

  const sendMarketplaceInquiry = async () => {
    if (!activeInquiryListing || inquiryMessage.trim().length < 5) {
      Alert.alert(language === 'ar' ? 'اكتب رسالة قصيرة للبائع' : language === 'fr' ? 'Écrivez un message au vendeur' : 'Write a short message to the seller');
      return;
    }
    setInquirySubmitting(true);
    try {
      const result = await createMarketplaceInquiry(activeInquiryListing, inquiryMessage.trim());
      if (!result.success) throw new Error(result.error || 'INQUIRY_CREATE_FAILED');
      setActiveInquiryListing(null);
      setInquiryMessage('');
      Alert.alert(language === 'ar' ? 'تم إرسال طلب التواصل' : language === 'fr' ? 'Demande envoyée' : 'Inquiry sent');
      await loadPrices();
    } catch (e) {
      Alert.alert(language === 'ar' ? 'تعذر إرسال الطلب' : language === 'fr' ? 'Envoi impossible' : 'Could not send inquiry',
        e instanceof Error ? e.message : 'Please sign in and try again.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const archiveMyListing = async (id: string) => {
    const result = await updateMarketplaceListingStatus(id, 'archived');
    if (!result.success) {
      Alert.alert(language === 'ar' ? 'تعذر تحديث العرض' : language === 'fr' ? 'Mise à jour impossible' : 'Could not update listing', result.error || '');
      return;
    }
    await loadPrices();
  };

  const acceptMarketplaceInquiry = async (id: string) => {
    const result = await updateMarketplaceInquiryStatus(id, 'accepted');
    if (!result.success) {
      Alert.alert(language === 'ar' ? 'تعذر قبول الطلب' : language === 'fr' ? 'Action impossible' : 'Could not accept inquiry', result.error || '');
      return;
    }
    await loadPrices();
  };

  const beginEditListing = (listing: MarketplaceListing) => {
    setEditingListingId(listing.id);
    setEditListingTitle(listing.title);
    setEditListingCategory(listing.category || '');
    setEditListingPrice(listing.price == null ? '' : String(listing.price));
  };

  const saveListingEdits = async () => {
    if (!editingListingId || editListingTitle.trim().length < 3 || !editListingCategory.trim()) {
      Alert.alert(language === 'ar' ? 'أكمل الاسم والصنف' : language === 'fr' ? 'Titre et catégorie requis' : 'Title and category are required');
      return;
    }
    if (editListingPrice.trim() && (!Number.isFinite(Number(editListingPrice)) || Number(editListingPrice) < 0)) {
      Alert.alert(language === 'ar' ? 'السعر غير صحيح' : language === 'fr' ? 'Prix invalide' : 'Invalid price');
      return;
    }
    setEditListingSaving(true);
    try {
      const result = await updateMarketplaceListing(editingListingId, {
        title: editListingTitle.trim(), category: editListingCategory.trim(),
        price: editListingPrice.trim() ? Number(editListingPrice) : null,
      });
      if (!result.success) throw new Error(result.error || 'LISTING_UPDATE_FAILED');
      setEditingListingId(null);
      await loadPrices();
    } catch (e) {
      Alert.alert(language === 'ar' ? 'تعذر تحديث العرض' : language === 'fr' ? 'Mise à jour impossible' : 'Could not update listing',
        e instanceof Error ? e.message : '');
    } finally {
      setEditListingSaving(false);
    }
  };

  const confirmDeleteListing = (id: string) => {
    Alert.alert(
      language === 'ar' ? 'حذف العرض؟' : language === 'fr' ? 'Supprimer l’annonce ?' : 'Delete listing?',
      language === 'ar' ? 'لن يظهر هذا العرض في السوق بعد الحذف.' : language === 'fr' ? 'Cette annonce sera supprimée du marché.' : 'This listing will be removed from the marketplace.',
      [
        { text: language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        { text: language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete', style: 'destructive', onPress: () => {
          void (async () => {
            const result = await deleteMarketplaceListing(id);
            if (!result.success) {
              Alert.alert(language === 'ar' ? 'تعذر الحذف' : language === 'fr' ? 'Suppression impossible' : 'Could not delete listing', result.error || '');
              return;
            }
            await loadPrices();
          })();
        }},
      ],
    );
  };

  const sellerListings = listings.filter((item) => item.listingType !== 'harvest');
  const futureHarvests = listings.filter((item) => item.listingType === 'harvest');

  // Keep one latest observation per crop in the current-price view.
  // All historical observations remain untouched in the database.
  const latestPriceByCrop = new Map<string, MarketPriceItem>();
  prices.forEach((item) => {
    const cropKey = (item.cropNameAr || item.cropName || item.id)
      .normalize('NFC')
      .replace(/\u0640/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
    if (!cropKey) return;
    const existing = latestPriceByCrop.get(cropKey);
    const itemDate = Date.parse(item.periodEnd || item.lastUpdated || item.periodStart || '');
    const existingDate = existing ? Date.parse(existing.periodEnd || existing.lastUpdated || existing.periodStart || '') : Number.NEGATIVE_INFINITY;
    if (!existing || (Number.isFinite(itemDate) ? itemDate : Number.NEGATIVE_INFINITY) >
      (Number.isFinite(existingDate) ? existingDate : Number.NEGATIVE_INFINITY)) {
      latestPriceByCrop.set(cropKey, item);
    }
  });

  const latestPrices = Array.from(latestPriceByCrop.values()).sort((a, b) => {
    const aDate = Date.parse(a.periodEnd || a.lastUpdated || a.periodStart || '');
    const bDate = Date.parse(b.periodEnd || b.lastUpdated || b.periodStart || '');
    return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
  });

  const filteredPrices = latestPrices.filter((item) => {
    const q = searchQuery.trim().toLocaleLowerCase();
    if (!q) return true;
    return item.cropNameAr.toLocaleLowerCase().includes(q) || item.cropName.toLocaleLowerCase().includes(q);
  });

  const formatMarketDate = (value?: string | null) => {
    if (!value) return '—';
    const datePart = value.slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart)
      ? new Date(datePart + 'T12:00:00')
      : new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(date);
  };

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <ScreenHeading title={t.marketTitle} subtitle={t.marketSubtitle} />

      {selectedMarketCategory !== 'home' ? (
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}>
          <Pressable onPress={() => { setSelectedMarketCategory('home'); setSearchQuery(''); setSellerFormOpen(false); setActiveInquiryListing(null); }} style={styles.marketBackButton}>
            <MaterialCommunityIcons name={isRtl ? 'arrow-right' : 'arrow-left'} size={20} color={colors.primary} />
            <Text style={styles.marketBackText}>{language === 'ar' ? 'رجوع للأقسام' : language === 'fr' ? 'Retour aux catégories' : 'Back to categories'}</Text>
          </Pressable>
        </View>
      ) : null}
      {selectedMarketCategory !== 'home' ? (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t.searchCrop}
          clearLabel={x.clearSearch}
        />
      ) : null}

      {selectedMarketCategory === 'home' ? (
      <View style={styles.marketCategorySection}>
        <Text style={[styles.marketCategoryHeading, isRtl && rtlStyles.rtlText]}>
          {language === 'ar' ? 'شنوّة تحب تلقى؟' : language === 'fr' ? 'Que recherchez-vous ?' : 'What are you looking for?'}
        </Text>
        <View style={styles.marketCategoryGrid}>
          {([
            { id: 'inquiries', icon: 'message-text-outline', ar: 'طلبات التواصل', fr: 'Demandes de contact', en: 'Contact requests', count: inquiries.length },
            { id: 'myListings', icon: 'clipboard-list-outline', ar: 'عروضي للبيع', fr: 'Mes annonces', en: 'My sale offers', count: myListings.length },
            { id: 'catalog', icon: 'book-open-variant', ar: 'دليل الأدوية والأسمدة', fr: 'Guide des intrants', en: 'Agricultural inputs guide', count: catalog.length },
            { id: 'harvest', icon: 'calendar-clock', ar: 'محاصيل قادمة للحصاد', fr: 'Récoltes à venir', en: 'Upcoming harvests', count: futureHarvests.length },
            { id: 'listings', icon: 'storefront-outline', ar: 'عروض البيع والشراء', fr: 'Offres achat & vente', en: 'Buy & sell offers', count: sellerListings.length },
            { id: 'prices', icon: 'chart-line', ar: 'أسعار السوق', fr: 'Prix du marché', en: 'Market prices', count: latestPrices.length },
          ] as const).map((category) => {
            const active = selectedMarketCategory === category.id;
            return (
              <Pressable key={category.id} onPress={() => setSelectedMarketCategory(category.id)}
                style={[styles.marketCategoryTile, active && styles.marketCategoryTileActive]}>
                <View style={[styles.marketCategoryIcon, active && styles.marketCategoryIconActive]}>
                  <MaterialCommunityIcons name={category.icon as any} size={23} color={active ? colors.primaryDark : colors.primary} />
                </View>
                <Text style={[styles.marketCategoryName, isRtl && rtlStyles.rtlText, active && styles.marketCategoryNameActive]}>
                  {language === 'ar' ? category.ar : language === 'fr' ? category.fr : category.en}
                </Text>
                <Text style={styles.marketCategoryCount}>{category.count} {language === 'ar' ? 'عرض' : language === 'fr' ? 'annonces' : 'items'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      ) : null}
      {selectedMarketCategory === 'listings' ? (
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="store-plus-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'بيع منتوجك على AgroGrowth' : language === 'fr' ? 'Vendre sur AgroGrowth' : 'Sell on AgroGrowth'}
          </Text>
        </View>
        <Text style={[styles.listingMeta, { textAlign: isRtl ? 'right' : 'left' }]}>
          {language === 'ar' ? 'انشر منتوج فلاحي أو معدات أو محصولك القادم. يلزم تسجيل الدخول.' : language === 'fr' ? 'Publiez un intrant, un équipement ou une récolte à venir. Connexion requise.' : 'Publish agricultural inputs, equipment or an upcoming harvest. Sign-in required.'}
        </Text>
        <Button title={sellerFormOpen
          ? (language === 'ar' ? 'إغلاق النموذج' : language === 'fr' ? 'Fermer' : 'Close form')
          : (language === 'ar' ? 'إضافة عرض للبيع' : language === 'fr' ? 'Ajouter une annonce' : 'Create a listing')}
          onPress={() => setSellerFormOpen(v => !v)} variant="outline" size="md" />
        {sellerFormOpen ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {(['agricultural_input','equipment','agricultural_product','harvest'] as const).map(type => (
                <Pressable key={type} onPress={() => setSellerType(type)}
                  style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.lg, borderWidth: 1, borderColor: sellerType === type ? colors.primary : colors.border, backgroundColor: sellerType === type ? colors.primaryLight : colors.surface }}>
                  <Text style={{ color: sellerType === type ? colors.primaryDark : colors.text, fontSize: typography.fontSizes.xs }}>
                    {type === 'agricultural_input' ? (language === 'ar' ? 'أدوية وأسمدة' : language === 'fr' ? 'Intrants' : 'Inputs') :
                     type === 'equipment' ? (language === 'ar' ? 'معدات' : language === 'fr' ? 'Matériel' : 'Equipment') :
                     type === 'agricultural_product' ? (language === 'ar' ? 'منتوج فلاحي' : language === 'fr' ? 'Produit agricole' : 'Farm produce') :
                     (language === 'ar' ? 'محصول قادم' : language === 'fr' ? 'Récolte à venir' : 'Future harvest')}
                  </Text>
                </Pressable>
              ))}
            </View>
            {[
              { label: language === 'ar' ? 'اسم العرض' : language === 'fr' ? 'Titre' : 'Listing title', value: sellerTitle, set: setSellerTitle, placeholder: ' ' },
              { label: language === 'ar' ? 'الصنف' : language === 'fr' ? 'Catégorie' : 'Category', value: sellerCategory, set: setSellerCategory, placeholder: language === 'ar' ? 'مثال: مبيد، سماد، زيت زيتون' : 'e.g. pesticide, fertilizer, olive oil' },
              { label: language === 'ar' ? 'السعر بالدينار' : language === 'fr' ? 'Prix (TND)' : 'Price (TND)', value: sellerPrice, set: setSellerPrice, keyboard: 'decimal-pad' as const },
              { label: language === 'ar' ? 'الكمية' : language === 'fr' ? 'Quantité' : 'Quantity', value: sellerQuantity, set: setSellerQuantity, keyboard: 'decimal-pad' as const },
              { label: language === 'ar' ? 'الوحدة' : language === 'fr' ? 'Unité' : 'Unit', value: sellerUnit, set: setSellerUnit },
              { label: language === 'ar' ? 'الموقع' : language === 'fr' ? 'Localisation' : 'Location', value: sellerLocation, set: setSellerLocation },
              { label: language === 'ar' ? 'الولاية' : language === 'fr' ? 'Gouvernorat' : 'Governorate', value: sellerGovernorate, set: setSellerGovernorate },
            ].map(field => (
              <View key={field.label} style={{ gap: 4 }}>
                <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>{field.label}</Text>
                <TextInput value={field.value} onChangeText={field.set} placeholder={field.placeholder}
                  keyboardType={field.keyboard || 'default'} style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text, textAlign: isRtl ? 'right' : 'left', backgroundColor: colors.surface }} />
              </View>
            ))}
            <View style={{ gap: 4 }}>
              <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>{language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}</Text>
              <TextInput value={sellerDescription} onChangeText={setSellerDescription} multiline
                style={{ minHeight: 76, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, textAlign: isRtl ? 'right' : 'left', backgroundColor: colors.surface }} />
            </View>
            {sellerType === 'harvest' ? (
              <>
                <View style={{ gap: 4 }}>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>{language === 'ar' ? 'نوع المحصول' : language === 'fr' ? 'Culture' : 'Crop'}</Text>
                  <TextInput value={harvestCrop} onChangeText={setHarvestCrop} style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text }} />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>{language === 'ar' ? 'تاريخ الحصاد المتوقع (YYYY-MM-DD)' : language === 'fr' ? 'Date prévue (YYYY-MM-DD)' : 'Expected harvest date (YYYY-MM-DD)'}</Text>
                  <TextInput value={harvestDate} onChangeText={setHarvestDate} placeholder="2027-01-15" style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text }} />
                </View>
              </>
            ) : null}
            <Button title={sellerImage
              ? (language === 'ar' ? 'تم اختيار صورة' : language === 'fr' ? 'Image sélectionnée' : 'Image selected')
              : (language === 'ar' ? 'إضافة صورة للمنتوج' : language === 'fr' ? 'Ajouter une photo' : 'Add product photo')}
              onPress={pickSellerImage} variant="secondary" size="md" />
            <Button title={language === 'ar' ? 'نشر العرض' : language === 'fr' ? 'Publier' : 'Publish listing'}
              onPress={publishSellerListing} loading={sellerSubmitting} disabled={sellerSubmitting} size="lg" />
          </View>
        ) : null}
      </Card>
      ) : (
        <View style={styles.marketHomeHint}>
          <MaterialCommunityIcons name="gesture-tap" size={18} color={colors.primary} />
          <Text style={[styles.marketHomeHintText, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'اختار قسم باش تشوف المنتوجات والأسعار متاعو.' : language === 'fr' ? 'Choisissez une catégorie pour afficher ses produits et ses prix.' : 'Choose a category to explore its products and prices.'}
          </Text>
        </View>
      )}

      {selectedMarketCategory === 'prices' && (
      <>
      {loading ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : error && prices.length === 0 ? (
        <StateCard
          kind="error"
          title={x.stateError}
          message={error}
          onRetry={loadPrices}
          retryLabel={x.retry}
        />
      ) : prices.length === 0 ? (
        <StateCard
          kind="empty"
          title={x.stateEmpty}
          message={x.marketNoPrices}
          onRetry={loadPrices}
          retryLabel={x.retry}
        />
      ) : (
        <>
          <ProvenanceBar meta={meta} detailed cached={fromCache} style={styles.provBar} />

          <View style={styles.priceSummaryRow}>
            <View style={styles.priceSummaryIcon}>
              <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary} />
            </View>
            <View style={styles.priceSummaryText}>
              <Text style={[styles.priceSummaryTitle, isRtl && rtlStyles.rtlText]}>
                {language === 'ar' ? 'آخر الأسعار المتوفرة' : language === 'fr' ? 'Derniers prix disponibles' : 'Latest available prices'}
              </Text>
              <Text style={[styles.priceSummaryCaption, isRtl && rtlStyles.rtlText]}>
                {language === 'ar' ? 'كل محصول يظهر مرة واحدة حسب أحدث تاريخ' : language === 'fr' ? 'Un seul prix par culture, selon la date la plus récente' : 'One entry per crop, selected by the latest observation date'}
              </Text>
            </View>
            <Badge label={String(latestPrices.length)} variant="primary" size="md" />
          </View>

          <View style={styles.priceList}>
            {filteredPrices.length === 0 ? (
              <StateCard kind="empty" title={x.stateEmpty} message={x.marketNoMatch} compact />
            ) : (
              filteredPrices.map((item) => {
                const priceText = item.pricePerKg !== null
                  ? item.pricePerKg.toFixed(2)
                  : item.priceMin != null && item.priceMax != null
                    ? `${item.priceMin.toFixed(2)} – ${item.priceMax.toFixed(2)}`
                    : item.priceMin != null ? item.priceMin.toFixed(2)
                      : item.priceMax != null ? item.priceMax.toFixed(2) : '—';
                const dateLabel = item.aggregationPeriod === 'monthly'
                  ? (language === 'ar' ? 'فترة السعر' : language === 'fr' ? 'Période du prix' : 'Price period')
                  : (language === 'ar' ? 'تاريخ آخر سعر' : language === 'fr' ? 'Date du dernier prix' : 'Latest price date');
                const dateValue = item.periodStart && item.periodEnd && item.periodStart !== item.periodEnd
                  ? `${formatMarketDate(item.periodStart)} – ${formatMarketDate(item.periodEnd)}`
                  : formatMarketDate(item.periodEnd || item.lastUpdated || item.periodStart);
                return (
                  <Card key={item.id} variant="elevated" style={styles.priceCard}>
                    <View style={[styles.priceCardTop, isRtl && rtlStyles.rtlRow]}>
                      <View style={styles.cropInfo}>
                        <Text style={[styles.cropName, isRtl && rtlStyles.rtlText]} numberOfLines={2}>
                          {language === 'ar' ? item.cropNameAr.replace(/\u0640/g, '') : item.cropName}
                        </Text>
                        <View style={[styles.locationRow, isRtl && rtlStyles.rtlRow]}>
                          <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.marketLocation}>
                            {item.marketLocation && item.marketLocation !== '—' ? item.marketLocation : (language === 'ar' ? 'سوق الجملة' : language === 'fr' ? 'Marché de gros' : 'Wholesale market')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.priceDisplay}>
                        <Text style={styles.priceValue}>{priceText}</Text>
                        <Text style={styles.currencyLabel}>
                          {item.currency === 'TND' && item.unit === 'kg' ? t.currencyPerKg : `${item.currency || 'TND'} / ${item.unit || 'kg'}`}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.priceDatePanel, isRtl && rtlStyles.rtlRow]}>
                      <View style={styles.priceDateIcon}>
                        <MaterialCommunityIcons name="calendar-clock" size={17} color={colors.primary} />
                      </View>
                      <View style={styles.priceDateText}>
                        <Text style={[styles.priceDateLabel, isRtl && rtlStyles.rtlText]}>{dateLabel}</Text>
                        <Text style={[styles.priceDateValue, isRtl && rtlStyles.rtlText]}>{dateValue}</Text>
                      </View>
                      {item.aggregationPeriod === 'monthly' ? (
                        <Badge label={language === 'ar' ? 'معدل شهري' : language === 'fr' ? 'Moyenne mensuelle' : 'Monthly average'} variant="secondary" size="sm" />
                      ) : null}
                    </View>

                    <View style={[styles.priceMetaRow, isRtl && rtlStyles.rtlRow]}>
                      {item.sourceName ? (
                        <View style={[styles.priceMetaItem, isRtl && rtlStyles.rtlRow]}>
                          <MaterialCommunityIcons name="database-check-outline" size={13} color={colors.textMuted} />
                          <Text style={styles.marketLocation}>{item.sourceName}</Text>
                        </View>
                      ) : null}
                      {item.qualityGrade && item.qualityGrade !== '—' ? (
                        <Badge label={item.qualityGrade} variant="secondary" size="sm" />
                      ) : null}
                      {item.changePercent != null && item.aggregationPeriod === 'monthly' ? (
                        <Text style={styles.marketLocation}>
                          {language === 'ar' ? 'مقارنة بالعام السابق' : language === 'fr' ? 'vs année précédente' : 'vs previous year'}: {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                        </Text>
                      ) : null}
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </>
      )}
      </>
      )}

      {selectedMarketCategory === 'listings' && (
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="storefront-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>{x.marketListingsTitle}</Text>
        </View>
        {listingsUnavailable ? (
          <StateCard kind="unavailable" title={x.marketListingsUnavailable} message={x.marketListingsBody} compact />
        ) : sellerListings.length === 0 ? (
          <StateCard kind="empty" title={x.stateEmpty} message={x.marketNoMatch} compact />
        ) : (
          <View style={styles.listingRows}>
            {sellerListings.map((listing) => (
              <View key={listing.id} style={[styles.listingRow, isRtl && rtlStyles.rtlRow]}>
                {listing.imageUrl ? <Image source={{ uri: listing.imageUrl }} style={styles.listingThumb} resizeMode="cover" /> : null}
                <View style={styles.listingText}>
                  <Text style={[styles.listingName, { textAlign: isRtl ? 'right' : 'left' }]}>{listing.title}</Text>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                    {[listing.category, listing.sellerName, listing.location].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                {listing.price != null ? (
                  <Text style={styles.listingPrice}>{listing.price.toFixed(2) + ' ' + (listing.currency || 'TND') + (listing.unit ? ' / ' + listing.unit : '')}</Text>
                ) : null}
                <Button title={language === 'ar' ? 'تواصل' : language === 'fr' ? 'Contacter' : 'Contact seller'}
                  onPress={() => { setActiveInquiryListing(listing.id); setInquiryMessage(''); }} variant="outline" size="sm" fullWidth={false} />
              </View>
            ))}
          </View>
        )}
      </Card>
      )}

      {selectedMarketCategory === 'harvest' && (
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="sprout" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'محاصيل قادمة للحصاد' : language === 'fr' ? 'Récoltes à venir' : 'Upcoming harvests'}
          </Text>
        </View>
        {listingsUnavailable ? (
          <StateCard kind="unavailable" title={x.marketListingsUnavailable} message={x.marketListingsBody} compact />
        ) : futureHarvests.length === 0 ? (
          <StateCard kind="empty" title={x.stateEmpty}
            message={language === 'ar' ? 'لا توجد عروض حصاد متوقعة منشورة حالياً.' : language === 'fr' ? 'Aucune récolte prévisionnelle publiée.' : 'No upcoming harvest offers have been published yet.'} compact />
        ) : (
          <View style={styles.listingRows}>
            {futureHarvests.map((listing) => (
              <View key={listing.id} style={[styles.listingRow, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.listingText}>
                  <Text style={[styles.listingName, isRtl && rtlStyles.rtlText]}>{listing.title}</Text>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                    {[listing.sellerName, listing.governorate || listing.location,
                      listing.expectedHarvestDate ? (language === 'ar' ? 'الحصاد: ' : language === 'fr' ? 'Récolte : ' : 'Harvest: ') + listing.expectedHarvestDate : null]
                      .filter(Boolean).join(' • ')}
                  </Text>
                </View>
                {listing.price != null ? (
                  <Text style={styles.listingPrice}>{listing.price.toFixed(2) + ' ' + (listing.currency || 'TND') + (listing.unit ? ' / ' + listing.unit : '')}</Text>
                ) : null}
                <Button title={language === 'ar' ? 'تواصل' : language === 'fr' ? 'Contacter' : 'Contact seller'}
                  onPress={() => { setActiveInquiryListing(listing.id); setInquiryMessage(''); }} variant="outline" size="sm" fullWidth={false} />
              </View>
            ))}
          </View>
        )}
      </Card>
      )}

      {selectedMarketCategory === 'listings' && activeInquiryListing ? (
        <Card variant="outlined" style={styles.listingsCard}>
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'إرسال طلب للبائع' : language === 'fr' ? 'Contacter le vendeur' : 'Send an inquiry'}
          </Text>
          <TextInput value={inquiryMessage} onChangeText={setInquiryMessage} multiline
            placeholder={language === 'ar' ? 'اكتب رسالتك أو الكمية المطلوبة...' : language === 'fr' ? 'Votre message ou quantité souhaitée...' : 'Your message or requested quantity...'}
            style={{ minHeight: 90, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, textAlign: isRtl ? 'right' : 'left' }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title={language === 'ar' ? 'إرسال' : language === 'fr' ? 'Envoyer' : 'Send inquiry'}
              onPress={sendMarketplaceInquiry} loading={inquirySubmitting} disabled={inquirySubmitting} size="md" fullWidth={false} />
            <Button title={language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
              onPress={() => { setActiveInquiryListing(null); setInquiryMessage(''); }} variant="outline" size="md" fullWidth={false} />
          </View>
        </Card>
      ) : null}

      {selectedMarketCategory === 'catalog' && (
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="flask-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'دليل الأدوية والأسمدة والبذور' : language === 'fr' ? 'Catalogue agricole' : 'Agricultural inputs catalog'}
          </Text>
        </View>
        {catalogUnavailable ? (
          <StateCard kind="unavailable"
            title={language === 'ar' ? 'الكتالوج غير متاح' : language === 'fr' ? 'Catalogue indisponible' : 'Catalog unavailable'}
            message={language === 'ar' ? 'يلزم تطبيق ترحيل قاعدة البيانات وربط مصدر موثوق.' : language === 'fr' ? 'La migration et une source fiable doivent être configurées.' : 'Apply the database migration and connect a trusted source.'} compact />
        ) : catalog.length === 0 ? (
          <StateCard kind="empty" title={x.stateEmpty}
            message={language === 'ar' ? 'لم يتم استيراد منتجات موثّقة بعد. لن نعرض أسماء أو جرعات مخمّنة.' : language === 'fr' ? 'Aucun produit source n’a encore été importé.' : 'No source-backed products have been imported yet.'} compact />
        ) : (
          <View style={styles.listingRows}>
            {catalog.slice(0, 12).map((product) => (
              <View key={product.id} style={[styles.listingRow, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.listingText}>
                  <Text style={[styles.listingName, isRtl && rtlStyles.rtlText]}>{product.tradeName}</Text>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                    {[product.productType, product.activeIngredient, product.sourceName].filter(Boolean).join(' • ')}
                  </Text>
                  {product.registrationNumber ? (
                    <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                      {(language === 'ar' ? 'رقم التسجيل: ' : language === 'fr' ? 'N° homologation : ' : 'Registration no.: ') + product.registrationNumber}
                    </Text>
                  ) : null}
                  {product.registrationEvidenceUrl ? (
                    <Pressable onPress={() => { void Linking.openURL(product.registrationEvidenceUrl!).catch(() => Alert.alert(language === 'ar' ? 'تعذر فتح الوثيقة' : language === 'fr' ? 'Impossible d’ouvrir le document' : 'Could not open evidence')); }}>
                      <Text style={[styles.listingMeta, { color: colors.primary, textDecorationLine: 'underline' }, isRtl && rtlStyles.rtlText]}>
                        {language === 'ar' ? 'عرض وثيقة التثبت الرسمية' : language === 'fr' ? 'Voir la preuve officielle' : 'View official registration evidence'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Badge label={
                  product.registrationStatus === 'registered_tunisia'
                    ? (language === 'ar' ? 'مرخّص' : language === 'fr' ? 'Homologué' : 'Registered')
                    : product.registrationStatus === 'expired'
                      ? (language === 'ar' ? 'منتهي الصلاحية' : language === 'fr' ? 'Expiré' : 'Expired')
                      : product.registrationStatus === 'prohibited'
                        ? (language === 'ar' ? 'ممنوع' : language === 'fr' ? 'Interdit' : 'Prohibited')
                        : product.registrationStatus === 'not_applicable'
                          ? (language === 'ar' ? 'غير منطبق' : language === 'fr' ? 'Non applicable' : 'Not applicable')
                          : (language === 'ar' ? 'غير متحقق' : language === 'fr' ? 'À vérifier' : 'Unverified')
                } variant={
                  product.registrationStatus === 'registered_tunisia' ? 'success'
                    : product.registrationStatus === 'expired' || product.registrationStatus === 'prohibited' ? 'danger'
                      : product.registrationStatus === 'not_applicable' ? 'secondary' : 'warning'
                } size="sm" />
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
          {language === 'ar' ? 'حالة التسجيل ومصدر البيانات ظاهرين لكل منتج. وجود المنتج في الكتالوج لا يثبت وحده صلاحيته للاستعمال.' : language === 'fr' ? 'Le statut et la source sont affichés. Une fiche ne remplace pas la vérification de l’étiquette.' : 'Registration status and source are shown. A catalog record alone does not authorize product use.'}
        </Text>
      </Card>
      )}

      {selectedMarketCategory === 'myListings' ? (
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'عروضي للبيع' : language === 'fr' ? 'Mes annonces' : 'My listings'}
          </Text>
        </View>
        {myListings.length === 0 ? (
          <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'سجّل الدخول لعرض وإدارة إعلاناتك.' : language === 'fr' ? 'Connectez-vous pour gérer vos annonces.' : 'Sign in to view and manage your listings.'}
          </Text>
        ) : (
          <View style={styles.listingRows}>
            {myListings.map((listing) => (
              <View key={listing.id} style={[styles.listingRow, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.listingText}>
                  <Text style={[styles.listingName, isRtl && rtlStyles.rtlText]}>{listing.title}</Text>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                    {listing.status || 'published'} · {listing.price == null ? '—' : listing.price.toFixed(2) + ' TND'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  <Button title={language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}
                    onPress={() => beginEditListing(listing)} variant="outline" size="sm" fullWidth={false} />
                  {listing.status !== 'archived' ? (
                    <Button title={language === 'ar' ? 'أرشفة' : language === 'fr' ? 'Archiver' : 'Archive'}
                      onPress={() => archiveMyListing(listing.id)} variant="outline" size="sm" fullWidth={false} />
                  ) : null}
                  <Button title={language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete'}
                    onPress={() => confirmDeleteListing(listing.id)} variant="outline" size="sm" fullWidth={false} />
                </View>
              </View>
            ))}
          </View>
        )}
        {editingListingId ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <TextInput value={editListingTitle} onChangeText={setEditListingTitle}
              placeholder={language === 'ar' ? 'اسم العرض' : language === 'fr' ? 'Titre' : 'Listing title'}
              style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text }} />
            <TextInput value={editListingCategory} onChangeText={setEditListingCategory}
              placeholder={language === 'ar' ? 'الصنف' : language === 'fr' ? 'Catégorie' : 'Category'}
              style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text }} />
            <TextInput value={editListingPrice} onChangeText={setEditListingPrice} keyboardType="decimal-pad"
              placeholder={language === 'ar' ? 'السعر بالدينار' : language === 'fr' ? 'Prix en TND' : 'Price in TND'}
              style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text }} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title={language === 'ar' ? 'حفظ' : language === 'fr' ? 'Enregistrer' : 'Save changes'}
                onPress={saveListingEdits} loading={editListingSaving} disabled={editListingSaving} size="md" fullWidth={false} />
              <Button title={language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
                onPress={() => setEditingListingId(null)} variant="outline" size="md" fullWidth={false} />
            </View>
          </View>
        ) : null}
      </Card>

      ) : null}

      {selectedMarketCategory === 'inquiries' ? (
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="message-text-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'طلبات التواصل' : language === 'fr' ? 'Demandes de contact' : 'Marketplace inquiries'}
          </Text>
        </View>
        {inquiries.length === 0 ? (
          <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'لا توجد طلبات تواصل بعد.' : language === 'fr' ? 'Aucune demande pour le moment.' : 'No inquiries yet.'}
          </Text>
        ) : (
          <View style={styles.listingRows}>
            {inquiries.map((inquiry) => (
              <View key={inquiry.id} style={{ gap: spacing.xs, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={[styles.listingName, isRtl && rtlStyles.rtlText]}>{inquiry.listingTitle || (language === 'ar' ? 'عرض فلاحي' : 'Marketplace listing')}</Text>
                <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                  {(inquiry.isSeller ? (language === 'ar' ? 'مشتري' : language === 'fr' ? 'Acheteur' : 'Buyer') : (language === 'ar' ? 'بائع' : language === 'fr' ? 'Vendeur' : 'Seller'))} · {inquiry.status} · {inquiry.createdAt.slice(0, 10)}
                </Text>
                <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>{inquiry.message}</Text>
                {inquiry.isSeller && inquiry.status === 'new' ? (
                  <Button title={language === 'ar' ? 'قبول الطلب' : language === 'fr' ? 'Accepter' : 'Accept inquiry'}
                    onPress={() => acceptMarketplaceInquiry(inquiry.id)} variant="outline" size="sm" fullWidth={false} />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>
      ) : null}




    </ScrollView>
  );
};

const styles = StyleSheet.create({
  intelCard: stackTopMd,
  intelRow: { ...spaceBetween, gap: spacing.sm },
  intelLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  intelLabel: labelSemibold,
  intelState: xsSemibold,
  provBar: stackSm,
  listingsCard: { marginBottom: spacing.lg, padding: spacing.md },
  marketBackButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  marketBackText: { color: colors.primary, fontSize: typography.fontSizes.sm, fontWeight: '600' },
  marketCategorySection: { marginTop: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  marketCategoryHeading: { ...titleBase, color: colors.text, marginBottom: 2 },
  marketCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: spacing.sm },
  marketCategoryTile: { width: '48%', minHeight: 132, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.xs, justifyContent: 'space-between' },
  marketHomeHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSubtle },
  marketHomeHintText: { flex: 1, color: colors.textSecondary, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.md },
  marketCategoryTileActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  marketCategoryIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSubtle },
  marketCategoryIconActive: { backgroundColor: colors.surface },
  marketCategoryName: { color: colors.text, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.semibold },
  marketCategoryNameActive: { color: colors.primaryDark },
  marketCategoryCount: { color: colors.textMuted, fontSize: typography.fontSizes.xs },
  listingsHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  listingsTitle: { ...titleBase, color: colors.text },
  listingRows: { gap: spacing.sm },
  listingRow: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listingThumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.surfaceSubtle },

  listingText: { width: '100%', minWidth: 0, gap: 4 },
  listingName: { ...labelSemibold, color: colors.text, lineHeight: typography.lineHeights.md },
  listingMeta: { ...subtleCaption, lineHeight: typography.lineHeights.md, flexShrink: 1 },
  listingPrice: { ...labelSemibold, color: colors.primaryDark, width: '100%', textAlign: 'right' },
  priceSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: 2 },
  priceSummaryIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  priceSummaryText: { flex: 1, gap: 2 },
  priceSummaryTitle: labelSemibold,
  priceSummaryCaption: subtleCaption,
  priceList: { gap: spacing.sm, marginBottom: spacing.lg },
  priceCard: { ...cardPad, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  priceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cropInfo: flex1,
  cropName: titleBase,
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  marketLocation: subtleCaption,
  priceDisplay: { alignItems: 'flex-end', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, minWidth: 104 },
  priceValue: { fontSize: typography.fontSizes.xl, lineHeight: typography.lineHeights.xl, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  currencyLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium, lineHeight: typography.lineHeights.xs },
  priceDatePanel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: spacing.sm },
  priceDateIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  priceDateText: { flex: 1, gap: 2 },
  priceDateLabel: subtleCaption,
  priceDateValue: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text },
  priceMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  priceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tipCard: { backgroundColor: colors.secondaryLight, borderColor: colors.secondary, padding: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipTextContent: flex1,
  tipTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.secondaryDark },
  tipBody: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 3, lineHeight: typography.lineHeights.sm },
});
