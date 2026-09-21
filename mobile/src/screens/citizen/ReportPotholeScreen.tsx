import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { submitMobileComplaint } from '../../api/client';

export const ReportPotholeScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState('Gokhale Road, Dadar West');
  const [landmark, setLandmark] = useState('Near Plaza Cinema');
  const [description, setDescription] = useState('Dangerous road cavity on lane 2 causing two-wheeler skids.');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('High');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number }>({
    lat: 19.0178,
    lng: 72.8478,
  });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const handleCapturePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to photograph potholes.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleFetchGPS = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS Permission', 'Location permission denied. Using fallback coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationCoords({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      Alert.alert('GPS Locked', `Precision: ±${Math.round(loc.coords.accuracy || 3)}m`);
    } catch (err: any) {
      Alert.alert('GPS Error', err.message || 'Could not lock GPS');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', `Pothole at ${address}`);
      formData.append('description', description);
      formData.append('severity', severity);
      formData.append('address', address);
      formData.append('landmark', landmark);
      formData.append('latitude', String(locationCoords.lat));
      formData.append('longitude', String(locationCoords.lng));
      formData.append('citizen_name', 'Mobile Citizen App User');

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'complaint.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('photo', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      const res = await submitMobileComplaint(formData);
      setSuccessReceipt(res);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Error communicating with CivicFix backend');
    } finally {
      setSubmitting(false);
    }
  };

  if (successReceipt) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 color="#0F766E" size={56} />
        <Text style={styles.successTitle}>Report Registered!</Text>
        <Text style={styles.successSubtitle}>
          Case ID: <Text style={styles.monoBold}>{successReceipt.id}</Text>
        </Text>
        <Text style={styles.successDesc}>
          Ward: {successReceipt.ward_id || 'w12'} • Routed to Municipal Ward Engineer
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
          <Text style={styles.primaryButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Report a Road Pothole</Text>
      <Text style={styles.headerSubtitle}>
        Live GPS and photo evidence routed directly to ward road contractor.
      </Text>

      {/* Photo Picker Box */}
      <TouchableOpacity style={styles.photoBox} onPress={handleCapturePhoto}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera color="#0F766E" size={32} />
            <Text style={styles.photoPlaceholderText}>Tap to Capture Camera Photo</Text>
            <Text style={styles.photoHint}>High clarity aids AI contour detection</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* GPS Location Bar */}
      <View style={styles.gpsBar}>
        <View style={styles.gpsInfo}>
          <MapPin color="#EF4444" size={18} />
          <Text style={styles.gpsText}>
            {locationCoords.lat.toFixed(4)}°N, {locationCoords.lng.toFixed(4)}°E
          </Text>
        </View>
        <TouchableOpacity style={styles.gpsButton} onPress={handleFetchGPS} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color="#0F766E" />
          ) : (
            <Text style={styles.gpsButtonText}>Lock GPS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Road / Street Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. Linking Road, Bandra West"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prominent Landmark</Text>
        <TextInput
          style={styles.input}
          value={landmark}
          onChangeText={setLandmark}
          placeholder="e.g. Near Plaza Cinema"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Severity Level</Text>
        <View style={styles.severityRow}>
          {(['Low', 'Medium', 'High'] as const).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.severityTab,
                severity === lvl && styles.severityTabActive,
                severity === lvl && lvl === 'High' && styles.severityHighActive,
              ]}
              onPress={() => setSeverity(lvl)}
            >
              <Text
                style={[
                  styles.severityTabText,
                  severity === lvl && styles.severityTabTextActive,
                ]}
              >
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Complaint Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Dispatch to Municipal System</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  photoBox: {
    height: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    padding: 16,
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 8,
  },
  photoHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  gpsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#172033',
    fontFamily: 'monospace',
  },
  gpsButton: {
    backgroundColor: '#F0FDFA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#172033',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  severityTabActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  severityHighActive: {
    backgroundColor: '#BE123C',
    borderColor: '#BE123C',
  },
  severityTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  severityTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0F766E',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  monoBold: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0F766E',
  },
  successDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
  },
});
