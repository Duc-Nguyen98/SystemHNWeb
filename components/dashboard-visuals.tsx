'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileWarning,
  Info,
  PackageCheck,
  Printer,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Wrench,
  ChartNoAxesCombined,
  ChartPie,
  Layers,
  ScanLine,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  STOCK,
  WARRANTIES,
  LABELS,
  IMPORT_ERRORS,
  SNAPSHOT,
  available,
  difference,
  formatDay,
  formatNumber as n,
  stockForType,
  total,
  periodMetrics,
  typeName,
  type DemoRoute,
  type ItemType,
  type Movement,
} from '@/lib/dashboard-demo';
import './dashboard-visuals.css';

type Navigate = (route: DemoRoute) => void;
const route = (view: string, filter = '', id = ''): DemoRoute => ({
  view,
  filter,
  id,
  action: '',
});
const SERIES = [
  { key: 'incoming', label: 'Nhập', color: '#28a86b' },
  { key: 'product', label: 'Xuất SP', color: '#e35d6a' },
  { key: 'component', label: 'Xuất LK', color: '#e99b37' },
  { key: 'returns', label: 'Hoàn tác mẫu', color: '#0C6286' },
] as const;
type FlowKey = (typeof SERIES)[number]['key'];

function flowData(rows: Movement[]) {
  return [...new Set(rows.map((m) => m.day))].sort().map((day) => {
    const daily = rows.filter((m) => m.day === day);
    return {
      day,
      label: formatDay(day).slice(0, 5),
      incoming: total(
        daily.filter((m) => m.kind === 'in'),
        (m) => m.quantity,
      ),
      product: total(
        daily.filter(
          (m) =>
            m.kind === 'out' &&
            STOCK.find((s) => s.id === m.sku)?.type === 'product',
        ),
        (m) => m.quantity,
      ),
      component: total(
        daily.filter(
          (m) =>
            m.kind === 'out' &&
            STOCK.find((s) => s.id === m.sku)?.type === 'component',
        ),
        (m) => m.quantity,
      ),
      returns: total(
        daily.filter((m) => m.kind === 'return'),
        (m) => m.quantity,
      ),
    };
  });
}

