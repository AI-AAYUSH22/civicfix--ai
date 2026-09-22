import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { colors } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { uploadEvidence } from '../lib/api';

export default function CaptureScreen({ route, navigation }: any) {
  const { workOrderId, captureType } = route.params;
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  if (!hasPermission) {
    return <View style={styles.container}><ActivityIndicator /></View>;
  }
  if (!hasPermission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.8, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      setPhoto(data);
    }
  };

  const uploadPhoto = async () => {
    if (!photo || !location) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        name: `evidence_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('work_order_id', workOrderId);
      formData.append('capture_type', captureType);
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());

      await uploadEvidence(formData);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
        <Text style={styles.successText}>Evidence uploaded successfully. GPS verified.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          <View style={styles.overlay}>
            <View style={styles.topRow}>
              <Text style={styles.overlayText}>Lat: {location?.coords.latitude.toFixed(6)}</Text>
              <Text style={styles.overlayText}>Lng: {location?.coords.longitude.toFixed(6)}</Text>
              <Text style={styles.watermark}>CivicFix</Text>
            </View>
            <View style={styles.bottomRow}>
              <Text style={styles.overlayText}>{new Date().toLocaleString()}</Text>
              <Text style={styles.overlayText}>WO: {workOrderId.substring(0, 8)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.retakeBtn]} onPress={() => setPhoto(null)}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={uploadPhoto} disabled={uploading}>
            {uploading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Confirm & Upload</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.gpsIndicator}>
          <View style={[styles.dot, { backgroundColor: location ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.gpsText}>{location ? 'GPS Locked' : 'Acquiring GPS...'}</Text>
        </View>
        <View style={styles.cameraOverlay}>
          <View style={styles.topRow}>
            {location && (
              <View>
                <Text style={styles.overlayText}>Lat: {location.coords.latitude.toFixed(6)}</Text>
                <Text style={styles.overlayText}>Lng: {location.coords.longitude.toFixed(6)}</Text>
              </View>
            )}
            <Text style={styles.watermark}>CivicFix</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.overlayText}>{new Date().toLocaleString()}</Text>
            <Text style={styles.overlayText}>WO: {workOrderId.substring(0, 8)}</Text>
          </View>
        </View>
        <View style={styles.cameraActions}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={!location}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 16, marginBottom: 16 },
  successText: { color: colors.white, fontSize: 18, textAlign: 'center', margin: 20 },
  camera: { flex: 1 },
  gpsIndicator: { position: 'absolute', top: 50, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  gpsText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 20, paddingTop: 100, paddingBottom: 120 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overlayText: { color: colors.white, fontSize: 14, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  watermark: { color: colors.white, fontSize: 18, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, opacity: 0.8 },
  cameraActions: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
  previewContainer: { flex: 1 },
  previewImage: { flex: 1, resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 20, paddingTop: 60, paddingBottom: 60 },
  actions: { flexDirection: 'row', padding: 20, backgroundColor: colors.bg },
  button: { flex: 1, padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  retakeBtn: { backgroundColor: colors.border, marginRight: 10 },
  confirmBtn: { backgroundColor: colors.primary, marginLeft: 10 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
