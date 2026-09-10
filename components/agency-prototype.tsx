'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  FilterX,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AgencyDetail, AgencyForm, AgencyRules } from './agency-actions';
import { SkuBadge, SkuNotice, SkuSelect } from './sku-primitives';
import {
  AGENCY_DEFAULT,
  AGENCY_TYPES,
  agencyAddress,
  agencyLabel,
  agencyTypeLabel,
  agencyUrl,
  createAgencyFixtures,
  parseAgencyQuery,
  queryAgencies,
  type Agency,
  type AgencyQuery,
} from '@/lib/agency-demo';
import './agency-prototype.css';

export default function AgencyPrototype() {
  const [records, setRecords] = useState(createAgencyFixtures);
  const [query, setQuery] = useState<AgencyQuery>(AGENCY_DEFAULT);
  const [search, setSearch] = useState('');
  const [scenario, setScenario] = useState('data');
  const [action, setAction] = useState<{
    kind: 'detail' | 'form' | 'rules';
    record?: Agency;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false),
    busy = useRef(false),
    currentHref = useRef('');
  const pendingNavigation = useRef<(() => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const table = useRef<HTMLDivElement>(null);
  const [scrollHint, setScrollHint] = useState(false);
  const result = useMemo(
    () => queryAgencies(scenario === 'empty' ? [] : records, query),
    [records, query, scenario],
  );
  useEffect(() => {
    const container = table.current?.querySelector<HTMLDivElement>(
      '[data-slot="table-container"]',
    );
    if (!container) return;
    const measure = () =>
      setScrollHint(
        container.scrollWidth - container.clientWidth - container.scrollLeft >
          2,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container.addEventListener('scroll', measure);
    measure();
    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', measure);
    };
  }, [scenario, result.rows.length]);
  useEffect(() => {
    const read = () => {
      const next = parseAgencyQuery(location.search);
      setQuery(next);
      setSearch(next.q);
      currentHref.current = location.href;
    };
    const pop = () => {
      if (dirty.current || busy.current) {
        const destination = location.href;
        history.pushState(history.state, '', currentHref.current);
        if (!busy.current) {
          pendingNavigation.current = () => {
            history.replaceState(history.state, '', destination);
            setAction(null);
            read();
          };
          setConfirmLeave(true);
        }
      } else {
        setAction(null);
        read();
      }
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty.current || busy.current) e.preventDefault();
    };
    const link = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]');
      if (anchor && (dirty.current || busy.current)) {
        e.preventDefault();
        e.stopPropagation();
        if (!busy.current) {
          pendingNavigation.current = () => {
            setAction(null);
            location.href = (anchor as HTMLAnchorElement).href;
          };
          setConfirmLeave(true);
        }
      }
    };
    const frame = requestAnimationFrame(read);
    window.addEventListener('hn:prototype-history', pop);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', link, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hn:prototype-history', pop);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', link, true);
    };
  }, []);
  function update(patch: Partial<AgencyQuery>) {
    const next = { ...query, ...patch };
    next.page = queryAgencies(records, next).page;
    setQuery(next);
    setSearch(next.q);
    history.pushState(history.state, '', agencyUrl(location.href, next));
    currentHref.current = location.href;
  }
  function page(n: number) {
    update({ page: n });
    requestAnimationFrame(() => {
      table.current?.focus({ preventScroll: true });
      table.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function open(kind: 'detail' | 'form' | 'rules', record?: Agency) {
    trigger.current = document.activeElement as HTMLElement;
    currentHref.current = location.href;
    dirty.current = false;
    setAction({ kind, record });
  }
  function close() {
    if (busy.current) return;
    if (dirty.current) {
      pendingNavigation.current = null;
      setConfirmLeave(true);
    } else setAction(null);
  }
  function save(d: Agency) {
    const unchanged =
      action?.record && JSON.stringify(d) === JSON.stringify(action.record);
    const saved = {
      ...d,
      id: d.id || `demo-new-${crypto.randomUUID()}`,
      version: unchanged ? d.version : d.id ? d.version + 1 : 1,
    };
    setRecords((old) =>
      d.id ? old.map((r) => (r.id === d.id ? saved : r)) : [...old, saved],
    );
    dirty.current = false;
    setScenario('data');
    setMessage(
      `${unchanged ? 'Không có thay đổi; đã giữ nguyên' : 'Đã lưu DEMO'} ${saved.code} — ${saved.name}. Tải lại trang sẽ khôi phục dữ liệu mẫu.`,
    );
    setAction({ kind: 'detail', record: saved });
  }
  const clear = () => {
    setScenario('data');
    update({ ...AGENCY_DEFAULT });
  };
  const filtered = query.q || query.type !== 'all' || query.status !== 'all';
  const sortHeader = (field: 'code' | 'name', label: string) => {
    const selected = query.sort.startsWith(field),
      ascending = query.sort === `${field}.asc`;
    return (
      <button
        type="button"
        onClick={() =>
          update({ sort: `${field}.${ascending ? 'desc' : 'asc'}`, page: 1 })
        }
        aria-pressed={selected}
        aria-label={`${label}: ${selected ? (ascending ? 'đang tăng dần' : 'đang giảm dần') : 'chưa sắp xếp'}. Sắp ${ascending ? 'giảm' : 'tăng'} dần`}
      >
        {label}
        {selected ? ascending ? <ArrowUp /> : <ArrowDown /> : <ArrowUpDown />}
      </button>
    );
  };
  return (
    <section
      id="agency-prototype"
      className="hn-sku hn-agy content-section"
      aria-labelledby="agency-heading"
    >
      <div className="hn-cat-heading">
        <span className="hn-cat-heading-icon">
          <Building2 />
        </span>
        <div>
          <span className="hn-cat-eyebrow">PROTOTYPE / DANH MỤC / AGY-01</span>
          <h2 id="agency-heading">Danh mục Đại lý / nơi nhận</h2>
          <p>Tra cứu và quản lý thông tin nơi nhận.</p>
        </div>
        <SkuBadge tone="purple">DEMO · Tablet+</SkuBadge>
      </div>
      <div className="hn-cat-scope">
        <span>
          Dữ liệu minh họa · Không kết nối kho thật · Tải lại để khôi phục mẫu
        </span>
        <Button variant="ghost" onClick={() => open('rules')}>
          <CircleHelp /> Phạm vi & điểm chưa chốt
        </Button>
      </div>
      {message && <SkuNotice tone="success">{message}</SkuNotice>}
      <div className="hn-cat-card">
        <div className="hn-agy-card-heading">
          <div>
            <h3>
              Danh sách nơi nhận <span>{records.length}</span>
            </h3>
            <p>4 loại nơi nhận · Toàn bộ dữ liệu DEMO</p>
          </div>
          <Button onClick={() => open('form')}>
            <Plus /> Thêm nơi nhận
          </Button>
        </div>
        <div className="hn-agy-toolbar">
          <form
            className="hn-agy-search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search, page: 1 });
            }}
          >
            <label htmlFor="agency-search">
              Tìm mã / tên / thị trường / khu vực
            </label>
            <div>
              <Input
                id="agency-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập từ khóa, nhấn Enter…"
              />
              <Button type="submit" variant="ghost" aria-label="Tìm nơi nhận">
                <Search aria-hidden="true" />
              </Button>
            </div>
          </form>
          <SkuSelect
            id="agency-type-filter"
            label="Loại nơi nhận"
            value={query.type}
            options={[{ value: 'all', label: 'Tất cả loại' }, ...AGENCY_TYPES]}
            onChange={(type) => update({ type, page: 1 })}
          />
          <SkuSelect
            id="agency-status-filter"
            label="Trạng thái"
            value={query.status}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang sử dụng' },
              { value: 'inactive', label: 'Ngừng sử dụng' },
            ]}
            onChange={(status) => update({ status, page: 1 })}
          />
        </div>
        {filtered && (
          <div className="hn-agy-chips">
            {query.q && (
              <Button
                variant="outline"
                onClick={() => update({ q: '', page: 1 })}
              >
                Tìm: {query.q}
                <X />
              </Button>
            )}
            {query.type !== 'all' && (
              <Button
                variant="outline"
                onClick={() => update({ type: 'all', page: 1 })}
              >
                {agencyTypeLabel(query.type)}
                <X />
              </Button>
            )}
            {query.status !== 'all' && (
              <Button
                variant="outline"
                onClick={() => update({ status: 'all', page: 1 })}
              >
                {query.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                <X />
              </Button>
            )}
            <Button variant="ghost" onClick={clear}>
              <FilterX /> Xóa tất cả bộ lọc
            </Button>
          </div>
        )}
        <div className="hn-agy-results">
          <output>
            <strong>
              {scenario === 'loading' || scenario === 'error'
                ? '—'
                : result.total}
            </strong>{' '}
            nơi nhận phù hợp
            {scenario === 'data' && ` / ${records.length} bản ghi mẫu`}
          </output>
          <span>
            {scrollHint
              ? 'Cuộn ngang để xem thêm · Mã/Tên và Hành động cố định'
              : 'STT theo kết quả đã sắp xếp'}
          </span>
        </div>
        <div
          ref={table}
          tabIndex={-1}
          className="hn-agy-table-wrap"
          aria-label="Kết quả nơi nhận"
        >
          {scenario === 'loading' ? (
            <output className="hn-agy-state">
              <p>Đang tải danh sách DEMO…</p>
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : scenario === 'error' ? (
            <div className="hn-agy-state">
              <SkuNotice tone="error">
                Không tải được danh sách (tình huống DEMO). Bộ lọc được giữ
                nguyên.
              </SkuNotice>
              <Button onClick={() => setScenario('data')}>Thử tải lại</Button>
            </div>
          ) : !result.total ? (
            <div className="hn-agy-state">
              <Building2 />
              <h3>
                {scenario === 'empty'
                  ? 'Chưa có nơi nhận'
                  : 'Không có nơi nhận phù hợp'}
              </h3>
              <p>
                {scenario === 'empty'
                  ? 'Dữ liệu DEMO đang ở trạng thái rỗng.'
                  : 'Thử đổi từ khóa hoặc xóa điều kiện đang áp dụng.'}
              </p>
              <Button
                onClick={scenario === 'empty' ? () => open('form') : clear}
              >
                {scenario === 'empty'
                  ? 'Thêm nơi nhận đầu tiên'
                  : 'Xóa tìm kiếm và bộ lọc'}
              </Button>
            </div>
          ) : (
            <Table className="hn-agy-table">
              <TableCaption className="sr-only">
                Danh mục Đại lý / nơi nhận — dữ liệu DEMO
              </TableCaption>
              <colgroup>
                <col style={{ width: 48 }} />
                <col style={{ width: 272 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 190 }} />
                <col style={{ width: 210 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 164 }} />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="agy-stt">
                    STT
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="agy-identity"
                    aria-sort={
                      query.sort.endsWith('asc') ? 'ascending' : 'descending'
                    }
                  >
                    <div className="hn-agy-sort">
                      {sortHeader('code', 'Mã')}
                      <span aria-hidden="true">/</span>
                      {sortHeader('name', 'Tên nơi nhận')}
                    </div>
                  </TableHead>
                  <TableHead scope="col">Loại nơi nhận</TableHead>
                  <TableHead scope="col">Thị trường / Khu vực</TableHead>
                  <TableHead scope="col">Liên hệ / Điện thoại</TableHead>
                  <TableHead scope="col">Địa chỉ</TableHead>
                  <TableHead scope="col">Trạng thái</TableHead>
                  <TableHead scope="col" className="agy-actions">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="agy-stt">
                      {(result.page - 1) * query.size + i + 1}
                    </TableCell>
                    <TableCell className="agy-identity">
                      <button
                        className="hn-agy-name"
                        onClick={() => open('detail', r)}
                      >
                        <strong>{r.code}</strong>
                        <span>{r.name}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className={`hn-agy-type ${r.type}`}>
                        {agencyTypeLabel(r.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span>{agencyLabel(r.market)}</span>
                      <small>{agencyLabel(r.area)}</small>
                    </TableCell>
                    <TableCell>
                      <span>{r.contact || 'Chưa có liên hệ'}</span>
                      <small className="hn-agy-phone">
                        {r.phone || 'Chưa có điện thoại'}
                      </small>
                    </TableCell>
                    <TableCell>
                      <button
                        className="hn-agy-address"
                        onClick={() => open('detail', r)}
                        aria-label={`Xem địa chỉ đầy đủ ${r.code}`}
                      >
                        {agencyAddress(r) || 'Chưa có địa chỉ'}
                      </button>
                      {r.legacyAddress && (
                        <small className="hn-agy-legacy">
                          Địa chỉ cũ · Chưa chuẩn hóa
                        </small>
                      )}
                    </TableCell>
                    <TableCell>
                      <SkuBadge tone={r.active ? 'green' : 'muted'}>
                        {r.active ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                      </SkuBadge>
                    </TableCell>
                    <TableCell className="agy-actions">
                      <div className="hn-sku-row-actions">
                        <Button
                          variant="outline"
                          aria-label={`Xem ${r.code}`}
                          onClick={() => open('detail', r)}
                        >
                          <Eye />
                          Xem
                        </Button>
                        <Button
                          variant="ghost"
                          className="hn-sku-edit-action"
                          aria-label={`Sửa ${r.code}`}
                          onClick={() => open('form', r)}
                        >
                          <Pencil />
                          Sửa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="hn-sku-pagination hn-agy-pagination">
          <SkuSelect
            id="agency-size"
            label="Dòng / trang"
            value={String(query.size)}
            options={[10, 15, 20, 50].map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            onChange={(v) => update({ size: Number(v), page: 1 })}
          />
          <span>
            {result.total
              ? `${(result.page - 1) * query.size + 1}–${Math.min(result.page * query.size, result.total)}`
              : '0'}{' '}
            / {result.total}
          </span>
          <Pagination aria-label="Phân trang nơi nhận">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  disabled={
                    result.page === 1 ||
                    scenario === 'error' ||
                    scenario === 'loading'
                  }
                  aria-label="Trang nơi nhận trước"
                  onClick={() => page(result.page - 1)}
                >
                  <ChevronLeft />
                </Button>
              </PaginationItem>
              {Array.from({ length: result.pages }, (_, i) => i + 1).map(
                (n) => (
                  <PaginationItem key={n}>
                    <Button
                      variant={result.page === n ? 'default' : 'ghost'}
                      aria-current={result.page === n ? 'page' : undefined}
                      aria-label={`Trang nơi nhận ${n}`}
                      disabled={scenario === 'error' || scenario === 'loading'}
                      onClick={() => page(n)}
                    >
                      {n}
                    </Button>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <Button
                  variant="outline"
                  disabled={
                    result.page === result.pages ||
                    scenario === 'error' ||
                    scenario === 'loading'
                  }
                  aria-label="Trang nơi nhận sau"
                  onClick={() => page(result.page + 1)}
                >
                  <ChevronRight />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <div className="hn-sku-test-strip">
        <SkuSelect
          id="agency-scenario"
          label="Kiểm thử nơi nhận DEMO"
          value={scenario}
          options={[
            { value: 'data', label: 'Có dữ liệu' },
            { value: 'loading', label: 'Đang tải' },
            { value: 'empty', label: 'Chưa có dữ liệu' },
            { value: 'error', label: 'Lỗi tải dữ liệu' },
          ]}
          onChange={setScenario}
        />
        <p>
          Mọi thay đổi chỉ tồn tại trong lượt xem. Không thêm Xóa, Import/Export
          hoặc thao tác hàng loạt.
        </p>
      </div>
      <Dialog
        open={!!action}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent
          className="hn-sku hn-agy-dialog"
          showCloseButton={false}
          finalFocus={trigger}
        >
          <header>
            <div>
              <DialogTitle>
                {action?.kind === 'rules'
                  ? 'Phạm vi Đại lý / nơi nhận'
                  : action?.kind === 'form'
                    ? action.record
                      ? 'Sửa nơi nhận'
                      : 'Thêm nơi nhận'
                    : 'Chi tiết nơi nhận'}
              </DialogTitle>
              <DialogDescription>
                {action?.record?.code && `${action.record.code} · `}Dữ liệu DEMO
                · Không ghi vào kho thật
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              disabled={saving}
              aria-label="Đóng nơi nhận"
              onClick={close}
            >
              <X />
            </Button>
          </header>
          {action?.kind === 'form' && (
            <AgencyForm
              key={action.record?.id || 'new'}
              record={action.record}
              records={records}
              onDirty={(v) => {
                dirty.current = v;
              }}
              onBusy={(v) => {
                busy.current = v;
                setSaving(v);
              }}
              onSave={save}
              onClose={close}
            />
          )}
          {action?.kind === 'detail' && action.record && (
            <AgencyDetail
              record={action.record}
              onEdit={() => setAction({ ...action, kind: 'form' })}
              onClose={close}
            />
          )}
          {action?.kind === 'rules' && <AgencyRules onClose={close} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent className="hn-sku hn-sku-leave">
          <AlertDialogTitle>Bỏ thay đổi nơi nhận chưa lưu?</AlertDialogTitle>
          <AlertDialogDescription>
            Nội dung đang nhập sẽ bị bỏ. Chưa có dữ liệu nào được ghi vào hệ
            thống kho thật.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dirty.current = false;
                setConfirmLeave(false);
                if (pendingNavigation.current) {
                  pendingNavigation.current();
                  pendingNavigation.current = null;
                } else setAction(null);
              }}
            >
              Bỏ thay đổi nơi nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
