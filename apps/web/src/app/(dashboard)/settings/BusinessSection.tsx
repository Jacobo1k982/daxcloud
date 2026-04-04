'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import {
    Building2, ChefHat, Pill, Scissors,
    Shirt, Leaf, Utensils, ShoppingCart, Package, Check,
} from 'lucide-react';

const INDUSTRIES = [
    { value: 'general', emoji: '🏪', label: 'Tienda General', desc: 'Retail, kiosko', icon: Package, color: '#FF5C35', price: 0 },
    { value: 'restaurant', emoji: '🍽️', label: 'Restaurante', desc: 'Comidas, bar', icon: Utensils, color: '#F97316', price: 22 },
    { value: 'bakery', emoji: '🥖', label: 'Panadería', desc: 'Pan, pasteles', icon: ChefHat, color: '#FF5C35', price: 22 },
    { value: 'pharmacy', emoji: '💊', label: 'Farmacia', desc: 'Medicamentos', icon: Pill, color: '#5AAAF0', price: 22 },
    { value: 'salon', emoji: '✂️', label: 'Peluquería', desc: 'Estética, spa', icon: Scissors, color: '#A78BFA', price: 22 },
    { value: 'clothing', emoji: '👗', label: 'Ropa', desc: 'Moda, calzado', icon: Shirt, color: '#EAB308', price: 22 },
    { value: 'produce', emoji: '🥦', label: 'Verdulería', desc: 'Frutas, verduras', icon: Leaf, color: '#22C55E', price: 22 },
    { value: 'supermarket', emoji: '🛒', label: 'Supermercado', desc: 'Abarrotes, bodega', icon: ShoppingCart, color: '#5AAAF0', price: 22 },
];

const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{
        display: 'block', fontSize: '11px', fontWeight: 600,
        letterSpacing: '.08em', textTransform: 'uppercase',
        color: 'var(--dax-text-muted)', marginBottom: '8px',
    }}>
        {children}
    </label>
);

