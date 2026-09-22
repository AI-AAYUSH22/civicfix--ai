import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { getCases } from '../lib/api';
import { ApiCase } from '../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onReportPress: () => void;
}

export default function HomeScreen({ onReportPress }: Props) {
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getCases();
      setCases(data.slice(0, 5)); // Just show recent 5
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('VERIFIED') || s.includes('RESOLVED') || s.includes('CLOSED')) return '#10B981'; // Green
    if (s.includes('REPAIR') || s.includes('ASSIGNED')) return '#F59E0B'; // Amber
    return '#F43F5E'; // Rose for reported/other
  };

  const renderCase = ({ item }: { item: ApiCase }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.caseId}>{item.id || 'CF-UNKNOWN'}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.location}>{item.location?.address || item.road_name || 'Unknown Location'}</Text>
      <Text style={styles.severity}>Severity: {item.severity}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CivicFix</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.greeting}>Good morning, Citizen</Text>
        
        <TouchableOpacity style={styles.reportButton} onPress={onReportPress}>
          <Ionicons name="add-circle" size={24} color={colors.white} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Report a Pothole</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Nearby Cases</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={cases}
            keyExtractor={(item) => item.id}
            renderItem={renderCase}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.navy,
    marginBottom: 20,
  },
  reportButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderColor: colors.border,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.navy,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: colors.slate,
    marginBottom: 4,
  },
  severity: {
    fontSize: 14,
    color: colors.slate,
    fontWeight: '500',
  },
});
