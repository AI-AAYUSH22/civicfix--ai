import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';
import { getWorkOrders } from '../lib/api';
import type { ApiWorkOrder } from '../lib/types';

export default function WorkOrderListScreen({ navigation }: any) {
  const [workOrders, setWorkOrders] = useState<ApiWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const data = await getWorkOrders();
      setWorkOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'Medium': return { bg: '#FEF3C7', text: '#D97706' };
      case 'Low': return { bg: '#D1FAE5', text: '#059669' };
      default: return { bg: '#E2E8F0', text: '#475569' };
    }
  };

  const renderItem = ({ item }: { item: ApiWorkOrder }) => {
    const priorityColor = getPriorityColor(item.priority);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('WorkOrderDetail', { workOrderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.idText}>WO ID: {item.id.substring(0, 8)}</Text>
          <View style={[styles.badge, { backgroundColor: priorityColor.bg }]}>
            <Text style={[styles.badgeText, { color: priorityColor.text }]}>{item.priority}</Text>
          </View>
        </View>
        <Text style={styles.titleText}>{item.case_title || 'Untitled Case'}</Text>
        <Text style={styles.locationText}>{item.case_location || 'Unknown location'}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.statusText}>{item.status}</Text>
          {item.deadline && <Text style={styles.deadlineText}>Due: {new Date(item.deadline).toLocaleDateString()}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Field Operations</Text>
        <Text style={styles.subTitle}>{workOrders.length} Active Assignments</Text>
      </View>
      <FlatList
        data={workOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40, backgroundColor: colors.bg },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.white },
  subTitle: { fontSize: 16, color: colors.slate, marginTop: 4 },
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  idText: { color: colors.slate, fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  titleText: { color: colors.white, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  locationText: { color: colors.slate, fontSize: 14, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { color: colors.primary, fontWeight: '500' },
  deadlineText: { color: colors.slate, fontSize: 12 },
});
