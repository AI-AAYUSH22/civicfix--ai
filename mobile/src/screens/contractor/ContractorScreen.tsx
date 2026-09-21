import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, CheckCircle2, AlertTriangle, Clock, MapPin } from 'lucide-react-native';
import { fetchMobileWorkOrders, uploadMobileEvidence } from '../../api/client';
import type { WorkOrder } from '../../types';

export const ContractorScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchMobileWorkOrders();
      setOrders(
        data.map((item: any) => ({
          id: item.id,
          caseId: item.case_id,
          title: `Repair ${item.case_id}`,
          location: item.location || 'Dadar West',
          ward: item.ward_id || 'w12',
          priority: item.priority || 'High',
          status: item.status || 'Assigned',
          dueDate: item.deadline ? item.deadline.slice(0, 10) : '3 Days',
          beforePhotoCaptured: false,
          afterPhotoCaptured: false,
          coordinates: { lat: 19.0178, lng: 72.8478 },
        }))
      );
    } catch {
      // Fallback mock orders for offline field preview
      setOrders([
        {
          id: 'WO-1021',
          caseId: 'CF-9B1A02',
          title: 'Deep Cavity Asphalt Patch',
          location: 'Gokhale Road, Dadar West',
          ward: 'w12',
          priority: 'High',
          status: 'Assigned',
          dueDate: '2026-09-24',
          beforePhotoCaptured: false,
          afterPhotoCaptured: false,
          coordinates: { lat: 19.0178, lng: 72.8478 },
        },
        {
          id: 'WO-1022',
          caseId: 'CF-3D8F90',
          title: 'Surface Crack & Pothole Repair',
          location: 'Linking Road, Bandra West',
          ward: 'w07',
          priority: 'Medium',
          status: 'In Progress',
          dueDate: '2026-09-25',
          beforePhotoCaptured: true,
          afterPhotoCaptured: false,
          coordinates: { lat: 19.0596, lng: 72.8295 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCaptureEvidence = async (order: WorkOrder, captureType: 'BEFORE' | 'AFTER') => {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    const locPerm = await Location.requestForegroundPermissionsAsync();

    if (!camPerm.granted || !locPerm.granted) {
      Alert.alert('Permissions Required', 'Camera and GPS are required for anti-spoofing verification.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const imageUri = result.assets[0].uri;
      const filename = imageUri.split('/').pop() || `${captureType.toLowerCase()}.jpg`;

      const formData = new FormData();
      formData.append('work_order_id', order.id);
      formData.append('capture_type', captureType);
      formData.append('latitude', String(loc.coords.latitude));
      formData.append('longitude', String(loc.coords.longitude));
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      const res = await uploadMobileEvidence(formData);

      if (captureType === 'AFTER' && res.verification) {
        Alert.alert(
          'AI CV Verification Complete',
          `Status: ${res.verification.status}\nScore: ${res.verification.overall_score}/100\nBackground SSIM & Perspective Homography Verified.`
        );
      } else {
        Alert.alert('Evidence Stored', `${captureType} capture cryptographically locked to site GPS.`);
      }

      // Update local state flags
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                beforePhotoCaptured: captureType === 'BEFORE' ? true : o.beforePhotoCaptured,
                afterPhotoCaptured: captureType === 'AFTER' ? true : o.afterPhotoCaptured,
                status: captureType === 'BEFORE' ? 'GROUND_LOCKED' : 'REPAIRED_PENDING_VAL',
              }
            : o
        )
      );
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Evidence sync failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Contractor Ground Unit</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        RoadWorks Infrastructure Unit A • High GPS Verification Locked
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>{item.id}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.orderTitle}>{item.title}</Text>
              <View style={styles.metaRow}>
                <MapPin size={13} color="#EF4444" />
                <Text style={styles.metaText}>{item.location} • Ward {item.ward}</Text>
              </View>
              <View style={styles.metaRow}>
                <Clock size={13} color="#64748B" />
                <Text style={styles.metaText}>Target: {item.dueDate} • Priority: {item.priority}</Text>
              </View>

              {/* Dual Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    item.beforePhotoCaptured && styles.actionButtonSuccess,
                  ]}
                  onPress={() => handleCaptureEvidence(item, 'BEFORE')}
                  disabled={uploading}
                >
                  <Camera size={14} color={item.beforePhotoCaptured ? '#10B981' : '#FFFFFF'} />
                  <Text
                    style={[
                      styles.actionButtonText,
                      item.beforePhotoCaptured && styles.actionButtonSuccessText,
                    ]}
                  >
                    {item.beforePhotoCaptured ? 'BEFORE Locked ✓' : '1. Capture BEFORE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    !item.beforePhotoCaptured && styles.actionButtonDisabled,
                    item.afterPhotoCaptured && styles.actionButtonSuccess,
                  ]}
                  onPress={() => handleCaptureEvidence(item, 'AFTER')}
                  disabled={!item.beforePhotoCaptured || uploading}
                >
                  <Camera size={14} color={item.afterPhotoCaptured ? '#10B981' : '#FFFFFF'} />
                  <Text
                    style={[
                      styles.actionButtonText,
                      item.afterPhotoCaptured && styles.actionButtonSuccessText,
                    ]}
                  >
                    {item.afterPhotoCaptured ? 'AFTER Locked ✓' : '2. Capture AFTER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
  },
  subtitle: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#172033',
  },
  statusBadge: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  actionButtonSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtonSuccessText: {
    color: '#065F46',
  },
});
