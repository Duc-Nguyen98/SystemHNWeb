'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Match the approved recipient search: a 44px submit target, never over the text.
// Callers retain their own query timing, URL state and clearing behavior.
export function MasterDataSearch({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  onSubmit,
  onClear,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  maxLength?: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <form
      className="hn-list-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div>
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="submit"
          variant="ghost"
          className="hn-list-search-submit"
          aria-label={label}
        >
          <Search aria-hidden="true" />
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            className="hn-list-search-clear"
            aria-label={`Xóa tìm kiếm ${label.replace('Tìm mã / tên ', '')}`}
            onClick={onClear}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
    </form>
  );
}
