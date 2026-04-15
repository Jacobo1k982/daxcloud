'use client';
import { useCallback } from 'react';

/**
 * useCashDrawer
 *
 * Abre el cajón de la caja registradora al completar una venta.
 *
 * Métodos soportados (en orden de prioridad):
 * 1. Web Serial API — impresora ESC/POS conectada por USB/Serial
 * 2. window.print con iframe oculto — para impresoras de red que abren cajón al imprimir
 * 3. Puerto serial directo si el cajón está conectado a COM/ttyUSB
 */
export function useCashDrawer() {

  // ── Método 1: Web Serial API (Chrome 89+, Edge 89+) ──────────────────────
  const openViaSerial = useCallback(async (): Promise<boolean> => {
    if (!('serial' in navigator)) return false;
    try {
      // Comando ESC/POS para abrir cajón: ESC p m t1 t2
      // m=0: pin 2, t1=25 (on time), t2=250 (off time)
      const openDrawerCmd = new Uint8Array([
        0x1B, 0x70, 0x00, 0x19, 0xFA,  // pin 2
      ]);

      // Intenta usar un puerto ya autorizado (sin pedir permiso de nuevo)
      const ports = await (navigator as any).serial.getPorts();
      if (ports.length === 0) return false;

      const port = ports[0];
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      await writer.write(openDrawerCmd);
      writer.releaseLock();
      await port.close();
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Método 2: Print iframe oculto (impresoras de red ESC/POS) ────────────
  const openViaPrint = useCallback((): boolean => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!doc) return false;

      // Escribe el comando como texto — algunas impresoras lo interpretan
      doc.open();
      doc.write(`<html><body>
        <script>
          // ESC/POS open drawer command
          var cmd = '\\x1B\\x70\\x00\\x19\\xFA';
          document.write(cmd);
          setTimeout(function(){ window.print(); }, 100);
        <\/script>
      </body></html>`);
      doc.close();

      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 2000);

      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Método 3: Fetch a endpoint local de impresora (CUPS / QZ Tray) ───────
  const openViaLocalEndpoint = useCallback(async (): Promise<boolean> => {
    try {
      // QZ Tray corre en localhost:8181 por defecto
      const cmd = btoa('\x1B\x70\x00\x19\xFA');
      const res = await fetch('http://localhost:8181/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cmd, encoding: 'base64' }),
        signal: AbortSignal.timeout(1000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // ── API principal: intenta todos los métodos ──────────────────────────────
  const openDrawer = useCallback(async () => {
    // Intenta Serial primero (más directo)
    const serialOk = await openViaSerial();
    if (serialOk) return;

    // Intenta endpoint local (QZ Tray, etc.)
    const localOk = await openViaLocalEndpoint();
    if (localOk) return;

    // Fallback: print iframe
    openViaPrint();
  }, [openViaSerial, openViaLocalEndpoint, openViaPrint]);

  // ── Solicitar permiso de puerto serial (llamar desde Settings) ──────────
  const requestSerialPermission = useCallback(async (): Promise<boolean> => {
    if (!('serial' in navigator)) return false;
    try {
      await (navigator as any).serial.requestPort();
      return true;
    } catch {
      return false;
    }
  }, []);

  const isSupported = typeof window !== 'undefined' && (
    'serial' in navigator ||
    typeof window.print === 'function'
  );

  return {
    openDrawer,
    requestSerialPermission,
    isSupported,
  };
}
