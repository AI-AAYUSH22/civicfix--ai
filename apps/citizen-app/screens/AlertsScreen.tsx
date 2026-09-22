import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  const alerts = [
    { id: '1', title: 'Case CF-1019 Verified by AI', type: 'verified', time: '10 mins ago' },
    { id: '2', title: 'Case CF-1023 Repair Started', type: 'started', time: '2 hours ago' },
    { id: '3', title: 'New Alert: Road closure on Main St', type: 'info', time: '1 day ago' },
  ];

  const renderAlert = ({ item }: { item: any }) => {
    const isVerified = item.type === 'verified';
    const isStarted = item.type === 'started';
    const bgColor = isVerified ? '#D1FAE5' : isStarted ? '#FEF3C7' : '#E0F2FE';
    const iconColor = isVerified ? '#10B981' : isStarted ? '#F59E0B' : '#0EA5E9';
    const iconName = isVerified ? 'checkmark-circle' : isStarted ? 'construct' : 'information-circle';

    return (
      <View style={[styles.card, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName as any} size={24} color={iconColor} style={styles.icon} />
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, padding: 16, alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  listContainer: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  icon: { marginRight: 16 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.navy, marginBottom: 4 },
  time: { fontSize: 12, color: colors.slate },
});
