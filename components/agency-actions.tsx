'use client';
import { useRef, useState, type SyntheticEvent } from 'react';
import { CheckCircle2, LoaderCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { SkuNotice, SkuSelect } from './sku-primitives';
import {
  AGENCY_TYPES,
  DEMO_PROVINCES,
  agencyAddress,
  agencyLabel,
  agencyPendingChanges,
  agencyTypeLabel,
  demoWards,
  emptyAgency,
  prepareAgencySave,
  validateAgency,
  type Agency,
} from '@/lib/agency-demo';

export function AgencyImpact() {
  return (
    <div className="hn-agy-address-preview">
      <strong>Thông tin tác động · Chờ BA/PO</strong>
      <p>
        Số chứng từ tham chiếu: <b>Chưa có dữ liệu</b> — không hiểu là 0.
      </p>
      <p className="hn-agy-hint">
        Chưa kết nối API usage/impact. Cần xác nhận việc đổi Mã, Loại, Trạng
        thái và địa chỉ ảnh hưởng thế nào tới chứng từ mới, bản nháp và lịch sử.
        Không tự cập nhật dây chuyền.
      </p>
    </div>
  );
}
export function AgencyDetail({
  record,
  onEdit,
  onClose,
}: {
  record: Agency;
  onEdit: () => void;
  onClose: () => void;
}) {
  const fields = [
    ['Mã nơi nhận', record.code],
    ['Tên nơi nhận', record.name],
    ['Loại nơi nhận', agencyTypeLabel(record.type)],
    ['Trạng thái', record.active ? 'Đang sử dụng' : 'Ngừng sử dụng'],
    ['Thị trường', agencyLabel(record.market)],
    ['Khu vực', agencyLabel(record.area)],
    ['Người liên hệ', record.contact || 'Chưa có'],
    ['Điện thoại', record.phone || 'Chưa có'],
  ];
  return (
    <>
      <div className="hn-agy-modal-body">
        <div className="hn-agy-grid">
          {fields.map(([label, value]) => (
            <dl key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </dl>
          ))}
        </div>
        <div className="hn-agy-address-preview">
          <strong>Địa chỉ đầy đủ</strong>
          {agencyAddress(record) || 'Chưa có địa chỉ'}
          {record.legacyAddress && (
            <p className="hn-agy-hint">
              Địa chỉ cũ được giữ nguyên; chưa chuẩn hóa.
            </p>
          )}
        </div>
        <AgencyImpact />
        <details>
          <summary>Mã địa bàn gốc · đối chiếu dữ liệu</summary>
          <p className="hn-agy-hint">
            Thị trường: {record.market || 'Chưa có'} · Khu vực:{' '}
            {record.area || 'Chưa có'}. Nhãn tiếng Việt chỉ phục vụ trình bày,
            không tự suy ra quan hệ địa bàn.
          </p>
        </details>
      </div>
      <footer>
        <Button variant="outline" onClick={onClose}>
          Đóng chi tiết
        </Button>
        <Button onClick={onEdit}>
          <Pencil /> Sửa nơi nhận
        </Button>
      </footer>
    </>
  );
}
export function AgencyRules({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="hn-agy-modal-body">
        <h3>Phạm vi đã triển khai</h3>
        <p>
          26 nơi nhận hoàn toàn minh họa, 4 loại, mặc định 10 dòng; tìm
          mã/tên/thị trường/khu vực, lọc → sort toàn tập → phân trang. Xem đầy
          đủ, Thêm/Sửa DEMO, URL/Back/Forward và cảnh báo chưa lưu.
        </p>
        <h3>Quy tắc kỹ thuật DEMO, chưa thay thế hợp đồng API</h3>
        <p>
          Mã, Tên và Loại có giá trị; giới hạn ký tự theo form khảo sát, mã
          trùng so sánh không phân biệt hoa/thường trong tập mẫu. Sort tiếng
          Việt có xét số và giữ dấu; search trim, không phân biệt hoa/thường và
          giữ dấu. Không tự đổi uppercase hoặc áp regex mã chưa duyệt.
        </p>
        <p>
          Điện thoại là chuỗi, giữ số 0 đầu và dữ liệu cũ; không tự cắt còn 10
          số hoặc xóa giá trị không khớp rule mới. Cần BA xác nhận format, số
          quốc tế/số bàn và quy tắc paste. Không tìm theo liên hệ/điện thoại và
          không tự ghi các trường này vào URL.
        </p>
        <h3>Địa bàn chưa chốt</h3>
        <p>
          Thị trường/Khu vực giữ giá trị tự do theo form gốc, hiển thị nhãn cho
          mã đã biết. Không tự suy ra từ Tỉnh. Tỉnh/Phường trong prototype là
          danh sách giả lập A/B, không phải danh mục hành chính chính thức. Địa
          chỉ cũ giữ nguyên khi sửa trường khác; chuẩn hóa chỉ xem trước.
        </p>
        <AgencyImpact />
        <p>
          Thay đổi Mã/Loại/Trạng thái ở bản ghi đã có chỉ xem trước, không áp
          dụng khi chưa có quy tắc BA/PO. Đây là giới hạn prototype, không kết
          luận hệ thống thật phải khóa các trường này.
        </p>
        <h3>Giới hạn kiểm thử</h3>
        <p>
          Lưu, lỗi và xung đột là mô phỏng trong bộ nhớ. Tải lại trang khôi phục
          mẫu; không có API, chứng từ, audit history, quyền production,
          nhập/xuất hay bulk action. Không xác nhận lỗi DOM/payload của hệ thống
          thật đã được sửa.
        </p>
      </div>
      <footer>
        <Button onClick={onClose}>Đã hiểu phạm vi</Button>
      </footer>
    </>
  );
}
function AddressCombo({
  id,
  label,
  value,
  items,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  items: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="hn-agy-combo">
      <label htmlFor={id}>{label}</label>
      <Combobox
        items={items}
        value={value || null}
        onValueChange={(v) => onChange(v || '')}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          showTrigger={false}
          placeholder={
            disabled ? 'Chọn Tỉnh mẫu trước' : 'Tìm và chọn địa bàn mẫu…'
          }
          disabled={disabled}
        >
          <ComboboxTrigger
            aria-label={`Mở lựa chọn ${label}`}
            disabled={disabled}
            className="hn-agy-combo-trigger"
          />
        </ComboboxInput>
        <ComboboxContent className="hn-agy-combo-options">
          <ComboboxEmpty>Không có địa bàn mẫu phù hợp</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
export function AgencyForm({
  record,
  records,
  onDirty,
  onBusy,
  onSave,
  onClose,
}: {
  record?: Agency;
  records: Agency[];
  onDirty: (v: boolean) => void;
  onBusy: (v: boolean) => void;
  onSave: (d: Agency) => void;
  onClose: () => void;
}) {
  const [initial] = useState(() => (record ? { ...record } : emptyAgency()));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [migration, setMigration] = useState(false);
  const [preview, setPreview] = useState(false);
  const [outcome, setOutcome] = useState('success');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false),
    guard = useRef(false);
  const [conflict, setConflict] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const sensitive = record ? agencyPendingChanges(initial, draft) : [];
  const pending = sensitive.length > 0 || migration;
  const payload = prepareAgencySave(initial, draft);
  function change(patch: Partial<Agency>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setPreview(false);
    setMessage('');
    onDirty(JSON.stringify(next) !== JSON.stringify(initial) || migration);
    setErrors((old) =>
      Object.fromEntries(Object.entries(old).filter(([k]) => !(k in patch))),
    );
  }
  const field = (
    key: 'code' | 'name' | 'market' | 'area' | 'contact' | 'phone' | 'street',
    label: string,
    required = false,
    hint = '',
  ) => (
    <div className={key === 'street' ? 'wide' : undefined}>
      <label htmlFor={`agency-form-${key}`}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <Input
        id={`agency-form-${key}`}
        name={key}
        type={key === 'phone' ? 'tel' : 'text'}
        inputMode={key === 'phone' ? 'tel' : 'text'}
        value={draft[key]}
        aria-required={required}
        aria-invalid={!!errors[key]}
        aria-describedby={`agency-help-${key}`}
        onChange={(e) => change({ [key]: e.target.value })}
      />
      <div id={`agency-help-${key}`}>
        {errors[key] && (
          <p className="hn-agy-error" role="alert">
            {errors[key]}
          </p>
        )}
        {hint && <p className="hn-agy-hint">{hint}</p>}
      </div>
    </div>
  );
  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (guard.current) return;
    const next = validateAgency(draft, records);
    setErrors(next);
    setMessage('');
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>(`#agency-form-${Object.keys(next)[0]}`)
          ?.focus(),
      );
      return;
    }
    if (pending) {
      setPreview(true);
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('#agency-impact-review')
          ?.focus(),
      );
      return;
    }
    guard.current = true;
    setBusy(true);
    onBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    guard.current = false;
    setBusy(false);
    onBusy(false);
    if (outcome === 'error') {
      setMessage(
        'Không lưu được dữ liệu DEMO. Nội dung đang nhập được giữ nguyên; thử lại khi sẵn sàng.',
      );
      return;
    }
    if (outcome === 'conflict') {
      setConflict(true);
      return;
    }
    onDirty(false);
    onSave(payload);
  }
  return (
    <form ref={form} className="hn-agy-form" noValidate onSubmit={submit}>
      <div className="hn-agy-modal-body">
        <fieldset disabled={busy}>
          <legend>Thông tin nơi nhận</legend>
          <div className="hn-agy-grid">
            {field(
              'code',
              'Mã nơi nhận',
              true,
              'Tối đa 50 ký tự. Ví dụ DEMO-AG-027; không tự đổi định dạng mã.',
            )}
            {field('name', 'Tên nơi nhận', true, 'Tối đa 255 ký tự.')}
            <div>
              <SkuSelect
                id="agency-form-type"
                label="Loại nơi nhận *"
                value={draft.type}
                options={[
                  { value: '', label: 'Chọn loại nơi nhận' },
                  ...AGENCY_TYPES,
                ]}
                onChange={(type) => change({ type: type as Agency['type'] })}
              />
              {errors.type && (
                <p className="hn-agy-error" role="alert">
                  {errors.type}
                </p>
              )}
            </div>
            <SkuSelect
              id="agency-form-status"
              label="Trạng thái"
              value={draft.active ? 'active' : 'inactive'}
              options={[
                { value: 'active', label: 'Đang sử dụng' },
                { value: 'inactive', label: 'Ngừng sử dụng' },
              ]}
              onChange={(v) => change({ active: v === 'active' })}
            />
          </div>
        </fieldset>
        {record && (
          <>
            <p className="hn-agy-hint">
              Đổi Mã, Loại hoặc Trạng thái: chỉ xem trước tác động trong
              prototype, chờ BA/PO chốt trước khi áp dụng.
            </p>
            <AgencyImpact />
          </>
        )}
        <fieldset disabled={busy} className="hn-agy-section">
          <legend>Địa bàn kinh doanh & liên hệ</legend>
          <div className="hn-agy-grid">
            {field(
              'market',
              'Thị trường',
              false,
              `Nhãn hiện tại: ${agencyLabel(draft.market)}. Nguồn danh mục chờ BA xác nhận.`,
            )}
            {field(
              'area',
              'Khu vực',
              false,
              `Nhãn hiện tại: ${agencyLabel(draft.area)}. Không tự đồng bộ theo Tỉnh.`,
            )}
            {field(
              'contact',
              'Người liên hệ',
              false,
              'Không bắt buộc theo UI đã khảo sát.',
            )}
            {field(
              'phone',
              'Điện thoại',
              false,
              'Giữ nguyên số 0 đầu và giá trị cũ. Quy tắc 10 số/quốc tế đang chờ BA; không tự cắt hoặc đổi dữ liệu.',
            )}
          </div>
        </fieldset>
        <fieldset disabled={busy} className="hn-agy-section">
          <legend>Địa chỉ nơi nhận</legend>
          {initial.legacyAddress && (
            <>
              <div className="hn-agy-address-preview">
                <strong>Địa chỉ cũ · Giữ nguyên khi lưu</strong>
                {initial.legacyAddress}
              </div>
              <p className="hn-agy-hint">
                Sửa tên hoặc liên hệ không làm thay đổi chuỗi địa chỉ này. Không
                ghép tự động với Tỉnh/Phường mới.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMigration(!migration);
                  setPreview(false);
                  const restored = migration
                    ? {
                        ...draft,
                        province: initial.province,
                        ward: initial.ward,
                        street: initial.street,
                      }
                    : draft;
                  setDraft(restored);
                  onDirty(
                    !migration ||
                      JSON.stringify(restored) !== JSON.stringify(initial),
                  );
                }}
              >
                {migration
                  ? 'Dừng xem trước chuẩn hóa'
                  : 'Xem trước chuẩn hóa địa chỉ'}
              </Button>
            </>
          )}
          {(!initial.legacyAddress || migration) && (
            <>
              <p className="hn-agy-hint">
                Tỉnh/Phường A/B là dữ liệu giả lập, không phải địa giới hành
                chính chính thức.
              </p>
              <div className="hn-agy-grid">
                <AddressCombo
                  id="agency-form-province"
                  label="Tỉnh/Thành phố · mẫu"
                  value={draft.province}
                  items={DEMO_PROVINCES}
                  onChange={(province) => {
                    change({ province, ward: '' });
                  }}
                />
                <div>
                  <AddressCombo
                    id="agency-form-ward"
                    label="Phường/Xã · mẫu"
                    value={draft.ward}
                    items={demoWards(draft.province)}
                    disabled={!draft.province}
                    onChange={(ward) => change({ ward })}
                  />
                  {errors.ward && (
                    <p className="hn-agy-error" role="alert">
                      {errors.ward}
                    </p>
                  )}
                </div>
                {field(
                  'street',
                  'Địa chỉ cụ thể',
                  false,
                  'Nhập số nhà/đường; không chép lại toàn bộ địa chỉ cũ. Đổi Tỉnh sẽ bỏ chọn Phường/Xã cũ.',
                )}
              </div>
            </>
          )}
          <div className="hn-agy-address-preview">
            <strong>
              {migration
                ? 'Địa chỉ đề xuất · Chỉ xem trước'
                : 'Địa chỉ đầy đủ sẽ lưu · DEMO'}
            </strong>
            {(migration
              ? [draft.street, draft.ward, draft.province]
                  .filter(Boolean)
                  .join(', ')
              : agencyAddress(payload)) || 'Chưa có địa chỉ'}
          </div>
        </fieldset>
        {preview && (
          <div id="agency-impact-review" tabIndex={-1}>
            <SkuNotice tone="warning">
              <strong>Chưa áp dụng thay đổi</strong>
              <p>
                {migration
                  ? 'Chuẩn hóa địa chỉ cần xác nhận nguồn địa bàn và quy tắc migration. '
                  : ' '}
                {sensitive.length > 0 &&
                  'Mã/Loại/Trạng thái có thay đổi; cần BA/PO xác nhận tác động trước khi lưu.'}{' '}
                Nội dung DEMO đang nhập được giữ lại, không cập nhật bản ghi.
              </p>
            </SkuNotice>
            <AgencyImpact />
            <div className="hn-agy-grid">
              {sensitive.map((key) => (
                <dl key={key}>
                  <dt>
                    {key === 'active'
                      ? 'Trạng thái'
                      : key === 'type'
                        ? 'Loại nơi nhận'
                        : 'Mã nơi nhận'}
                  </dt>
                  <dd>
                    {key === 'active'
                      ? initial.active
                        ? 'Đang sử dụng'
                        : 'Ngừng sử dụng'
                      : key === 'type'
                        ? agencyTypeLabel(initial.type)
                        : initial.code}{' '}
                    →{' '}
                    {key === 'active'
                      ? draft.active
                        ? 'Đang sử dụng'
                        : 'Ngừng sử dụng'
                      : key === 'type'
                        ? agencyTypeLabel(draft.type)
                        : draft.code}
                  </dd>
                </dl>
              ))}
            </div>
          </div>
        )}
        {message && <SkuNotice tone="error">{message}</SkuNotice>}
        {conflict && (
          <SkuNotice tone="warning">
            <strong>Xung đột phiên · Mô phỏng</strong>
            <p>
              Chưa ghi đè bản ghi. So sánh bản DEMO hiện tại và nội dung bạn
              đang nhập trước khi thử lại; đây không phải xung đột từ API thật.
            </p>
            <div className="hn-agy-grid">
              <p>Bản hiện tại: {record?.name || 'Chưa tạo'}</p>
              <p>Đang nhập: {draft.name}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConflict(false);
                setOutcome('success');
                setMessage('');
              }}
            >
              Tải bản DEMO hiện tại & cho phép thử lại
            </Button>
          </SkuNotice>
        )}
        <details>
          <summary>Đối chiếu dữ liệu sẽ lưu · DEMO</summary>
          <p className="hn-agy-hint">
            Payload minh họa được tạo từ cùng state điều khiển input. Khi còn
            thay đổi chờ BA/PO, không gửi/lưu payload. Không có request mạng.
          </p>
          <pre aria-label="Payload nơi nhận DEMO">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
        <SkuSelect
          id="agency-save-scenario"
          label="Kiểm thử kết quả lưu DEMO"
          value={outcome}
          options={[
            { value: 'success', label: 'Thành công' },
            { value: 'error', label: 'Lỗi lưu — giữ dữ liệu' },
            { value: 'conflict', label: 'Xung đột phiên — không ghi đè' },
          ]}
          onChange={setOutcome}
          disabled={busy || conflict}
        />
      </div>
      <footer>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          Hủy / quay lại
        </Button>
        <Button type="submit" disabled={busy || conflict}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" />
              Đang lưu…
            </>
          ) : pending ? (
            'Xem trước tác động'
          ) : (
            <>
              <CheckCircle2 />
              Lưu nơi nhận · DEMO
            </>
          )}
        </Button>
      </footer>
    </form>
  );
}
