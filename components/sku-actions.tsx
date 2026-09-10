'use client';

import {
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
  type ReactNode,
} from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  checkImportFile,
  emptySku,
  missingReferences,
  typeName,
  validateSku,
  type Sku,
} from '@/lib/sku-demo';
import { SkuBadge, SkuNotice, SkuSelect } from './sku-primitives';
import { useMasterDataDemo } from './master-data-demo';

const pause = () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, 600));
function Footer({ children }: { children: ReactNode }) {
  return <div className="hn-sku-dialog-footer">{children}</div>;
}
function DataGroup({
  title,
  rows,
}: {
  title: string;
  rows: [string, ReactNode][];
}) {
  return (
    <section className="hn-sku-data-group">
      <h3>{title}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value === '' || value === null || value === undefined ? (
                <span className="hn-sku-unset">Chưa có</span>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
export function SkuDetail({
  sku: s,
  readonly,
  onEdit,
  onPublish,
  onClose,
}: {
  sku: Sku;
  readonly: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onClose: () => void;
}) {
  const { brandName, referenceLabel } = useMasterDataDemo();
  const missing = missingReferences(s);
  return (
    <>
      <div className="hn-sku-dialog-body">
        <div className="hn-sku-detail-status">
          <SkuBadge tone={s.active ? 'green' : 'muted'}>
            {s.active ? 'Đang sử dụng' : 'Không hoạt động'}
          </SkuBadge>
          <SkuBadge tone={s.published ? 'purple' : 'muted'}>
            {s.published ? 'Đang hiển thị' : 'Chưa hiển thị'}
          </SkuBadge>
          {s.pending && <SkuBadge tone="amber">Chờ điền · mẫu</SkuBadge>}
        </div>
        {s.pending && (
          <SkuNotice tone="warning">
            <strong>
              {missing.length
                ? `Thông tin đang trống: ${missing.join(', ')}.`
                : 'Đã điền các trường tham chiếu mẫu.'}
            </strong>
            <p>
              Đây không phải danh sách trường bắt buộc. Điều kiện hoàn tất hàng
              đợi đang chờ chốt nghiệp vụ.
            </p>
          </SkuNotice>
        )}
        <div className="hn-sku-detail-grid">
          <DataGroup
            title="01 · Nhận diện"
            rows={[
              ['Mã SKU', s.code],
              ['Tên SKU', s.name],
              ['Loại', typeName(s.type)],
              ['Đơn vị', s.unit],
              ['Phiên bản', s.version],
            ]}
          />
          <DataGroup
            title="02 · Phân loại"
            rows={[
              ['Hãng', s.brand ? brandName(s.brand) : ''],
              ['Nhóm hàng', referenceLabel('group', s.group)],
              ['Model', referenceLabel('model', s.model)],
              ['Công suất', s.power],
              ['Quy cách', referenceLabel('packaging', s.packaging)],
            ]}
          />
          <DataGroup
            title="03 · Định mức tồn"
            rows={[
              ['Tối thiểu', s.min ?? 'Chưa thiết lập'],
              ['Tối đa', s.max ?? 'Chưa thiết lập'],
              ['Đơn vị định mức', s.unit],
            ]}
          />
          <DataGroup
            title="04 · Kiểm soát"
            rows={[
              [
                'Quản lý serial',
                s.serial === null
                  ? 'Chưa chọn · chờ chốt mặc định'
                  : s.serial
                    ? 'Có'
                    : 'Không',
              ],
              [
                'Đã phát sinh tồn',
                s.hasStock
                  ? 'Có · kịch bản khóa trường'
                  : 'Chưa · kịch bản mẫu',
              ],
              ['Phiên bản dữ liệu DEMO', `v${s.revision}`],
            ]}
          />
        </div>
        <SkuNotice>
          <strong>Điều kiện hiển thị: Chờ chốt nghiệp vụ.</strong>
          <p>
            Chưa xác định tập trường bắt buộc, điều kiện trạng thái, quyền duyệt
            và ảnh hưởng khi gỡ khỏi ứng dụng. Trạng thái phía trên là dữ liệu
            mô phỏng, không chứng minh SKU đủ điều kiện.
          </p>
        </SkuNotice>
      </div>
      <Footer>
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        {!readonly && (
          <>
            <Button variant="outline" onClick={onPublish}>
              {s.published ? 'Gỡ khỏi ứng dụng' : 'Đưa lên ứng dụng'} · DEMO
            </Button>
            <Button onClick={onEdit}>
              <Pencil /> {s.pending ? 'Điền thông tin' : 'Sửa SKU'}
            </Button>
          </>
        )}
      </Footer>
    </>
  );
}

export function SkuForm({
  sku,
  rows,
  onDirty,
  onBusy,
  onSaved,
  onClose,
}: {
  sku?: Sku;
  rows: Sku[];
  onDirty: (v: boolean) => void;
  onBusy: (v: boolean) => void;
  onSaved: (s: Sku) => void;
  onClose: () => void;
}) {
  const {
    brands,
    models,
    modelsFor,
    brandName,
    referenceLabel,
    referenceValue,
  } = useMasterDataDemo();
  const [draft, setDraft] = useState<Sku>(() =>
    sku ? { ...sku } : emptySku(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<'success' | 'error' | 'conflict'>(
    'success',
  );
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!sku?.pending) return;
    const key = !sku.brand
      ? 'brand'
      : !sku.group
        ? 'group'
        : !sku.model
          ? 'model'
          : !sku.power
            ? 'power'
            : !sku.packaging
              ? 'packaging'
              : 'name';
    formRef.current?.querySelector<HTMLElement>(`#sku-form-${key}`)?.focus();
  }, [sku]);
  const locked = !!sku?.hasStock;
  const changed = (patch: Partial<Sku>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onDirty(JSON.stringify(next) !== JSON.stringify(sku || emptySku()));
    setErrors((old) =>
      Object.fromEntries(
        Object.entries(old).filter(([key]) => !(key in patch)),
      ),
    );
  };
  function brandChange(brand: string) {
    const valid = modelsFor(brand).some((m) => m.value === draft.model);
    changed({ brand, model: valid ? draft.model : '' });
    if (draft.model && !valid)
      setMessage(
        'Đã bỏ Model cũ vì không thuộc Hãng mới. Vui lòng chọn Model phù hợp.',
      );
  }
  function field(
    key: keyof Sku,
    label: string,
    hint?: string,
    type = 'text',
    disabled = false,
  ) {
    const referenceType =
      key === 'group' ? 'group' : key === 'packaging' ? 'packaging' : null;
    const value = referenceType
      ? referenceLabel(referenceType, String(draft[key]))
      : draft[key];
    return (
      <div className="hn-sku-field">
        <label htmlFor={`sku-form-${key}`}>
          {label}
          {disabled && <LockKeyhole />}
        </label>
        <Input
          id={`sku-form-${key}`}
          name={key}
          type={type}
          value={
            typeof value === 'string' || typeof value === 'number' ? value : ''
          }
          disabled={busy || disabled}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] || hint ? `sku-help-${key}` : undefined}
          onChange={(e) =>
            changed({
              [key]:
                type === 'number'
                  ? e.target.value === ''
                    ? null
                    : Number(e.target.value)
                  : referenceType
                    ? referenceValue(referenceType, e.target.value)
                    : e.target.value,
            })
          }
        />
        {(errors[key] || hint) && (
          <p
            id={`sku-help-${key}`}
            className={errors[key] ? 'hn-sku-field-error' : 'hn-sku-field-hint'}
          >
            {errors[key] || hint}
          </p>
        )}
      </div>
    );
  }
  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (guard.current || conflict) return;
    const issues = validateSku(draft, rows, models);
    setErrors(issues);
    if (Object.keys(issues).length) {
      window.requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    guard.current = true;
    setBusy(true);
    onBusy(true);
    setMessage('');
    await pause();
    guard.current = false;
    setBusy(false);
    onBusy(false);
    if (result === 'error') {
      setMessage(
        'Chưa lưu được dữ liệu DEMO. Nội dung đã nhập được giữ nguyên; bạn có thể chọn kịch bản Thành công rồi thử lại.',
      );
      return;
    }
    if (result === 'conflict') {
      setConflict(true);
      return;
    }
    const record = {
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      id: draft.id || `new-${crypto.randomUUID()}`,
      revision: draft.revision + 1,
    };
    onSaved(record);
  }
  return (
    <form ref={formRef} className="hn-sku-form" onSubmit={submit} noValidate>
      <div className="hn-sku-dialog-body">
        <SkuNotice>
          Chỉ lưu vào bộ dữ liệu DEMO trong lượt xem. Trường bắt buộc theo loại,
          mặc định serial và điều kiện hoàn tất:{' '}
          <strong>Chờ chốt nghiệp vụ</strong>. Kiểm tra mã/tên và định mức dưới
          đây phục vụ kịch bản mẫu.
        </SkuNotice>
        {message && (
          <SkuNotice tone={result === 'error' ? 'error' : 'info'}>
            {message}
          </SkuNotice>
        )}
        {conflict && (
          <SkuNotice tone="warning">
            <strong>Phiên bản mẫu đã thay đổi. Chưa lưu dữ liệu.</strong>
            <p>
              Bản đang sửa v{draft.revision}; bản mới mô phỏng v
              {draft.revision + 1}. Bản mẫu mới chỉ thay phiên bản; nội dung bạn
              nhập vẫn được giữ.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft((old) => ({ ...old, revision: old.revision + 1 }));
                setConflict(false);
                setResult('success');
                setMessage(
                  'Đã tải phiên bản DEMO mới. Kiểm tra nội dung rồi bấm Lưu lại; không tự động ghi đè.',
                );
              }}
            >
              <RefreshCw /> Tải phiên bản mẫu mới
            </Button>
          </SkuNotice>
        )}
        <div className="hn-sku-form-grid">
          <fieldset disabled={busy}>
            <legend>01 · Thông tin SKU</legend>
            {field(
              'code',
              'Mã SKU · cần có trong DEMO',
              locked
                ? 'Đã phát sinh tồn mẫu nên không thể đổi mã.'
                : 'Mã phải khác các SKU trong bộ dữ liệu mẫu.',
              'text',
              locked,
            )}
            {field('name', 'Tên SKU · cần có trong DEMO')}
            <SkuSelect
              id="sku-form-type"
              label="Loại"
              value={draft.type}
              options={[
                { value: 'product', label: 'Sản phẩm' },
                { value: 'component', label: 'Linh kiện' },
              ]}
              onChange={(type) => changed({ type: type as Sku['type'] })}
              disabled={busy}
            />
            {field('unit', 'Đơn vị')}
            {field('version', 'Phiên bản')}
            <SkuSelect
              id="sku-form-active"
              label="Trạng thái sử dụng mẫu"
              value={draft.active ? 'yes' : 'no'}
              options={[
                { value: 'yes', label: 'Đang sử dụng' },
                { value: 'no', label: 'Không hoạt động' },
              ]}
              onChange={(v) => changed({ active: v === 'yes' })}
              disabled={busy}
            />
          </fieldset>
          <fieldset disabled={busy}>
            <legend>02 · Danh mục tham chiếu</legend>
            <SkuSelect
              id="sku-form-brand"
              label="Hãng"
              value={draft.brand || 'unset'}
              options={[
                { value: 'unset', label: 'Chưa chọn Hãng' },
                ...brands.filter((b) => b.active || b.value === draft.brand),
              ]}
              onChange={(v) => brandChange(v === 'unset' ? '' : v)}
              disabled={busy}
            />
            <SkuSelect
              id="sku-form-model"
              label="Model theo Hãng"
              value={draft.model || 'unset'}
              options={[
                {
                  value: 'unset',
                  label: draft.brand ? 'Chưa chọn Model' : 'Chọn Hãng trước',
                },
                ...modelsFor(draft.brand).map((m) => ({
                  value: m.value,
                  label: `${m.label} · ${brandName(m.brand)}`,
                })),
              ]}
              onChange={(v) => changed({ model: v === 'unset' ? '' : v })}
              disabled={busy || !draft.brand}
            />
            {errors.model && (
              <p className="hn-sku-field-error" role="alert">
                {errors.model}
              </p>
            )}
            {field('group', 'Nhóm hàng')}
            {field('power', 'Công suất')}
            {field('packaging', 'Quy cách đóng gói')}
            <p className="hn-sku-field-hint">
              Hãng và Model là danh mục giả lập. Không suy ra quan hệ
              Loại–Nhóm–Công suất khi chưa có quy tắc được duyệt.
            </p>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>
              03 · Định mức tồn ({draft.unit || 'chưa chọn đơn vị'})
            </legend>
            {field(
              'min',
              'Định mức tối thiểu',
              'Để trống: chưa thiết lập. Giá trị 0 khác với để trống.',
              'number',
            )}
            {field(
              'max',
              'Định mức tối đa',
              'Để trống hoặc từ 1 trở lên, lớn hơn tối thiểu.',
              'number',
            )}
          </fieldset>
          <fieldset disabled={busy}>
            <legend>04 · Kiểm soát & ứng dụng</legend>
            <SkuSelect
              id="sku-form-serial"
              label="Quản lý serial"
              value={
                draft.serial === null ? 'unset' : draft.serial ? 'yes' : 'no'
              }
              options={[
                { value: 'unset', label: 'Chưa chọn · chờ chốt mặc định' },
                { value: 'yes', label: 'Có · lựa chọn DEMO' },
                { value: 'no', label: 'Không · lựa chọn DEMO' },
              ]}
              onChange={(v) =>
                changed({ serial: v === 'unset' ? null : v === 'yes' })
              }
              disabled={busy || locked}
            />
            <p className="hn-sku-field-hint">
              {locked
                ? 'Đã phát sinh tồn mẫu: khóa thay đổi chế độ serial.'
                : 'Không tự đổi serial theo Loại. Chưa xác định mặc định nghiệp vụ.'}
            </p>
            <div className="hn-sku-app-readout">
              <span>Ứng dụng phân vùng</span>
              <SkuBadge tone={draft.published ? 'purple' : 'muted'}>
                {draft.published ? 'Đang hiển thị' : 'Chưa hiển thị'}
              </SkuBadge>
              <p>
                Thay đổi tại action riêng sau khi lưu DEMO. Điều kiện đưa/gỡ
                khỏi ứng dụng đang chờ chốt.
              </p>
            </div>
          </fieldset>
        </div>
        <div className="hn-sku-action-scenario">
          <SkuSelect
            id="sku-save-scenario"
            label="Kết quả lưu DEMO"
            value={result}
            options={[
              { value: 'success', label: 'Thành công' },
              { value: 'error', label: 'Lỗi kết nối' },
              { value: 'conflict', label: 'Xung đột phiên' },
            ]}
            onChange={(v) => {
              setResult(v as typeof result);
              setMessage('');
            }}
            disabled={busy || conflict}
          />
          <span>Không gửi yêu cầu tới hệ thống thật.</span>
        </div>
      </div>
      <Footer>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          Hủy / quay lại
        </Button>
        <Button type="submit" disabled={busy || conflict}>
          {busy ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
          {busy ? 'Đang lưu mẫu…' : 'Lưu SKU · DEMO'}
        </Button>
      </Footer>
    </form>
  );
}

