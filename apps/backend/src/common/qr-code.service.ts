import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  async generateBase64(text: string): Promise<string> {
    return QRCode.toDataURL(text);
  }
}
