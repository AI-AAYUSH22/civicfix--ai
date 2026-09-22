import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './lib/theme';

import WorkOrderListScreen from './screens/WorkOrderListScreen';
import WorkOrderDetailScreen from './screens/WorkOrderDetailScreen';
import CaptureScreen from './screens/CaptureScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'List' | 'Detail' | 'Capture' | 'Profile'>('List');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [captureType, setCaptureType] = useState<'BEFORE' | 'AFTER'>('BEFORE');

  const navigate = (screen: string, params?: any) => {
    if (screen === 'List') {
      setCurrentTab('List');
    } else if (screen === 'WorkOrderDetail') {
      setSelectedWorkOrderId(params.workOrderId);
      setCurrentTab('Detail');
    } else if (screen === 'Capture') {
      if (params?.workOrderId) setSelectedWorkOrderId(params.workOrderId);
      if (params?.captureType) setCaptureType(params.captureType);
      setCurrentTab('Capture');
    } else if (screen === 'Profile') {
      setCurrentTab('Profile');
    }
  };

  const goBack = () => {
    if (currentTab === 'Capture' && selectedWorkOrderId) {
      setCurrentTab('Detail');
    } else if (currentTab === 'Detail') {
      setCurrentTab('List');
    }
  };

  const renderScreen = () => {
    switch (currentTab) {
      case 'List':
        return <WorkOrderListScreen navigation={{ navigate }} />;
      case 'Detail':
        return <WorkOrderDetailScreen route={{ params: { workOrderId: selectedWorkOrderId } }} navigation={{ navigate, goBack }} />;
      case 'Capture':
        return <CaptureScreen route={{ params: { workOrderId: selectedWorkOrderId, captureType } }} navigation={{ navigate, goBack }} />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <WorkOrderListScreen navigation={{ navigate }} />;
    }
  };

  const TabButton = ({ name, icon, tab }: { name: string; icon: keyof typeof Ionicons.glyphMap; tab: string }) => {
    const isActive =
      currentTab === tab ||
      (tab === 'List' && currentTab === 'Detail' && !selectedWorkOrderId) || // simple fallback
      (tab === 'Capture' && currentTab === 'Capture') ||
      (tab === 'Detail' && currentTab === 'Detail');

    let activeCheck = false;
    if (tab === 'List') activeCheck = currentTab === 'List';
    if (tab === 'Detail') activeCheck = currentTab === 'Detail';
    if (tab === 'Capture') activeCheck = currentTab === 'Capture';
    if (tab === 'Profile') activeCheck = currentTab === 'Profile';

    return (
      <TouchableOpacity style={styles.tabItem} onPress={() => navigate(tab)}>
        <Ionicons name={icon} size={24} color={activeCheck ? colors.primary : colors.slate} />
        <Text style={[styles.tabText, { color: activeCheck ? colors.primary : colors.slate }]}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>
        <SafeAreaView edges={['bottom']} style={styles.tabBar}>
          <View style={styles.tabRow}>
            <TabButton name="Orders" icon="list" tab="List" />
            <TabButton name="Active" icon="hammer" tab="Detail" />
            <TabButton name="Camera" icon="camera" tab="Capture" />
            <TabButton name="Profile" icon="person" tab="Profile" />
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  screenContainer: { flex: 1 },
  tabBar: { backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  tabRow: { flexDirection: 'row', height: 60 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 10, marginTop: 4, fontWeight: '500' },
});