export function SkuPublish({
  sku,
  onBusy,
  onClose,
  onDone,
}: {
  sku: Sku;
  onBusy: (v: boolean) => void;
  onClose: () => void;
  onDone: (s: Sku) => void;
}) {
  const [initial] = useState(() => ({ ...sku }));
  const [revision, setRevision] = useState(sku.revision);
  const [scenario, setScenario] = useState('conflict');
  const [state, setState] = useState<
    'confirm' | 'working' | 'conflict' | 'loaded' | 'error' | 'denied' | 'done'
  >('confirm');
  const guard = useRef(false);
  const target = !initial.published;
  const currentLabel = initial.published ? 'Đang hiển thị' : 'Chưa hiển thị';
  const targetLabel = target ? 'Đang hiển thị' : 'Chưa hiển thị';
  async function apply() {
    if (guard.current || state === 'conflict') return;
    guard.current = true;
    setState('working');
    onBusy(true);
    await pause();
    guard.current = false;
    onBusy(false);
    if (scenario === 'conflict' && revision === initial.revision) {
      setState('conflict');
      return;
    }
    if (scenario === 'error') {
      setState('error');
      return;
    }
    if (scenario === 'denied') {
      setState('denied');
      return;
    }
    onDone({ ...initial, published: target, revision: revision + 1 });
    setState('done');
  }
  async function reload() {
    if (guard.current) return;
    guard.current = true;
    onBusy(true);
    setState('working');
    await pause();
    setRevision(initial.revision + 1);
    setState('loaded');
    guard.current = false;
    onBusy(false);
  }
  return (
    <>
      <div className="hn-sku-dialog-body">
        <SkuNotice tone="warning">
          <strong>Chờ chốt nghiệp vụ — chỉ xem luồng DEMO.</strong>
          <p>
            Chưa xác định điều kiện được đưa SKU lên ứng dụng hoặc hậu quả khi
            gỡ đối với giỏ hàng/đơn đang mở. Xác nhận bên dưới chỉ đổi nhãn
            trong bộ dữ liệu mẫu, không quyết định tính hợp lệ của SKU thật.
          </p>
        </SkuNotice>
        <div className="hn-sku-publish-flow">
          <div>
            <span>Trạng thái máy chủ mô phỏng</span>
            <strong>{state === 'done' ? targetLabel : currentLabel}</strong>
            <small>
              Phiên bản v
              {state === 'done'
                ? revision + 1
                : state === 'conflict'
                  ? initial.revision + 1
                  : revision}
            </small>
          </div>
          <ArrowRight />
          <div>
            <span>Thay đổi đang yêu cầu</span>
            <strong>{targetLabel}</strong>
            <small>{initial.code}</small>
          </div>
        </div>
        {state === 'conflict' && (
          <SkuNotice tone="warning">
            <strong>Chưa thực hiện — xung đột phiên bản DEMO.</strong>
            <p>
              Bản đã đọc v{initial.revision}; máy chủ mô phỏng đang ở v
              {initial.revision + 1}, trạng thái vẫn{' '}
              {currentLabel.toLowerCase()}. Tải bản mới trước khi xác nhận lại.
            </p>
            <Button variant="outline" onClick={reload}>
              <RefreshCw /> Tải bản mới
            </Button>
          </SkuNotice>
        )}
        {state === 'loaded' && (
          <SkuNotice tone="success">
            <strong>Đã tải bản mới v{revision}.</strong>
            <p>
              Chưa thay đổi hiển thị. Hãy đối chiếu trạng thái rồi xác nhận lại
              một lần; hệ thống không tự động thử lại thao tác ghi.
            </p>
          </SkuNotice>
        )}
        {state === 'error' && (
          <SkuNotice tone="error">
            Lỗi kết nối mẫu trước khi ghi. Trạng thái vẫn{' '}
            {currentLabel.toLowerCase()}. Chọn lại kịch bản rồi thử lại; không
            hiển thị thành công giả.
          </SkuNotice>
        )}
        {state === 'denied' && (
          <SkuNotice tone="error">
            Kịch bản bị từ chối quyền. Không đổi trạng thái. Quyền thực tế phải
            do backend xác nhận, không lấy từ URL.
          </SkuNotice>
        )}
        {state === 'done' ? (
          <SkuNotice tone="success">
            <strong>
              {initial.code}: đã {target ? 'bật' : 'tắt'} hiển thị DEMO.
            </strong>
            <p>
              Danh sách mẫu đã cập nhật. Tải lại trang sẽ khôi phục dữ liệu ban
              đầu.
            </p>
          </SkuNotice>
        ) : (
          <div className="hn-sku-action-scenario">
            <SkuSelect
              id="sku-publish-scenario"
              label="Kịch bản phản hồi DEMO"
              value={scenario}
              options={[
                {
                  value: 'conflict',
                  label: 'Xung đột → tải bản mới → xác nhận lại',
                },
                { value: 'success', label: 'Thành công' },
                { value: 'error', label: 'Lỗi kết nối trước khi ghi' },
                { value: 'denied', label: 'Bị từ chối quyền' },
              ]}
              onChange={(v) => {
                setScenario(v);
                setRevision(initial.revision);
                setState('confirm');
              }}
              disabled={state === 'working'}
            />
          </div>
        )}
      </div>
      <Footer>
        <Button
          variant="outline"
          disabled={state === 'working'}
          onClick={onClose}
        >
          {state === 'done' ? 'Về danh sách' : 'Hủy / đóng'}
        </Button>
        {state !== 'done' && (
          <Button
            disabled={
              state === 'working' || state === 'conflict' || state === 'denied'
            }
            onClick={apply}
          >
            {state === 'working' && <LoaderCircle className="animate-spin" />}
            {state === 'working'
              ? 'Đang xử lý mẫu…'
              : state === 'loaded'
                ? `Xác nhận lại với v${revision} · DEMO`
                : `Xác nhận ${target ? 'đưa lên' : 'gỡ khỏi'} · DEMO`}
          </Button>
        )}
      </Footer>
    </>
  );
}

