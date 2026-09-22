import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView as RNSafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './lib/theme';

import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import CasesScreen from './screens/CasesScreen';
import AlertsScreen from './screens/AlertsScreen';

type TabName = 'Home' | 'Report' | 'Cases' | 'Alerts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen onReportPress={() => setActiveTab('Report')} />;
      case 'Report':
        return <ReportScreen onFinished={() => setActiveTab('Home')} />;
      case 'Cases':
        return <CasesScreen />;
      case 'Alerts':
        return <AlertsScreen />;
      default:
        return <HomeScreen onReportPress={() => setActiveTab('Report')} />;
    }
  };

  const TabButton = ({ name, iconName }: { name: TabName; iconName: any }) => {
    const isActive = activeTab === name;
    return (
      <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab(name)}>
        <Ionicons name={iconName} size={24} color={isActive ? colors.primary : colors.slate} />
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.content}>
          {renderScreen()}
        </View>
        <RNSafeAreaView style={styles.tabBar} edges={['bottom']}>
          <TabButton name="Home" iconName="home" />
          <TabButton name="Report" iconName="add-circle" />
          <TabButton name="Cases" iconName="clipboard" />
          <TabButton name="Alerts" iconName="notifications" />
        </RNSafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 12,
    color: colors.slate,
    marginTop: 4,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
