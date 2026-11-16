import React, { useCallback, useState } from 'react';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  Linking,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { badgePill, cardBottomRow, cardPad, flex1, screenStyles, spaceBetween, spaceBetweenSm, stackSm, stackTopMd } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import { labelSemibold, mutedCaption, subtleCaption, titleBase, xsSemibold } from '../theme/typographyStyles';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScreenHeading } from '../components/ui/ScreenHeading';
import { SearchBar } from '../components/ui/SearchBar';
import { ProvenanceBar } from '../components/ui/ProvenanceBar';
import { StateCard } from '../components/ui/StateCard';
import { createMarketplaceInquiry, createMarketplaceListing, deleteMarketplaceListing, getAgriculturalCatalog, getMarketPrices, getMarketplaceInquiries, getMarketplaceListings, getMyMarketplaceListings, updateMarketplaceInquiryStatus, updateMarketplaceListing, updateMarketplaceListingStatus, uploadMarketplaceImage } from '../api/client';
import { AICapability, AgriculturalCatalogProduct, MarketplaceInquiry, MarketplaceListing, MarketPriceItem, ProvenanceMeta } from '../types';
import { useAICapabilities } from '../hooks/useAICapabilities';
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
  const { byId: capabilities } = useAICapabilities();
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

  const filteredPrices = prices.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return item.cropNameAr.toLowerCase().includes(q) || item.cropName.toLowerCase().includes(q);
  });

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <ScreenHeading title={t.marketTitle} subtitle={t.marketSubtitle} />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t.searchCrop}
        clearLabel={x.clearSearch}
      />
      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="store-plus-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? 'بيع منتوجك على AgroGrowth' : language === 'fr' ? 'Vendre sur AgroGrowth' : 'Sell on AgroGrowth'}
          </Text>
        </View>
        <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
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

          <View style={styles.priceList}>
            {filteredPrices.length === 0 ? (
              <StateCard kind="empty" title={x.stateEmpty} message={x.marketNoMatch} compact />
            ) : (
              filteredPrices.map((item) => (
              <Card key={item.id} variant="elevated" style={styles.priceCard}>
                <View style={[styles.cardHeader, isRtl && rtlStyles.rtlRow]}>
                  <View style={styles.cropInfo}>
                    <Text style={[styles.cropName, isRtl && rtlStyles.rtlText]}>
                      {language === 'ar' ? item.cropNameAr : item.cropName}
                    </Text>
                    {item.marketLocation && item.marketLocation !== '—' ? (
                      <View style={[styles.locationRow, isRtl && rtlStyles.rtlRow]}>
                        <MaterialCommunityIcons name="map-marker" size={13} color={colors.textMuted} />
                        <Text style={styles.marketLocation}>{item.marketLocation}</Text>
                      {item.sourceName ? <Text style={styles.marketLocation}>{item.sourceName} · {item.priceKind === 'retail' ? (language === 'ar' ? 'تفصيل' : language === 'fr' ? 'Détail' : 'Retail') : (language === 'ar' ? 'جملة' : language === 'fr' ? 'Gros' : 'Wholesale')} · {item.verificationStatus === 'official-source' ? (language === 'ar' ? 'مصدر رسمي' : language === 'fr' ? 'Source officielle' : 'Official source') : (language === 'ar' ? 'غير متحقق' : language === 'fr' ? 'Non vérifié' : 'Unverified')}</Text> : null}
                      {item.aggregationPeriod === 'monthly' ? (
                        <Text style={styles.marketLocation}>
                          {language === 'ar' ? 'معدل شهري' : language === 'fr' ? 'Moyenne mensuelle' : 'Monthly average'}
                          {item.supplyQuantityTons != null ? ' · ' + (language === 'ar' ? 'التزويد' : language === 'fr' ? 'Approvisionnement' : 'Supply') + ': ' + item.supplyQuantityTons.toLocaleString() + ' t' : ''}
                          {item.observationDays != null ? ' · ' + item.observationDays + (language === 'ar' ? ' يوم رصد' : language === 'fr' ? ' jours observés' : ' observation days') : ''}
                          {item.supplyChangePercent != null ? ' · ' + (language === 'ar' ? 'تغير التزويد' : language === 'fr' ? 'Variation offre' : 'Supply change') + ': ' + (item.supplyChangePercent > 0 ? '+' : '') + item.supplyChangePercent.toFixed(1) + '%' : ''}
                          {item.changePercent != null ? ' · ' + (language === 'ar' ? 'مقارنة بالعام السابق' : language === 'fr' ? 'vs année précédente' : 'vs previous year') : ''}
                        </Text>
                      ) : null}
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.priceDisplay}>
                    <Text style={styles.priceValue}>
                      {item.pricePerKg !== null ? item.pricePerKg.toFixed(2) :
                        item.priceMin !== null && item.priceMin !== undefined && item.priceMax !== null && item.priceMax !== undefined
                          ? `${item.priceMin.toFixed(2)}–${item.priceMax.toFixed(2)}`
                          : item.priceMin != null ? item.priceMin.toFixed(2) : item.priceMax != null ? item.priceMax.toFixed(2) : '—'}
                    </Text>
                    <Text style={styles.currencyLabel}>{item.currency === 'TND' && item.unit === 'kg' ? t.currencyPerKg : `${item.currency || 'TND'} / ${item.unit || 'kg'}`}</Text>
                  </View>
                </View>

                <View style={[cardBottomRow, isRtl && rtlStyles.rtlRow]}>
                  {item.qualityGrade && item.qualityGrade !== '—' ? (
                    <Badge label={item.qualityGrade} variant="secondary" size="sm" />
                  ) : (
                    <View />
                  )}

                  {item.changePercent !== null ? (
                    <View
                      style={[
                        styles.trendBadge,
                        {
                          backgroundColor:
                            item.changePercent > 0
                              ? colors.successLight
                              : item.changePercent < 0
                                ? colors.dangerLight
                                : colors.surfaceSubtle,
                        },
                        isRtl && rtlStyles.rtlRow,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.changePercent > 0 ? 'trending-up' : item.changePercent < 0 ? 'trending-down' : 'trending-neutral'}
                        size={16}
                        color={item.changePercent > 0 ? colors.success : item.changePercent < 0 ? colors.danger : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.trendText,
                          {
                            color:
                              item.changePercent > 0 ? colors.success : item.changePercent < 0 ? colors.danger : colors.textSecondary,
                          },
                        ]}
                      >
                        {`${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(1)}%`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noTrend}>{item.lastUpdated ? item.lastUpdated : '—'}</Text>
                  )}
                </View>
              </Card>
              ))
            )}
          </View>
        </>
      )}

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
                <View style={styles.listingText}>
                  <Text style={[styles.listingName, isRtl && rtlStyles.rtlText]}>{listing.title}</Text>
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

      {activeInquiryListing ? (
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

      {/* Market intelligence — honest availability of forecast & supply/demand */}
      <Card variant="outlined" style={styles.intelCard}>
        <View style={[styles.tipRow, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={colors.primary} />
          <View style={styles.tipTextContent}>
            <Text style={[styles.tipTitle, isRtl && rtlStyles.rtlText]}>{x.marketIntelTitle}</Text>
            <Text style={[styles.tipBody, isRtl && rtlStyles.rtlText]}>{x.marketIntelNote}</Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <MarketIntelRow label={x.marketIntelForecast} capability={capabilities['market-forecast']} x={x} isRtl={isRtl} />
          <MarketIntelRow label={x.marketIntelSupplyDemand} capability={capabilities['supply-demand']} x={x} isRtl={isRtl} />
        </View>
      </Card>

      <Card variant="outlined" style={styles.tipCard}>
        <View style={[styles.tipRow, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="information" size={22} color={colors.secondary} />
          <View style={styles.tipTextContent}>
            <Text style={[styles.tipTitle, isRtl && rtlStyles.rtlText]}>{x.marketAboutTitle}</Text>
            <Text style={[styles.tipBody, isRtl && rtlStyles.rtlText]}>{x.marketAboutBody}</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const MarketIntelRow: React.FC<{
  label: string;
  capability?: AICapability;
  x: ReturnType<typeof useLanguage>['x'];
  isRtl: boolean;
}> = ({ label, capability, x, isRtl }) => {
  const available = Boolean(capability) && capability!.engine !== 'unavailable' && capability!.available !== false;
  return (
    <View style={[styles.intelRow, isRtl && rtlStyles.rtlRow]}>
      <View style={[styles.intelLeft, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons
          name={available ? 'check-circle' : 'minus-circle-outline'}
          size={16}
          color={available ? colors.success : colors.textMuted}
        />
        <Text style={[styles.intelLabel, isRtl && rtlStyles.rtlText]}>{label}</Text>
      </View>
      <Text style={[styles.intelState, { color: available ? colors.success : colors.textMuted }]}>
        {available ? x.aiAvailable : x.aiNotConfigured}
      </Text>
    </View>
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
  listingsHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  listingsTitle: { ...titleBase, color: colors.text },
  listingRows: { gap: spacing.sm },
  listingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  listingText: { flex: 1, gap: 2 },
  listingName: { ...labelSemibold, color: colors.text },
  listingMeta: subtleCaption,
  listingPrice: { ...labelSemibold, color: colors.primaryDark, textAlign: 'right' },
  priceList: { gap: spacing.sm, marginBottom: spacing.lg },
  priceCard: cardPad,
  cardHeader: spaceBetweenSm,
  cropInfo: flex1,
  cropName: titleBase,
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  marketLocation: subtleCaption,
  priceDisplay: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  priceValue: { fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  currencyLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium, lineHeight: typography.lineHeights.xs },
  trendBadge: badgePill,
  trendText: labelSemibold,
  noTrend: mutedCaption,
  tipCard: { backgroundColor: colors.secondaryLight, borderColor: colors.secondary, padding: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipTextContent: flex1,
  tipTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.secondaryDark },
  tipBody: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 3, lineHeight: typography.lineHeights.sm },
});
