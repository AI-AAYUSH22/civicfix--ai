import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { getCases } from '../lib/api';
import { ApiCase } from '../lib/types';

export default function CasesScreen() {
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getCases();
      setCases(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('VERIFIED') || s.includes('RESOLVED') || s.includes('CLOSED')) return '#10B981';
    if (s.includes('REPAIR') || s.includes('ASSIGNED')) return '#F59E0B';
    return '#F43F5E';
  };

  const showCaseDetails = (item: ApiCase) => {
    Alert.alert(
      `Case ${item.id || 'Unknown'}`,
      `Status: ${item.status}\nSeverity: ${item.severity}\nLocation: ${item.location?.address || item.road_name || 'N/A'}\nDescription: ${item.description}`,
      [{ text: 'OK' }]
    );
  };

  const renderCase = ({ item }: { item: ApiCase }) => (
    <TouchableOpacity style={styles.card} onPress={() => showCaseDetails(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.caseId}>{item.id || 'CF-UNKNOWN'}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.location}>{item.location?.address || item.road_name || 'Unknown Location'}</Text>
      <Text style={styles.date}>Reported: {new Date(item.created_at || Date.now()).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cases</Text>
      </View>
      
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={renderCase}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchCases}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, padding: 16, alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12,
    borderColor: colors.border, borderWidth: 1,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  caseId: { fontWeight: 'bold', fontSize: 16, color: colors.navy },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  location: { fontSize: 14, color: colors.slate, marginBottom: 4 },
  date: { fontSize: 12, color: colors.slate },
});
