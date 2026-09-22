import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contractor Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RW</Text>
          </View>
          <Text style={styles.name}>RoadWorks Unit A</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={colors.amber} />
            <Text style={styles.ratingText}>4.8 Rating</Text>
          </View>
          <Text style={styles.stats}>12 Active Orders</Text>
        </View>

        <Text style={styles.sectionTitle}>Recent Completed Jobs</Text>
        <View style={styles.jobCard}>
          <Text style={styles.jobId}>WO: c1a2b3d4</Text>
          <Text style={styles.jobTitle}>Pothole Repair - Main St</Text>
          <Text style={styles.jobDate}>Completed: {new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.jobCard}>
          <Text style={styles.jobId}>WO: e5f6g7h8</Text>
          <Text style={styles.jobTitle}>Sidewalk Fix - 1st Ave</Text>
          <Text style={styles.jobDate}>Completed: {new Date(Date.now() - 86400000).toLocaleDateString()}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.btnIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingTop: 40, backgroundColor: colors.bg },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.white },
  content: { padding: 16 },
  profileCard: { backgroundColor: colors.cardBg, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: 'bold' },
  name: { color: colors.white, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { color: colors.amber, fontSize: 16, marginLeft: 4, fontWeight: '600' },
  stats: { color: colors.slate, fontSize: 14 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  jobCard: { backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  jobId: { color: colors.slate, fontSize: 12, marginBottom: 4 },
  jobTitle: { color: colors.white, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  jobDate: { color: colors.primary, fontSize: 14 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 24, borderColor: colors.danger, borderWidth: 1 },
  btnIcon: { marginRight: 8 },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: 'bold' },
});
