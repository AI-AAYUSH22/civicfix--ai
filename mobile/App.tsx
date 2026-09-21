import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { ShieldCheck, HardHat, Camera, ArrowRight, Sparkles } from 'lucide-react-native';
import { ReportPotholeScreen } from './src/screens/citizen/ReportPotholeScreen';
import { ContractorScreen } from './src/screens/contractor/ContractorScreen';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'HOME' | 'CITIZEN' | 'CONTRACTOR'>('HOME');

  if (currentMode === 'CITIZEN') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ReportPotholeScreen onBack={() => setCurrentMode('HOME')} />
      </SafeAreaView>
    );
  }

  if (currentMode === 'CONTRACTOR') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ContractorScreen onBack={() => setCurrentMode('HOME')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <ShieldCheck color="#0F766E" size={24} />
            </View>
            <View>
              <Text style={styles.brandTitle}>CivicFix AI</Text>
              <Text style={styles.brandSubtitle}>Decentralized Road Repair Verification</Text>
            </View>
          </View>
        </View>

        {/* Hero Announcement Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#0F766E" />
            <Text style={styles.heroBadgeText}>AI Anti-Spoofing Vision Active</Text>
          </View>
          <Text style={styles.heroTitle}>Municipal Infrastructure & Pothole Tracking</Text>
          <Text style={styles.heroDescription}>
            Every road cavity is verified using SIFT Perspective Homography, CLAHE Lighting Normalization, and strict GPS spatial bounds.
          </Text>
        </View>

        {/* Mode Selector Cards */}
        <Text style={styles.sectionHeading}>Choose Your Role</Text>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => setCurrentMode('CITIZEN')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0FDFA' }]}>
            <Camera color="#0F766E" size={28} />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Citizen Portal</Text>
            <Text style={styles.roleDesc}>
              Report potholes with live GPS lock and camera photo. Track repair progress in real time.
            </Text>
          </View>
          <ArrowRight color="#94A3B8" size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => setCurrentMode('CONTRACTOR')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFFBEB' }]}>
            <HardHat color="#D97706" size={28} />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Contractor Field Crew</Text>
            <Text style={styles.roleDesc}>
              View assigned work orders, capture verified Before/After evidence, and synchronize to Ward DB.
            </Text>
          </View>
          <ArrowRight color="#94A3B8" size={18} />
        </TouchableOpacity>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CivicFix AI Mobile Client • Connects to FastAPI Port 8000
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#172033',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 3,
  },
  roleDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
