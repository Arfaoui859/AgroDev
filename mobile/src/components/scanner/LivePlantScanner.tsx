import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';

interface LivePlantScannerProps {
  onImageSelected: (imageUri: string) => void;
  onCancel: () => void;
}

export const LivePlantScanner: React.FC<LivePlantScannerProps> = ({
  onImageSelected,
  onCancel,
}) => {
  const { t, isRtl } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [torch, setTorch] = useState<boolean>(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);

  // Take photo using native camera
  const handleCapturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (e) {
      console.warn('Camera capture error:', e);
      Alert.alert('خطأ', 'تعذر التقاط الصورة بالكاميرا.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Gallery Picker
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Gallery picker error:', e);
    }
  };

  // Confirmation of captured image
  const handleConfirmImage = () => {
    if (capturedUri) {
      onImageSelected(capturedUri);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedUri(null);
  };

  // 1. Image Review & Retake View
  if (capturedUri) {
    return (
      <View style={styles.container}>
        <View style={styles.reviewHeader}>
          <Text style={[styles.reviewTitle, isRtl && styles.rtlText]}>
            مراجعة صورة النبات
          </Text>
          <Text style={[styles.reviewSub, isRtl && styles.rtlText]}>
            تأكد من وضوح تفاصيل الورقة أو البقع المرضية قبل بدء التحليل
          </Text>
        </View>

        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: capturedUri }} style={styles.fullPreview} />
        </View>

        <View style={styles.reviewActions}>
          <Button
            title="تأكيد والتشخيص بالذكاء الاصطناعي"
            variant="primary"
            size="lg"
            onPress={handleConfirmImage}
            icon={
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={22}
                color={colors.textInverse}
              />
            }
          />
          <Button
            title="إعادة التقاط الصورة"
            variant="outline"
            size="md"
            onPress={handleRetake}
            style={{ marginTop: spacing.sm }}
            icon={
              <MaterialCommunityIcons
                name="camera-retake-outline"
                size={20}
                color={colors.text}
              />
            }
          />
        </View>
      </View>
    );
  }

  // 2. Permission Missing View
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <MaterialCommunityIcons name="camera-off" size={48} color={colors.accent} />
        <Text style={[styles.permissionTitle, isRtl && styles.rtlText]}>
          مطلوب إذن الكاميرا للفحص الحي
        </Text>
        <Text style={[styles.permissionDesc, isRtl && styles.rtlText]}>
          يحتاج AgroGrowth للوصول إلى كاميرا هاتفك لمسح أوراق النباتات واكتشاف الأمراض فوراً.
        </Text>
        <Button
          title="منح إذن الكاميرا"
          variant="primary"
          onPress={requestPermission}
          style={{ marginVertical: spacing.md }}
        />
        <Button
          title="أو اختيار صورة من المعرض"
          variant="secondary"
          onPress={handlePickFromGallery}
          style={{ marginBottom: spacing.sm }}
        />
        <Button title="إلغاء والعودة" variant="ghost" onPress={onCancel} />
      </View>
    );
  }

  // 3. Live Camera Viewfinder with Agricultural Framing Guide
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
      >
        {/* Top Controls Bar */}
        <View style={[styles.cameraTopBar, isRtl && styles.rtlRow]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancel}
            style={styles.circleIconButton}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.textInverse} />
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTorch((prev) => !prev)}
              style={[styles.circleIconButton, torch && styles.circleIconButtonActive]}
            >
              <MaterialCommunityIcons
                name={torch ? 'flash' : 'flash-off'}
                size={22}
                color={colors.textInverse}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
              style={styles.circleIconButton}
            >
              <MaterialCommunityIcons
                name="camera-flip-outline"
                size={22}
                color={colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Viewfinder Frame with Visual Reticle Corners */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.reticleBox}>
            {/* 4 Corner Bracket Accents */}
            <View style={[styles.cornerBracket, styles.topLeft]} />
            <View style={[styles.cornerBracket, styles.topRight]} />
            <View style={[styles.cornerBracket, styles.bottomLeft]} />
            <View style={[styles.cornerBracket, styles.bottomRight]} />

            <View style={styles.guidancePill}>
              <MaterialCommunityIcons name="leaf" size={16} color={colors.primaryLight} />
              <Text style={styles.guidanceText}>
                وجّه الكاميرا نحو الورقة أو الثمرة بمسافة 15-20 سم
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Shutter & Gallery Bar */}
        <View style={styles.cameraBottomBar}>
          <View style={[styles.shutterRow, isRtl && styles.rtlRow]}>
            {/* Gallery Picker Shortcut */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handlePickFromGallery}
              style={styles.bottomToolBtn}
            >
              <MaterialCommunityIcons name="image-multiple" size={28} color={colors.textInverse} />
              <Text style={styles.bottomToolLabel}>المعرض</Text>
            </TouchableOpacity>

            {/* Shutter Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCapturePhoto}
              disabled={isCapturing}
              style={styles.shutterOuter}
            >
              <View style={styles.shutterInner}>
                {isCapturing && <ActivityIndicator color={colors.primary} size="small" />}
              </View>
            </TouchableOpacity>

            {/* Guide Info */}
            <View style={styles.bottomToolBtn}>
              <MaterialCommunityIcons name="auto-fix" size={28} color={colors.primaryLight} />
              <Text style={styles.bottomToolLabel}>AI ذكي</Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  circleIconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIconButtonActive: {
    backgroundColor: colors.accent,
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: 280,
    height: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  cornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: radius.md,
  },
  guidancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  guidanceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textInverse,
    fontWeight: typography.fontWeights.medium,
  },
  cameraBottomBar: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  shutterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomToolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  bottomToolLabel: {
    fontSize: 10,
    color: colors.textInverse,
    marginTop: 4,
    fontWeight: typography.fontWeights.medium,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: radius.full,
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  reviewTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  reviewSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  imagePreviewContainer: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.md,
  },
  fullPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  reviewActions: {
    paddingBottom: spacing.lg,
  },
});
