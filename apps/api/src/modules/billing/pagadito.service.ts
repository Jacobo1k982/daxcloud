import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PagaditoTransDetail {
  quantity:    number;
  description: string;
  price:       number;
  url_product: string;
}

export interface PagaditoStatusResult {
  success:    boolean;
  status?:    'REGISTERED' | 'COMPLETED' | 'VERIFYING' | 'REVOKED' | 'FAILED' | 'CANCELED' | 'EXPIRED';
  reference?: string;
  dateTrans?: string;
  code?:      string;
  message?:   string;
}

@Injectable()
export class PagaditoService {
  private readonly logger = new Logger(PagaditoService.name);
  constructor(private config: ConfigService) {}

  private get uid():      string { return this.config.get<string>('PAGADITO_UID') ?? ''; }
  private get wsk():      string { return this.config.get<string>('PAGADITO_WSK') ?? ''; }
  private get isSandbox():boolean{ return (this.config.get<string>('PAGADITO_ENV') ?? 'sandbox') === 'sandbox'; }
  private get endpoint(): string {
    return this.isSandbox
      ? 'https://sandbox.pagadito.com/comercios/wspg/charges.php'
      : 'https://comercios.pagadito.com/wspg/charges.php';
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }

  private parseXml(xml: string): { code: string; message: string; value: any } {
    const get = (tag: string) => { const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim() : ''; };
    let value: any = get('value');
    try { if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) value = JSON.parse(value); } catch {}
    return { code: get('code'), message: get('message'), value };
  }

  private async soapCall(action: string, params: Record<string, string>): Promise<{ code: string; message: string; value: any }> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:wspg" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body>
    <ns1:${action}>${Object.entries(params).map(([k,v]) => `<${k} xsi:type="xsd:string">${this.escapeXml(v)}</${k}>`).join('')}</ns1:${action}>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

    try {
      const res  = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': `urn:ws#${action}` }, body });
      const text = await res.text();
      this.logger.debug(`SOAP ${action}: ${text.slice(0, 200)}`);
      return this.parseXml(text);
    } catch (e) {
      this.logger.error(`SOAP ${action} error: ${e}`);
      throw new BadRequestException(`Error de conexión con Pagadito`);
    }
  }

  async connect(): Promise<{ success: boolean; token?: string; code?: string; message?: string }> {
    if (!this.uid || !this.wsk) return { success: false, message: 'Credenciales Pagadito no configuradas' };
    const r = await this.soapCall('connect', { uid: this.uid, wsk: this.wsk, format_return: 'json' });
    if (r.code === 'PG1001') return { success: true, token: r.value as string, code: r.code };
    this.logger.warn(`connect failed: ${r.code} - ${r.message}`);
    return { success: false, code: r.code, message: r.message };
  }

  async execTrans(params: { token: string; ern: string; amount: number; details: PagaditoTransDetail[]; currency?: string }): Promise<{ success: boolean; url?: string; code?: string; message?: string }> {
    const details = JSON.stringify(params.details.map(d => ({ quantity: d.quantity, description: d.description, price: Number(d.price).toFixed(2), url_product: d.url_product })));
    const r = await this.soapCall('exec_trans', { token: params.token, ern: params.ern, amount: params.amount.toFixed(2), details, format_return: 'json', currency: params.currency ?? 'USD' });
    if (r.code === 'PG1002') return { success: true, url: r.value as string, code: r.code };
    this.logger.warn(`exec_trans failed: ${r.code} - ${r.message}`);
    return { success: false, code: r.code, message: r.message };
  }

  async getStatus(token: string, tokenTrans: string): Promise<PagaditoStatusResult> {
    const r = await this.soapCall('get_status', { token, token_trans: tokenTrans, format_return: 'json' });
    if (r.code === 'PG1003') {
      const val = typeof r.value === 'object' ? r.value as any : {};
      return { success: true, status: val.status, reference: val.reference, dateTrans: val.date_trans, code: r.code };
    }
    return { success: false, code: r.code, message: r.message };
  }

  async initiatePayment(params: { ern: string; amount: number; details: PagaditoTransDetail[]; currency?: string }): Promise<{ url: string; sessionToken: string }> {
    const conn = await this.connect();
    if (!conn.success || !conn.token) throw new BadRequestException(conn.message ?? 'No se pudo conectar con Pagadito');
    const trans = await this.execTrans({ token: conn.token, ern: params.ern, amount: params.amount, details: params.details, currency: params.currency });
    if (!trans.success || !trans.url) throw new BadRequestException(trans.message ?? 'No se pudo iniciar la transacción');
    return { url: trans.url, sessionToken: conn.token };
  }
}
