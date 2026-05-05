import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { tenantService, Tenant } from '@/services/tenantService';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, Typography } from '@/types/theme';

export default function SelectTenantScreen() {
  const router = useRouter();
  const setTenant = useAuthStore((s) => s.setTenant);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', debouncedQuery],
    queryFn: () => tenantService.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    const timer = setTimeout(() => setDebouncedQuery(text), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (tenant: Tenant) => {
    setTenant(tenant);
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DaxCloud</Text>
        <Text style={styles.subtitle}>¿En qué negocio querés comprar?</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Buscar negocio..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
          />
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
        <TouchableOpacity style={styles.qrBtn} onPress={() => router.push('/auth/scan-qr')}>
          <Ionicons name="qr-code" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {tenants && tenants.length > 0 ? (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tenantCard} onPress={() => handleSelect(item)}>
              <View style={styles.tenantLogo}>
                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.logoImg} />
                ) : (
                  <Text style={styles.logoFallback}>{item.name[0]}</Text>
                )}
              </View>
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantName}>{item.name}</Text>
                {item.category && (
                  <Text style={styles.tenantCategory}>{item.category}</Text>
                )}
                {item.address && (
                  <Text style={styles.tenantAddress} numberOfLines={1}>{item.address}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      ) : debouncedQuery.length >= 2 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No encontramos "{debouncedQuery}"</Text>
          <Text style={styles.emptyHint}>Intentá con otro nombre o escaneá el QR del local</Text>
        </View>
      ) : (
        <View style={styles.hint}>
          <Ionicons name="storefront-outline" size={64} color={Colors.border} />
          <Text style={styles.hintText}>Escribí el nombre del negocio{'\n'}o escaneá su código QR</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  searchRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, height: 46, ...Typography.body, color: Colors.text },
  qrBtn: {
    width: 46, height: 46, backgroundColor: Colors.card,
    borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  tenantCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  tenantLogo: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  logoImg: { width: 48, height: 48 },
  logoFallback: { ...Typography.h2, color: Colors.primary },
  tenantInfo: { flex: 1 },
  tenantName: { ...Typography.body, fontWeight: '600', color: Colors.text },
  tenantCategory: { ...Typography.bodySmall, color: Colors.primary, marginTop: 2 },
  tenantAddress: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  emptyHint: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  hintText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },
});
