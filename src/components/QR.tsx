'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QR({ text, size = 220, className }: { text: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size * 2, color: { dark: '#1b1230', light: '#ffffff' } }).then(setSrc).catch(() => setSrc(''));
  }, [text, size]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="QR-code" className={className} style={{ width: size, height: size, borderRadius: 12, background: '#fff' }} /> : <div style={{ width: size, height: size }} />;
}
