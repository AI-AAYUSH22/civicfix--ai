import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../lib/theme';
import { getWorkOrders } from '../lib/api';
import type { ApiWorkOrder } from '../lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function WorkOrderDetailScreen({ route, navigation }: any) {
  const { workOrderId } = route.params;
  const [workOrder, setWorkOrder] = useState<ApiWorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [workOrderId]);

  const fetchDetail = async () => {
    try {
      const data = await getWorkOrders();
      const found = data.find((wo) => wo.id === workOrderId);
      if (found) setWorkOrder(found);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!workOrder) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Work Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Case ID: {workOrder.case_id.substring(0, 8)}</Text>
          <Text style={styles.title}>{workOrder.case_title}</Text>
          <Text style={styles.description}>{workOrder.case_description || 'No description provided'}</Text>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{workOrder.case_location}</Text>
          <Text style={styles.label}>Contractor:</Text>
          <Text style={styles.value}>{workOrder.contractor_name || 'Unassigned'}</Text>
          <Text style={styles.label}>Deadline:</Text>
          <Text style={styles.value}>{workOrder.deadline ? new Date(workOrder.deadline).toLocaleDateString() : 'N/A'}</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>GPS Map Placeholder</Text>
          <Text style={styles.mapCoords}>
            Lat: {workOrder.assigned_latitude?.toFixed(4) || 'N/A'} | Lng: {workOrder.assigned_longitude?.toFixed(4) || 'N/A'}
          </Text>
        </View>

        <View style={styles.evidenceStatus}>
          <Text style={styles.statusLabel}>Evidence Status:</Text>
          <Text style={styles.statusValue}>{workOrder.before_photo_captured ? (workOrder.after_photo_captured ? 'Complete' : 'Before Photo Only') : 'Pending'}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Capture', { workOrderId: workOrder.id, captureType: 'BEFORE' })}
        >
          <Ionicons name="camera" size={20} color={colors.white} style={styles.btnIcon} />
          <Text style={styles.buttonText}>Capture BEFORE Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !workOrder.before_photo_captured && styles.buttonDisabled]}
          disabled={!workOrder.before_photo_captured}
          onPress={() => navigation.navigate('Capture', { workOrderId: workOrder.id, captureType: 'AFTER' })}
        >
          <Ionicons name="camera" size={20} color={colors.white} style={styles.btnIcon} />
          <Text style={styles.buttonText}>Capture AFTER Photo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: colors.bg },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
  content: { padding: 16 },
  card: { backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.slate, fontSize: 14, marginTop: 12 },
  value: { color: colors.white, fontSize: 16, marginTop: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  description: { color: colors.white, fontSize: 16, marginTop: 8, lineHeight: 24 },
  mapPlaceholder: { height: 150, borderColor: colors.primary, borderWidth: 2, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(15, 118, 110, 0.1)' },
  mapText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  mapCoords: { color: colors.white, marginTop: 8 },
  evidenceStatus: { marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  statusLabel: { color: colors.slate, fontSize: 16, marginRight: 8 },
  statusValue: { color: colors.amber, fontSize: 16, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16 },
  buttonDisabled: { backgroundColor: colors.border, opacity: 0.7 },
  btnIcon: { marginRight: 8 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
