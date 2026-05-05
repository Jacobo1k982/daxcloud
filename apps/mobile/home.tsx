import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, Typography } from '@/types/theme';

const TIER_COLORS: Record<string, string> = {
  bronze: Colors.bronze,
  silver: Colors.silver,
  gold: Colors.gold,
  diamond: Colors.diamond,
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  diamond: 'Diamante',
};

export default function HomeScreen() {
  const { user, tenant } = useAuthStore();

  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customerProfile'],
    queryFn: customerService.getProfile,
  });

  const { data: historyData } = useQuery({
    queryKey: ['purchaseHistory', 1],
    queryFn: () => customerService.getPurchaseHistory(1),
  });

  const recentPurchases = historyData?.data?.slice(0, 3) ?? [];
  const tierColor = TIER_COLORS[profile?.tier ?? 'bronze'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'cliente'} 👋</Text>
            <Text style={styles.tenantName}>{tenant?.name}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Points card */}
        <View style={[styles.pointsCard, { borderColor: tierColor }]}>
          <View style={styles.pointsTop}>
            <View>
              <Text style={styles.pointsLabel}>Tus puntos</Text>
              <Text style={styles.pointsValue}>
                {profile?.points?.toLocaleString() ?? '—'}
              </Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + '22', borderColor: tierColor }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>
                {TIER_LABELS[profile?.tier ?? 'bronze']}
              </Text>
            </View>
          </View>
          <View style={styles.pointsBottom}>
            <Text style={styles.spentText}>
              Total gastado: ₡{profile?.totalSpent?.toLocaleString() ?? '0'}
            </Text>
          </View>
        </View>

        {/* Recent purchases */}
        {recentPurchases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compras recientes</Text>
            {recentPurchases.map((p) => (
              <View key={p.id} style={styles.purchaseRow}>
                <View style={styles.purchaseIcon}>
                  <Ionicons name="bag-handle" size={18} color={Colors.primary} />
                </View>
                <View style={styles.purchaseInfo}>
                  <Text style={styles.purchaseDate}>
                    {new Date(p.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}
                  </Text>
                  <Text style={styles.purchaseItems}>{p.items.length} producto(s)</Text>
                </View>
                <View style={styles.purchaseRight}>
                  <Text style={styles.purchaseTotal}>₡{p.total.toLocaleString()}</Text>
                  <Text style={styles.purchasePoints}>+{p.pointsEarned} pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { ...Typography.h2, color: Colors.text },
  tenantName: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  notifBtn: { padding: Spacing.xs },
  pointsCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1.5, gap: Spacing.md,
  },
  pointsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pointsLabel: { ...Typography.label, color: Colors.textSecondary, textTransform: 'uppercase' },
  pointsValue: { fontSize: 42, fontWeight: '700', color: Colors.text, lineHeight: 50 },
  tierBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  tierText: { ...Typography.label, fontWeight: '600' },
  pointsBottom: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  spentText: { ...Typography.bodySmall, color: Colors.textSecondary },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.body, fontWeight: '600', color: Colors.text },
  purchaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  purchaseIcon: {
    width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  purchaseInfo: { flex: 1 },
  purchaseDate: { ...Typography.body, fontWeight: '500', color: Colors.text },
  purchaseItems: { ...Typography.bodySmall, color: Colors.textSecondary },
  purchaseRight: { alignItems: 'flex-end' },
  purchaseTotal: { ...Typography.body, fontWeight: '600', color: Colors.text },
  purchasePoints: { ...Typography.caption, color: Colors.success },
});
