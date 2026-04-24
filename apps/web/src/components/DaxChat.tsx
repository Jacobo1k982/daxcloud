'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function DaxChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy **Dax**, tu asistente de DaxCloud 👋\n\n¿En qué puedo ayudarte hoy? Puedo contarte sobre nuestros planes, funciones o cómo DaxCloud puede transformar tu negocio.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error de conexión. Por favor intenta de nuevo en unos segundos.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Renderizar markdown básico
  const renderText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const QUICK = ['¿Cuánto cuesta?', '¿Funciona para restaurantes?', '¿Hay prueba gratis?', '¿Qué es SINPE?'];

  return (
    <>
      {/* ── Botón flotante ── */}
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9998 }}>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(255,92,53,0.45)',
              transition: 'all .25s',
              animation: 'chatPulse 3s ease-in-out infinite',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <MessageCircle size={26} color="#fff" />
          </button>
        )}
      </div>

      {/* ── Ventana de chat ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
          width: 'clamp(320px, 90vw, 400px)',
          height: 'clamp(480px, 70vh, 580px)',
          background: 'rgba(6,13,22,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,92,53,0.2)',
          borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          animation: 'chatOpen .3s cubic-bezier(.22,1,.36,1)',
          fontFamily: "'Inter','Outfit',system-ui,sans-serif",
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,92,53,0.1)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--dax-coral-soft)', flexShrink: 0 }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 12px rgba(255,92,53,0.35)' }}>
              <Bot size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', margin: 0, lineHeight: 1.2 }}>Dax</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3DBF7F', animation: 'blink 2s infinite' }} />
                <span style={{ fontSize: '11px', color: 'var(--dax-white-35)' }}>Asistente IA · en línea</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-white-35)', padding: '6px', borderRadius: '8px', display: 'flex', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--dax-coral-border)'; (e.currentTarget as HTMLElement).style.color = '#FF5C35'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--dax-surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-white-35)'; }}>
              <X size={16} />
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,92,53,0.2) transparent' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '2px' }}>
                    <Bot size={13} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg,#FF5C35,#FF3D1F)'
                    : 'var(--dax-surface-2)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  fontSize: '13px',
                  lineHeight: 1.65,
                  color: msg.role === 'user' ? '#fff' : 'rgba(240,244,255,0.88)',
                  boxShadow: msg.role === 'user' ? '0 2px 12px rgba(255,92,53,0.25)' : 'none',
                }}
                  dangerouslySetInnerHTML={{ __html: renderText(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={13} color="#fff" />
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--dax-surface-2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', animation: `typingDot .9s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick replies — solo al inicio */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {QUICK.map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 50); }}
                    style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,92,53,0.25)', background: 'var(--dax-coral-soft)', color: 'rgba(255,92,53,0.8)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--dax-coral-border)'; (e.currentTarget as HTMLElement).style.color = '#FF5C35'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--dax-coral-soft)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,92,53,0.8)'; }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--dax-surface-2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', color: 'var(--dax-text-primary)',
                fontSize: '13px', fontFamily: 'inherit',
                outline: 'none', transition: 'all .2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,92,53,0.4)'; e.target.style.background = 'var(--dax-coral-soft)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--dax-surface-3)'; e.target.style.background = 'var(--dax-surface-2)'; }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: '38px', height: '38px', borderRadius: '11px', border: 'none',
                background: input.trim() && !loading ? 'linear-gradient(135deg,#FF5C35,#FF3D1F)' : 'var(--dax-surface-2)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all .2s',
                boxShadow: input.trim() && !loading ? '0 2px 12px rgba(255,92,53,0.3)' : 'none',
              }}>
              {loading
                ? <Loader2 size={15} color="rgba(255,255,255,0.4)" style={{ animation: 'spin .7s linear infinite' }} />
                : <Send size={15} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.25)'} />
              }
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPulse { 0%,100%{box-shadow:0 4px 24px rgba(255,92,53,0.45)} 50%{box-shadow:0 4px 32px rgba(255,92,53,0.65),0 0 0 8px rgba(255,92,53,0.1)} }
        @keyframes chatOpen { from{opacity:0;transform:scale(.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes typingDot { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
      `}</style>
    </>
  );
}