function Tag({
  children,
  tone = 'purple',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`hn-v-tag ${tone}`}>{children}</span>;
}
function Heading({
  title,
  eyebrow,
  icon,
  extra,
  tone = 'purple',
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  extra?: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`hn-v-card-head ${tone}`}>
      <span className="hn-v-card-icon">{icon}</span>
      <div>
        <span className="hn-v-eyebrow">{eyebrow}</span>
        <h4>{title}</h4>
      </div>
      {extra && <div className="hn-v-head-extra">{extra}</div>}
    </div>
  );
}
function SectionTitle({ title, note }: { title: string; note: string }) {
  return (
    <div className="hn-v-section-title">
      <h4>{title}</h4>
      <span>{note}</span>
    </div>
  );
}
function SmallTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption: string;
}) {
  return (
    <Table className="hn-table hn-v-table">
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow>
          {headers.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {row.map((cell, j) => (
              <TableCell key={j}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const x = (i: number) => 4 + (i * 118) / Math.max(1, values.length - 1);
  const y = (v: number) => 35 - (v / max) * 27;
  return (
    <svg viewBox="0 0 128 42" aria-hidden="true" className="hn-v-spark">
      <path
        d={`M4 40 ${values.map((v, i) => `L${x(i)} ${y(v)}`).join(' ')} L${x(values.length - 1)} 40 Z`}
        fill={color}
        opacity=".1"
      />
      <polyline
        points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.length === 1 && (
        <circle cx="4" cy={y(values[0])} r="3" fill={color} />
      )}
    </svg>
  );
}
function Kpi({
  title,
  value,
  unit = 'cái',
  tone,
  icon,
  scope,
  note,
  onClick,
  values,
}: {
  title: string;
  value: number;
  unit?: string;
  tone: string;
  icon: ReactNode;
  scope: string;
  note: string;
  onClick: () => void;
  values?: number[];
}) {
  const colors: Record<string, string> = {
    purple: '#0C6286',
    cyan: '#169fb2',
    green: '#28a86b',
    red: '#e35d6a',
    amber: '#e99b37',
  };
  return (
    <Card className={`hn-v-kpi ${tone}`}>
      <button
        onClick={onClick}
        aria-label={`${title}: ${n(value)} ${unit}. Xem chi tiết`}
      >
        <div className="hn-v-kpi-top">
          <span>{title}</span>
          <i>{icon}</i>
        </div>
        <strong>
          {n(value)} <small>{unit}</small>
        </strong>
        <div className="hn-v-kpi-bottom">
          <span>
            <Tag tone={tone}>{scope}</Tag>
            <small>{note}</small>
          </span>
          {values ? (
            <Sparkline values={values} color={colors[tone]} />
          ) : (
            <ChevronRight />
          )}
        </div>
      </button>
    </Card>
  );
}

function FlowPanel({
  rows,
  from,
  to,
  type,
}: {
  rows: Movement[];
  from: string;
  to: string;
  type: ItemType;
}) {
  const data = useMemo(() => flowData(rows), [rows]);
  const [shown, setShown] = useState<FlowKey[]>(SERIES.map((s) => s.key));
  const [selected, setSelected] = useState('');
  const point = data.find((d) => d.day === selected) || data[data.length - 1];
  return (
    <Card className="hn-v-card hn-v-flow">
      <Heading
        eyebrow="PHÂN TÍCH VẬN HÀNH"
        title="Luồng nhập – xuất"
        icon={<ChartNoAxesCombined />}
        extra={<Tag>Trong kỳ · cái</Tag>}
      />
      <div className="hn-v-card-body">
        <p className="hn-v-scope">
          {formatDay(from)} – {formatDay(to)} · {typeName(type)}
        </p>
        <div className="hn-v-legend" aria-label="Chuỗi biểu đồ nhập xuất">
          {SERIES.map((s) => (
            <Button
              key={s.key}
              variant="ghost"
              aria-pressed={shown.includes(s.key)}
              onClick={() =>
                setShown((old) =>
                  old.includes(s.key)
                    ? old.filter((v) => v !== s.key)
                    : [...old, s.key],
                )
              }
            >
              <i style={{ background: s.color }} />
              {s.label}
            </Button>
          ))}
        </div>
        <div className="hn-v-flow-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={data}
              margin={{ top: 18, right: 12, bottom: 6, left: 0 }}
              accessibilityLayer
              aria-label="Nhập, xuất theo cột và hoàn tác theo đường. Dùng phím mũi tên hoặc bảng số liệu để đọc từng ngày."
            >
              <CartesianGrid
                vertical={false}
                stroke="#eceaf2"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#777183', fontSize: 12 }}
                minTickGap={16}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#777183', fontSize: 12 }}
                width={38}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid #e6e2ef',
                  borderRadius: 8,
                  boxShadow: '0 8px 30px #16313B15',
                  fontSize: 14,
                }}
                formatter={(value) => `${n(Number(value))} cái`}
                cursor={{ fill: '#0C628608' }}
              />
              {SERIES.slice(0, 3).map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                  hide={!shown.includes(s.key)}
                  isAnimationActive={false}
                />
              ))}
              <Line
                dataKey="returns"
                name="Hoàn tác mẫu"
                type="linear"
                stroke="#0C6286"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                hide={!shown.includes('returns')}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="hn-v-chart-reader">
          <Select
            value={point?.day || ''}
            items={data.map((d) => ({ value: d.day, label: formatDay(d.day) }))}
            onValueChange={(v) => {
              if (v) setSelected(v);
            }}
          >
            <SelectTrigger
              className="hn-select"
              aria-label="Ngày chi tiết biểu đồ"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="hn-select-menu"
              alignItemWithTrigger={false}
            >
              {data.map((d) => (
                <SelectItem key={d.day} value={d.day}>
                  {formatDay(d.day)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            {shown.length
              ? point &&
                SERIES.filter((s) => shown.includes(s.key))
                  .map((s) => `${s.label}: ${point[s.key]}`)
                  .join(' · ')
              : 'Chọn một chuỗi để xem số liệu.'}
          </span>
        </div>
        <details>
          <summary>Xem bảng số liệu</summary>
          <SmallTable
            caption="Số liệu luồng hàng theo ngày"
            headers={['Ngày', ...SERIES.map((s) => s.label)]}
            rows={data.map((d) => [
              formatDay(d.day),
              d.incoming,
              d.product,
              d.component,
              d.returns,
            ])}
          />
        </details>
      </div>
    </Card>
  );
}

function StockMix() {
  const data = [
    {
      name: 'Sản phẩm',
      value: total(
        STOCK.filter((s) => s.type === 'product'),
        (s) => s.balance,
      ),
      fill: '#0C6286',
    },
    {
      name: 'Linh kiện',
      value: total(
        STOCK.filter((s) => s.type === 'component'),
        (s) => s.balance,
      ),
      fill: '#ffb45d',
    },
  ];
  const sum = total(data, (d) => d.value);
  return (
    <Card className="hn-v-card">
      <Heading
        eyebrow="CƠ CẤU TỒN"
        title="Tồn theo loại hàng"
        icon={<ChartPie />}
        extra={<Tag tone="green">Hiện tại</Tag>}
      />
      <div className="hn-v-card-body">
        <p className="hn-v-scope">
          Toàn bộ loại hàng · Không theo bộ lọc kỳ/loại hàng
        </p>
        <div className="hn-v-donut">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="90%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={3}
                stroke="none"
                cornerRadius={5}
                isAnimationActive={false}
              />
              <Tooltip
                formatter={(value) =>
                  `${n(Number(value))} cái · ${Math.round((Number(value) / sum) * 100)}%`
                }
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e6e2ef',
                  fontSize: 14,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="hn-v-donut-center">
            <span>Tổng tồn</span>
            <strong>{n(sum)}</strong>
            <small>cái · ghi nhận</small>
          </div>
        </div>
        <div className="hn-v-donut-legend">
          {data.map((d) => (
            <div key={d.name}>
              <i style={{ background: d.fill }} />
              <span>
                {d.name}
                <strong>
                  {n(d.value)} <small>cái</small>
                </strong>
              </span>
              <b>
                {Math.round((d.value / sum) * 100)}
                <small>%</small>
              </b>
            </div>
          ))}
        </div>
        <details>
          <summary>Xem bảng số liệu</summary>
          <SmallTable
            caption="Tồn theo loại hàng hiện tại"
            headers={['Loại hàng', 'Tồn ghi nhận', 'Tỷ lệ']}
            rows={data.map((d) => [
              d.name,
              `${n(d.value)} cái`,
              `${Math.round((d.value / sum) * 100)}%`,
            ])}
          />
        </details>
      </div>
    </Card>
  );
}

export default function DashboardDataSurface({
  from,
  to,
  type,
  navigate,
}: {
  from: string;
  to: string;
  type: ItemType;
  navigate: Navigate;
}) {
  const items = stockForType(type);
  const metrics = useMemo(
    () => periodMetrics(from, to, type),
    [from, to, type],
  );
  const daily = useMemo(() => flowData(metrics.rows), [metrics.rows]);
  const [priority, setPriority] = useState('all');
  const currentTotal = total(items, (s) => s.balance);
  const states = [
    {
      name: 'Khả dụng (mẫu)',
      value: total(items, available),
      color: '#0C6286',
    },
    {
      name: 'Chờ kiểm tra',
      value: total(items, (s) => s.quarantine),
      color: '#1aa6b8',
    },
    {
      name: 'Không thể xuất',
      value: total(items, (s) => s.blocked),
      color: '#e99b37',
    },
    {
      name: 'Hàng lỗi',
      value: total(items, (s) => s.defective),
      color: '#e35d6a',
    },
  ];
  const low = items.filter((s) => available(s) < s.min),
    high = items.filter((s) => available(s) > s.max);
  const top = items
    .map((item) => ({
      item,
      qty: total(
        metrics.rows.filter((m) => m.sku === item.id && m.kind === 'out'),
        (m) => m.quantity,
      ),
    }))
    .sort((a, b) => b.qty - a.qty || a.item.id.localeCompare(b.item.id))
    .slice(0, 5);
  const tasks = [
    {
      title: 'Sự cố đối soát tồn',
      text: 'Chênh lệch giữa tồn ghi nhận và sổ',
      count: STOCK.filter((s) => difference(s) !== 0).length,
      unit: 'dòng lệch',
      tone: 'red',
      level: 'urgent',
      icon: <ShieldAlert />,
      target: route('inventory', 'variance'),
    },
    {
      title: 'Bảo hành quá hạn',
      text: 'Hồ sơ đã vượt hạn xử lý mẫu',
      count: WARRANTIES.filter((w) => w.overdue > 0).length,
      unit: 'hồ sơ',
      tone: 'amber',
      level: 'soon',
      icon: <Wrench />,
      target: route('warranty', 'overdue'),
    },
    {
      title: 'Nhãn cần kiểm tra',
      text: '2 thất bại · 1 chờ phản hồi',
      count: LABELS.filter((l) => l.status !== 'Đã in').length,
      unit: 'nhãn',
      tone: 'amber',
      level: 'soon',
      icon: <Printer />,
      target: route('labels', 'pending'),
    },
    {
      title: 'Lỗi dữ liệu nhập',
      text: '3 không hợp lệ · 2 trùng',
      count: IMPORT_ERRORS.length,
      unit: 'dòng lỗi',
      tone: 'amber',
      level: 'soon',
      icon: <FileWarning />,
      target: route('quality', 'all'),
    },
    {
      title: 'SKU chờ hoàn thiện',
      text: 'Thiếu thông tin danh mục',
      count: 1,
      unit: 'SKU',
      tone: 'purple',
      level: 'watch',
      icon: <Boxes />,
      target: route('sku', 'incomplete'),
    },
  ];
  const open = WARRANTIES.filter((w) => w.status !== 'Đã trả khách');
  const overdue = open.filter((w) => w.overdue > 0);
  return (
    <div className="hn-v-surface">
      <SectionTitle
        title="Tổng quan nhanh"
        note={`${typeName(type)} · Dữ liệu minh họa`}
      />
      <div className="hn-v-kpis">
        <Kpi
          title="Tồn khả dụng"
          value={total(items, available)}
          tone="purple"
          icon={<PackageCheck />}
          scope="Hiện tại"
          note="Xem trạng thái loại trừ"
          onClick={() => navigate(route('inventory', 'all'))}
        />
        <Kpi
          title="SKU đang có tồn"
          value={items.filter((s) => s.balance > 0).length}
          unit="SKU"
          tone="cyan"
          icon={<Boxes />}
          scope="Hiện tại"
          note="Đếm riêng từng mã"
          onClick={() => navigate(route('inventory', 'all'))}
        />
        <Kpi
          title="Nhập đã ghi sổ"
          value={metrics.incoming}
          tone="green"
          icon={<ArrowDownLeft />}
          scope="Trong kỳ"
          note={`${formatDay(from).slice(0, 5)} – ${formatDay(to).slice(0, 5)}`}
          values={daily.map((d) => d.incoming)}
          onClick={() => navigate(route('metric', 'in'))}
        />
        <Kpi
          title="Xuất sản phẩm"
          value={metrics.outgoingProduct}
          tone="red"
          icon={<ArrowUpRight />}
          scope="Trong kỳ"
          note={type === 'component' ? 'Ngoài loại đang chọn' : 'Theo ngày'}
          values={daily.map((d) => d.product)}
          onClick={() => navigate(route('metric', 'product'))}
        />
        <Kpi
          title="Xuất linh kiện"
          value={metrics.outgoingComponent}
          tone="amber"
          icon={<Wrench />}
          scope="Trong kỳ"
          note={type === 'product' ? 'Ngoài loại đang chọn' : 'Theo ngày'}
          values={daily.map((d) => d.component)}
          onClick={() => navigate(route('metric', 'component'))}
        />
      </div>
      <div className="hn-v-operations">
        <Card className="hn-v-card hn-v-queue">
          <Heading
            eyebrow="ƯU TIÊN VẬN HÀNH"
            title="Công việc cần ưu tiên"
            icon={<ClipboardList />}
            extra={<Tag>{tasks.length} nhóm</Tag>}
          />
          <div
            className="hn-v-priority-tabs"
            aria-label="Mức ưu tiên công việc"
          >
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'urgent', label: 'Khẩn cấp' },
              { value: 'soon', label: 'Cần xử lý sớm' },
              { value: 'watch', label: 'Theo dõi' },
            ].map((p) => (
              <Button
                key={p.value}
                variant="ghost"
                aria-pressed={priority === p.value}
                onClick={() => setPriority(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="hn-v-queue-rows">
            {tasks
              .filter((t) => priority === 'all' || t.level === priority)
              .map((t) => (
                <button
                  className={`hn-v-task ${t.tone}`}
                  key={t.title}
                  aria-label={`Xem ${t.count} ${t.unit}: ${t.title}`}
                  onClick={() => navigate(t.target)}
                >
                  <span className="hn-v-task-icon">{t.icon}</span>
                  <span className="hn-v-task-copy">
                    <strong>{t.title}</strong>
                    <small>{t.text}</small>
                  </span>
                  <span className="hn-v-task-amount">
                    <b>{t.count}</b>
                    <small>{t.unit}</small>
                  </span>
                  <ChevronRight />
                </button>
              ))}
          </div>
          <div className="hn-v-card-foot">
            <span>
              Hiện tại · Toàn bộ loại hàng · Không cộng các nhóm khác đơn vị
            </span>
          </div>
        </Card>
        <Card className="hn-v-card hn-v-attention">
          <Heading
            eyebrow="TÍN HIỆU HIỆN TẠI"
            title="Điểm cần chú ý"
            tone="amber"
            icon={<ShieldAlert />}
          />
          <div className="hn-v-card-body">
            <button
              className="hn-v-signal amber"
              onClick={() => navigate(route('inventory', 'low'))}
            >
              <span>
                <b>{low.length}</b> SKU dưới ngưỡng
              </span>
              <small>Khả dụng thấp hơn định mức tối thiểu</small>
              <em>
                Xem tồn cần kiểm tra <ArrowRight />
              </em>
            </button>
            <button
              className="hn-v-signal purple"
              onClick={() => navigate(route('inventory', 'high'))}
            >
              <span>
                <b>{high.length}</b> SKU vượt ngưỡng
              </span>
              <small>Khả dụng cao hơn định mức tối đa</small>
              <em>
                Xem tồn vượt ngưỡng <ArrowRight />
              </em>
            </button>
            <div className="hn-v-source-note">
              <Clock3 />
              <span>
                {SNAPSHOT}
                <small>
                  Theo {typeName(type).toLowerCase()} · Định mức mẫu
                </small>
              </span>
            </div>
          </div>
        </Card>
      </div>
      <SectionTitle
        title="Đối soát tồn theo kỳ"
        note={`${formatDay(from)} – ${formatDay(to)} · ${typeName(type)} · cái`}
      />
      <Card className="hn-v-card hn-v-equation-card">
        <section
          className="hn-v-reconciliation"
          aria-label="Phương trình đối soát tồn theo kỳ, đơn vị cái"
        >
          <div className="hn-v-balance opening">
            <span className="hn-v-reconcile-icon">
              <Boxes aria-hidden="true" />
            </span>
            <span className="hn-v-reconcile-label">Tồn đầu kỳ</span>
            <strong>
              {n(metrics.open)} <small>cái</small>
            </strong>
          </div>
          <div className="hn-v-reconcile-movements">
            <ArrowRight
              className="hn-v-reconcile-connector"
              aria-hidden="true"
            />
            {[
              {
                label: 'Nhập ghi sổ',
                value: metrics.incoming,
                sign: '+',
                tone: 'incoming',
                icon: <ArrowDownLeft />,
              },
              {
                label: 'Xuất sản phẩm',
                value: metrics.outgoingProduct,
                sign: '−',
                tone: 'outgoing',
                icon: <ArrowUpRight />,
              },
              {
                label: 'Xuất linh kiện',
                value: metrics.outgoingComponent,
                sign: '−',
                tone: 'parts',
                icon: <Wrench />,
              },
              {
                label: 'Hoàn tác mẫu',
                value: metrics.returns,
                sign: '+',
                tone: 'reversed',
                icon: <RotateCcw />,
              },
            ].map((c) => (
              <div
                key={c.label}
                className={`hn-v-reconcile-movement ${c.tone}`}
              >
                <span className="hn-v-reconcile-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <span className="hn-v-reconcile-label">{c.label}</span>
                <strong>
                  <span className="hn-v-reconcile-sign">{c.sign}</span>
                  {n(c.value)} <small>cái</small>
                </strong>
              </div>
            ))}
          </div>
          <div className="hn-v-balance closing">
            <span className="hn-v-reconcile-equals" aria-hidden="true">
              =
            </span>
            <span className="hn-v-reconcile-icon">
              <PackageCheck aria-hidden="true" />
            </span>
            <span className="hn-v-reconcile-label">Tồn cuối kỳ</span>
            <strong>
              {n(metrics.close)} <small>cái</small>
            </strong>
          </div>
        </section>
        <div className="hn-v-equation-foot">
          <span>
            <CheckCircle2 />
            Phương trình mẫu khớp{' '}
            <small>Không đồng nghĩa sự cố tồn đã đóng</small>
          </span>
          <Button
            variant="ghost"
            onClick={() => navigate(route('metric', 'all'))}
          >
            Xem sổ chi tiết <ArrowRight />
          </Button>
        </div>
      </Card>
      <SectionTitle
        title="Luồng và xu hướng"
        note="Biểu đồ và bảng chi tiết dùng chung dữ liệu mẫu"
      />
      <div className="hn-v-analysis">
        <FlowPanel rows={metrics.rows} from={from} to={to} type={type} />
        <StockMix />
        <Card className="hn-v-card">
          <Heading
            eyebrow="TRẠNG THÁI HÀNG"
            title="Cơ cấu trạng thái tồn"
            icon={<Layers />}
            extra={<Tag>Hiện tại</Tag>}
          />
          <div className="hn-v-card-body">
            <div className="hn-v-state-total">
              <span>
                Tổng tồn ghi nhận{' '}
                <strong>
                  {n(currentTotal)} <small>cái</small>
                </strong>
              </span>
              <span className="hn-v-scope">
                {typeName(type)}
                <br />
                Không theo kỳ
              </span>
            </div>
            <div className="hn-v-state-bars">
              {states.map((s) => (
                <div key={s.name}>
                  <div>
                    <span>
                      <i style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <strong>
                      {n(s.value)}{' '}
                      <small>
                        cái · {Math.round((s.value / currentTotal) * 100)}%
                      </small>
                    </strong>
                  </div>
                  <div className="hn-v-bar-track">
                    <span
                      style={{
                        width: `${(s.value / currentTotal) * 100}%`,
                        background: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="hn-v-inline-link"
              onClick={() => navigate(route('definitions'))}
            >
              <Info />
              Cách tính khả dụng
            </Button>
          </div>
        </Card>
        <Card className="hn-v-card">
          <Heading
            eyebrow="NGƯỠNG TỒN"
            title="SKU dưới định mức"
            icon={<SlidersHorizontal />}
            tone="amber"
            extra={<Tag tone="amber">{low.length} SKU</Tag>}
          />
          <div className="hn-v-card-body">
            <p className="hn-v-scope">
              {typeName(type)} · Khả dụng / định mức tối thiểu · cái
            </p>
            <div className="hn-v-thresholds">
              {low.length ? (
                low.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(route('inventory', 'low', s.id))}
                    aria-label={`Xem định mức ${s.id}`}
                  >
                    <span>
                      <strong>{s.name}</strong>
                      <b>
                        {available(s)} <small>/ {s.min}</small>
                      </b>
                    </span>
                    <div className="hn-v-bar-track">
                      <span
                        style={{ width: `${(available(s) / s.min) * 100}%` }}
                      />
                    </div>
                    <small>
                      {s.id}
                      <em>Thấp hơn {s.min - available(s)} cái</em>
                    </small>
                  </button>
                ))
              ) : (
                <div className="hn-v-no-threshold">
                  <CheckCircle2 />
                  <strong>Không có SKU dưới ngưỡng</strong>
                  <span>Trong loại hàng đang chọn ở bộ dữ liệu mẫu.</span>
                </div>
              )}
            </div>
            <div className="hn-v-card-foot">
              <span>Chỉ so sánh SKU có định mức mẫu</span>
              <Button
                variant="ghost"
                onClick={() => navigate(route('inventory', 'low'))}
              >
                Xem danh sách <ArrowRight />
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <SectionTitle
        title="Theo dõi chuyên biệt"
        note="Hồ sơ bảo hành, luân chuyển hàng và dữ liệu"
      />
      <div className="hn-v-specialized">
        <Card className="hn-v-card">
          <Heading
            eyebrow="BẢO HÀNH"
            title="Hồ sơ cần theo dõi"
            icon={<Wrench />}
          />
          <div className="hn-v-card-body">
            <div className="hn-v-warranty-number">
              <strong>{open.length}</strong>
              <span>hồ sơ đang mở</span>
              <Tag tone="amber">{overdue.length} quá hạn</Tag>
            </div>
            <div
              className="hn-v-warranty-track"
              aria-label={`${overdue.length} trên ${open.length} hồ sơ đang mở quá hạn mẫu`}
            >
              <i
                style={{ width: `${(overdue.length / open.length) * 100}%` }}
              />
            </div>
            <div className="hn-v-key-value">
              <span>Quá hạn lâu nhất</span>
              <strong>
                {Math.max(...overdue.map((w) => w.overdue), 0)} ngày
              </strong>
            </div>
            <div className="hn-v-key-value">
              <span>Hạn / SLA thật</span>
              <Tag tone="neutral">Chờ chốt</Tag>
            </div>
            <Button
              variant="outline"
              className="hn-v-card-action"
              onClick={() => navigate(route('warranty', 'open'))}
            >
              Xem hồ sơ đang mở <ArrowRight />
            </Button>
          </div>
        </Card>
        <Card className="hn-v-card hn-v-ranking">
          <Heading
            eyebrow="LUÂN CHUYỂN HÀNG"
            title="Top 5 SKU xuất"
            icon={<ChartNoAxesCombined />}
          />
          <div className="hn-v-card-body">
            <p className="hn-v-scope">{typeName(type)} · Trong kỳ · cái</p>
            {top.map((t, i) => (
              <button
                key={t.item.id}
                onClick={() => navigate(route('metric', 'sku', t.item.id))}
                aria-label={`Xem xuất ${t.item.id}`}
              >
                <span className="hn-v-rank-index">{i + 1}</span>
                <span className="hn-v-rank-main">
                  <span>
                    <strong>{t.item.name}</strong>
                    <b>{t.qty}</b>
                  </span>
                  <span className="hn-v-bar-track">
                    <span
                      style={{
                        width: `${(t.qty / Math.max(1, ...top.map((v) => v.qty))) * 100}%`,
                        opacity: 1 - i * 0.12,
                      }}
                    />
                  </span>
                  <small>{t.item.id}</small>
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="hn-v-card">
          <Heading
            eyebrow="KIỂM SOÁT DỮ LIỆU"
            title="Chất lượng dữ liệu"
            icon={<ScanLine />}
          />
          <div className="hn-v-card-body">
            <button
              className="hn-v-data-link"
              onClick={() => navigate(route('sku', 'incomplete'))}
            >
              <span>
                <Boxes />
                SKU chờ hoàn thiện
              </span>
              <b>
                1 <ChevronRight />
              </b>
            </button>
            <button
              className="hn-v-data-link"
              onClick={() => navigate(route('quality', 'all'))}
            >
              <span>
                <FileWarning />
                Lỗi dữ liệu nhập
              </span>
              <b>
                {IMPORT_ERRORS.length} <ChevronRight />
              </b>
            </button>
            <div className="hn-v-error-mix">
              <span
                style={
                  {
                    '--segment': `${(IMPORT_ERRORS.filter((e) => !e.duplicate).length / IMPORT_ERRORS.length) * 100}%`,
                  } as CSSProperties
                }
              />
            </div>
            <div className="hn-v-quality-legend">
              <span>
                <i />3 không hợp lệ
              </span>
              <span>
                <i />2 trùng
              </span>
            </div>
            <Button
              variant="outline"
              className="hn-v-card-action"
              onClick={() => navigate(route('quality', 'all'))}
            >
              Xem báo cáo ngoại lệ <ArrowRight />
            </Button>
          </div>
        </Card>
      </div>
      <details className="hn-v-notes">
        <summary>Phạm vi dữ liệu và lưu ý nghiệp vụ</summary>
        <p>
          Dữ liệu DEMO độc lập; công thức khả dụng, SLA, phân quyền và thao tác
          ghi/in thật vẫn chờ chốt. Tồn hiện tại không theo kỳ. Biểu đồ
          nhập–xuất, đối soát và Top SKU theo đúng kỳ và loại hàng đang chọn; cơ
          cấu tồn theo loại hàng luôn là toàn bộ.
        </p>
        <Button variant="ghost" onClick={() => navigate(route('definitions'))}>
          Xem định nghĩa số liệu <ArrowRight />
        </Button>
      </details>
    </div>
  );
}