export function BusinessSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
    const { tenant, industry: currentIndustry } = useAuth();
    const { setAuth, token, user, features } = useAuthStore();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        name: tenant?.name ?? '',
        industry: currentIndustry ?? 'general',
    });
    const [hovered, setHovered] = useState('');
    const [confirmIndustry, setConfirmIndustry] = useState(false);
    const [pendingIndustry, setPendingIndustry] = useState('');

    const { data: tenantData } = useQuery({
        queryKey: ['tenant-me'],
        queryFn: async () => { const { data } = await api.get('/tenants/me'); return data; },
    });

    useEffect(() => {
        if (!tenantData) return;
        setForm(p => ({
            ...p,
            name: tenantData.name ?? p.name,
            industry: tenantData.industry ?? p.industry,
        }));
    }, [tenantData]);

    const updateMutation = useMutation({
        mutationFn: async (payload: { name?: string; industry?: string }) =>
            api.put('/tenants/me/profile', payload),
        onSuccess: (res, variables) => {
            // Actualiza el store con la nueva industria
            if (variables.industry && token && user && features) {
                setAuth(token, user, {
                    ...tenant!,
                    industry: variables.industry,
                }, features);
            }
            queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
            showToast('Datos del negocio actualizados');
            setConfirmIndustry(false);
            setPendingIndustry('');
        },
        onError: (err: any) => {
            showToast(err.response?.data?.message ?? 'Error al guardar', 'error');
        },
    });

    const handleIndustryClick = (value: string) => {
        if (value === form.industry) return;
        // Si ya tiene datos (ventas, productos), pide confirmación
        setPendingIndustry(value);
        setConfirmIndustry(true);
    };

    const confirmChange = () => {
        setForm(p => ({ ...p, industry: pendingIndustry }));
        updateMutation.mutate({ industry: pendingIndustry });
    };

    const handleSaveName = () => {
        if (!form.name.trim()) return showToast('El nombre no puede estar vacío', 'error');
        updateMutation.mutate({ name: form.name });
    };

    const selectedInd = INDUSTRIES.find(i => i.value === form.industry);

    return (
        <div style={{ maxWidth: '620px' }}>

            {/* ── Nombre del negocio ── */}
            <div style={{ marginBottom: '28px' }}>
                <Label>Nombre del negocio</Label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        className="dax-input"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Mi Tienda"
                        style={{ flex: 1, margin: 0 }}
                    />
                    <button
                        onClick={handleSaveName}
                        disabled={updateMutation.isPending || form.name === tenant?.name}
                        className="dax-btn-primary"
                        style={{ flexShrink: 0, fontSize: '13px', padding: '10px 18px' }}
                    >
                        {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* ── ID del tenant ── */}
            <div style={{ marginBottom: '28px' }}>
                <Label>ID del negocio</Label>
                <input
                    className="dax-input"
                    value={tenant?.slug ?? ''}
                    disabled
                    style={{ margin: 0, opacity: .5, cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '5px' }}>
                    El ID no se puede cambiar — es el identificador único de tu negocio.
                </p>
            </div>

            {/* ── Industria ── */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <Label>Tipo de industria</Label>
                    {selectedInd && (
                        <span style={{
                            fontSize: '10px', fontWeight: 700,
                            color: selectedInd.color,
                            background: `${selectedInd.color}15`,
                            border: `1px solid ${selectedInd.color}30`,
                            padding: '2px 8px', borderRadius: '6px',
                            letterSpacing: '.04em',
                            marginBottom: '8px',
                        }}>
                            {selectedInd.emoji} {selectedInd.label}
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px',
                }}>
                    {INDUSTRIES.map((ind, i) => {
                        const selected = form.industry === ind.value;
                        const isHov = hovered === ind.value;

                        return (
                            <button
                                key={ind.value}
                                type="button"
                                onClick={() => handleIndustryClick(ind.value)}
                                onMouseEnter={() => setHovered(ind.value)}
                                onMouseLeave={() => setHovered('')}
                                style={{
                                    padding: '12px 8px',
                                    borderRadius: '12px',
                                    border: `1.5px solid ${selected ? ind.color : isHov ? 'var(--dax-navy-400)' : 'var(--dax-border)'}`,
                                    background: selected ? `${ind.color}10` : isHov ? 'var(--dax-surface-2)' : 'var(--dax-surface)',
                                    cursor: selected ? 'default' : 'pointer',
                                    textAlign: 'center',
                                    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
                                    transform: selected ? 'scale(1.03)' : isHov ? 'scale(1.01)' : 'scale(1)',
                                    boxShadow: selected ? `0 0 0 1px ${ind.color}30, 0 4px 12px ${ind.color}15` : 'none',
                                    position: 'relative',
                                    animation: `industryIn .3s ease both`,
                                    animationDelay: `${i * 35}ms`,
                                }}
                            >
                                {/* Check si está seleccionada */}
                                {selected && (
                                    <div style={{
                                        position: 'absolute', top: '6px', right: '6px',
                                        width: '14px', height: '14px', borderRadius: '50%',
                                        background: ind.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Check size={8} color="#fff" strokeWidth={3} />
                                    </div>
                                )}

                                {/* Badge de precio si tiene costo y no es la actual */}
                                {ind.price > 0 && !selected && (
                                    <div style={{
                                        position: 'absolute', top: '5px', left: '5px',
                                        fontSize: '8px', fontWeight: 700,
                                        color: '#F0A030',
                                        background: 'rgba(240,160,48,.12)',
                                        border: '1px solid rgba(240,160,48,.25)',
                                        padding: '1px 5px', borderRadius: '4px',
                                        letterSpacing: '.02em',
                                    }}>
                                        +$22
                                    </div>
                                )}

                                {/* Gratis badge */}
                                {ind.price === 0 && !selected && (
                                    <div style={{
                                        position: 'absolute', top: '5px', left: '5px',
                                        fontSize: '8px', fontWeight: 700,
                                        color: 'var(--dax-success)',
                                        background: 'var(--dax-success-bg)',
                                        padding: '1px 5px', borderRadius: '4px',
                                    }}>
                                        Gratis
                                    </div>
                                )}

                                <div style={{ fontSize: '22px', marginBottom: '5px', lineHeight: 1, marginTop: '6px' }}>{ind.emoji}</div>
                                <p style={{
                                    fontSize: '11px', fontWeight: 700,
                                    color: selected ? ind.color : 'var(--dax-text-primary)',
                                    marginBottom: '2px', lineHeight: 1.2,
                                }}>
                                    {ind.label}
                                </p>
                                <p style={{ fontSize: '9px', color: selected ? `${ind.color}90` : 'var(--dax-text-muted)', lineHeight: 1.3 }}>
                                    {ind.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '10px' }}>
                    Cambia la industria para adaptar el POS, módulos y flujos a tu tipo de negocio.
                </p>
            </div>

            {/* ── Info adicional ── */}
            <div style={{
                padding: '16px',
                background: 'var(--dax-surface-2)',
                borderRadius: 'var(--dax-radius-md)',
                border: '1px solid var(--dax-border)',
                display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
                {[
                    { label: 'Plan actual', value: tenant?.plan ?? 'starter' },
                    { label: 'País', value: tenant?.country ?? '—' },
                    { label: 'Moneda', value: tenant?.currency ?? '—' },
                    { label: 'ID de empresa', value: tenant?.slug ?? '—' },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)', textTransform: item.label === 'Plan actual' ? 'capitalize' : 'none' }}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Modal confirmación de cambio de industria ── */}
            {confirmIndustry && typeof window !== 'undefined' && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px',
                }}>
                    <div className="dax-card" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>

                        {/* Ícono */}
                        {(() => {
                            const pendingInd = INDUSTRIES.find(i => i.value === pendingIndustry);
                            const currentInd = INDUSTRIES.find(i => i.value === form.industry);
                            const willCharge = (pendingInd?.price ?? 0) > 0;
                            const planBase = tenantData?.subscription?.plan?.priceMonthly ?? 29;
                            const planName = tenantData?.subscription?.plan?.displayName ?? 'Starter';

                            return (
                                <>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '14px',
                                        background: willCharge ? 'rgba(255,92,53,.1)' : 'rgba(61,191,127,.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 20px', fontSize: '24px',
                                    }}>
                                        {pendingInd?.emoji}
                                    </div>

                                    <h3 style={{ fontSize: '17px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>
                                        Cambiar a {pendingInd?.label}
                                    </h3>

                                    <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
                                        {currentInd?.label} → {pendingInd?.label}
                                    </p>

                                    {/* Desglose de cobro */}
                                    {willCharge ? (
                                        <div style={{
                                            background: 'var(--dax-surface-2)',
                                            borderRadius: 'var(--dax-radius-md)',
                                            padding: '16px',
                                            marginBottom: '20px',
                                            border: '1px solid var(--dax-border)',
                                        }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '12px' }}>
                                                Resumen de facturación
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>Plan {planName}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>${planBase}/mes</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>
                                                        Módulo {pendingInd?.label}
                                                    </span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0A030' }}>+$22/mes</span>
                                                </div>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    paddingTop: '10px',
                                                    borderTop: '1px solid var(--dax-border)',
                                                    marginTop: '4px',
                                                }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Total mensual</span>
                                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#FF5C35' }}>${planBase + 22}/mes</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'var(--dax-success-bg)',
                                            border: '1px solid rgba(61,191,127,.2)',
                                            borderRadius: 'var(--dax-radius-md)',
                                            padding: '14px 16px',
                                            marginBottom: '20px',
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                        }}>
                                            <Check size={16} color="var(--dax-success)" />
                                            <p style={{ fontSize: '13px', color: 'var(--dax-success)', fontWeight: 600 }}>
                                                Tienda General está incluida en tu plan — sin costo adicional.
                                            </p>
                                        </div>
                                    )}

                                    {/* Nota */}
                                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
                                        {willCharge
                                            ? 'El módulo se activará inmediatamente. El cobro se aplica en tu próximo ciclo de facturación.'
                                            : 'Tus datos existentes no se eliminan al cambiar de industria.'
                                        }
                                    </p>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => { setConfirmIndustry(false); setPendingIndustry(''); }}
                                            className="dax-btn-secondary"
                                            style={{ flex: 1 }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmChange}
                                            disabled={updateMutation.isPending}
                                            className="dax-btn-primary"
                                            style={{ flex: 1 }}
                                        >
                                            {updateMutation.isPending
                                                ? 'Activando...'
                                                : willCharge
                                                    ? `Activar · $${planBase + 22}/mes`
                                                    : 'Confirmar cambio'
                                            }
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}

            <style>{`
        @keyframes industryIn {
          from { opacity: 0; transform: scale(.94) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </div>
    );
}