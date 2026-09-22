import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../lib/theme';
import { createCitizenComplaint, getWards } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function ReportScreen({ onFinished }: { onFinished?: () => void }) {
  const [step, setStep] = useState(1);
  
  // Form State
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [addressDesc, setAddressDesc] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [wardId, setWardId] = useState('');
  
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      const data = await getWards();
      setWards(data);
      if (data.length > 0) setWardId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const getLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const { status } = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera/Storage permission is required.');
      return;
    }

    const result = useCamera 
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submitComplaint = async () => {
    if (!location || !photoUri || !description || !wardId) {
      Alert.alert('Error', 'Missing required fields.');
      return;
    }
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('latitude', String(location.coords.latitude));
      formData.append('longitude', String(location.coords.longitude));
      formData.append('description', description);
      formData.append('severity', severity);
      formData.append('ward_id', wardId);
      if (addressDesc) formData.append('address', addressDesc);
      
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('photo', { uri: photoUri, name: filename, type } as any);
      
      await createCitizenComplaint(formData);
      setStep(6); // Success step
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((s) => (
        <View key={s} style={[styles.stepDot, step >= s ? styles.stepDotActive : null]} />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 1: Location</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={getLocation}>
              <Ionicons name="location" size={20} color={colors.white} />
              <Text style={styles.actionBtnText}>{loading ? 'Locating...' : 'Get GPS Location'}</Text>
            </TouchableOpacity>
            {location && (
              <Text style={styles.coords}>
                Lat: {location.coords.latitude.toFixed(4)}, Lng: {location.coords.longitude.toFixed(4)}
              </Text>
            )}
            <Text style={styles.label}>Address Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Opposite Metro Station"
              value={addressDesc}
              onChangeText={setAddressDesc}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 2: Photo</Text>
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={20} color={colors.white} />
                <Text style={styles.actionBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => pickImage(false)}>
                <Ionicons name="image" size={20} color={colors.primary} />
                <Text style={styles.actionBtnSecondaryText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}
          </View>
        );
      case 3:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 3: Description</Text>
            <Text style={styles.label}>Problem Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the pothole..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.label}>Severity</Text>
            <View style={styles.row}>
              {(['Low', 'Medium', 'High'] as const).map((sev) => (
                <TouchableOpacity
                  key={sev}
                  style={[styles.chip, severity === sev && styles.chipActive]}
                  onPress={() => setSeverity(sev)}
                >
                  <Text style={[styles.chipText, severity === sev && styles.chipTextActive]}>{sev}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 4: Ward</Text>
            <Text style={styles.label}>Select Ward</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {wards.length === 0 ? (
                <Text style={{ padding: 10 }}>No wards available or failed to load.</Text>
              ) : (
                wards.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.wardItem, wardId === w.id && styles.wardItemActive]}
                    onPress={() => setWardId(w.id)}
                  >
                    <Text style={[styles.wardItemText, wardId === w.id && styles.wardItemTextActive]}>
                      {w.name} ({w.city})
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        );
      case 5:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Step 5: Review</Text>
            <Text style={styles.summaryText}>Location: {location ? 'Captured' : 'Missing'}</Text>
            <Text style={styles.summaryText}>Photo: {photoUri ? 'Captured' : 'Missing'}</Text>
            <Text style={styles.summaryText}>Desc: {description}</Text>
            <Text style={styles.summaryText}>Severity: {severity}</Text>
            
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={submitComplaint} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      case 6:
        return (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.successTitle}>Report Submitted!</Text>
            <Text style={{ textAlign: 'center', marginBottom: 20 }}>
              Thank you for reporting. The civic authorities have been notified.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { setStep(1); onFinished && onFinished(); }}>
              <Text style={styles.primaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report Issue</Text>
      </View>
      {step < 6 && renderStepIndicator()}
      <ScrollView contentContainerStyle={styles.content}>
        {renderStep()}

        {step < 5 && step > 0 && (
          <View style={styles.navButtons}>
            <TouchableOpacity 
              style={[styles.navBtn, step === 1 && styles.navBtnDisabled]} 
              disabled={step === 1}
              onPress={() => setStep(s => s - 1)}
            >
              <Text style={styles.navBtnText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navBtnPrimary} 
              onPress={() => setStep(s => s + 1)}
            >
              <Text style={styles.navBtnPrimaryText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, padding: 16, alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  content: { padding: 16 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginHorizontal: 4 },
  stepDotActive: { backgroundColor: colors.primary },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderColor: colors.border, borderWidth: 1,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, marginBottom: 20
  },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: colors.navy, marginBottom: 16 },
  label: { fontSize: 14, color: colors.slate, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: colors.bg
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  actionBtn: {
    backgroundColor: colors.primary, padding: 12, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8
  },
  actionBtnText: { color: colors.white, fontWeight: 'bold', marginLeft: 8 },
  actionBtnSecondary: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary,
    padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8
  },
  actionBtnSecondaryText: { color: colors.primary, fontWeight: 'bold', marginLeft: 8 },
  photoActions: { flexDirection: 'row', justifyContent: 'space-around' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 16 },
  coords: { fontSize: 12, color: colors.slate, marginVertical: 8, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: {
    flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, alignItems: 'center', marginHorizontal: 4
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { color: colors.slate, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  wardItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  wardItemActive: { backgroundColor: colors.primaryLight },
  wardItemText: { fontSize: 16, color: colors.navy },
  wardItemTextActive: { color: colors.primary, fontWeight: 'bold' },
  navButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  navBtn: { padding: 16, borderRadius: 8, backgroundColor: '#E2E8F0', flex: 1, marginRight: 8, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { color: colors.navy, fontWeight: 'bold', fontSize: 16 },
  navBtnPrimary: { padding: 16, borderRadius: 8, backgroundColor: colors.primary, flex: 1, marginLeft: 8, alignItems: 'center' },
  navBtnPrimaryText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  summaryText: { fontSize: 16, marginBottom: 8, color: colors.navy },
  primaryBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#10B981', marginVertical: 16 }
});