const importErrors = [
  {
    row: 3,
    code: 'DEMO-IMPORT-003',
    field: 'Tên SKU',
    value: '(trống)',
    reason: 'Thiếu tên trong bộ mẫu',
    fix: 'Bổ sung tên để chạy lại kịch bản.',
  },
  {
    row: 6,
    code: 'DEMO-IMPORT-006',
    field: 'Model',
    value: 'B-01 / Hãng mẫu A',
    reason: 'Model không thuộc Hãng',
    fix: 'Chọn A-01 hoặc A-02 trong danh mục mẫu.',
  },
];
export function SkuImport({
  onBusy,
  onDirty,
  onClose,
}: {
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [scenario, setScenario] = useState('invalid');
  const [updates, setUpdates] = useState(false);
  const [step, setStep] = useState<
    'choose' | 'loading' | 'preview' | 'confirm' | 'committing' | 'done'
  >('choose');
  const [response, setResponse] = useState('success');
  const [error, setError] = useState('');
  const [errorFilter, setErrorFilter] = useState('all');
  const guard = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalid = scenario === 'invalid';
  const counts = {
    new: invalid ? 3 : 4,
    update: updates ? 2 : 0,
    skip: updates ? 2 : 4,
  };
  const reset = () => {
    setFile(null);
    setFileError('');
    setStep('choose');
    setError('');
    onDirty(false);
    if (inputRef.current) inputRef.current.value = '';
  };
  async function preview() {
    if (guard.current) return;
    guard.current = true;
    onBusy(true);
    onDirty(true);
    setStep('loading');
    await pause();
    setStep('preview');
    onBusy(false);
    guard.current = false;
  }
  async function commit() {
    if (guard.current || invalid || step !== 'confirm') return;
    guard.current = true;
    onBusy(true);
    setStep('committing');
    setError('');
    await pause();
    onBusy(false);
    guard.current = false;
    if (response === 'error') {
      setError(
        'Kịch bản lỗi trước commit: toàn bộ lô mẫu chưa được nhập. Không có kết quả ghi một phần.',
      );
      setStep('preview');
      return;
    }
    setStep('done');
    onDirty(false);
  }
  function downloadErrors() {
    const cells = (s: string | number) =>
      `"${String(s).replaceAll('"', '""')}"`;
    const csv =
      '\uFEFF' +
      [
        ['Dòng mẫu', 'Mã mẫu', 'Cột', 'Giá trị', 'Lý do', 'Hướng sửa'],
        ...importErrors.map((e) => [
          e.row,
          e.code,
          e.field,
          e.value,
          e.reason,
          e.fix,
        ]),
      ]
        .map((r) => r.map(cells).join(','))
        .join('\r\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'loi-nhap-SKU-DEMO.csv';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const busy = step === 'loading' || step === 'committing';
  const errorRows = importErrors.filter(
    (e) => errorFilter === 'all' || e.field === errorFilter,
  );
  return (
    <>
      <div className="hn-sku-dialog-body">
        <ol className="hn-sku-import-steps" aria-label="Các bước nhập SKU">
          {['Chọn tệp / bộ mẫu', 'Kiểm tra trước', 'Xác nhận', 'Kết quả'].map(
            (label, i) => (
              <li
                key={label}
                aria-current={
                  (step === 'choose'
                    ? 0
                    : step === 'preview' || step === 'loading'
                      ? 1
                      : step === 'confirm' || step === 'committing'
                        ? 2
                        : 3) === i
                    ? 'step'
                    : undefined
                }
              >
                <span>{i + 1}</span>
                {label}
              </li>
            ),
          )}
        </ol>
        <SkuNotice>
          <strong>
            Luồng minh họa bằng bộ dữ liệu cố định, không đọc nội dung Excel.
          </strong>
          <p>
            Chọn tệp bên dưới chỉ kiểm tra đuôi tệp và dung lượng tại thiết bị,
            không tải lên. Preview/kết quả luôn thuộc bộ mẫu, không phải nội
            dung tệp đã chọn. Template 24 cột chính thức: chờ cung cấp.
          </p>
        </SkuNotice>
        {step === 'choose' && (
          <>
            <div className="hn-sku-file-picker">
              <FileSpreadsheet />
              <div>
                <h3>Chọn tệp Excel</h3>
                <p>.xlsx, .xls · tối đa 10 MB</p>
                <span>Kiểm tra metadata tại thiết bị, không upload</span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                aria-hidden="true"
                id="sku-file"
                tabIndex={-1}
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (!chosen) return;
                  const invalidFile = checkImportFile(chosen);
                  setFileError(invalidFile);
                  setFile(
                    invalidFile
                      ? null
                      : { name: chosen.name, size: chosen.size },
                  );
                  onDirty(!invalidFile);
                }}
              />
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                <Upload /> Chọn tệp
              </Button>
            </div>
            {fileError && <SkuNotice tone="error">{fileError}</SkuNotice>}
            {file && (
              <div className="hn-sku-file">
                <FileCheck2 />
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {(file.size / 1024).toFixed(1)} KB · Đúng đuôi tệp/dung
                    lượng; chưa kiểm tra nội dung
                  </small>
                </span>
                <Button
                  variant="ghost"
                  aria-label="Bỏ tệp đã chọn"
                  onClick={() => {
                    setFile(null);
                    onDirty(false);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                >
                  <X />
                </Button>
              </div>
            )}
            <div className="hn-sku-import-limits">
              <div>
                <strong>1.000</strong>
                <span>dòng dữ liệu tối đa</span>
              </div>
              <div>
                <strong>24</strong>
                <span>cột tối đa</span>
              </div>
              <div>
                <strong>20.040</strong>
                <span>dòng worksheet kể cả trống</span>
              </div>
            </div>
            <p className="hn-sku-field-hint">
              Các giới hạn trên được ghi nhận từ màn gốc; prototype chưa đọc
              workbook để kiểm tra số dòng/cột. Mã và Tên là cột tối thiểu; các
              quy tắc khác cần BA chốt.
            </p>
            <div className="hn-sku-action-scenario">
              <SkuSelect
                id="sku-import-scenario"
                label="Bộ mẫu để xem luồng"
                value={scenario}
                options={[
                  { value: 'invalid', label: 'Bộ mẫu có lỗi · chặn nhập' },
                  { value: 'valid', label: 'Bộ mẫu không lỗi · xem xác nhận' },
                ]}
                onChange={setScenario}
              />
              <label className="hn-sku-check" htmlFor="sku-import-updates">
                <Checkbox
                  id="sku-import-updates"
                  checked={updates}
                  onCheckedChange={(v) => setUpdates(!!v)}
                />
                Cho phép cập nhật SKU đã có · DEMO
              </label>
            </div>
            {updates && (
              <SkuNotice tone="warning">
                Quyền ghi đè từng trường chưa được chốt. Bộ mẫu chỉ minh họa số
                dòng cập nhật; không thay mã hoặc chế độ serial đã khóa và không
                cập nhật danh sách thật.
              </SkuNotice>
            )}
          </>
        )}
        {busy && (
          <output className="hn-sku-empty">
            <LoaderCircle className="animate-spin" />
            <h3>
              {step === 'loading'
                ? 'Đang dựng preview bộ mẫu…'
                : 'Đang mô phỏng nhập toàn bộ lô…'}
            </h3>
            <p>Không gửi tệp hoặc dữ liệu đến hệ thống kho.</p>
          </output>
        )}
        {(step === 'preview' || step === 'confirm' || step === 'done') && (
          <>
            <div className="hn-sku-import-summary">
              {[
                ['Tạo mới', counts.new],
                ['Cập nhật', counts.update],
                ['Bỏ qua', counts.skip],
                ['Dòng lỗi', invalid ? 2 : 0],
                ['Cảnh báo', 0],
              ].map(([label, n]) => (
                <div
                  key={String(label)}
                  className={label === 'Dòng lỗi' && invalid ? 'error' : ''}
                >
                  <strong>{n}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="hn-sku-field-hint">
              {invalid ? '9' : '8'} dòng mẫu = {counts.new} tạo mới +{' '}
              {counts.update} cập nhật + {counts.skip} bỏ qua +{' '}
              {invalid ? 2 : 0} dòng lỗi. Không có cảnh báo trong bộ mẫu; quy
              tắc tiếp tục khi có cảnh báo chưa được chốt.
            </p>
            {error && <SkuNotice tone="error">{error}</SkuNotice>}
            {invalid ? (
              <>
                <SkuNotice tone="error">
                  <strong>Chưa thể nhập: còn 2 dòng lỗi trong bộ mẫu.</strong>
                  <p>
                    Nguyên tắc toàn bộ hoặc không: không dòng nào được nhập khi
                    còn lỗi. Quay lại và chọn bộ mẫu không lỗi để xem luồng tiếp
                    theo.
                  </p>
                </SkuNotice>
                <div className="hn-sku-error-tools">
                  <SkuSelect
                    id="sku-import-error-filter"
                    label="Lọc lỗi theo cột"
                    value={errorFilter}
                    options={[
                      { value: 'all', label: 'Tất cả lỗi' },
                      { value: 'Tên SKU', label: 'Tên SKU' },
                      { value: 'Model', label: 'Model' },
                    ]}
                    onChange={setErrorFilter}
                  />
                  <Button variant="outline" onClick={downloadErrors}>
                    <Download /> Tải lỗi mẫu
                  </Button>
                </div>
                <Table className="hn-sku-import-errors">
                  <TableHeader>
                    <TableRow>
                      {[
                        'Dòng / Mã mẫu',
                        'Cột / Giá trị',
                        'Lý do / Hướng sửa',
                      ].map((x) => (
                        <TableHead key={x} scope="col">
                          {x}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorRows.map((e) => (
                      <TableRow key={e.row}>
                        <TableCell>
                          <strong>Dòng {e.row}</strong>
                          <span>{e.code}</span>
                        </TableCell>
                        <TableCell>
                          <strong>{e.field}</strong>
                          <span>{e.value}</span>
                        </TableCell>
                        <TableCell>
                          <strong>{e.reason}</strong>
                          <span>{e.fix}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              step !== 'done' && (
                <SkuNotice tone="success">
                  <strong>Bộ mẫu không có lỗi.</strong>
                  <p>
                    Đây không phải kết quả xác thực tệp của bạn.{' '}
                    {step === 'confirm'
                      ? `Bạn đang xác nhận mô phỏng ${counts.new} tạo mới, ${counts.update} cập nhật và ${counts.skip} bỏ qua.`
                      : 'Bạn có thể chuyển sang bước xác nhận mô phỏng.'}
                  </p>
                </SkuNotice>
              )
            )}
            {step === 'confirm' && (
              <SkuSelect
                id="sku-import-result"
                label="Kết quả commit DEMO"
                value={response}
                options={[
                  { value: 'success', label: 'Thành công toàn bộ lô mẫu' },
                  {
                    value: 'error',
                    label: 'Lỗi trước commit · không ghi dòng nào',
                  },
                ]}
                onChange={setResponse}
              />
            )}
            {step === 'done' && (
              <div className="hn-sku-import-done">
                <CheckCircle2 />
                <h3>Đã hoàn tất mô phỏng nhập SKU</h3>
                <p>
                  Kết quả bộ mẫu: {counts.new} tạo mới, {counts.update} cập
                  nhật, {counts.skip} bỏ qua. Không ghi vào danh sách SKU hoặc
                  hệ thống thật. Đã khóa nút nhập lại để tránh thao tác trùng
                  trong kịch bản này.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer>
        <Button variant="outline" disabled={busy} onClick={onClose}>
          {step === 'done' ? 'Đóng kết quả' : 'Hủy / đóng'}
        </Button>
        {step !== 'choose' && step !== 'done' && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setStep('choose');
              setError('');
            }}
          >
            Quay lại chọn bộ mẫu
          </Button>
        )}
        {step === 'choose' && (
          <>
            <Button
              variant="ghost"
              disabled={!file && !fileError}
              onClick={reset}
            >
              Làm lại
            </Button>
            <Button onClick={preview}>
              <FileCheck2 /> Xem kiểm tra bộ mẫu
            </Button>
          </>
        )}
        {step === 'preview' && (
          <Button disabled={invalid} onClick={() => setStep('confirm')}>
            Tiếp tục xác nhận <ArrowRight />
          </Button>
        )}
        {step === 'confirm' && (
          <Button onClick={commit}>Nhập toàn bộ lô · DEMO</Button>
        )}
        {step === 'done' && (
          <Button variant="outline" onClick={reset}>
            Xem kịch bản khác
          </Button>
        )}
      </Footer>
    </>
  );
}

export function SkuRules({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="hn-sku-dialog-body">
        <SkuNotice>
          Phạm vi được xác nhận: bổ sung prototype SKU, không sửa WMS thật. Giữ
          Hoa Nam Design v2 sáng, xanh teal làm accent; không thay Dashboard hoặc các màn đăng
          nhập.
        </SkuNotice>
        <section className="hn-sku-rules">
          <h3>Đã thể hiện trong prototype</h3>
          <ul>
            <li>
              Filter → sắp xếp toàn tập → phân trang; mã và Hành động cố định
              khi cuộn.
            </li>
            <li>
              URL lưu tìm kiếm, loại, hãng, trạng thái, hàng đợi, sort, trang và
              số dòng bằng nhóm tham số <code>sku*</code>, độc lập Dashboard.
            </li>
            <li>
              Model lọc theo Hãng mẫu; đổi Hãng sẽ bỏ Model không phù hợp và
              thông báo.
            </li>
            <li>
              Xem, sửa, thêm, hàng đợi mẫu, nhập Excel minh họa và đưa/gỡ ứng
              dụng DEMO.
            </li>
            <li>Không có checkbox chọn nhiều khi chưa xác định bulk action.</li>
          </ul>
          <h3>Chờ BA/PO chốt — chưa áp dụng thành quy tắc thật</h3>
          <ul>
            <li>
              Trường bắt buộc theo loại và điều kiện rời hàng đợi chờ điền.
            </li>
            <li>
              Mặc định serial; quan hệ Loại–Nhóm–Công suất và quyền thay đổi.
            </li>
            <li>
              Điều kiện publish, quyền/duyệt, ảnh/tài liệu và ảnh hưởng khi
              unpublish.
            </li>
            <li>Bulk action được phép, phạm vi chọn và điều kiện từng SKU.</li>
            <li>
              Template Excel 24 cột, trường ghi đè và cách xử lý cảnh báo.
            </li>
            <li>
              Collation, vị trí giá trị trống và tìm kiếm bỏ dấu. DEMO hiện dùng
              so sánh tiếng Việt có phân biệt dấu, không phân biệt hoa/thường,
              số tự nhiên; giá trị trống cuối bảng ở cả hai chiều.
            </li>
          </ul>
          <h3>DEV cần triển khai/kiểm chứng tại hệ thống thật</h3>
          <ul>
            <li>
              Sort và pagination chung hợp đồng API; kiểm tra lại Hãng–Model và
              eligibility phía server.
            </li>
            <li>
              Xung đột: tải version/ETag mới, đối chiếu rồi xác nhận lại có kiểm
              soát; không tự retry thao tác ghi.
            </li>
            <li>
              Phân quyền, phiên khi reload, kiểm thử nhiều phiên, idempotency và
              giao dịch import toàn bộ hoặc không.
            </li>
            <li>
              Không suy từ kết quả DEMO rằng các lỗi backend hoặc phiên đăng
              nhập đã được sửa.
            </li>
          </ul>
          <h3>Giới hạn dữ liệu mẫu</h3>
          <p>
            72 SKU giả lập, 3 SKU được gán sẵn vào hàng đợi mẫu. Không sao chép
            819 SKU của hệ thống. Tạo/sửa/hiển thị chỉ thay đổi trong bộ nhớ
            lượt xem; refresh đặt lại dữ liệu, nhưng giữ điều kiện danh sách từ
            URL. Import dùng bộ mẫu cố định, không đọc/tải workbook.
          </p>
        </section>
      </div>
      <Footer>
        <Button onClick={onClose}>Đã hiểu</Button>
      </Footer>
    </>
  );
}
