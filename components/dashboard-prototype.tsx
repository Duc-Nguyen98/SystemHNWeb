'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  Info,
  LoaderCircle,
  PackageCheck,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Warehouse,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CLOSED_ROUTE,
  DEFAULT_FROM,
  DEMO_DAY,
  HANDOFF,
  IMPORT_ERRORS,
  LABELS,
  MOVEMENTS,
  PENDING_SKU,
  SNAPSHOT,
  STOCK,
  WARRANTIES,
  available,
  difference,
  formatDay,
  formatNumber as n,
  normalize,
  parseDemoRoute,
  periodMetrics,
  stockForType,
  total,
  typeName,
  type DemoRoute,
  type ItemType,
  type Movement,
  type Stock,
} from '@/lib/dashboard-demo';
import DashboardDataSurface from '@/components/dashboard-visuals';
import WarrantyComponentIssue from '@/components/warranty-component-issue';
import './dashboard-prototype.css';

type Navigate = (route: DemoRoute) => void;
type Scene = 'ready' | 'loading' | 'empty' | 'error' | 'stale' | 'denied';
const SCENES = [
  { value: 'ready', label: 'Có dữ liệu' },
  { value: 'loading', label: 'Đang tải' },
  { value: 'empty', label: 'Trống' },
  { value: 'error', label: 'Lỗi tải' },
  { value: 'stale', label: 'Dữ liệu cũ' },
  { value: 'denied', label: 'Không có quyền' },
];
const routeOf = (
  view: string,
  filter = '',
  id = '',
  action = '',
): DemoRoute => ({ view, filter, id, action });

function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`hn-pill ${tone}`}>{children}</span>;
}
function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`hn-notice ${tone}`}>
      <Info aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
