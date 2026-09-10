'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Eye,
  FilterX,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { MasterDataSearch } from './master-data-search';
import { SkuBadge, SkuNotice, SkuSelect } from './sku-primitives';
import { DefectDetail, DefectForm, DefectRules } from './defect-actions';
import {
  DEFECT_DEFAULT,
  DEFECT_SORTS,
  DEFECT_STATUSES,
  createDefectFixtures,
  defectStatus,
  defectUrl,
  parseDefectQuery,
  queryDefects,
  type Defect,
  type DefectQuery,
} from '@/lib/defect-demo';
import './agency-prototype.css';
import './master-data-list.css';
import './defect-prototype.css';

export default function DefectPrototype() {
  const [records, setRecords] = useState(createDefectFixtures);
  const [query, setQuery] = useState<DefectQuery>(DEFECT_DEFAULT);
  const [search, setSearch] = useState('');
  const [scenario, setScenario] = useState('data');
  const [action, setAction] = useState<{
    kind: 'detail' | 'form' | 'rules';
    record?: Defect;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false),
    busy = useRef(false),
    currentHref = useRef('');
  const pendingNavigation = useRef<(() => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null),
    table = useRef<HTMLDivElement>(null);
  const unavailable = scenario === 'loading' || scenario === 'error';
  const readonly = scenario === 'readonly';
  const result = useMemo(
    () => queryDefects(scenario === 'empty' ? [] : records, query),
    [records, query, scenario],
  );
  useEffect(() => {
    const read = () => {
      const next = parseDefectQuery(location.search);
      setQuery(next);
      setSearch(next.q);
      currentHref.current = location.href;
    };
    const pop = () => {
      if (location.href === currentHref.current) return;
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
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty.current || busy.current) {
        event.preventDefault();
      }
    };
    const link = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null;
      if (anchor && (dirty.current || busy.current)) {
        event.preventDefault();
        event.stopPropagation();
        if (!busy.current) {
          pendingNavigation.current = () => {
            setAction(null);
            location.href = anchor.href;
          };
          setConfirmLeave(true);
        }
      }
    };
    const frame = requestAnimationFrame(read);
    window.addEventListener('hn:prototype-history', pop);
    window.addEventListener('hashchange', pop);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', link, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hn:prototype-history', pop);
      window.removeEventListener('hashchange', pop);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', link, true);
    };
  }, []);
  function update(patch: Partial<DefectQuery>) {
    const next = { ...query, ...patch };
    next.page = queryDefects(scenario === 'empty' ? [] : records, next).page;
    setQuery(next);
    setSearch(next.q);
    history.pushState(history.state, '', defectUrl(location.href, next));
    currentHref.current = location.href;
  }
  function page(value: number) {
    update({ page: value });
    requestAnimationFrame(() => {
      table.current?.focus({ preventScroll: true });
      table.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function open(kind: 'detail' | 'form' | 'rules', record?: Defect) {
    trigger.current = document.activeElement as HTMLElement;
    currentHref.current = location.href;
    dirty.current = false;
    pendingNavigation.current = null;
    setAction({ kind, record });
  }
  function close() {
    if (busy.current) return;
    if (dirty.current) {
      pendingNavigation.current = null;
      setConfirmLeave(true);
    } else setAction(null);
  }
  function save(draft: Defect) {
    const saved = {
      ...draft,
      id: draft.id || `demo-def-new-${crypto.randomUUID()}`,
    };
    setRecords((old) =>
      draft.id
        ? old.map((r) => (r.id === draft.id ? saved : r))
        : [...old, saved],
    );
    dirty.current = false;
    setScenario('data');
    setMessage(
      `Đã lưu DEMO ${saved.code} — ${saved.name}. Tải lại trang sẽ khôi phục dữ liệu mẫu.`,
    );
    setAction({ kind: 'detail', record: saved });
  }
  const clear = () => update({ q: '', status: 'all', page: 1 });
  const filtered = !!query.q || query.status !== 'all';
  const summaryRecords = scenario === 'empty' ? [] : records;
  const activeCount = summaryRecords.filter((record) => record.active).length;
  const sortHeader = (field: 'code' | 'name', label: string) => {
    const selected = query.sort.startsWith(field),
      asc = query.sort === `${field}.asc`;
    return (
      <button
        type="button"
        disabled={unavailable}
        aria-pressed={selected}
        aria-label={`${label}: ${selected ? (asc ? 'đang tăng dần' : 'đang giảm dần') : 'chưa sắp xếp'}. Sắp ${asc ? 'giảm' : 'tăng'} dần`}
        onClick={() =>
          update({ sort: `${field}.${asc ? 'desc' : 'asc'}`, page: 1 })
        }
      >
        {label}
        {selected ? asc ? <ArrowUp /> : <ArrowDown /> : <ArrowUpDown />}
      </button>
    );
  };
  return (
    <section
      id="defect-prototype"
      className="hn-sku hn-master-list hn-def content-section"
      aria-labelledby="defect-heading"
    >
      <div className="hn-def-breadcrumb" aria-label="Vị trí prototype">
        <span>PROTOTYPE</span>
        <ChevronRight aria-hidden="true" />
        <span>Danh mục</span>
        <ChevronRight aria-hidden="true" />
        <span>Bệnh / lỗi</span>
      </div>
      <header className="hn-def-heading">
        <div className="hn-def-heading-content">
          <div className="hn-def-title-line">
            <h2 id="defect-heading">Danh mục Bệnh / lỗi</h2>
            <dl
              className="hn-def-summary"
              aria-label="Tổng hợp danh mục DEMO, không theo bộ lọc"
            >
              <div>
                <dt>Tổng</dt>
                <dd>{unavailable ? '—' : summaryRecords.length}</dd>
              </div>
              <div className="is-active">
                <dt>Đang dùng</dt>
                <dd>{unavailable ? '—' : activeCount}</dd>
              </div>
              <div>
                <dt>Ngừng dùng</dt>
                <dd>
                  {unavailable ? '—' : summaryRecords.length - activeCount}
                </dd>
              </div>
            </dl>
          </div>
          <p>Tra cứu mã, mô tả và trạng thái bệnh / lỗi dùng cho bảo hành.</p>
        </div>
        {!readonly && (
          <Button className="hn-def-add" onClick={() => open('form')}>
            <Plus /> Thêm bệnh / lỗi
          </Button>
        )}
      </header>
      <div className="hn-def-scope">
        <span>
          <SkuBadge tone="purple">DEMO</SkuBadge> Không kết nối kho thật · Tải
          lại để khôi phục mẫu
        </span>
        <Button variant="ghost" onClick={() => open('rules')}>
          <CircleHelp /> Phạm vi & điểm chưa chốt
        </Button>
      </div>
      {message && <SkuNotice tone="success">{message}</SkuNotice>}
      <div className="hn-cat-card">
        <div className="hn-def-toolbar">
          <MasterDataSearch
            id="defect-search"
            label="Tìm mã / tên bệnh / lỗi"
            value={search}
            placeholder="Nhập mã hoặc tên, nhấn Enter…"
            onChange={setSearch}
            onSubmit={() => update({ q: search, page: 1 })}
            onClear={() => update({ q: '', page: 1 })}
          />
          <SkuSelect
            id="defect-status"
            label="Trạng thái bệnh / lỗi"
            value={query.status}
            options={DEFECT_STATUSES}
            onChange={(status) => update({ status, page: 1 })}
          />
          <SkuSelect
            id="defect-sort"
            label="Sắp xếp bệnh / lỗi"
            value={query.sort}
            options={DEFECT_SORTS}
            onChange={(sort) => update({ sort, page: 1 })}
          />
          <div className="hn-def-page-size">
            <SkuSelect
              id="defect-size"
              label="Dòng / trang bệnh / lỗi"
              value={String(query.size)}
              options={[10, 15, 20, 50].map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              onChange={(size) => update({ size: Number(size), page: 1 })}
            />
          </div>
        </div>
        {filtered && (
          <div className="hn-def-chips">
            {query.q && (
              <Button
                variant="outline"
                aria-label="Xóa từ khóa bệnh / lỗi"
                onClick={() => update({ q: '', page: 1 })}
              >
                Tìm: {query.q}
                <X />
              </Button>
            )}
            {query.status !== 'all' && (
              <Button
                variant="outline"
                aria-label="Xóa lọc trạng thái bệnh / lỗi"
                onClick={() => update({ status: 'all', page: 1 })}
              >
                {defectStatus(query.status === 'active')}
                <X />
              </Button>
            )}
            <Button variant="ghost" onClick={clear}>
              <FilterX /> Xóa tất cả bộ lọc
            </Button>
          </div>
        )}
        <div className="hn-def-results">
          <output>
            {unavailable ? (
              scenario === 'loading' ? (
                'Đang tải danh sách DEMO…'
              ) : (
                'Chưa tải được kết quả'
              )
            ) : (
              <>
                <strong>{result.total}</strong> bệnh / lỗi phù hợp /{' '}
                {scenario === 'empty' ? 0 : records.length} bản ghi mẫu
              </>
            )}
          </output>
          <span>STT theo kết quả đã sắp xếp</span>
        </div>
        <div
          ref={table}
          tabIndex={-1}
          className="hn-def-table-wrap"
          aria-label="Kết quả bệnh / lỗi"
          aria-busy={scenario === 'loading'}
        >
          {scenario === 'loading' ? (
            <div className="hn-def-state">
              <p>Đang tải dữ liệu minh họa</p>
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </div>
          ) : scenario === 'error' ? (
            <div className="hn-def-state">
              <SkuNotice tone="error">
                Không tải được danh sách (DEMO). Tìm kiếm, bộ lọc và trang được
                giữ nguyên.
              </SkuNotice>
              <Button onClick={() => setScenario('data')}>
                Thử tải lại bệnh / lỗi
              </Button>
            </div>
          ) : !result.total ? (
            <div className="hn-def-state">
              <ClipboardList />
              <h3>
                {scenario === 'empty'
                  ? 'Chưa có bệnh / lỗi'
                  : 'Không có bệnh / lỗi phù hợp'}
              </h3>
              <p>
                {scenario === 'empty'
                  ? 'Tình huống DEMO chưa có danh mục.'
                  : 'Thử đổi từ khóa hoặc xóa điều kiện đang áp dụng.'}
              </p>
              {scenario === 'empty' ? (
                <Button onClick={() => open('form')}>
                  Thêm bệnh / lỗi đầu tiên
                </Button>
              ) : (
                <Button onClick={clear}>Xóa tìm kiếm và bộ lọc</Button>
              )}
            </div>
          ) : (
            <Table className="hn-def-table">
              <TableCaption className="sr-only">
                Danh mục Bệnh / lỗi — dữ liệu DEMO. Sắp xếp toàn bộ kết quả
                trước phân trang. Mô tả đầy đủ đọc bằng nút Xem.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="def-stt">
                    STT
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="def-code"
                    aria-sort={
                      query.sort.startsWith('code')
                        ? query.sort.endsWith('asc')
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="hn-def-sort">
                      {sortHeader('code', 'Mã')}
                    </div>
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="def-identity"
                    aria-sort={
                      query.sort.startsWith('name')
                        ? query.sort.endsWith('asc')
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="hn-def-sort">
                      {sortHeader('name', 'Tên bệnh / lỗi')}
                    </div>
                  </TableHead>
                  <TableHead scope="col" className="def-description">
                    Mô tả
                  </TableHead>
                  <TableHead scope="col" className="def-status">
                    Trạng thái
                  </TableHead>
                  <TableHead scope="col" className="def-actions">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((record, index) => (
                  <TableRow
                    key={record.id}
                    data-inactive={!record.active || undefined}
                  >
                    <TableCell className="def-stt">
                      {(result.page - 1) * query.size + index + 1}
                    </TableCell>
                    <TableCell className="def-code">
                      <button
                        className="hn-def-code"
                        aria-label={`Xem thông tin ${record.code}`}
                        onClick={() => open('detail', record)}
                      >
                        <code>{record.code}</code>
                      </button>
                    </TableCell>
                    <TableCell className="def-identity">
                      <button
                        className="hn-def-name"
                        onClick={() => open('detail', record)}
                      >
                        <span>{record.name}</span>
                      </button>
                      <button
                        className="hn-def-tablet-description"
                        onClick={() => open('detail', record)}
                        aria-label={`Xem mô tả ${record.code}`}
                      >
                        Xem mô tả
                      </button>
                    </TableCell>
                    <TableCell className="def-description">
                      <button
                        className="hn-def-description"
                        onClick={() => open('detail', record)}
                        aria-label={`Đọc mô tả đầy đủ ${record.code}`}
                      >
                        <span>{record.description || 'Chưa có mô tả'}</span>
                        <small>Đọc đầy đủ</small>
                      </button>
                    </TableCell>
                    <TableCell className="def-status">
                      <span
                        className={`hn-def-status ${record.active ? 'is-active' : 'is-inactive'}`}
                      >
                        <span
                          className="hn-def-status-dot"
                          aria-hidden="true"
                        />
                        {defectStatus(record.active)}
                      </span>
                    </TableCell>
                    <TableCell className="def-actions">
                      <fieldset
                        className="hn-sku-row-actions"
                        aria-label={`Hành động ${record.code}`}
                      >
                        <Button
                          variant="outline"
                          aria-label={`Xem ${record.code}`}
                          onClick={() => open('detail', record)}
                        >
                          <Eye /> Xem
                        </Button>
                        {!readonly && (
                          <Button
                            variant="ghost"
                            className="hn-sku-edit-action"
                            aria-label={`Sửa ${record.code}`}
                            onClick={() => open('form', record)}
                          >
                            <Pencil /> Sửa
                          </Button>
                        )}
                      </fieldset>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="hn-sku-pagination hn-def-pagination">
          <span>
            Hiển thị{' '}
            {unavailable
              ? '—'
              : `${result.total ? `${(result.page - 1) * query.size + 1}–${Math.min(result.page * query.size, result.total)}` : 0} / ${result.total} bệnh / lỗi`}
          </span>
          <Pagination aria-label="Phân trang bệnh / lỗi">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  aria-label="Trang bệnh / lỗi trước"
                  disabled={unavailable || result.page === 1}
                  onClick={() => page(result.page - 1)}
                >
                  <ChevronLeft />
                </Button>
              </PaginationItem>
              {Array.from({ length: result.pages }, (_, i) => i + 1).map(
                (n) => (
                  <PaginationItem key={n}>
                    <Button
                      variant={n === result.page ? 'default' : 'ghost'}
                      aria-current={n === result.page ? 'page' : undefined}
                      aria-label={`Trang bệnh / lỗi ${n}`}
                      disabled={unavailable}
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
                  aria-label="Trang bệnh / lỗi sau"
                  disabled={unavailable || result.page === result.pages}
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
          id="defect-scenario"
          label="Kiểm thử bệnh / lỗi DEMO"
          value={scenario}
          options={[
            { value: 'data', label: 'Có dữ liệu' },
            { value: 'loading', label: 'Đang tải' },
            { value: 'empty', label: 'Chưa có dữ liệu' },
            { value: 'error', label: 'Lỗi tải dữ liệu' },
            { value: 'readonly', label: 'Chỉ xem — mô phỏng' },
          ]}
          onChange={setScenario}
        />
        <p>
          Không thao tác dữ liệu kho thật. Quy tắc mã, trạng thái và bảo hành
          chưa được tự chốt.
        </p>
      </div>
      <Dialog
        open={!!action}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent
          className="hn-sku hn-agy-dialog hn-def-dialog"
          showCloseButton={false}
          finalFocus={trigger}
          initialFocus={
            action?.kind === 'form' && !action.record
              ? () => document.getElementById('defect-form-code')
              : undefined
          }
        >
          <header>
            <div>
              <DialogTitle>
                {action?.kind === 'rules'
                  ? 'Phạm vi Bệnh / lỗi'
                  : action?.kind === 'form'
                    ? action.record
                      ? 'Sửa bệnh / lỗi'
                      : 'Thêm bệnh / lỗi'
                    : 'Chi tiết bệnh / lỗi'}
              </DialogTitle>
              <DialogDescription>
                {action?.record?.code ? `${action.record.code} · ` : ''}Dữ liệu
                DEMO · Không ghi vào kho thật
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              disabled={saving}
              aria-label="Đóng bệnh / lỗi"
              onClick={close}
            >
              <X />
            </Button>
          </header>
          {action?.kind === 'form' && (
            <DefectForm
              key={action.record?.id || 'new'}
              record={action.record}
              records={records}
              onDirty={(value) => {
                dirty.current = value;
              }}
              onBusy={(value) => {
                busy.current = value;
                setSaving(value);
              }}
              onSave={save}
              onClose={close}
            />
          )}
          {action?.kind === 'detail' && action.record && (
            <DefectDetail
              record={action.record}
              readonly={readonly}
              onEdit={() => setAction({ ...action, kind: 'form' })}
              onClose={close}
            />
          )}
          {action?.kind === 'rules' && <DefectRules onClose={close} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent className="hn-sku hn-sku-leave">
          <AlertDialogTitle>Bạn có thay đổi chưa lưu</AlertDialogTitle>
          <AlertDialogDescription>
            Thoát và bỏ thay đổi bệnh / lỗi? Nội dung đang nhập chưa được lưu.
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
              Bỏ thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
