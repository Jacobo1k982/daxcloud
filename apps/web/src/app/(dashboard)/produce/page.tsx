'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
    Plus, X, AlertTriangle, Thermometer,
    TrendingUp, TrendingDown, RefreshCw,
    Leaf, Package, BarChart2, Clock,
} from 'lucide-react';

type Tab = 'dashboard' | 'products' | 'lots' | 'wastes' | 'sections' | 'suppliers';

const FRESHNESS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    fresh: { label: 'Fresco', color: 'var(--dax-success)', bg: 'var(--dax-success-bg)', emoji: '🟢' },
    good: { label: 'Bueno', color: 'var(--dax-blue)', bg: 'rgba(90,170,240,.12)', emoji: '🔵' },
    warning: { label: 'Por vencer', color: 'var(--dax-amber)', bg: 'rgba(240,160,48,.12)', emoji: '🟡' },
    critical: { label: 'Crítico', color: 'var(--dax-danger)', bg: 'var(--dax-danger-bg)', emoji: '🔴' },
    expired: { label: 'Vencido', color: '#666', bg: 'var(--dax-surface-2)', emoji: '⚫' },
};

const SECTIONS = ['Frutas', 'Verduras', 'Hortalizas', 'Hierbas', 'Raíces', 'Cítricos', 'Tropicales', 'Legumbres'];
const WEIGHT_UNITS = ['kg', 'lb', 'g', 'oz', 'unidad', 'manojo', 'docena', 'caja'];
const WASTE_REASONS = [
    'Deterioro natural', 'Daño por temperatura', 'Daño físico',
    'Plagas', 'Exceso de humedad', 'Vencimiento', 'Error de almacenamiento', 'Otro',
];

const GREEN = '#22C55E';

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
        {children}
        {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
    </label>
);

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

