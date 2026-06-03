'use client';
import { useState } from 'react';

export function NameModal({ onSave, onClose }: { onSave: (name: string) => void; onClose?: () => void }) {
  const [v, setV] = useState('');
  return (
    <div className="df-win" role="dialog" aria-label="Nhập tên" style={{ zIndex: 71 }}>
      <div className="df-win-card" style={{ minWidth: 270 }}>
        <p className="df-title" style={{ fontSize: 20, margin: '0 0 4px' }}>Tên của bạn</p>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '0 0 12px' }}>Hiển thị trên bảng xếp hạng (nhập một lần).</p>
        <input
          className="df-input"
          maxLength={20}
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="VD: Cường"
          autoFocus
        />
        <button className="df-btn df-cta" style={{ width: '100%', marginTop: 12 }} disabled={!v.trim()} onClick={() => onSave(v.trim())}>
          Lưu
        </button>
        {onClose && (
          <button className="df-btn" style={{ width: '100%', marginTop: 8 }} onClick={onClose}>Để sau</button>
        )}
      </div>
    </div>
  );
}
