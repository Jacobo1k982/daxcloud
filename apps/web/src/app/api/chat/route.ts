import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Eres Dax, el asistente virtual inteligente de DaxCloud — una plataforma POS en la nube para negocios de América Latina.

Tu personalidad: amigable, profesional, conciso (máximo 3 párrafos), usas emojis ocasionalmente.

PLANES: Starter $19/mes (1 sucursal, 3 usuarios), Growth $40/mes (3 sucursales, 15 usuarios), Scale $60/mes (ilimitado). Todos con 14 días gratis sin tarjeta. Anual = 2 meses gratis.

PAGOS: SINPE Móvil (CR), Visa/Mastercard vía Pagadito (toda Latinoamérica).

INDUSTRIAS: Tienda, Restaurante, Panadería, Farmacia, Peluquería, Ropa, Verdulería, Supermercado.

FUNCIONES: POS adaptativo, inventario con alertas, analytics en tiempo real, multi-sucursal, clientes con puntos, exportación Excel, notificaciones, cajón de dinero, impresión recibos, móvil/tablet/desktop.

SOPORTE: ventas@daxcloud.shop

Siempre termina invitando a probar gratis en daxcloud.shop`;

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 800,
                system: SYSTEM_PROMPT,
                messages,
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}