function DemoSelect({
  label,
  value,
  options,
  onChange,
  id,
}: {
  id?: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(value) => {
        if (value !== null) onChange(value);
      }}
      items={options}
    >
      <SelectTrigger id={id} className="hn-select" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="hn-select-menu" alignItemWithTrigger={false}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function DataTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption: string;
}) {
  return (
    <Table className="hn-table">
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow>
          {headers.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j}>{cell}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={headers.length}>
              <div className="hn-empty">
                <Search />
                <strong>Không có kết quả phù hợp</strong>
                <span>Thử xóa từ khóa hoặc đổi bộ lọc.</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
function ItemName({ item }: { item: Stock }) {
  return (
    <span className="hn-item">
      <strong>{item.name}</strong>
      <small>
        {item.id} · {typeName(item.type)}
      </small>
    </span>
  );
}
function MovementTable({ rows }: { rows: Movement[] }) {
  return (
    <DataTable
      caption="Các dòng sổ minh họa"
      headers={['Ngày', 'SKU', 'Nghiệp vụ', 'Số lượng', 'Chứng từ mẫu']}
      rows={rows.map((m) => [
        formatDay(m.day),
        m.sku,
        m.kind === 'in'
          ? 'Nhập ghi sổ'
          : m.kind === 'out'
            ? 'Xuất ghi sổ'
            : 'Hoàn tác mẫu',
        <span className="hn-number" key="q">
          {m.kind === 'out' ? '−' : '+'}
          {m.quantity} cái
        </span>,
        m.doc,
      ])}
    />
  );
}

export default function DashboardPrototype() {
  const [scene, setScene] = useState<Scene>('ready');
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEMO_DAY);
  const [draftFrom, setDraftFrom] = useState(DEFAULT_FROM);
  const [draftTo, setDraftTo] = useState(DEMO_DAY);
  const [period, setPeriod] = useState('week');
  const [type, setType] = useState<ItemType>('all');
  const [dateError, setDateError] = useState('');
  const [route, setRoute] = useState<DemoRoute>(CLOSED_ROUTE);
  const [dirty, setDirty] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<DemoRoute | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const triggerRef = useRef<HTMLElement | null>(null);
  const fromInput = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readLocation = () => {
    setRoute(parseDemoRoute(window.location.search));
    const p = new URLSearchParams(window.location.search);
    const f = p.get('demoFrom'),
      t = p.get('demoTo'),
      it = p.get('demoType');
    if (
      f &&
      t &&
      /^2026-\d{2}-\d{2}$/.test(f) &&
      /^2026-\d{2}-\d{2}$/.test(t) &&
      f >= '2026-08-01' &&
      t <= DEMO_DAY &&
      f <= t
    ) {
      setFrom(f);
      setTo(t);
      setDraftFrom(f);
      setDraftTo(t);
      setPeriod(f === DEFAULT_FROM && t === DEMO_DAY ? 'week' : 'custom');
    }
    if (it === 'all' || it === 'product' || it === 'component') setType(it);
  };
  useEffect(() => {
    const initialRead = requestAnimationFrame(readLocation);
    const pop = () => {
      setDirty(false);
      setPendingRoute(null);
      readLocation();
    };
    window.addEventListener('hn:prototype-history', pop);
    return () => {
      cancelAnimationFrame(initialRead);
      window.removeEventListener('hn:prototype-history', pop);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function saveUrl(
    next: DemoRoute,
    nextFrom = from,
    nextTo = to,
    nextType = type,
    replace = false,
  ) {
    const url = new URL(window.location.href);
    for (const key of ['demoView', 'demoFilter', 'demoId', 'demoAction'])
      url.searchParams.delete(key);
    if (next.view) {
      url.searchParams.set('demoView', next.view);
      if (next.filter) url.searchParams.set('demoFilter', next.filter);
      if (next.id) url.searchParams.set('demoId', next.id);
      if (next.action) url.searchParams.set('demoAction', next.action);
    }
    url.searchParams.set('demoFrom', nextFrom);
    url.searchParams.set('demoTo', nextTo);
    url.searchParams.set('demoType', nextType);
    url.hash = 'dashboard-prototype';
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  }
  const commitRoute: Navigate = (next) => {
    if (!route.view) triggerRef.current = document.activeElement as HTMLElement;
    setDirty(false);
    setPendingRoute(null);
    setRoute(next);
    saveUrl(next);
    if (!next.view)
      requestAnimationFrame(() =>
        triggerRef.current?.focus({ preventScroll: true }),
      );
  };
  const navigate: Navigate = (next) => {
    if (dirty) setPendingRoute(next);
    else commitRoute(next);
  };
  function applyPeriod(f: string, t: string, p: string) {
    setDateError('');
    setFrom(f);
    setTo(t);
    setDraftFrom(f);
    setDraftTo(t);
    setPeriod(p);
    saveUrl(route, f, t);
  }
  function refresh() {
    setRefreshing(true);
    setNotice('');
    timeoutRef.current = setTimeout(() => {
      setRefreshing(false);
      setScene('ready');
      setNotice('Đã tải lại bộ dữ liệu minh họa. Không gọi hệ thống kho thật.');
    }, 650);
  }
  const isData = scene === 'ready' || scene === 'stale';
  const title = route.action
    ? {
        edit: 'Sửa thông tin hồ sơ',
        status: 'Cập nhật trạng thái bảo hành',
        components: 'Xuất linh kiện · Phiếu nháp',
        print: 'Phiếu xuất · Xem luồng in nhãn',
        complete: 'Hoàn thiện thông tin SKU',
      }[route.action] || 'Trạng thái minh họa'
    : route.id
      ? {
          trace: 'Truy vết SKU',
          inventory: 'Chi tiết tồn & đối soát',
          warranty: 'Chi tiết bảo hành',
          labels: 'Chi tiết nhãn',
          quality: 'Chi tiết lô dữ liệu',
          metric: 'Chi tiết sổ minh họa',
        }[route.view] || 'Chi tiết'
      : {
          inventory: 'Tra cứu tồn & đối soát',
          warranty: 'Hồ sơ bảo hành',
          labels: 'Nhãn cần kiểm tra',
          quality: 'Lỗi nhập liệu',
          sku: 'SKU chờ hoàn thiện',
          trace: 'Truy vết SKU',
          metric: 'Sổ phát sinh trong kỳ',
          definitions: 'Phạm vi và định nghĩa số liệu',
          handoff: 'Bàn giao Dashboard cho DEV',
        }[route.view] || 'Màn chưa được mô phỏng';
  const back = () => {
    if (route.action) navigate({ ...route, action: '' });
    else if (route.view === 'trace' && route.id)
      navigate(routeOf('inventory', route.filter, route.id));
    else if (route.id) navigate({ ...route, id: '' });
    else navigate(CLOSED_ROUTE);
  };

  return (
    <section
      id="dashboard-prototype"
      className="content-section hn-prototype-section"
      aria-labelledby="dashboard-prototype-heading"
    >
      <div className="section-heading">
        <span className="section-number">D01</span>
        <div>
          <span className="section-eyebrow">PROTOTYPE · DASHBOARD</span>
          <h2 id="dashboard-prototype-heading">Tổng quan vận hành</h2>
        </div>
        <Pill tone="purple">Dữ liệu minh họa</Pill>
      </div>
      <div className="hn-demo hn-refined">
        <div className="hn-demo-controls">
          <div>
            <SlidersHorizontal />
            <strong>Trạng thái mô phỏng</strong>
          </div>
          <DemoSelect
            label="Trạng thái Dashboard mô phỏng"
            value={scene}
            options={SCENES}
            onChange={(value) => {
              setScene(value as Scene);
              setNotice('');
            }}
          />
          <Button
            variant="outline"
            onClick={() => navigate(routeOf('handoff'))}
          >
            Hướng dẫn & phạm vi <Info />
          </Button>
        </div>
        <div className="hn-workspace" aria-label="Dashboard mô phỏng">
          <div className="hn-app-header">
            <div className="hn-warehouse">
              <span>
                <Warehouse />
              </span>
              <div>
                <strong>Kho minh họa Hoa Nam</strong>
                <small>Prototype · Không kết nối backend</small>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate(routeOf('definitions'))}
            >
              <Info />
              Định nghĩa số liệu
            </Button>
          </div>
          <div className="hn-workspace-body">
            <div className="hn-page-heading">
              <div>
                <h3>Tổng quan vận hành</h3>
                <p>Ưu tiên xử lý ngoại lệ, sau đó kiểm tra luồng hàng.</p>
              </div>
              <span className="hn-snapshot">
                <Clock3 />
                Bộ dữ liệu mẫu · {SNAPSHOT}
              </span>
            </div>
            <div className="hn-filters">
              <div className="hn-filter-block">
                <span>Kỳ số liệu phát sinh</span>
                <div className="hn-segments" aria-label="Chọn kỳ số liệu">
                  {[
                    { value: 'today', label: 'Hôm nay' },
                    { value: 'week', label: '7 ngày' },
                    { value: 'month', label: 'Trong tháng' },
                    { value: 'custom', label: 'Tùy chọn' },
                  ].map((p) => (
                    <Button
                      key={p.value}
                      variant="ghost"
                      aria-pressed={period === p.value}
                      onClick={() =>
                        p.value === 'custom'
                          ? setPeriod('custom')
                          : applyPeriod(
                              p.value === 'today'
                                ? DEMO_DAY
                                : p.value === 'week'
                                  ? DEFAULT_FROM
                                  : '2026-09-01',
                              DEMO_DAY,
                              p.value,
                            )
                      }
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="hn-filter-block">
                <span>Loại hàng · KPI, sổ, biểu đồ</span>
                <DemoSelect
                  label="Loại hàng Dashboard"
                  value={type}
                  options={[
                    { value: 'all', label: 'Toàn bộ loại hàng' },
                    { value: 'product', label: 'Sản phẩm' },
                    { value: 'component', label: 'Linh kiện' },
                  ]}
                  onChange={(value) => {
                    setType(value as ItemType);
                    saveUrl(route, from, to, value as ItemType);
                  }}
                />
              </div>
              <Button
                className="hn-primary"
                disabled={refreshing}
                onClick={refresh}
              >
                {refreshing ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <RefreshCw />
                )}
                Làm mới demo
              </Button>
              {period === 'custom' && (
                <form
                  className="hn-date-range"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const submitted = new FormData(event.currentTarget);
                    const startValue = submitted.get('from');
                    const endValue = submitted.get('to');
                    const start =
                      typeof startValue === 'string' ? startValue : '';
                    const end = typeof endValue === 'string' ? endValue : '';
                    if (!start || !end || start > end) {
                      setDateError('Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
                      fromInput.current?.focus();
                      return;
                    }
                    if (start < '2026-08-01' || end > DEMO_DAY) {
                      setDateError(
                        'Bộ dữ liệu demo chỉ bao phủ 01/08–05/09/2026; không phải giới hạn nghiệp vụ thật.',
                      );
                      return;
                    }
                    applyPeriod(start, end, 'custom');
                  }}
                >
                  <label htmlFor="hn-field-2">
                    Từ ngày
                    <Input
                      id="hn-field-2"
                      name="from"
                      ref={fromInput}
                      type="date"
                      value={draftFrom}
                      onChange={(e) => setDraftFrom(e.target.value)}
                      aria-invalid={!!dateError}
                      aria-describedby={dateError ? 'hn-date-error' : undefined}
                      required
                    />
                  </label>
                  <label htmlFor="hn-field-3">
                    Đến ngày
                    <Input
                      id="hn-field-3"
                      name="to"
                      type="date"
                      value={draftTo}
                      onChange={(e) => setDraftTo(e.target.value)}
                      required
                    />
                  </label>
                  <Button type="submit" className="hn-primary">
                    Áp dụng bộ lọc
                  </Button>
                  {dateError && (
                    <p
                      id="hn-date-error"
                      className="hn-form-error"
                      role="alert"
                    >
                      {dateError}
                    </p>
                  )}
                </form>
              )}
            </div>
            {notice && <output className="hn-live-note">{notice}</output>}
            {scene === 'stale' && (
              <Notice tone="warning">
                <strong>Dữ liệu cũ — trạng thái minh họa.</strong> Không dùng để
                quyết định xuất hàng.{' '}
                <Button variant="ghost" onClick={refresh}>
                  Tải lại demo
                </Button>
              </Notice>
            )}
            {!isData ? (
              <div className="hn-scene" aria-busy={scene === 'loading'}>
                {scene === 'loading' ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    <h4>Đang tải Dashboard — mô phỏng</h4>
                    <p>
                      Chưa hiển thị số liệu. Chọn “Có dữ liệu” để xem trạng thái
                      hoàn tất.
                    </p>
                    <div className="hn-skeletons">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="hn-skeleton" />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {scene === 'denied' ? (
                      <ShieldAlert />
                    ) : scene === 'error' ? (
                      <AlertCircle />
                    ) : (
                      <PackageCheck />
                    )}
                    <h4>
                      {scene === 'denied'
                        ? 'Bạn chưa có quyền xem Dashboard'
                        : scene === 'error'
                          ? 'Không tải được dữ liệu'
                          : 'Chưa có dữ liệu trong phạm vi này'}
                    </h4>
                    <p>
                      {scene === 'denied'
                        ? 'Đây là trạng thái minh họa. Quyền thật cần được xác thực ở máy chủ.'
                        : scene === 'error'
                          ? 'Mô phỏng lỗi tải: không thay dữ liệu bằng số 0.'
                          : 'Trạng thái trống minh họa; không suy ra kho thực tế đang hết hàng.'}
                    </p>
                    <Button
                      className="hn-primary"
                      onClick={() => setScene('ready')}
                    >
                      Về dữ liệu demo
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <DashboardDataSurface
                from={from}
                to={to}
                type={type}
                navigate={navigate}
              />
            )}
            <div className="hn-demo-foot">
              <Info />
              <span>
                Dữ liệu DEMO độc lập, không phải số liệu vận hành. Mọi kết quả
                ghi/in chỉ là mô phỏng.
              </span>
            </div>
          </div>
        </div>
        <div className="hn-handoff-strip">
          <span>
            <strong>Phần bổ sung theo báo cáo Dashboard</strong> · Không thay
            đổi Đăng nhập / Quên mật khẩu.
          </span>
          <Button variant="ghost" onClick={() => navigate(routeOf('handoff'))}>
            Xem bàn giao DEV <ArrowRight />
          </Button>
        </div>
      </div>
      <Dialog
        open={!!route.view}
        onOpenChange={(open) => {
          if (!open) navigate(CLOSED_ROUTE);
        }}
      >
        <DialogContent className="hn-demo-dialog" showCloseButton={false}>
          <div className="hn-dialog-header">
            <div>
              <span className="hn-dialog-eyebrow">
                PROTOTYPE · DỮ LIỆU MINH HỌA
              </span>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Không kết nối backend. Thao tác ở đây không thay đổi dữ liệu kho
                thật.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              aria-label="Đóng màn action"
              onClick={() => navigate(CLOSED_ROUTE)}
            >
              <X />
            </Button>
          </div>
          <div className="hn-dialog-toolbar">
            <Button variant="ghost" onClick={back}>
              <ArrowLeft />
              {route.id || route.action ? 'Quay lại' : 'Về Dashboard'}
            </Button>
            <span>
              {['warranty', 'labels', 'quality', 'sku'].includes(route.view) ||
              route.filter === 'variance'
                ? 'Toàn bộ loại hàng'
                : typeName(type)}{' '}
              ·{' '}
              {route.view === 'metric'
                ? `${formatDay(from)} – ${formatDay(to)}`
                : `Tồn / công việc hiện tại · ${SNAPSHOT}`}
            </span>
          </div>
          <div
            className="hn-dialog-body"
            key={`${route.view}-${route.filter}-${route.id}-${route.action}`}
          >
            <ActionContent
              route={route}
              navigate={navigate}
              type={type}
              from={from}
              to={to}
              onDirty={setDirty}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={pendingRoute !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRoute(null);
        }}
      >
        <AlertDialogContent className="hn-discard-dialog">
          <AlertDialogTitle>Bỏ nội dung đang nhập?</AlertDialogTitle>
          <AlertDialogDescription>
            Nội dung mới chỉ ở bản mô phỏng và chưa được lưu. Bạn có thể tiếp
            tục chỉnh sửa.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục nhập</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRoute) commitRoute(pendingRoute);
              }}
            >
              Bỏ nội dung
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ActionContent({
  route,
  navigate,
  type,
  from,
  to,
  onDirty,
}: {
  route: DemoRoute;
  navigate: Navigate;
  type: ItemType;
  from: string;
  to: string;
  onDirty: (dirty: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const items = stockForType(type);
  const queryMatches = (text: string) =>
    normalize(text).includes(normalize(query));
  if (route.action)
    return (
      <DemoActionForm route={route} navigate={navigate} onDirty={onDirty} />
    );
  if (route.view === 'definitions')
    return (
      <>
        <Notice>
          <strong>Chờ chốt nghiệp vụ.</strong> Các công thức sau chỉ giải thích
          bộ dữ liệu demo, không thay thế công thức của hệ thống thật.
        </Notice>
        <DataTable
          caption="Phạm vi số liệu mẫu"
          headers={['Chỉ số', 'Cách tính trong demo', 'Phạm vi']}
          rows={[
            [
              'Tồn khả dụng (mẫu)',
              'Tồn ghi nhận − chờ kiểm tra − khóa xuất − hàng lỗi. Chưa mô phỏng giữ chỗ.',
              'Chốt mẫu 05/09/2026 16:30; theo loại hàng',
            ],
            [
              'Tồn theo sổ',
              'Số dư sổ của mỗi SKU. Độc lập với tồn ghi nhận để minh họa chênh lệch.',
              'Cùng thời điểm snapshot',
            ],
            [
              'Nhập / xuất trong kỳ',
              'Cộng dòng DEMO trong kỳ theo loại hàng; cùng dữ liệu với bảng chi tiết.',
              'Từ ngày đến ngày, bao gồm hai đầu',
            ],
            [
              'Hoàn tác mẫu',
              'Dòng cộng lại vào sổ DEMO. Phân loại hoàn tác thật chưa được chốt.',
              'Cùng kỳ số liệu',
            ],
            [
              'SKU dưới / vượt định mức',
              'So sánh khả dụng mẫu với min/max đã gán cho SKU.',
              'Hiện tại, theo loại hàng',
            ],
            [
              'Nhóm công việc ưu tiên',
              'Đếm đúng các bản ghi mẫu trong từng nhóm; không cộng nhóm khác đơn vị.',
              'Hiện tại, toàn bộ loại hàng',
            ],
            [
              'Hồ sơ quá hạn',
              'Hạn mẫu gán riêng cho từng hồ sơ; không suy diễn SLA sản xuất.',
              'Hiện tại, toàn bộ hồ sơ mẫu',
            ],
          ]}
        />
        <h4>Không được suy diễn khi tích hợp</h4>
        <p>
          BA/PO cần xác nhận giữ chỗ, nguồn/cutoff, đơn vị tính, lịch SLA, quyền
          chuyển trạng thái, quy tắc in lại, điều kiện đủ thông tin SKU. Không
          sửa số thật để làm KPI trông khớp.
        </p>
      </>
    );
  if (route.view === 'handoff')
    return (
      <>
        <Notice>
          Prototype bổ sung chỉ minh họa cách sửa UI và đường đi. Điểm audit{' '}
          <strong>60/100</strong> thuộc hệ thống được khảo sát, không phải điểm
          nghiệm thu của bản mới.
        </Notice>
        <DataTable
          caption="Phạm vi bàn giao Dashboard"
          headers={['Backlog', 'Nhóm sửa', 'Trong prototype']}
          rows={HANDOFF.map((row) => [...row])}
        />
        <h4>Cách thử</h4>
        <ol>
          <li>Chọn kỳ và loại hàng; mở KPI để đối chiếu các dòng sổ mẫu.</li>
          <li>
            Bấm một nhóm công việc để đến danh sách đã lọc; mở chi tiết và quay
            lại.
          </li>
          <li>
            Trong form chọn kết quả mô phỏng thành công, lỗi hoặc xung đột.
            Không có yêu cầu ghi nào gửi ra ngoài.
          </li>
          <li>
            Dùng bộ chọn trạng thái trên Dashboard để xem tải, trống, lỗi, dữ
            liệu cũ và không quyền.
          </li>
        </ol>
        <Notice tone="warning">
          <strong>Cần chốt trước khi triển khai thật:</strong> công thức KPI/khả
          dụng, SLA, quyền thao tác, in lại, điều kiện trường bắt buộc. Camera,
          máy in, phân quyền thật và API chưa kết nối.
        </Notice>
        <p>
          Bản mô phỏng giữ nháp khi thử lỗi; kết quả mô phỏng không cập nhật bộ
          dữ liệu gốc. Khi dùng nút Back của trình duyệt rời form, nội dung form
          không được lưu. Hãy dùng Quay lại/Đóng trong màn để nhận cảnh báo bỏ
          nội dung.
        </p>
      </>
    );
  if (route.view === 'inventory') {
    const item = STOCK.find((s) => s.id === route.id);
    if (route.id && !item)
      return <Notice>Không có SKU này trong bộ dữ liệu mẫu.</Notice>;
    if (item)
      return (
        <>
          <div className="hn-detail-heading">
            <ItemName item={item} />
            <Pill tone={difference(item) ? 'danger' : 'success'}>
              {difference(item) ? 'Có chênh lệch' : 'Khớp tại mẫu'}
            </Pill>
          </div>
          <div className="hn-comparator">
            {[
              { label: 'Tồn ghi nhận', value: item.balance },
              { label: 'Tồn theo sổ', value: item.ledger },
              { label: 'Chênh lệch', value: difference(item) },
            ].map((v) => (
              <div key={v.label}>
                <span>{v.label}</span>
                <strong>
                  {v.value > 0 && v.label === 'Chênh lệch' ? '+' : ''}
                  {v.value}
                  <small> cái</small>
                </strong>
              </div>
            ))}
          </div>
          <Notice tone={difference(item) ? 'warning' : 'info'}>
            {difference(item)
              ? `Tồn ghi nhận ${difference(item) < 0 ? 'thấp' : 'cao'} hơn sổ ${Math.abs(difference(item))} cái. Kiểm tra chứng từ; không tự sửa tồn cho khớp.`
              : 'Tồn ghi nhận và sổ khớp ở SKU mẫu này.'}
          </Notice>
          <dl className="hn-definition-grid">
            <div>
              <dt>Kho / vị trí</dt>
              <dd>Kho minh họa · {item.location}</dd>
            </div>
            <div>
              <dt>Thời điểm so sánh</dt>
              <dd>{SNAPSHOT}</dd>
            </div>
            <div>
              <dt>Khả dụng (mẫu)</dt>
              <dd>{available(item)} cái</dd>
            </div>
            <div>
              <dt>Loại trừ trong demo</dt>
              <dd>
                Chờ kiểm tra {item.quarantine} · Khóa {item.blocked} · Lỗi{' '}
                {item.defective}
              </dd>
            </div>
          </dl>
          <Button
            className="hn-primary"
            onClick={() => navigate(routeOf('trace', route.filter, item.id))}
          >
            <Search />
            Truy vết SKU
          </Button>
          <h4>Biến động gần nhất · dữ liệu minh họa</h4>
          <MovementTable
            rows={MOVEMENTS.filter((m) => m.sku === item.id)
              .slice(-8)
              .reverse()}
          />
          <details>
            <summary>Thông tin kỹ thuật dành cho DEV</summary>
            <p>
              Delta = balance − ledger. Mã minh họa:
              BALANCE_NOT_EQUAL_SIGNED_LEDGER_SUM. Nguyên nhân thật cần được
              điều tra từ sổ và chứng từ, không suy ra từ demo.
            </p>
          </details>
        </>
      );
    const filter = ['variance', 'low', 'high', 'all'].includes(route.filter)
      ? route.filter
      : 'all';
    // Exception queue is explicitly all types; threshold/KPI drill-down follows the type filter.
    const base = filter === 'variance' ? STOCK : items;
    const filtered = base.filter(
      (s) =>
        (filter === 'variance'
          ? difference(s) !== 0
          : filter === 'low'
            ? available(s) < s.min
            : filter === 'high'
              ? available(s) > s.max
              : true) && queryMatches(`${s.id} ${s.name}`),
    );
    return (
      <>
        <div className="hn-list-controls">
          <DemoSelect
            label="Chế độ xem tồn kho"
            value={filter}
            options={[
              { value: 'variance', label: 'Có chênh lệch · Tất cả loại hàng' },
              { value: 'low', label: 'Dưới định mức' },
              { value: 'high', label: 'Vượt định mức' },
              { value: 'all', label: 'Tất cả trong loại hàng' },
            ]}
            onChange={(f) => navigate({ ...route, filter: f })}
          />
          <Input
            aria-label="Tìm SKU tồn kho"
            placeholder="Tìm mã hoặc tên SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Pill>{filtered.length} SKU mẫu</Pill>
        </div>
        <Notice>
          Đến từ Dashboard ·{' '}
          {filter === 'variance'
            ? 'Các dòng có chênh lệch · Toàn bộ loại hàng'
            : typeName(type)}
          . Bảng cuộn ngang riêng nếu cần; không thay đổi số tồn.
        </Notice>
        <DataTable
          caption="Danh sách tồn đã lọc"
          headers={[
            'SKU / tên hàng',
            'Khả dụng mẫu',
            'Ghi nhận',
            'Theo sổ',
            'Chênh lệch',
            'Min / Max',
            'Vị trí',
            'Thao tác',
          ]}
          rows={filtered.map((s) => [
            <ItemName item={s} key="name" />,
            `${available(s)} cái`,
            s.balance,
            s.ledger,
            <Pill key="delta" tone={difference(s) ? 'danger' : 'neutral'}>
              {difference(s) > 0 ? '+' : ''}
              {difference(s)}
            </Pill>,
            `${s.min} / ${s.max}`,
            s.location,
            <Button
              key="open"
              variant="outline"
              aria-label={`Xem tồn ${s.id}`}
              onClick={() => navigate({ ...route, id: s.id })}
            >
              Xem chi tiết
            </Button>,
          ])}
        />
      </>
    );
  }
  if (route.view === 'trace') return <TraceView initialSku={route.id} />;
  if (route.view === 'metric') {
    const m = periodMetrics(from, to, type);
    const filtered = m.rows
      .filter((r) =>
        route.filter === 'in'
          ? r.kind === 'in'
          : route.filter === 'product'
            ? r.kind === 'out' &&
              STOCK.find((s) => s.id === r.sku)?.type === 'product'
            : route.filter === 'component'
              ? r.kind === 'out' &&
                STOCK.find((s) => s.id === r.sku)?.type === 'component'
              : route.filter === 'sku'
                ? r.kind === 'out' && r.sku === route.id
                : true,
      )
      .filter((r) => queryMatches(`${r.sku} ${r.doc}`));
    return (
      <>
        <Notice>
          Đúng kỳ {formatDay(from)} – {formatDay(to)} · {typeName(type)} ·{' '}
          {route.filter === 'in'
            ? 'Chỉ nhập'
            : route.filter === 'product'
              ? 'Chỉ xuất sản phẩm'
              : route.filter === 'component'
                ? 'Chỉ xuất linh kiện'
                : route.filter === 'sku'
                  ? route.id
                  : 'Mọi phát sinh'}
          . Dòng sổ mẫu, không phải chứng từ thật.
        </Notice>
        <div className="hn-list-controls">
          <Input
            aria-label="Tìm trong sổ demo"
            placeholder="Tìm SKU hoặc chứng từ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Pill>{filtered.length} dòng</Pill>
          <Pill tone="purple">
            {route.filter === 'all' ? 'Biến động ròng' : 'Tổng lượng'}:{' '}
            {n(
              total(filtered, (r) =>
                route.filter === 'all' && r.kind === 'out'
                  ? -r.quantity
                  : r.quantity,
              ),
            )}{' '}
            cái
          </Pill>
        </div>
        <MovementTable rows={filtered} />
      </>
    );
  }
  if (route.view === 'warranty') {
    const w = WARRANTIES.find((w) => w.id === route.id);
    if (route.id && !w)
      return <Notice>Không có hồ sơ này trong bộ dữ liệu mẫu.</Notice>;
    if (w)
      return (
        <>
          <div className="hn-detail-heading">
            <div>
              <h4>{w.id}</h4>
              <p>
                {w.serial} · {w.sku}
              </p>
            </div>
            <Pill tone={w.overdue ? 'danger' : 'purple'}>{w.status}</Pill>
          </div>
          <div className="hn-sla">
            <Clock3 />
            <strong>
              {w.overdue
                ? `Quá hạn mẫu ${w.overdue} ngày`
                : 'Chưa quá hạn trong mẫu'}
            </strong>
            <span>Hạn: {formatDay(w.due)}</span>
            <Pill tone="warning">SLA thật: chờ chốt</Pill>
          </div>
          <div
            className="hn-progress"
            aria-label="Các bước xử lý bảo hành minh họa"
          >
            {[
              'Đã tiếp nhận',
              'Đang kiểm tra',
              'Đang sửa chữa',
              'Đã hoàn tất xử lý',
              'Đã trả khách',
            ].map((s, i) => (
              <span key={s} className={s === w.status ? 'current' : ''}>
                <i>{i + 1}</i>
                {s}
              </span>
            ))}
          </div>
          <Tabs defaultValue="overview" className="hn-tabs">
            <TabsList>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="media">Ảnh & video (0)</TabsTrigger>
              <TabsTrigger value="parts">Linh kiện (1)</TabsTrigger>
              <TabsTrigger value="history">Lịch sử (2)</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <dl className="hn-definition-grid">
                <div>
                  <dt>Ngày tiếp nhận</dt>
                  <dd>{formatDay(w.received)}</dd>
                </div>
                <div>
                  <dt>Ngày dự kiến</dt>
                  <dd>{formatDay(w.due)}</dd>
                </div>
                <div>
                  <dt>Bệnh / lỗi mẫu</dt>
                  <dd>{w.fault}</dd>
                </div>
                <div>
                  <dt>Trạng thái hiện vật</dt>
                  <dd>Đang bảo hành · không tự trở về tồn bán</dd>
                </div>
              </dl>
              <h4>Chẩn đoán minh họa</h4>
              <p>
                Kiểm tra linh kiện liên quan đến lỗi tiếp nhận. Kết quả xử lý và
                người phụ trách cần được ghi nhận theo quy trình thật.
              </p>
              <details>
                <summary>Khách hàng & tiếp nhận</summary>
                <p>
                  Khách hàng minh họa · Không sử dụng tên, số điện thoại hoặc
                  địa chỉ thật. Máy nhận cùng phụ kiện mẫu.
                </p>
              </details>
            </TabsContent>
            <TabsContent value="media">
              <div className="hn-empty">
                Chưa có ảnh/video trong bộ dữ liệu minh họa. Không hỗ trợ tải
                tệp trong prototype.
              </div>
            </TabsContent>
            <TabsContent value="parts">
              <DataTable
                caption="Linh kiện của hồ sơ mẫu"
                headers={['Linh kiện', 'SL', 'Trạng thái']}
                rows={[[STOCK[2].name, '1 cái', 'Dòng minh họa · chưa ghi sổ']]}
              />
            </TabsContent>
            <TabsContent value="history">
              <ol className="hn-timeline">
                <li>
                  <strong>{formatDay(w.received)}</strong>
                  <span>Tiếp nhận hồ sơ mẫu.</span>
                </li>
                <li>
                  <strong>05/09/2026 · 14:00</strong>
                  <span>
                    Ghi chú kiểm tra minh họa; không phải nhật ký thật.
                  </span>
                </li>
              </ol>
            </TabsContent>
          </Tabs>
          <div className="hn-action-row">
            <Button
              variant="outline"
              onClick={() => navigate({ ...route, action: 'edit' })}
            >
              Sửa thông tin
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ ...route, action: 'components' })}
            >
              Xuất linh kiện
            </Button>
            <Button
              className="hn-primary"
              onClick={() => navigate({ ...route, action: 'status' })}
            >
              Cập nhật trạng thái
            </Button>
          </div>
        </>
      );
    const filter = ['overdue', 'due', 'open', 'all'].includes(route.filter)
      ? route.filter
      : 'overdue';
    const filtered = WARRANTIES.filter(
      (w) =>
        (filter === 'overdue'
          ? w.overdue > 0
          : filter === 'due'
            ? w.due === DEMO_DAY && w.status !== 'Đã trả khách'
            : filter === 'open'
              ? w.status !== 'Đã trả khách'
              : true) &&
        queryMatches(`${w.id} ${w.serial} ${w.sku} ${w.fault}`),
    ).sort((a, b) => b.overdue - a.overdue || a.id.localeCompare(b.id));
    return (
      <>
        <div className="hn-list-controls">
          <DemoSelect
            label="Bộ lọc bảo hành"
            value={filter}
            options={[
              { value: 'overdue', label: 'Quá hạn' },
              { value: 'due', label: 'Đến hạn hôm nay (mẫu)' },
              { value: 'open', label: 'Đang mở' },
              { value: 'all', label: 'Tất cả hồ sơ mẫu' },
            ]}
            onChange={(f) => navigate({ ...route, filter: f })}
          />
          <Input
            aria-label="Tìm hồ sơ bảo hành demo"
            placeholder="Tìm mã hồ sơ, serial, lỗi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Pill>{filtered.length} hồ sơ mẫu</Pill>
        </div>
        <Notice>
          Toàn bộ loại hàng · Sắp xếp quá hạn nhiều nhất trước. Hạn mẫu minh
          họa, không khẳng định quy tắc SLA thật.
        </Notice>
        <DataTable
          caption="Hồ sơ bảo hành đã lọc"
          headers={[
            'Hồ sơ / serial',
            'Bệnh / lỗi',
            'Hạn dự kiến',
            'Quá hạn',
            'Trạng thái',
            'Thao tác',
          ]}
          rows={filtered.map((w) => [
            <span className="hn-item" key="id">
              <strong>{w.id}</strong>
              <small>{w.serial}</small>
            </span>,
            w.fault,
            formatDay(w.due),
            <Pill key="due" tone={w.overdue ? 'danger' : 'neutral'}>
              {w.overdue ? `${w.overdue} ngày` : 'Không'}
            </Pill>,
            w.status,
            <Button
              key="open"
              variant="outline"
              aria-label={`Xem hồ sơ ${w.id}`}
              onClick={() => navigate({ ...route, id: w.id })}
            >
              Xem chi tiết
            </Button>,
          ])}
        />
      </>
    );
  }
  if (route.view === 'labels') {
    const l = LABELS.find((l) => l.id === route.id);
    if (route.id && !l)
      return <Notice>Không có nhãn này trong bộ dữ liệu mẫu.</Notice>;
    if (l)
      return (
        <>
          <div className="hn-detail-heading">
            <h4>{l.id}</h4>
            <Pill
              tone={
                l.status === 'Đã in'
                  ? 'success'
                  : l.status === 'Thất bại'
                    ? 'danger'
                    : 'warning'
              }
            >
              {l.status}
            </Pill>
          </div>
          <Notice tone="warning">
            Màn này chỉ đọc. Lệnh in/in lại thuộc phiếu xuất. Khi chưa rõ máy in
            đã nhận lệnh, không tự thử lại.
          </Notice>
          <dl className="hn-definition-grid">
            <div>
              <dt>Phiếu xuất mẫu</dt>
              <dd>{l.doc}</dd>
            </div>
            <div>
              <dt>Máy in / lần gần nhất</dt>
              <dd>
                {l.printer} · {l.time}
              </dd>
            </div>
            <div>
              <dt>Kết quả / nguyên nhân</dt>
              <dd>{l.reason}</dd>
            </div>
            <div>
              <dt>Phiên bản nhãn</dt>
              <dd>{l.version}</dd>
            </div>
          </dl>
          <div className="hn-label-preview">
            <Printer />
            <strong>BẢN XEM TRƯỚC MINH HỌA</strong>
            <span>
              {l.id} · {l.version}
            </span>
            <span>
              {l.sku} · {l.doc}
            </span>
            <small>Không phải mẫu nhãn đã được duyệt · Không dùng để in</small>
          </div>
          <h4>Lịch sử lần thử — dữ liệu mẫu</h4>
          <DataTable
            caption="Lịch sử in mẫu"
            headers={['Thời điểm', 'Kết quả', 'Ghi chú']}
            rows={[[l.time, l.status, l.reason]]}
          />
          <Button
            className="hn-primary"
            onClick={() => navigate({ ...route, action: 'print' })}
          >
            Mở phiếu xuất mẫu <ArrowRight />
          </Button>
        </>
      );
    const filtered = LABELS.filter(
      (l) =>
        (route.filter === 'all' || l.status !== 'Đã in') &&
        queryMatches(`${l.id} ${l.doc} ${l.sku}`),
    );
    return (
      <>
        <Notice>
          Đến từ Dashboard · Nhãn thất bại và chờ phản hồi được phân biệt. Bộ dữ
          liệu minh họa, không có lệnh in thật.
        </Notice>
        <div className="hn-list-controls">
          <DemoSelect
            label="Bộ lọc nhãn"
            value={route.filter || 'pending'}
            options={[
              { value: 'pending', label: 'Cần kiểm tra' },
              { value: 'all', label: 'Tất cả nhãn mẫu' },
            ]}
            onChange={(filter) => navigate({ ...route, filter })}
          />
          <Input
            aria-label="Tìm nhãn demo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mã nhãn / phiếu xuất…"
          />
          <Pill>{filtered.length} nhãn mẫu</Pill>
        </div>
        <DataTable
          caption="Nhãn đã lọc"
          headers={[
            'Nhãn / phiếu xuất',
            'Kết quả',
            'Nguyên nhân',
            'Lần gần nhất',
            'Thao tác',
          ]}
          rows={filtered.map((l) => [
            <span className="hn-item" key="id">
              <strong>{l.id}</strong>
              <small>{l.doc}</small>
            </span>,
            <Pill
              key="status"
              tone={
                l.status === 'Thất bại'
                  ? 'danger'
                  : l.status === 'Đã in'
                    ? 'success'
                    : 'warning'
              }
            >
              {l.status}
            </Pill>,
            l.reason,
            l.time,
            <Button
              key="open"
              variant="outline"
              aria-label={`Xem nhãn ${l.id}`}
              onClick={() => navigate({ ...route, id: l.id })}
            >
              Xem chi tiết
            </Button>,
          ])}
        />
      </>
    );
  }
  if (route.view === 'quality') {
    const filtered = IMPORT_ERRORS.filter(
      (e) =>
        (!route.id || e.batch === route.id) &&
        queryMatches(`${e.file} ${e.field} ${e.reason}`),
    );
    return (
      <>
        <Notice>
          Đến từ Dashboard · 5 dòng lỗi trong 2 lô mẫu · 3 không hợp lệ + 2
          trùng. Cùng tập dữ liệu với số đếm Dashboard.
        </Notice>
        <div className="hn-list-controls">
          <Input
            aria-label="Tìm lỗi nhập demo"
            placeholder="Tệp, trường, nội dung lỗi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Pill>{filtered.length} dòng lỗi</Pill>
          {route.id && (
            <Pill tone="warning">{route.id} · Có dòng cần xử lý</Pill>
          )}
        </div>
        <DataTable
          caption="Chi tiết lỗi từng dòng"
          headers={[
            'Lô / tệp',
            'Dòng Excel',
            'Trường',
            'Giá trị mẫu',
            'Lỗi & cách sửa',
            'Thao tác',
          ]}
          rows={filtered.map((e) => [
            <span className="hn-item" key="file">
              <strong>{e.batch}</strong>
              <small>{e.file}</small>
            </span>,
            e.row,
            e.field,
            e.value,
            <span className="hn-item" key="fix">
              <strong>{e.reason}</strong>
              <small>{e.fix}</small>
            </span>,
            !route.id ? (
              <Button
                key="detail"
                variant="outline"
                aria-label={`Xem lô ${e.batch} từ dòng ${e.row}`}
                onClick={() => navigate({ ...route, id: e.batch })}
              >
                Xem lô
              </Button>
            ) : (
              <code key="code">{e.code}</code>
            ),
          ])}
        />
        <Notice>
          Prototype không nhập lại Excel và không tạo tệp xuất giả. Cơ chế nhập
          lại/chống trùng và tải tệp lỗi cần tích hợp backend, kiểm thử riêng.
        </Notice>
      </>
    );
  }
  if (route.view === 'sku')
    return (
      <>
        <Notice>
          Đến từ Dashboard · Chỉ SKU thiếu thông tin. Chưa có thao tác cập nhật
          danh mục thật.
        </Notice>
        <DataTable
          caption="SKU chờ hoàn thiện mẫu"
          headers={['SKU / tên', 'Loại', 'Còn thiếu trong mẫu', 'Thao tác']}
          rows={[
            [
              <span className="hn-item" key="id">
                <strong>{PENDING_SKU.name}</strong>
                <small>{PENDING_SKU.id}</small>
              </span>,
              'Linh kiện',
              PENDING_SKU.missing.join(', '),
              <Button
                key="edit"
                className="hn-primary"
                onClick={() =>
                  navigate({ ...route, id: PENDING_SKU.id, action: 'complete' })
                }
              >
                Bổ sung thông tin
              </Button>,
            ],
          ]}
        />
        <p>
          Các trường bắt buộc thật theo loại SKU, Model, Nguồn điện và quyền sửa
          mã: <strong>Chờ chốt nghiệp vụ.</strong>
        </p>
      </>
    );
  return (
    <Notice>Màn này chưa được mô phỏng. Vui lòng quay lại Dashboard.</Notice>
  );
}

function TraceView({ initialSku }: { initialSku: string }) {
  const [query, setQuery] = useState(initialSku);
  const [sku, setSku] = useState(initialSku);
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState('all');
  const item = STOCK.find(
    (s) => s.id.toLowerCase() === sku.trim().toLowerCase(),
  );
  const rows = MOVEMENTS.filter(
    (m) => m.sku === item?.id && (kind === 'all' || m.kind === kind),
  ).reverse();
  return (
    <>
      <form
        className="hn-list-controls"
        onSubmit={(e) => {
          e.preventDefault();
          setSku(query);
          setPage(1);
        }}
      >
        <Input
          aria-label="Mã SKU cần truy vết"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ví dụ DEMO-LK-001"
        />
        <Button type="submit" className="hn-primary">
          <Search />
          Tra cứu mẫu
        </Button>
      </form>
      {!item ? (
        <div className="hn-empty">
          <Search />
          <strong>Không tìm thấy SKU mẫu</strong>
          <p>
            Thử DEMO-LK-001. Prototype chỉ tra SKU mẫu; camera/serial/QR chưa
            kết nối.
          </p>
        </div>
      ) : (
        <>
          <div className="hn-detail-heading">
            <ItemName item={item} />
            <Pill tone="purple">Loại đối tượng: SKU</Pill>
          </div>
          <p>
            {item.location} · Snapshot mẫu {SNAPSHOT}
          </p>
          <div className="hn-list-controls">
            <DemoSelect
              label="Loại biến động truy vết"
              value={kind}
              options={[
                { value: 'all', label: 'Tất cả biến động mẫu' },
                { value: 'in', label: 'Nhập kho' },
                { value: 'out', label: 'Xuất kho' },
                { value: 'return', label: 'Hoàn tác mẫu' },
              ]}
              onChange={(value) => {
                setKind(value);
                setPage(1);
              }}
            />
            <Pill>{rows.length} biến động</Pill>
          </div>
          <MovementTable rows={rows.slice((page - 1) * 10, page * 10)} />
          <div className="hn-pagination">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((v) => v - 1)}
            >
              Trang trước
            </Button>
            <span>
              Trang {page} / {Math.max(1, Math.ceil(rows.length / 10))}
            </span>
            <Button
              variant="outline"
              disabled={page * 10 >= rows.length}
              onClick={() => setPage((v) => v + 1)}
            >
              Trang sau
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function DemoActionForm({
  route,
  navigate,
  onDirty,
}: {
  route: DemoRoute;
  navigate: Navigate;
  onDirty: (dirty: boolean) => void;
}) {
  const w = WARRANTIES.find((w) => w.id === route.id);
  const label = LABELS.find((l) => l.id === route.id);
  const [result, setResult] = useState('');
  const [outcome, setOutcome] = useState('success');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Đã hoàn tất xử lý');
  const [parts, setParts] = useState([
    { key: 1, sku: 'DEMO-LK-001', qty: '1' },
  ]);
  const partKey = useRef(1);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [received, setReceived] = useState(w?.due || DEMO_DAY);
  const [formError, setFormError] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const markDirty = () => {
    onDirty(true);
    setResult('');
  };
  if (route.action === 'components') {
    return <WarrantyComponentIssue warrantyId={w?.id || route.id || '—'} onBack={() => navigate({ ...route, action: '' })} />;
  }
  if (route.action === 'print')
    return (
      <>
        <Notice tone="warning">
          <strong>Chờ chốt nghiệp vụ in/in lại.</strong> Chưa đủ căn cứ để tự
          đặt quyền, số bản, cơ chế retry hoặc thiết kế nhãn chính thức.
        </Notice>
        <dl className="hn-definition-grid">
          <div>
            <dt>Phiếu xuất mẫu</dt>
            <dd>{label?.doc || 'Không tìm thấy'}</dd>
          </div>
          <div>
            <dt>Nhãn / phiên bản</dt>
            <dd>
              {label?.id} · {label?.version}
            </dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{label?.status}</dd>
          </div>
          <div>
            <dt>Máy in</dt>
            <dd>{label?.printer}</dd>
          </div>
        </dl>
        <h4>Điểm kiểm soát cần xác nhận</h4>
        <ol>
          <li>Kiểm tra kết quả lần thử gần nhất tại máy in.</li>
          <li>Đối chiếu dữ liệu và phiên bản nhãn.</li>
          <li>Xác nhận quyền in/in lại, máy in, số bản và lý do.</li>
          <li>Phân biệt đã gửi lệnh với đã in thành công.</li>
        </ol>
        <Button disabled className="hn-primary">
          <Printer />
          Gửi lệnh in — chưa kết nối
        </Button>
        <p>
          Màn chỉ minh họa nơi thực hiện action tại phiếu xuất. Không phát sinh
          lệnh in, kể cả khi thao tác trên website công khai.
        </p>
      </>
    );
  return (
    <>
      <Notice>
        <strong>Form mô phỏng.</strong> Các trường minh họa từ báo cáo. Quy tắc
        bắt buộc/quyền/chuyển trạng thái thật:{' '}
        <strong>Chờ chốt nghiệp vụ.</strong>
      </Notice>
      <form
        ref={formRef}
        className="hn-action-form"
        onChange={markDirty}
        onSubmit={(event) => {
          event.preventDefault();
          setFormError('');
          if (route.action === 'components') {
            if (new Set(parts.map((p) => p.sku)).size !== parts.length) {
              setFormError(
                'Ví dụ này không cho lặp SKU; hãy gộp số lượng vào một dòng. Quy tắc thật cần chốt riêng.',
              );
              return;
            }
            if (
              parts.some(
                (p) =>
                  !Number.isInteger(Number(p.qty)) ||
                  Number(p.qty) < 1 ||
                  Number(p.qty) > available(STOCK.find((s) => s.id === p.sku)!),
              )
            ) {
              setFormError(
                'Số lượng phải là số nguyên dương và không vượt khả dụng của từng linh kiện mẫu. Không tự đổi kho hoặc xuất âm.',
              );
              return;
            }
          }
          if (route.action === 'complete' && (!brand || !category)) {
            setFormError(
              'Hãy chọn Hãng và Nhóm hàng để hoàn thiện ví dụ này. Điều kiện thật cần BA/PO chốt.',
            );
            return;
          }
          if (route.action === 'edit' && w && received < w.received) {
            setFormError(
              'Trong ví dụ này, ngày dự kiến không được trước ngày tiếp nhận.',
            );
            return;
          }
          setBusy(true);
          setResult('');
          timer.current = setTimeout(() => {
            setBusy(false);
            setResult(outcome);
            if (outcome === 'success') onDirty(false);
          }, 650);
        }}
      >
        <fieldset disabled={busy}>
          {route.action === 'edit' && (
            <>
              <div className="hn-form-grid">
                <label htmlFor="hn-field-4">
                  Hồ sơ
                  <Input id="hn-field-4" value={w?.id || route.id} readOnly />
                </label>
                <label htmlFor="hn-field-5">
                  Ngày dự kiến hoàn thành
                  <Input
                    id="hn-field-5"
                    type="date"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                    required
                  />
                </label>
                <label htmlFor="hn-field-6">
                  Khách gửi
                  <Input
                    id="hn-field-6"
                    placeholder="Khách hàng minh họa"
                    autoComplete="off"
                  />
                </label>
                <label htmlFor="hn-field-7">
                  Bệnh / lỗi
                  <Input id="hn-field-7" defaultValue={w?.fault} />
                </label>
              </div>
              <label htmlFor="hn-field-8">
                Kết quả kiểm tra
                <Textarea
                  id="hn-field-8"
                  placeholder="Nhập nội dung minh họa, không nhập dữ liệu cá nhân thật."
                />
              </label>
              <label htmlFor="hn-field-9">
                Lý do hiệu chỉnh (bắt buộc trong demo)
                <Textarea
                  id="hn-field-9"
                  required
                  placeholder="Ví dụ: cập nhật ngày dự kiến sau kiểm tra."
                />
              </label>
            </>
          )}
          {route.action === 'status' && (
            <>
              <div className="hn-transition">
                <Pill>{w?.status || 'Đang xử lý'}</Pill>
                <ArrowRight />
                <Pill tone="purple">{status}</Pill>
              </div>
              <label htmlFor="hn-field-10">
                Trạng thái mới — lựa chọn minh họa
                <DemoSelect
                  id="hn-field-10"
                  label="Trạng thái bảo hành mới"
                  value={status}
                  options={['Đã hoàn tất xử lý', 'Đã trả khách'].map(
                    (value) => ({ value, label: value }),
                  )}
                  onChange={(value) => {
                    setStatus(value);
                    markDirty();
                  }}
                />
              </label>
              <Notice tone="warning">
                Cập nhật trạng thái không tự đưa hiện vật về tồn có thể bán. Các
                lựa chọn trên không khẳng định quyền chuyển tiếp thật của hồ sơ.
              </Notice>
              <label htmlFor="hn-field-11">
                Kết quả xử lý
                <Textarea
                  id="hn-field-11"
                  required
                  maxLength={2000}
                  placeholder="Mô tả kết quả xử lý minh họa…"
                />
              </label>
            </>
          )}
          {route.action === 'components' && (
            <>
              <div className="hn-form-grid">
                <label htmlFor="hn-part-warehouse">
                  Kho xuất
                  <Input
                    id="hn-part-warehouse"
                    value="Kho minh họa Hoa Nam"
                    readOnly
                  />
                </label>
                <label htmlFor="hn-part-warranty">
                  Hồ sơ bảo hành
                  <Input
                    id="hn-part-warranty"
                    value={w?.id || route.id}
                    readOnly
                  />
                </label>
              </div>
              {parts.map((part, i) => (
                <div className="hn-part-row" key={part.key}>
                  <div className="hn-detail-heading">
                    <strong>Dòng {i + 1}</strong>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={parts.length === 1}
                      aria-label={`Xóa dòng linh kiện ${i + 1}`}
                      onClick={() => {
                        setParts((old) =>
                          old.filter((p) => p.key !== part.key),
                        );
                        markDirty();
                      }}
                    >
                      Xóa dòng
                    </Button>
                  </div>
                  <label htmlFor={`hn-part-sku-${part.key}`}>
                    Linh kiện
                    <DemoSelect
                      id={`hn-part-sku-${part.key}`}
                      label={`SKU linh kiện mẫu dòng ${i + 1}`}
                      value={part.sku}
                      options={STOCK.filter((s) => s.type === 'component').map(
                        (s) => ({ value: s.id, label: `${s.id} · ${s.name}` }),
                      )}
                      onChange={(value) => {
                        setParts((old) =>
                          old.map((p) =>
                            p.key === part.key ? { ...p, sku: value } : p,
                          ),
                        );
                        markDirty();
                      }}
                    />
                  </label>
                  <div className="hn-form-grid">
                    <label htmlFor={`hn-part-qty-${part.key}`}>
                      Số lượng cần (cái)
                      <Input
                        id={`hn-part-qty-${part.key}`}
                        aria-label={`Số lượng linh kiện dòng ${i + 1}`}
                        type="number"
                        min="1"
                        step="1"
                        value={part.qty}
                        onChange={(e) =>
                          setParts((old) =>
                            old.map((p) =>
                              p.key === part.key
                                ? { ...p, qty: e.target.value }
                                : p,
                            ),
                          )
                        }
                        required
                      />
                    </label>
                    <div className="hn-available">
                      <span>Khả dụng mẫu của đúng kho · Đang dùng</span>
                      <strong>
                        {available(STOCK.find((s) => s.id === part.sku)!)} cái
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setParts((old) => [
                    ...old,
                    { key: ++partKey.current, sku: 'DEMO-LK-002', qty: '1' },
                  ]);
                  markDirty();
                }}
              >
                + Thêm dòng linh kiện
              </Button>
              <label htmlFor="hn-part-note">
                Ghi chú
                <Textarea id="hn-part-note" placeholder="Nội dung minh họa…" />
              </label>
              <Notice>
                Tạo nháp có giữ chỗ/trừ tồn ở hệ thống thật hay không:{' '}
                <strong>Chờ chốt nghiệp vụ.</strong> Prototype không tạo phiếu
                hay thay đổi số lượng.
              </Notice>
            </>
          )}
          {route.action === 'complete' && (
            <>
              <div className="hn-form-grid">
                <label htmlFor="hn-field-17">
                  Mã SKU
                  <Input id="hn-field-17" value={PENDING_SKU.id} readOnly />
                </label>
                <label htmlFor="hn-field-18">
                  Tên SKU
                  <Input
                    id="hn-field-18"
                    defaultValue={PENDING_SKU.name}
                    required
                  />
                </label>
              </div>
              <div className="hn-missing">
                <FileWarning />
                <span>
                  Checklist mẫu: <strong>Hãng</strong> và{' '}
                  <strong>Nhóm hàng</strong> còn thiếu.
                </span>
              </div>
              <div className="hn-form-grid">
                <label htmlFor="hn-field-19">
                  Hãng · còn thiếu
                  <DemoSelect
                    id="hn-field-19"
                    label="Hãng SKU mẫu"
                    value={brand}
                    options={[
                      { value: '', label: 'Chọn hãng mẫu' },
                      { value: 'demo-brand', label: 'Hãng minh họa' },
                    ]}
                    onChange={(value) => {
                      setBrand(value);
                      markDirty();
                    }}
                  />
                </label>
                <label htmlFor="hn-field-20">
                  Nhóm hàng · còn thiếu
                  <DemoSelect
                    id="hn-field-20"
                    label="Nhóm hàng SKU mẫu"
                    value={category}
                    options={[
                      { value: '', label: 'Chọn nhóm hàng mẫu' },
                      { value: 'demo-parts', label: 'Phụ tùng minh họa' },
                    ]}
                    onChange={(value) => {
                      setCategory(value);
                      markDirty();
                    }}
                  />
                </label>
                <label htmlFor="hn-field-21">
                  Định mức tối thiểu (tùy chọn)
                  <Input
                    id="hn-field-21"
                    type="number"
                    min="0"
                    placeholder="Chưa cấu hình"
                  />
                </label>
                <label htmlFor="hn-field-22">
                  Định mức tối đa (tùy chọn)
                  <Input
                    id="hn-field-22"
                    type="number"
                    min="1"
                    placeholder="Chưa cấu hình"
                  />
                </label>
              </div>
              <p>
                Mã SKU được khóa trong ví dụ. Quy tắc Model/Nguồn điện, min/max
                và quản lý serial thật chưa được quyết định trong prototype.
              </p>
            </>
          )}
          <div className="hn-simulation">
            <label htmlFor="hn-field-23">
              Kết quả để thử trong prototype
              <DemoSelect
                id="hn-field-23"
                label="Kết quả gửi mô phỏng"
                value={outcome}
                options={[
                  { value: 'success', label: 'Thành công (mô phỏng)' },
                  { value: 'error', label: 'Lỗi tải / ghi (mô phỏng)' },
                  { value: 'conflict', label: 'Xung đột cập nhật (mô phỏng)' },
                ]}
                onChange={setOutcome}
              />
            </label>
          </div>
        </fieldset>
        {formError && (
          <p className="hn-form-error" role="alert">
            {formError}
          </p>
        )}
        {result && (
          <div
            className={`hn-result ${result}`}
            role={result === 'success' ? 'status' : 'alert'}
          >
            {result === 'success' ? <CheckCircle2 /> : <AlertCircle />}
            <div>
              <strong>
                {result === 'success'
                  ? 'Mô phỏng thành công'
                  : result === 'conflict'
                    ? 'Mô phỏng: hồ sơ đã được cập nhật ở nơi khác'
                    : 'Mô phỏng: không gửi được dữ liệu'}
              </strong>
              <p>
                {result === 'success'
                  ? 'Không ghi dữ liệu thật. Bộ dữ liệu mẫu gốc không thay đổi; đây là minh họa phản hồi cho DEV.'
                  : 'Nội dung bạn nhập vẫn được giữ. Có thể đổi kết quả thử và gửi lại; không tự ghi đè hoặc tạo bản trùng.'}
              </p>
            </div>
          </div>
        )}
        <div className="hn-action-row">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => navigate({ ...route, action: '' })}
          >
            Hủy / Quay lại
          </Button>
          <Button type="submit" className="hn-primary" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" />
                Đang mô phỏng…
              </>
            ) : route.action === 'components' ? (
              'Mô phỏng tạo phiếu nháp'
            ) : (
              'Mô phỏng lưu kết quả'
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
