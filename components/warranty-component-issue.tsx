'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, ChevronRight, ScanLine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import './warranty-component-issue.css';

type IssueState = 'select' | 'scan' | 'review' | 'success';

const componentOptions = [
  { sku: 'HN-LK-001', name: 'Bộ lọc nhiên liệu', available: 12, tagged: true },
  { sku: 'HN-LK-002', name: 'Bugi máy cắt cỏ', available: 24, tagged: true },
  { sku: 'HN-LK-003', name: 'Bộ gioăng hộp số', available: 8, tagged: false },
];

export default function WarrantyComponentIssue({ warrantyId, onBack }: { warrantyId: string; onBack: () => void }) {
  const [state, setState] = useState<IssueState>('select');
  const [selected, setSelected] = useState(componentOptions[0].sku);
  const [qty, setQty] = useState('1');
  const [scanned, setScanned] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const item = useMemo(() => componentOptions.find((option) => option.sku === selected)!, [selected]);
  const total = scanned.length || Number(qty) || 0;

  if (state === 'success') return <section className="hn-component-screen"><div className="hn-component-result"><span className="hn-result-icon"><Check /></span><h3>Đã ghi nhận yêu cầu xuất linh kiện</h3><p>Phiếu xuất linh kiện đang chờ xử lý cho hồ sơ <strong>{warrantyId}</strong>.</p><div className="hn-component-summary"><span>Linh kiện</span><strong>{item.name} · {item.sku}</strong><span>Số lượng</span><strong>{total} cái</strong></div><Button onClick={onBack}>Quay lại hồ sơ</Button></div></section>;

  return <section className="hn-component-screen" aria-labelledby="component-issue-title">
    <header className="hn-component-header"><Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại"><ArrowLeft /></Button><div><span>Hồ sơ bảo hành · {warrantyId}</span><h2 id="component-issue-title">Xuất linh kiện cho bảo hành</h2></div></header>
    <div className="hn-component-stepper"><span className={state === 'select' ? 'active' : 'done'}>1. Chọn linh kiện</span><span className={state === 'scan' ? 'active' : state === 'review' ? 'done' : ''}>2. Quét / nhập số lượng</span><span className={state === 'review' ? 'active' : ''}>3. Xác nhận</span></div>
    {state === 'select' && <div className="hn-component-card"><div className="hn-component-card-title"><div><small>Xuất linh kiện</small><h3>Chọn linh kiện cần xuất</h3></div><span className="hn-component-badge">Chưa tạo phiếu</span></div><p className="hn-component-help">Chọn một linh kiện phục vụ hồ sơ bảo hành. Tồn khả dụng được đối chiếu theo kho xuất.</p><div className="hn-component-options">{componentOptions.map((option) => <button className={selected === option.sku ? 'selected' : ''} key={option.sku} onClick={() => setSelected(option.sku)}><span><strong>{option.name}</strong><small>{option.sku} · Khả dụng {option.available} cái</small></span><ChevronRight /></button>)}</div><Button className="hn-primary" onClick={() => setState('scan')}>Tiếp tục quét linh kiện <ChevronRight /></Button></div>}
    {state === 'scan' && <div className="hn-component-card"><div className="hn-component-card-title"><div><small>Xuất linh kiện</small><h3>{item.name}</h3></div><span className="hn-component-badge">{item.tagged ? 'Có mã' : 'Không dán mã'}</span></div>{item.tagged ? <><p className="hn-component-help">Linh kiện có mã: quét mã từng linh kiện để kiểm tra đúng hiện vật.</p><Button className="hn-scan-button" onClick={() => setScanned((current) => [...current, `${item.sku}-${current.length + 1}`])}><ScanLine /> Quét mã linh kiện</Button>{scanned.length > 0 && <div className="hn-scanned-list">{scanned.map((code) => <div key={code}><Check />{code}<button onClick={() => setScanned((current) => current.filter((value) => value !== code))} aria-label={`Xoá ${code}`}><X /></button></div>)}</div>}</> : <><div className="hn-component-info"><AlertTriangle /><div><strong>Linh kiện không dán mã</strong><span>Quét mã hộp đựng linh kiện, sau đó nhập số lượng thực tế cần xuất.</span></div></div><Button variant="outline" onClick={() => setScanned(['BOX-HN-LK-003-01'])}><ScanLine /> Quét mã hộp</Button><label className="hn-component-field">Số lượng linh kiện cần xuất<Input type="number" min="1" value={qty} onChange={(event) => setQty(event.target.value)} /></label></>}<div className="hn-component-actions"><Button variant="outline" onClick={() => setState('select')}>Quay lại</Button><Button className="hn-primary" disabled={total < 1} onClick={() => setState('review')}>Kiểm tra yêu cầu</Button></div></div>}
    {state === 'review' && <div className="hn-component-card"><div className="hn-component-card-title"><div><small>Bước xác nhận</small><h3>Kiểm tra trước khi xuất</h3></div><span className="hn-component-badge warning">Chưa ghi nhận</span></div><dl className="hn-component-review"><div><dt>Hồ sơ bảo hành</dt><dd>{warrantyId}</dd></div><div><dt>Linh kiện</dt><dd>{item.name} · {item.sku}</dd></div><div><dt>Số lượng</dt><dd>{total} cái</dd></div><div><dt>Kho xuất</dt><dd>Kho Hoa Nam · cần xác nhận từ WMS</dd></div></dl><label className="hn-component-field">Ghi chú xuất linh kiện (không bắt buộc)<Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: thay thế theo kết quả kiểm tra…" /></label><div className="hn-component-info"><AlertTriangle /><span>Chỉ sau khi xác nhận thành công, hệ thống mới tạo phiếu xuất linh kiện cho hồ sơ này.</span></div><div className="hn-component-actions"><Button variant="outline" onClick={() => setState('scan')}>Quay lại quét</Button><Button className="hn-primary" onClick={() => setState('success')}>Xác nhận xuất linh kiện</Button></div></div>}
  </section>;
}
