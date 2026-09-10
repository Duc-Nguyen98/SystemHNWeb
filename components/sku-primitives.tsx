'use client';
import type { ReactNode } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
export function SkuSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="hn-sku-select">
      <label htmlFor={id}>{label}</label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) onChange(String(v));
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue>
            {options.find((o) => o.value === value)?.label || 'Chưa chọn'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="hn-sku-options" alignItemWithTrigger={false}>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function SkuNotice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warning' | 'error' | 'success';
}) {
  return (
    <div
      className={`hn-sku-notice ${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {tone === 'success' ? <CheckCircle2 /> : <ShieldAlert />}
      <div>{children}</div>
    </div>
  );
}
export function SkuBadge({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'green' | 'purple' | 'amber';
}) {
  return <span className={`hn-sku-badge ${tone}`}>{children}</span>;
}
