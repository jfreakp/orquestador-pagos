import { QrCodeService } from './qr-code.service';

describe('QrCodeService', () => {
  it('generates a base64 PNG data URL for the given text', async () => {
    const service = new QrCodeService();

    const dataUrl = await service.generateBase64('https://example.com/pay/abc');

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('does not persist anything (pure function of its input)', async () => {
    const service = new QrCodeService();

    const first = await service.generateBase64('same-text');
    const second = await service.generateBase64('same-text');

    expect(first).toBe(second);
  });
});
