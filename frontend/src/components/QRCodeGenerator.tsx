import React from 'react';

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
}

export default function QRCodeGenerator({ data, size = 200 }: QRCodeGeneratorProps) {
  const encodedData = encodeURIComponent(data);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&color=059669&bgcolor=ffffff`;

  return (
    <div className="bg-white p-4 rounded-3xl border-4 border-emerald-50 shadow-inner inline-block">
      <img src={url} alt="QR Code" width={size} height={size} className="rounded-xl" />
    </div>
  );
}