export default function ProducePage() {
    const { formatCurrency } = useAuth();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>('dashboard');
    const [filterSection, setFilterSection] = useState('');
    const [filterFreshness, setFilterFreshness] = useState('');

    const [showProductModal, setShowProductModal] = useState(false);
    const [showLotModal, setShowLotModal] = useState(false);
    const [showWasteModal, setShowWasteModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState<any>(null);
    const [showTempModal, setShowTempModal] = useState<any>(null);

    const [productForm, setProductForm] = useState({
        productId: '', section: 'Frutas', weightUnit: 'kg', pricePerUnit: 0,
        shelfLifeDays: 7, minTemperature: '', maxTemperature: '',
        origin: '', seasonal: false, seasonStart: '', seasonEnd: '',
    });

    const [lotForm, setLotForm] = useState({
        produceProductId: '', supplierId: '', branchId: '',
        lotCode: '', quantity: 1, weightUnit: 'kg', unitCost: 0,
        harvestDate: '', expirationDate: '', temperature: '', origin: '', notes: '',
    });

    const [wasteForm, setWasteForm] = useState({
        harvestLotId: '', productId: '', branchId: '',
        quantity: 1, weightUnit: 'kg', reason: '', cost: 0, reportedBy: '',
    });

    const [sectionForm, setSectionForm] = useState({
        name: '', description: '', temperature: '', humidity: '', capacity: '', unit: 'kg',
    });

    const [supplierForm, setSupplierForm] = useState({
        name: '', contactName: '', phone: '', email: '',
        address: '', taxId: '', paymentTerms: '', notes: '',
    });

    const [priceForm, setPriceForm] = useState({ price: 0, reason: '' });
    const [tempForm, setTempForm] = useState({ temperature: 0 });

    // Queries
    const { data: stats } = useQuery({
        queryKey: ['produce-stats'],
        queryFn: async () => { const { data } = await api.get('/produce/stats'); return data; },
    });

    const { data: alerts } = useQuery({
        queryKey: ['produce-alerts'],
        queryFn: async () => { const { data } = await api.get('/produce/alerts'); return data; },
        enabled: tab === 'dashboard',
    });

    const { data: produceProducts = [] } = useQuery({
        queryKey: ['produce-products', filterSection],
        queryFn: async () => {
            const params = filterSection ? `?section=${filterSection}` : '';
            const { data } = await api.get(`/produce/products${params}`);
            return data;
        },
        enabled: tab === 'products' || tab === 'dashboard',
    });

    const { data: lots = [] } = useQuery({
        queryKey: ['produce-lots', filterFreshness],
        queryFn: async () => {
            const params = filterFreshness ? `?status=${filterFreshness}` : '';
            const { data } = await api.get(`/produce/lots${params}`);
            return data;
        },
        enabled: tab === 'lots' || tab === 'dashboard',
    });

    const { data: wastes = [] } = useQuery({
        queryKey: ['produce-wastes'],
        queryFn: async () => { const { data } = await api.get('/produce/wastes'); return data; },
        enabled: tab === 'wastes',
    });

    const { data: sections = [] } = useQuery({
        queryKey: ['produce-sections'],
        queryFn: async () => { const { data } = await api.get('/produce/sections'); return data; },
        enabled: tab === 'sections' || tab === 'dashboard',
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ['produce-suppliers'],
        queryFn: async () => { const { data } = await api.get('/produce/suppliers'); return data; },
        enabled: tab === 'suppliers',
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: async () => { const { data } = await api.get('/products'); return data; },
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['produce-stats'] });
        queryClient.invalidateQueries({ queryKey: ['produce-lots'] });
        queryClient.invalidateQueries({ queryKey: ['produce-alerts'] });
    };

    // Mutations
    const productMutation = useMutation({
        mutationFn: async (productId: string) => api.post('/produce/products', {
            productId,
            section: productForm.section,
            weightUnit: productForm.weightUnit,
            pricePerUnit: Number(productForm.pricePerUnit),
            shelfLifeDays: Number(productForm.shelfLifeDays),
            minTemperature: productForm.minTemperature ? Number(productForm.minTemperature) : undefined,
            maxTemperature: productForm.maxTemperature ? Number(productForm.maxTemperature) : undefined,
            origin: productForm.origin || undefined,
            seasonal: productForm.seasonal,
            seasonStart: productForm.seasonStart ? Number(productForm.seasonStart) : undefined,
            seasonEnd: productForm.seasonEnd ? Number(productForm.seasonEnd) : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['produce-products'] });
            queryClient.invalidateQueries({ queryKey: ['produce-stats'] });
            setShowProductModal(false);
            setProductForm({ productId: '', section: 'Frutas', weightUnit: 'kg', pricePerUnit: 0, shelfLifeDays: 7, minTemperature: '', maxTemperature: '', origin: '', seasonal: false, seasonStart: '', seasonEnd: '' });
        },
    });

    const lotMutation = useMutation({
        mutationFn: async () => api.post('/produce/lots', {
            ...lotForm,
            quantity: Number(lotForm.quantity),
            unitCost: lotForm.unitCost ? Number(lotForm.unitCost) : undefined,
            temperature: lotForm.temperature ? Number(lotForm.temperature) : undefined,
            supplierId: lotForm.supplierId || undefined,
            branchId: lotForm.branchId || undefined,
        }),
        onSuccess: () => { invalidate(); setShowLotModal(false); setLotForm({ produceProductId: '', supplierId: '', branchId: '', lotCode: '', quantity: 1, weightUnit: 'kg', unitCost: 0, harvestDate: '', expirationDate: '', temperature: '', origin: '', notes: '' }); },
    });

    const wasteMutation = useMutation({
        mutationFn: async () => api.post('/produce/wastes', {
            ...wasteForm,
            quantity: Number(wasteForm.quantity),
            cost: wasteForm.cost ? Number(wasteForm.cost) : undefined,
            harvestLotId: wasteForm.harvestLotId || undefined,
            productId: wasteForm.productId || undefined,
            branchId: wasteForm.branchId || undefined,
        }),
        onSuccess: () => { invalidate(); queryClient.invalidateQueries({ queryKey: ['produce-wastes'] }); setShowWasteModal(false); setWasteForm({ harvestLotId: '', productId: '', branchId: '', quantity: 1, weightUnit: 'kg', reason: '', cost: 0, reportedBy: '' }); },
    });

    const sectionMutation = useMutation({
        mutationFn: async () => api.post('/produce/sections', {
            ...sectionForm,
            temperature: sectionForm.temperature ? Number(sectionForm.temperature) : undefined,
            humidity: sectionForm.humidity ? Number(sectionForm.humidity) : undefined,
            capacity: sectionForm.capacity ? Number(sectionForm.capacity) : undefined,
        }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['produce-sections'] }); setShowSectionModal(false); setSectionForm({ name: '', description: '', temperature: '', humidity: '', capacity: '', unit: 'kg' }); },
    });

    const supplierMutation = useMutation({
        mutationFn: async () => api.post('/produce/suppliers', supplierForm),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['produce-suppliers'] }); setShowSupplierModal(false); setSupplierForm({ name: '', contactName: '', phone: '', email: '', address: '', taxId: '', paymentTerms: '', notes: '' }); },
    });

    const priceMutation = useMutation({
        mutationFn: async () => api.put(`/produce/products/${showPriceModal.id}/price`, priceForm),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['produce-products'] }); setShowPriceModal(null); },
    });

    const tempMutation = useMutation({
        mutationFn: async () => api.put(`/produce/lots/${showTempModal.id}/temperature`, tempForm),
        onSuccess: () => { invalidate(); setShowTempModal(null); },
    });

    const discardMutation = useMutation({
        mutationFn: async (id: string) => api.put(`/produce/lots/${id}/discard`),
        onSuccess: () => invalidate(),
    });

    const refreshFreshnessMutation = useMutation({
        mutationFn: async () => api.post('/produce/lots/update-freshness'),
        onSuccess: () => invalidate(),
    });

    const TABS = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'products', label: 'Productos', icon: Leaf },
        { id: 'lots', label: 'Lotes', icon: Package },
        { id: 'wastes', label: 'Mermas', icon: AlertTriangle },
        { id: 'sections', label: 'Almacenaje', icon: Thermometer },
        { id: 'suppliers', label: 'Proveedores', icon: TrendingUp },
    ] as { id: Tab; label: string; icon: any }[];

    const alertCount = (alerts?.critical?.length ?? 0) + (alerts?.expired?.length ?? 0) + (alerts?.temperatureAlerts?.length ?? 0);

    return (
        <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1200px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--dax-radius-lg)', background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={22} color={GREEN} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '2px' }}>Verdulería</h1>
                        <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Control de frescura, lotes y mermas</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => refreshFreshnessMutation.mutate()} disabled={refreshFreshnessMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)', background: 'var(--dax-surface)', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <RefreshCw size={13} className={refreshFreshnessMutation.isPending ? 'spinning' : ''} />
                        Actualizar frescura
                    </button>
                    {tab === 'products' && <button onClick={() => setShowProductModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Producto</button>}
                    {tab === 'lots' && <button onClick={() => setShowLotModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Lote</button>}
                    {tab === 'wastes' && <button onClick={() => setShowWasteModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Merma</button>}
                    {tab === 'sections' && <button onClick={() => setShowSectionModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Sección</button>}
                    {tab === 'suppliers' && <button onClick={() => setShowSupplierModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Proveedor</button>}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? GREEN : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0 }}>
                            <Icon size={13} />
                            {t.label}
                            {t.id === 'dashboard' && alertCount > 0 && (
                                <span style={{ background: 'var(--dax-surface)', color: GREEN, borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{alertCount}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB: DASHBOARD ── */}
            {tab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                        {[
                            { label: 'Lotes frescos', value: stats?.freshLots ?? 0, color: GREEN, emoji: '🟢' },
                            { label: 'Por vencer', value: stats?.warningLots ?? 0, color: 'var(--dax-amber)', emoji: '🟡' },
                            { label: 'Críticos', value: stats?.criticalLots ?? 0, color: 'var(--dax-danger)', emoji: '🔴' },
                            { label: 'Vencidos', value: stats?.expiredLots ?? 0, color: '#666', emoji: '⚫' },
                            { label: 'Productos', value: stats?.totalProducts ?? 0, color: 'var(--dax-blue)', emoji: '🌿' },
                            { label: 'Costo mermas/mes', value: formatCurrency(stats?.monthWasteCost ?? 0), color: 'var(--dax-danger)', emoji: '📉', isText: true },
                            { label: 'Ventas del mes', value: formatCurrency(stats?.monthRevenue ?? 0), color: GREEN, emoji: '💰', isText: true },
                        ].map((s, i) => (
                            <div key={i} className="dax-card" style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>{s.emoji}</span>
                                </div>
                                <p style={{ fontSize: s.isText ? '14px' : '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Alertas críticas */}
                    {alerts?.expired?.length > 0 && (
                        <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(224,80,80,.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <AlertTriangle size={15} color="var(--dax-danger)" />
                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-danger)' }}>Lotes vencidos — Acción requerida ({alerts.expired.length})</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {alerts.expired.map((lot: any) => (
                                    <div key={lot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--dax-danger-bg)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{lot.produceProduct?.product?.name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Lote: {lot.lotCode} · {Number(lot.quantity)} {lot.weightUnit}</p>
                                        </div>
                                        <button onClick={() => { if (confirm('¿Descartar este lote?')) discardMutation.mutate(lot.id); }} style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', padding: '5px 12px', borderRadius: 'var(--dax-radius-md)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                            Descartar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Alertas de temperatura */}
                    {alerts?.temperatureAlerts?.length > 0 && (
                        <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(240,160,48,.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <Thermometer size={15} color="#F0A030" />
                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-amber)' }}>Alertas de temperatura ({alerts.temperatureAlerts.length})</p>
                            </div>
                            {alerts.temperatureAlerts.map((lot: any) => (
                                <div key={lot.id} style={{ padding: '10px 14px', background: 'var(--dax-amber-bg)', borderRadius: 'var(--dax-radius-md)', marginBottom: '6px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{lot.produceProduct?.product?.name}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--dax-amber)' }}>
                                        Temp. actual: {Number(lot.temperature)}°C ·
                                        Rango: {lot.produceProduct?.minTemperature ?? '—'}°C — {lot.produceProduct?.maxTemperature ?? '—'}°C
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Por vencer en 3 días */}
                    {stats?.expiringIn3?.length > 0 && (
                        <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(240,160,48,.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <Clock size={15} color="#F0A030" />
                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Vencen en los próximos 3 días</p>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {stats.expiringIn3.map((lot: any) => {
                                    const days = daysUntil(lot.expirationDate);
                                    return (
                                        <div key={lot.id} style={{ padding: '8px 12px', background: 'var(--dax-amber-bg)', borderRadius: 'var(--dax-radius-md)', border: '1px solid rgba(240,160,48,.2)' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
                                                {lot.produceProduct?.product?.name}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'var(--dax-amber)', fontWeight: 600 }}>
                                                {days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `${days} días`} · {Number(lot.quantity)} {lot.weightUnit}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Secciones */}
                    {sections.length > 0 && (
                        <div className="dax-card" style={{ padding: '20px 24px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '14px' }}>Estado del almacenaje</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                                {sections.map((sec: any) => (
                                    <div key={sec.id} style={{ padding: '14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '8px' }}>{sec.name}</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {sec.temperature !== null && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>🌡 {Number(sec.temperature)}°C</p>}
                                            {sec.humidity !== null && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>💧 {Number(sec.humidity)}%</p>}
                                            {sec.capacity !== null && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📦 {Number(sec.capacity)} {sec.unit}</p>}
                                        </div>
                                        <button onClick={() => { setShowSectionModal(true); }} style={{ marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: GREEN, fontWeight: 600 }}>
                                            Actualizar condiciones
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: PRODUCTOS ── */}
            {tab === 'products' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => setFilterSection('')} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: !filterSection ? GREEN : 'var(--dax-surface-2)', color: !filterSection ? '#fff' : 'var(--dax-text-muted)' }}>
                            Todos
                        </button>
                        {SECTIONS.map(s => (
                            <button key={s} onClick={() => setFilterSection(s)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterSection === s ? GREEN : 'var(--dax-surface-2)', color: filterSection === s ? '#fff' : 'var(--dax-text-muted)' }}>
                                {s}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                        {produceProducts.length === 0 ? (
                            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                                <Leaf size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay productos registrados</p>
                            </div>
                        ) : produceProducts.map((pp: any) => {
                            const lot = pp.harvestLots?.[0];
                            const fc = lot ? FRESHNESS_CONFIG[lot.freshnessStatus] : null;
                            return (
                                <div key={pp.id} className="dax-card" style={{ padding: '20px', borderLeft: `3px solid ${fc?.color ?? GREEN}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>{pp.product?.name}</p>
                                            <span style={{ fontSize: '11px', background: 'rgba(34,197,94,.12)', color: GREEN, padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>{pp.section}</span>
                                        </div>
                                        <button onClick={() => { setShowPriceModal(pp); setPriceForm({ price: Number(pp.pricePerUnit), reason: '' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: GREEN }}>
                                            Cambiar precio
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '6px 10px' }}>
                                            <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)' }}>Precio</p>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: GREEN }}>{formatCurrency(Number(pp.pricePerUnit))}<span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', fontWeight: 400 }}>/{pp.weightUnit}</span></p>
                                        </div>
                                        <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '6px 10px' }}>
                                            <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)' }}>Vida útil</p>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{pp.shelfLifeDays} días</p>
                                        </div>
                                        {pp.origin && (
                                            <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '6px 10px' }}>
                                                <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)' }}>Origen</p>
                                                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>{pp.origin}</p>
                                            </div>
                                        )}
                                    </div>
                                    {pp.minTemperature !== null && (
                                        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>🌡 {Number(pp.minTemperature)}°C — {Number(pp.maxTemperature)}°C</p>
                                    )}
                                    {fc && lot && (
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: fc.color, background: fc.bg, padding: '3px 10px', borderRadius: '10px' }}>
                                                {fc.emoji} {fc.label}
                                            </span>
                                            {lot.expirationDate && (
                                                <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                                                    · {daysUntil(lot.expirationDate)} días
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '6px' }}>{pp._count?.harvestLots ?? 0} lote{(pp._count?.harvestLots ?? 0) !== 1 ? 's' : ''} activos</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── TAB: LOTES ── */}
            {tab === 'lots' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                            { value: '', label: 'Todos' },
                            { value: 'fresh', label: '🟢 Fresco' },
                            { value: 'good', label: '🔵 Bueno' },
                            { value: 'warning', label: '🟡 Por vencer' },
                            { value: 'critical', label: '🔴 Crítico' },
                            { value: 'expired', label: '⚫ Vencido' },
                        ].map(f => (
                            <button key={f.value} onClick={() => setFilterFreshness(f.value)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterFreshness === f.value ? GREEN : 'var(--dax-surface-2)', color: filterFreshness === f.value ? '#fff' : 'var(--dax-text-muted)' }}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="dax-card">
                        <div className="dax-table-wrap">
                            <table className="dax-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Lote</th>
                                        <th>Cantidad</th>
                                        <th>Origen</th>
                                        <th>Temp.</th>
                                        <th>Llegada</th>
                                        <th>Vencimiento</th>
                                        <th style={{ textAlign: 'center' }}>Frescura</th>
                                        <th style={{ textAlign: 'center' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lots.length === 0 ? (
                                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>No hay lotes</td></tr>
                                    ) : lots.map((lot: any) => {
                                        const fc = FRESHNESS_CONFIG[lot.freshnessStatus];
                                        const days = lot.expirationDate ? daysUntil(lot.expirationDate) : null;
                                        return (
                                            <tr key={lot.id}>
                                                <td>
                                                    <p style={{ fontWeight: 600 }}>{lot.produceProduct?.product?.name}</p>
                                                    {lot.supplier && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{lot.supplier.name}</p>}
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{lot.lotCode}</td>
                                                <td style={{ fontWeight: 600 }}>{Number(lot.quantity)} <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', fontWeight: 400 }}>{lot.weightUnit}</span></td>
                                                <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{lot.origin ?? '—'}</td>
                                                <td>
                                                    {lot.temperature !== null ? (
                                                        <button onClick={() => { setShowTempModal(lot); setTempForm({ temperature: Number(lot.temperature) }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Thermometer size={12} /> {Number(lot.temperature)}°C
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => { setShowTempModal(lot); setTempForm({ temperature: 0 }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--dax-text-muted)', fontWeight: 600 }}>+ Temp</button>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                                                    {new Date(lot.arrivalDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}
                                                </td>
                                                <td>
                                                    {lot.expirationDate ? (
                                                        <div>
                                                            <p style={{ fontSize: '12px', color: fc.color, fontWeight: 600 }}>
                                                                {new Date(lot.expirationDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}
                                                            </p>
                                                            {days !== null && <p style={{ fontSize: '10px', color: fc.color }}>{days > 0 ? `${days}d` : 'Vencido'}</p>}
                                                        </div>
                                                    ) : <span style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>—</span>}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: fc.color, background: fc.bg, padding: '3px 10px', borderRadius: '10px' }}>
                                                        {fc.emoji} {fc.label}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button onClick={() => setShowWasteModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-amber)', marginRight: '6px' }}>
                                                        Merma
                                                    </button>
                                                    {lot.freshnessStatus !== 'expired' && (
                                                        <button onClick={() => { if (confirm('¿Descartar lote completo?')) discardMutation.mutate(lot.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-danger)' }}>
                                                            Descartar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: MERMAS ── */}
            {tab === 'wastes' && (
                <div className="dax-card">
                    <div className="dax-table-wrap">
                        <table className="dax-table">
                            <thead>
                                <tr><th>Producto / Lote</th><th>Cantidad</th><th>Razón</th><th>Costo</th><th>Reportado por</th><th>Fecha</th></tr>
                            </thead>
                            <tbody>
                                {wastes.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>Sin mermas registradas</td></tr>
                                ) : wastes.map((w: any) => (
                                    <tr key={w.id}>
                                        <td>
                                            <p style={{ fontWeight: 600 }}>
                                                {w.harvestLot?.produceProduct?.product?.name ?? w.product?.name ?? '—'}
                                            </p>
                                            {w.harvestLot && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Lote: {w.harvestLot.lotCode}</p>}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{Number(w.quantity)} {w.weightUnit}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{w.reason}</td>
                                        <td style={{ color: 'var(--dax-danger)', fontWeight: 600 }}>{w.cost ? formatCurrency(Number(w.cost)) : '—'}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{w.reportedBy ?? '—'}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{new Date(w.createdAt).toLocaleDateString('es-CR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB: ALMACENAJE ── */}
            {tab === 'sections' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                    {sections.length === 0 ? (
                        <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                            <Thermometer size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay secciones de almacenaje</p>
                        </div>
                    ) : sections.map((sec: any) => (
                        <div key={sec.id} className="dax-card" style={{ padding: '20px' }}>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>{sec.name}</p>
                            {sec.description && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>{sec.description}</p>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {sec.temperature !== null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>🌡 Temperatura</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-blue)' }}>{Number(sec.temperature)}°C</span>
                                    </div>
                                )}
                                {sec.humidity !== null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>💧 Humedad</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-blue)' }}>{Number(sec.humidity)}%</span>
                                    </div>
                                )}
                                {sec.capacity !== null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📦 Capacidad</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: GREEN }}>{Number(sec.capacity)} {sec.unit}</span>
                                    </div>
                                )}
                            </div>
                            {sec.branch && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '10px' }}>📍 {sec.branch.name}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB: PROVEEDORES ── */}
            {tab === 'suppliers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {suppliers.length === 0 ? (
                        <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                            <TrendingUp size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay proveedores registrados</p>
                        </div>
                    ) : suppliers.map((sup: any) => (
                        <div key={sup.id} className="dax-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>{sup.name}</p>
                                    {sup.contactName && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{sup.contactName}</p>}
                                </div>
                                <span className="dax-badge dax-badge-success">Activo</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {sup.phone && <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>📞 {sup.phone}</p>}
                                {sup.email && <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>✉ {sup.email}</p>}
                                {sup.address && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📍 {sup.address}</p>}
                                {sup.paymentTerms && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>💳 {sup.paymentTerms}</p>}
                                {sup._count?.harvestLots > 0 && <p style={{ fontSize: '11px', color: GREEN, marginTop: '4px', fontWeight: 600 }}>{sup._count.harvestLots} lotes entregados</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}

            {/* Modal Producto */}
            {showProductModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '580px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Nuevo producto de verdulería</h2>
                                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Crea el producto y configura sus parámetros de verdulería</p>
                            </div>
                            <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            {/* Selector: producto existente o nuevo */}
                            <div style={{ display: 'flex', gap: '6px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '4px' }}>
                                {[
                                    { value: 'existing', label: 'Producto existente' },
                                    { value: 'new', label: 'Crear nuevo producto' },
                                ].map(opt => (
                                    <button key={opt.value} type="button"
                                        onClick={() => setProductForm(p => ({ ...p, _mode: opt.value } as any))}
                                        style={{ flex: 1, padding: '8px', borderRadius: 'var(--dax-radius-sm)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s', background: (productForm as any)._mode === opt.value || (!((productForm as any)._mode) && opt.value === 'existing') ? GREEN : 'transparent', color: (productForm as any)._mode === opt.value || (!((productForm as any)._mode) && opt.value === 'existing') ? '#fff' : 'var(--dax-text-muted)' }}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Seleccionar existente */}
                            {(!((productForm as any)._mode) || (productForm as any)._mode === 'existing') && (
                                <div>
                                    <Label>Selecciona del catálogo</Label>
                                    <select className="dax-input" value={productForm.productId} onChange={e => setProductForm(p => ({ ...p, productId: e.target.value }))}>
                                        <option value="">Selecciona producto...</option>
                                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} {p.category ? `— ${p.category}` : ''}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Crear nuevo */}
                            {(productForm as any)._mode === 'new' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 600, color: GREEN, letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>Datos del producto nuevo</p>
                                    <div>
                                        <Label>Nombre del producto</Label>
                                        <input className="dax-input" value={(productForm as any)._newName ?? ''} onChange={e => setProductForm(p => ({ ...p, _newName: e.target.value } as any))} placeholder="Ej: Tomate cherry, Aguacate hass..." />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <Label optional>SKU / Código</Label>
                                            <input className="dax-input" value={(productForm as any)._newSku ?? ''} onChange={e => setProductForm(p => ({ ...p, _newSku: e.target.value } as any))} placeholder="VEG-001" />
                                        </div>
                                        <div>
                                            <Label>Precio de venta</Label>
                                            <input className="dax-input" type="number" min="0" step="0.01" value={(productForm as any)._newPrice ?? productForm.pricePerUnit} onChange={e => setProductForm(p => ({ ...p, _newPrice: parseFloat(e.target.value) || 0, pricePerUnit: parseFloat(e.target.value) || 0 } as any))} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', margin: 0 }}>
                                        Se creará automáticamente en el catálogo general y se registrará en verdulería.
                                    </p>
                                </div>
                            )}

                            {/* Separador */}
                            <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '14px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: GREEN, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                                    Parámetros de verdulería
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label>Sección</Label>
                                    <select className="dax-input" value={productForm.section} onChange={e => setProductForm(p => ({ ...p, section: e.target.value }))}>
                                        {SECTIONS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div><Label>Unidad de venta</Label>
                                    <select className="dax-input" value={productForm.weightUnit} onChange={e => setProductForm(p => ({ ...p, weightUnit: e.target.value }))}>
                                        {WEIGHT_UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label>Precio por unidad</Label>
                                    <input className="dax-input" type="number" min="0" step="0.01" value={productForm.pricePerUnit} onChange={e => setProductForm(p => ({ ...p, pricePerUnit: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div><Label>Vida útil (días)</Label>
                                    <input className="dax-input" type="number" min="1" value={productForm.shelfLifeDays} onChange={e => setProductForm(p => ({ ...p, shelfLifeDays: parseInt(e.target.value) || 7 }))} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Temp. mínima (°C)</Label><input className="dax-input" type="number" step="0.5" value={productForm.minTemperature} onChange={e => setProductForm(p => ({ ...p, minTemperature: e.target.value }))} placeholder="Ej: 2" /></div>
                                <div><Label optional>Temp. máxima (°C)</Label><input className="dax-input" type="number" step="0.5" value={productForm.maxTemperature} onChange={e => setProductForm(p => ({ ...p, maxTemperature: e.target.value }))} placeholder="Ej: 8" /></div>
                            </div>

                            <div><Label optional>Origen / Región</Label>
                                <input className="dax-input" value={productForm.origin} onChange={e => setProductForm(p => ({ ...p, origin: e.target.value }))} placeholder="Ej: Valle Central, CR" />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                                <input type="checkbox" id="seasonal" checked={productForm.seasonal} onChange={e => setProductForm(p => ({ ...p, seasonal: e.target.checked }))} style={{ accentColor: GREEN }} />
                                <label htmlFor="seasonal" style={{ fontSize: '13px', color: 'var(--dax-text-secondary)', cursor: 'pointer' }}>Producto de temporada</label>
                            </div>

                            {productForm.seasonal && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><Label>Mes inicio</Label>
                                        <select className="dax-input" value={productForm.seasonStart} onChange={e => setProductForm(p => ({ ...p, seasonStart: e.target.value }))}>
                                            <option value="">Selecciona...</option>
                                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div><Label>Mes fin</Label>
                                        <select className="dax-input" value={productForm.seasonEnd} onChange={e => setProductForm(p => ({ ...p, seasonEnd: e.target.value }))}>
                                            <option value="">Selecciona...</option>
                                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowProductModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button
                                    onClick={async () => {
                                        const mode = (productForm as any)._mode ?? 'existing';
                                        let finalProductId = productForm.productId;

                                        if (mode === 'new') {
                                            const newName = (productForm as any)._newName?.trim();
                                            if (!newName) return;
                                            try {
                                                const { data } = await api.post('/products', {
                                                    name: newName,
                                                    sku: (productForm as any)._newSku || undefined,
                                                    price: (productForm as any)._newPrice ?? productForm.pricePerUnit,
                                                    category: productForm.section,
                                                    active: true,
                                                });
                                                finalProductId = data.id;
                                                queryClient.invalidateQueries({ queryKey: ['products'] });
                                            } catch {
                                                return;
                                            }
                                        }

                                        if (!finalProductId) return;
                                        productMutation.mutate(finalProductId);
                                    }}
                                    disabled={productMutation.isPending || (
                                        ((productForm as any)._mode === 'new' || !(productForm as any)._mode === false)
                                            ? !(productForm as any)._newName
                                            : !productForm.productId
                                    )}
                                    className="dax-btn-primary"
                                    style={{ flex: 1, background: GREEN, borderColor: GREEN }}
                                >
                                    {productMutation.isPending ? 'Guardando...' : 'Registrar producto'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lote */}
            {showLotModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '520px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Registrar lote de cosecha</h2>
                            <button onClick={() => setShowLotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><Label>Producto</Label>
                                <select className="dax-input" value={lotForm.produceProductId} onChange={e => setLotForm(p => ({ ...p, produceProductId: e.target.value }))}>
                                    <option value="">Selecciona producto...</option>
                                    {produceProducts.map((pp: any) => <option key={pp.id} value={pp.id}>{pp.product?.name} ({pp.section})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label>Código de lote</Label><input className="dax-input" value={lotForm.lotCode} onChange={e => setLotForm(p => ({ ...p, lotCode: e.target.value }))} placeholder="Ej: LOT-2026-001" /></div>
                                <div><Label>Proveedor</Label>
                                    <select className="dax-input" value={lotForm.supplierId} onChange={e => setLotForm(p => ({ ...p, supplierId: e.target.value }))}>
                                        <option value="">Sin proveedor</option>
                                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label>Cantidad</Label><input className="dax-input" type="number" min="0.01" step="0.01" value={lotForm.quantity} onChange={e => setLotForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))} /></div>
                                <div><Label>Unidad</Label>
                                    <select className="dax-input" value={lotForm.weightUnit} onChange={e => setLotForm(p => ({ ...p, weightUnit: e.target.value }))}>
                                        {WEIGHT_UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Costo unitario</Label><input className="dax-input" type="number" min="0" step="0.01" value={lotForm.unitCost} onChange={e => setLotForm(p => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))} /></div>
                                <div><Label optional>Temperatura (°C)</Label><input className="dax-input" type="number" step="0.1" value={lotForm.temperature} onChange={e => setLotForm(p => ({ ...p, temperature: e.target.value }))} placeholder="Ej: 4" /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Fecha de cosecha</Label><input className="dax-input" type="date" value={lotForm.harvestDate} onChange={e => setLotForm(p => ({ ...p, harvestDate: e.target.value }))} /></div>
                                <div><Label optional>Fecha de vencimiento</Label><input className="dax-input" type="date" value={lotForm.expirationDate} onChange={e => setLotForm(p => ({ ...p, expirationDate: e.target.value }))} /></div>
                            </div>
                            <div><Label optional>Origen</Label><input className="dax-input" value={lotForm.origin} onChange={e => setLotForm(p => ({ ...p, origin: e.target.value }))} placeholder="Finca / Región de origen" /></div>
                            <div><Label optional>Notas</Label><input className="dax-input" value={lotForm.notes} onChange={e => setLotForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones..." /></div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowLotModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={() => lotMutation.mutate()} disabled={lotMutation.isPending || !lotForm.produceProductId || !lotForm.lotCode} className="dax-btn-primary" style={{ flex: 1 }}>
                                    {lotMutation.isPending ? 'Guardando...' : 'Registrar lote'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Merma */}
            {showWasteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Registrar merma</h2>
                            <button onClick={() => setShowWasteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><Label optional>Lote afectado</Label>
                                <select className="dax-input" value={wasteForm.harvestLotId} onChange={e => setWasteForm(p => ({ ...p, harvestLotId: e.target.value }))}>
                                    <option value="">Sin lote específico</option>
                                    {lots.filter((l: any) => l.freshnessStatus !== 'expired').map((l: any) => (
                                        <option key={l.id} value={l.id}>{l.produceProduct?.product?.name} — {l.lotCode}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label>Cantidad</Label><input className="dax-input" type="number" min="0.01" step="0.01" value={wasteForm.quantity} onChange={e => setWasteForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))} /></div>
                                <div><Label>Unidad</Label>
                                    <select className="dax-input" value={wasteForm.weightUnit} onChange={e => setWasteForm(p => ({ ...p, weightUnit: e.target.value }))}>
                                        {WEIGHT_UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div><Label>Causa</Label>
                                <select className="dax-input" value={wasteForm.reason} onChange={e => setWasteForm(p => ({ ...p, reason: e.target.value }))}>
                                    <option value="">Selecciona causa...</option>
                                    {WASTE_REASONS.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Costo estimado</Label><input className="dax-input" type="number" min="0" step="0.01" value={wasteForm.cost} onChange={e => setWasteForm(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} /></div>
                                <div><Label optional>Reportado por</Label><input className="dax-input" value={wasteForm.reportedBy} onChange={e => setWasteForm(p => ({ ...p, reportedBy: e.target.value }))} placeholder="Nombre" /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowWasteModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={() => wasteMutation.mutate()} disabled={wasteMutation.isPending || !wasteForm.reason} className="dax-btn-primary" style={{ flex: 1 }}>
                                    {wasteMutation.isPending ? 'Guardando...' : 'Registrar merma'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Sección */}
            {showSectionModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva sección de almacenaje</h2>
                            <button onClick={() => setShowSectionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><Label>Nombre de la sección</Label><input className="dax-input" value={sectionForm.name} onChange={e => setSectionForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Cámara de frutas, Refrigerador #1..." /></div>
                            <div><Label optional>Descripción</Label><input className="dax-input" value={sectionForm.description} onChange={e => setSectionForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción breve..." /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Temperatura (°C)</Label><input className="dax-input" type="number" step="0.5" value={sectionForm.temperature} onChange={e => setSectionForm(p => ({ ...p, temperature: e.target.value }))} placeholder="Ej: 4" /></div>
                                <div><Label optional>Humedad (%)</Label><input className="dax-input" type="number" min="0" max="100" value={sectionForm.humidity} onChange={e => setSectionForm(p => ({ ...p, humidity: e.target.value }))} placeholder="Ej: 85" /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Capacidad</Label><input className="dax-input" type="number" min="0" step="0.1" value={sectionForm.capacity} onChange={e => setSectionForm(p => ({ ...p, capacity: e.target.value }))} /></div>
                                <div><Label>Unidad</Label>
                                    <select className="dax-input" value={sectionForm.unit} onChange={e => setSectionForm(p => ({ ...p, unit: e.target.value }))}>
                                        {WEIGHT_UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowSectionModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={() => sectionMutation.mutate()} disabled={sectionMutation.isPending || !sectionForm.name} className="dax-btn-primary" style={{ flex: 1 }}>
                                    {sectionMutation.isPending ? 'Guardando...' : 'Crear sección'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Proveedor */}
            {showSupplierModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo proveedor / finca</h2>
                            <button onClick={() => setShowSupplierModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><Label>Nombre</Label><input className="dax-input" value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} placeholder="Finca El Paraíso, Distribuidora Verde..." /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Contacto</Label><input className="dax-input" value={supplierForm.contactName} onChange={e => setSupplierForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Nombre del contacto" /></div>
                                <div><Label optional>Teléfono</Label><input className="dax-input" value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} placeholder="+506 8888-9999" /></div>
                            </div>
                            <div><Label optional>Correo</Label><input className="dax-input" type="email" value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} placeholder="finca@proveedor.com" /></div>
                            <div><Label optional>Dirección / Ubicación</Label><input className="dax-input" value={supplierForm.address} onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))} placeholder="Cartago, Tres Ríos..." /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><Label optional>Cédula jurídica</Label><input className="dax-input" value={supplierForm.taxId} onChange={e => setSupplierForm(p => ({ ...p, taxId: e.target.value }))} /></div>
                                <div><Label optional>Términos de pago</Label>
                                    <select className="dax-input" value={supplierForm.paymentTerms} onChange={e => setSupplierForm(p => ({ ...p, paymentTerms: e.target.value }))}>
                                        <option value="">Selecciona...</option>
                                        {['Contado', 'Crédito 8 días', 'Crédito 15 días', 'Crédito 30 días'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div><Label optional>Notas</Label><input className="dax-input" value={supplierForm.notes} onChange={e => setSupplierForm(p => ({ ...p, notes: e.target.value }))} placeholder="Productos que suministra, días de entrega..." /></div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowSupplierModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={() => supplierMutation.mutate()} disabled={supplierMutation.isPending || !supplierForm.name} className="dax-btn-primary" style={{ flex: 1 }}>
                                    {supplierMutation.isPending ? 'Guardando...' : 'Registrar proveedor'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cambio de precio */}
            {showPriceModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '380px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Cambiar precio</h2>
                            <button onClick={() => setShowPriceModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '12px 14px', marginBottom: '16px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{showPriceModal.product?.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                                Precio actual: <strong style={{ color: GREEN }}>{formatCurrency(Number(showPriceModal.pricePerUnit))}</strong> / {showPriceModal.weightUnit}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><Label>Nuevo precio</Label><input className="dax-input" type="number" min="0" step="0.01" value={priceForm.price} onChange={e => setPriceForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div>
                            <div><Label optional>Razón del cambio</Label>
                                <select className="dax-input" value={priceForm.reason} onChange={e => setPriceForm(p => ({ ...p, reason: e.target.value }))}>
                                    <option value="">Selecciona razón...</option>
                                    {['Temporada alta', 'Temporada baja', 'Alta demanda', 'Baja demanda', 'Ajuste de costos', 'Promoción', 'Otro'].map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowPriceModal(null)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={() => priceMutation.mutate()} disabled={priceMutation.isPending || !priceForm.price} className="dax-btn-primary" style={{ flex: 1, background: GREEN, borderColor: GREEN }}>
                                    {priceMutation.isPending ? 'Guardando...' : 'Actualizar precio'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Temperatura */}
            {showTempModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '360px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Registrar temperatura</h2>
                            <button onClick={() => setShowTempModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '12px 14px', marginBottom: '16px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
                                {showTempModal.produceProduct?.product?.name} — Lote {showTempModal.lotCode}
                            </p>
                            {showTempModal.produceProduct?.minTemperature && (
                                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                                    Rango ideal: {Number(showTempModal.produceProduct.minTemperature)}°C — {Number(showTempModal.produceProduct.maxTemperature)}°C
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <Label>Temperatura actual (°C)</Label>
                                <input className="dax-input" type="number" step="0.1" value={tempForm.temperature} onChange={e => setTempForm({ temperature: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowTempModal(null)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button onClick={() => tempMutation.mutate()} disabled={tempMutation.isPending} className="dax-btn-primary" style={{ flex: 1 }}>
                                    {tempMutation.isPending ? 'Guardando...' : 'Registrar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
