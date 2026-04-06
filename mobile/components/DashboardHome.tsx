/**
 * Dashboard Home Screen
 * Shows stats (calls, escalations, appointments) and recent calls
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient, { CallRecord, CallStats } from '../lib/api';

// Design tokens
const C = {
  bg: '#080E1A',
  surface: '#0E1929',
  surface2: '#152235',
  teal: '#0CD9C2',
  tealDim: 'rgba(12,217,194,0.11)',
  orange: '#FF6A3C',
  orangeDim: 'rgba(255,106,60,0.12)',
  green: '#20D777',
  greenDim: 'rgba(32,215,119,0.13)',
  text: '#E6EDFF',
  textSub: '#637491',
  textDim: '#2E3F58',
  border: 'rgba(255,255,255,0.07)',
};

interface DashboardHomeScreenProps {
  businessId: string;
  onCallTap: (callId: string) => void;
}

export function DashboardHomeScreen({
  businessId,
  onCallTap,
}: DashboardHomeScreenProps) {
  const [stats, setStats] = useState<CallStats | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, callsData] = await Promise.all([
        apiClient.getCallStats(businessId),
        apiClient.listCalls(businessId, 10, 0),
      ]);
      setStats(statsData);
      setCalls(callsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={C.teal} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color={C.orange} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    return (num / 1000).toFixed(1) + 'K';
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN');
  };

  const formatIntent = (intent?: string) => {
    if (!intent) return 'Unknown';
    return intent
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />

      <FlatList
        data={calls}
        ListHeaderComponent={
          <>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="phone"
                label="Total Calls"
                value={formatNumber(stats?.total_calls || 0)}
                color={C.teal}
                colorDim={C.tealDim}
              />
              <StatCard
                icon="alert-circle"
                label="Escalations"
                value={formatNumber(stats?.escalated || 0)}
                color={C.orange}
                colorDim={C.orangeDim}
              />
              <StatCard
                icon="calendar"
                label="Appointments"
                value={formatNumber(stats?.appointments_booked || 0)}
                color={C.green}
                colorDim={C.greenDim}
              />
            </View>

            {/* Recent Calls Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Calls</Text>
              {calls.length === 0 && (
                <Text style={styles.noCallsText}>No calls yet</Text>
              )}
            </View>
          </>
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CallListItem
            call={item}
            onTap={() => onCallTap(item.id)}
            formatTime={formatTime}
            formatIntent={formatIntent}
          />
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.callsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.teal}
          />
        }
      />
    </View>
  );
}

// ─── Stat Card Component ────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
  colorDim: string;
}

function StatCard({ icon, label, value, color, colorDim }: StatCardProps) {
  return (
    <LinearGradient
      colors={[colorDim, 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.statCard, { borderColor: color }]}
    >
      <Ionicons name={icon as any} size={28} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </LinearGradient>
  );
}

// ─── Call List Item Component ──────────────────────────────

interface CallListItemProps {
  call: CallRecord;
  onTap: () => void;
  formatTime: (iso: string) => string;
  formatIntent: (intent?: string) => string;
}

function CallListItem({
  call,
  onTap,
  formatTime,
  formatIntent,
}: CallListItemProps) {
  return (
    <TouchableOpacity style={styles.callItem} onPress={onTap}>
      <View style={styles.callItemLeft}>
        <View
          style={[
            styles.callIcon,
            call.escalated && { backgroundColor: `${C.orange}22` },
            !call.escalated && { backgroundColor: `${C.teal}22` },
          ]}
        >
          <Ionicons
            name={call.escalated ? 'alert-circle' : 'call'}
            size={20}
            color={call.escalated ? C.orange : C.teal}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callNumber}>{call.caller_number || 'Unknown'}</Text>
          {call.summary && (
            <Text style={styles.callSummary} numberOfLines={1}>
              {call.summary}
            </Text>
          )}
          <View style={styles.callMeta}>
            <Text style={styles.callTime}>{formatTime(call.timestamp)}</Text>
            {call.intent && (
              <Text style={styles.callIntent}>{formatIntent(call.intent)}</Text>
            )}
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.textDim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: C.text,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: C.orange,
    borderRadius: 8,
  },
  retryButtonText: {
    color: C.bg,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  noCallsText: {
    fontSize: 13,
    color: C.textDim,
  },
  callsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
    backgroundColor: C.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  callItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  callSummary: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  callMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  callTime: {
    fontSize: 11,
    color: C.textDim,
  },
  callIntent: {
    fontSize: 11,
    color: C.teal,
    fontWeight: '500',
  },
});
