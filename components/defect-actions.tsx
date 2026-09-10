'use client';
import { useRef, useState, type SyntheticEvent } from 'react';
import { LoaderCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SkuBadge, SkuNotice, SkuSelect } from './sku-primitives';
import {
  DEFECT_STATUSES,
  defectPendingChanges,
  defectStatus,
  emptyDefect,
  prepareDefectSave,
  validateDefect,
  type Defect,
} from '@/lib/defect-demo';

export function DefectImpact() {
  return (
    <div className="hn-def-impact">
      <strong>Tác động đến hồ sơ bảo hành · Chưa xác nhận</strong>
      <p>
        Số hồ sơ tham chiếu: <b>Chưa có dữ liệu</b>, không hiểu là 0. Chưa kết
        nối API kiểm tra tác động.
      </p>
      <p>
        Quy tắc đổi mã, ngừng sử dụng, hồ sơ cũ và mã thay thế cần BA/BE xác
        nhận; prototype không tự áp dụng dây chuyền.
      </p>
    </div>
  );
}
export function DefectDetail({
  record,
  onEdit,
  onClose,
  readonly,
}: {
  record: Defect;
  onEdit: () => void;
  onClose: () => void;
  readonly: boolean;
}) {
  return (
    <>
      <div className="hn-agy-modal-body">
        <div className="hn-agy-grid">
          <dl>
            <dt>Mã bệnh / lỗi</dt>
            <dd>{record.code}</dd>
          </dl>
          <dl>
            <dt>Trạng thái</dt>
            <dd>
              <SkuBadge tone={record.active ? 'green' : 'muted'}>
                {defectStatus(record.active)}
              </SkuBadge>
            </dd>
          </dl>
          <dl className="wide">
            <dt>Tên bệnh / lỗi</dt>
            <dd>{record.name}</dd>
          </dl>
          <dl className="wide">
            <dt>Mô tả đầy đủ</dt>
            <dd className="hn-def-full-description">
              {record.description || 'Chưa có mô tả'}
            </dd>
          </dl>
        </div>
        <DefectImpact />
      </div>
      <footer>
        <Button variant="outline" onClick={onClose}>
          Đóng chi tiết
        </Button>
        {!readonly && (
          <Button onClick={onEdit}>
            <Pencil /> Sửa bệnh / lỗi
          </Button>
        )}
      </footer>
    </>
  );
}
export function DefectRules({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="hn-agy-modal-body">
        <h3>Phạm vi đã xác nhận</h3>
        <p>
          18 bệnh / lỗi DEMO, mặc định 10 dòng/trang. Tìm mã/tên, lọc trạng
          thái, sort toàn tập trước phân trang, URL/Back/Forward, Xem đầy đủ,
          Thêm/Sửa và cảnh báo nội dung chưa lưu. Mọi dữ liệu chỉ tồn tại trong
          lượt xem.
        </p>
        <h3>Quy ước kỹ thuật DEMO</h3>
        <p>
          STT là vị trí sau lọc và sắp xếp. Tìm mã/tên có trim từ khóa, không
          phân biệt hoa/thường và giữ dấu; không tìm theo mô tả. Sort tiếng Việt
          có xét số, giữ dấu. Đây không phải hợp đồng API đã được BA duyệt.
        </p>
        <p>
          Mã/Tên có giá trị; giới hạn 80/200/2.000 ký tự theo form khảo sát.
          Kiểm tra trùng mã trong tập DEMO không phân biệt hoa/thường và khoảng
          trắng hai đầu; không tự đổi dữ liệu sang chữ hoa hoặc đặt regex mã.
        </p>
        <h3>Giới hạn Thêm/Sửa</h3>
        <p>
          Bản mới mặc định Đang sử dụng chỉ để mô phỏng form đã khảo sát, không
          có nghĩa được duyệt hoặc dùng ngay trong bảo hành. Khi sửa bản ghi có
          sẵn, đổi Mã/Trạng thái chỉ xem trước và chặn toàn bộ lượt lưu; không
          lưu một phần âm thầm.
        </p>
        <DefectImpact />
        <p>
          Giữ nguyên hậu tố lịch sử trong tên. Tên màn “Danh mục Bệnh / lỗi”
          theo yêu cầu của bạn, chưa thay thế glossary nghiệp vụ toàn hệ thống.
        </p>
        <p>
          Không có Xóa, Import/Export, gộp mã, nhật ký chỉnh sửa hay số hồ sơ
          giả. Quyền chỉ xem và kết quả lưu/lỗi/xung đột là tình huống mô phỏng,
          không xác minh backend hoặc phân quyền thật.
        </p>
      </div>
      <footer>
        <Button onClick={onClose}>Đã hiểu phạm vi</Button>
      </footer>
    </>
  );
}
export function DefectForm({
  record,
  records,
  onDirty,
  onBusy,
  onSave,
  onClose,
}: {
  record?: Defect;
  records: Defect[];
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
  onSave: (draft: Defect) => void;
  onClose: () => void;
}) {
  const [initial] = useState(() => (record ? { ...record } : emptyDefect()));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const [outcome, setOutcome] = useState('success');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const saving = useRef(false),
    form = useRef<HTMLFormElement>(null);
  const pending = defectPendingChanges(initial, draft);
  function change(patch: Partial<Defect>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setPreview(false);
    setMessage('');
    onDirty(JSON.stringify(next) !== JSON.stringify(initial));
    setErrors((old) =>
      Object.fromEntries(
        Object.entries(old).filter(([key]) => !(key in patch)),
      ),
    );
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || conflict) return;
    const issues = validateDefect(draft, records);
    setErrors(issues);
    setMessage('');
    if (Object.keys(issues).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>(`#defect-form-${Object.keys(issues)[0]}`)
          ?.focus(),
      );
      return;
    }
    const payload = prepareDefectSave(initial, draft);
    if (!payload) {
      setPreview(true);
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('#defect-impact-review')
          ?.focus(),
      );
      return;
    }
    saving.current = true;
    setBusy(true);
    onBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    saving.current = false;
    setBusy(false);
    onBusy(false);
    if (outcome === 'error') {
      setMessage(
        'Không lưu được DEMO. Nội dung đang nhập được giữ nguyên; bạn có thể thử lại.',
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
        <p className="hn-def-help">
          Chỉ lưu trong bộ nhớ DEMO. Tải lại trang sẽ khôi phục dữ liệu mẫu.
        </p>
        <fieldset disabled={busy}>
          <legend>Thông tin bệnh / lỗi</legend>
          <div className="hn-agy-grid">
            {(['code', 'name'] as const).map((key) => (
              <div key={key}>
                <label htmlFor={`defect-form-${key}`}>
                  {key === 'code' ? 'Mã bệnh / lỗi' : 'Tên bệnh / lỗi'}{' '}
                  <span aria-hidden="true">*</span>
                </label>
                <Input
                  id={`defect-form-${key}`}
                  name={key}
                  value={draft[key]}
                  required
                  maxLength={key === 'code' ? 80 : 200}
                  aria-invalid={!!errors[key]}
                  aria-describedby={`defect-help-${key}`}
                  onChange={(e) => change({ [key]: e.target.value })}
                />
                <div id={`defect-help-${key}`}>
                  <p className="hn-def-help">
                    {key === 'code'
                      ? 'Tối đa 80 ký tự. Quy tắc mã chính thức chờ BA xác nhận.'
                      : 'Tối đa 200 ký tự; giữ nguyên hậu tố lịch sử.'}
                  </p>
                  {errors[key] && (
                    <p role="alert" className="hn-def-error">
                      {errors[key]}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div className="wide">
              <label htmlFor="defect-form-description">Mô tả</label>
              <Textarea
                id="defect-form-description"
                name="description"
                value={draft.description}
                maxLength={2000}
                rows={4}
                aria-invalid={!!errors.description}
                aria-describedby="defect-help-description"
                onChange={(e) => change({ description: e.target.value })}
              />
              <div
                id="defect-help-description"
                className="hn-def-description-help"
              >
                <span>Không bắt buộc theo form khảo sát.</span>
                <span>
                  {draft.description.length.toLocaleString('vi')} / 2.000 ký tự
                </span>
              </div>
              {errors.description && (
                <p role="alert" className="hn-def-error">
                  {errors.description}
                </p>
              )}
            </div>
            <SkuSelect
              id="defect-form-status"
              label="Trạng thái"
              value={draft.active ? 'active' : 'inactive'}
              options={DEFECT_STATUSES.slice(1)}
              onChange={(value) => change({ active: value === 'active' })}
            />
            <p className="hn-def-help">
              {record
                ? 'Đổi Mã hoặc Trạng thái chỉ xem trước, không áp dụng khi lưu. Nội dung khác được giữ trong form để bạn tiếp tục chỉnh sửa.'
                : 'Mặc định Đang sử dụng chỉ phục vụ DEMO; quy tắc duyệt và áp dụng cho hồ sơ mới chưa chốt.'}
            </p>
          </div>
        </fieldset>
        {preview && (
          <div id="defect-impact-review" tabIndex={-1}>
            <SkuNotice tone="warning">
              <strong>Chỉ xem trước — chưa lưu bất kỳ thay đổi nào</strong>
              <p>
                Cần BA/BE xác nhận trước khi áp dụng thay đổi Mã/Trạng thái.
              </p>
            </SkuNotice>
            <div className="hn-agy-grid hn-def-diff">
              {pending.map((key) => (
                <dl key={key}>
                  <dt>{key === 'code' ? 'Mã bệnh / lỗi' : 'Trạng thái'}</dt>
                  <dd>
                    {key === 'code'
                      ? initial.code
                      : defectStatus(initial.active)}{' '}
                    → {key === 'code' ? draft.code : defectStatus(draft.active)}
                  </dd>
                </dl>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                change({ code: initial.code, active: initial.active })
              }
            >
              Khôi phục mã và trạng thái ban đầu
            </Button>
          </div>
        )}
        {record && <DefectImpact />}
        {message && <SkuNotice tone="error">{message}</SkuNotice>}
        {conflict && (
          <SkuNotice tone="warning">
            <strong>Xung đột phiên · Mô phỏng</strong>
            <p>
              Chưa ghi đè dữ liệu. Bản DEMO hiện tại không đổi; nội dung đang
              nhập được giữ nguyên.
            </p>
            <div className="hn-agy-grid hn-def-diff">
              <dl>
                <dt>Bản hiện tại</dt>
                <dd>{record?.name || 'Chưa tạo'}</dd>
              </dl>
              <dl>
                <dt>Đang nhập</dt>
                <dd>{draft.name}</dd>
              </dl>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConflict(false);
                setOutcome('success');
              }}
            >
              Kết thúc mô phỏng xung đột để thử lại
            </Button>
          </SkuNotice>
        )}
        <SkuSelect
          id="defect-save-scenario"
          label="Kiểm thử kết quả lưu DEMO"
          value={outcome}
          options={[
            { value: 'success', label: 'Thành công' },
            { value: 'error', label: 'Lỗi lưu — giữ dữ liệu' },
            { value: 'conflict', label: 'Xung đột — không ghi đè' },
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
              <LoaderCircle className="animate-spin" /> Đang lưu…
            </>
          ) : pending.length ? (
            'Xem trước thay đổi'
          ) : (
            'Lưu bệnh / lỗi · DEMO'
          )}
        </Button>
      </footer>
    </form>
  );
}
