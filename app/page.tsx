'use client';

import { useState } from 'react';
import DashboardPrototype from '@/components/dashboard-prototype';
import SkuPrototype from '@/components/sku-prototype';
import CatalogPrototype from '@/components/catalog-prototype';
import AgencyPrototype from '@/components/agency-prototype';
import DefectPrototype from '@/components/defect-prototype';
import { MasterDataDemoProvider } from '@/components/master-data-demo';
import PrototypeHistory from '@/components/prototype-history';
import {
  AlertCircle, ArrowLeft, ArrowRight, Boxes, Check, CheckCircle2,
  ClipboardCheck, Eye, EyeOff, LayoutDashboard, LoaderCircle,
  ExternalLink, LockKeyhole, Mail, Menu, MonitorCog, PackageCheck,
  Palette, PanelLeftClose, ScanLine, ShieldCheck, Sparkles, Warehouse, X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const issues = [
  { priority: 'P0', screen: 'Quên mật khẩu', finding: 'Trang cao 840px tại viewport 1024×768 và 1280×720.', action: 'Khóa chiều cao AuthLayout theo 100dvh; ảnh dùng object-fit: contain.' },
  { priority: 'P0', screen: 'Dùng chung', finding: 'Input 36px, CTA 38px, icon 34px — nhỏ cho tablet cảm ứng.', action: 'Control và hit-area tối thiểu 44px; khuyến nghị 48px.' },
  { priority: 'P1', screen: 'Đăng nhập', finding: 'Form từ 400px giảm còn 352px khi chuyển sang 1024px.', action: 'Giữ auth content 400–440px; cân lại cột hoặc nâng breakpoint.' },
  { priority: 'P1', screen: 'Dùng chung', finding: 'Accent cần thống nhất với bộ Hoa Nam Design v2.', action: 'Dùng #0C6286 cho accent và #0C5D7D cho CTA chữ trắng để đạt AA.' },
  { priority: 'P1', screen: 'Đăng nhập', finding: 'Label “Email” nhưng validation cho phép email hoặc tên đăng nhập.', action: 'Đồng bộ label, placeholder và validation copy.' },
  { priority: 'P1', screen: 'Quên mật khẩu', finding: 'Email đang dùng type=text, không inputmode, autocomplete=off.', action: 'Dùng type=email, inputMode=email, autocomplete=email.' },
];

const acceptance = [
  'Dùng Public Sans, hệ token Hoa Nam Design v2 và không có scrollbar ngang.',
  'Form không hẹp dưới 400px với mọi viewport từ 768px trở lên.',
  'Input, CTA, icon và link có vùng tương tác tối thiểu 44×44px.',
  'Toàn bộ text hiển thị bằng tiếng Việt, không còn “your@gmail.com”.',
  'Tab order đúng; focus visible; Enter submit; lỗi đầu tiên được focus.',
  'CTA có loading, chống double-submit và thông báo lỗi thân thiện.',
  'Login dùng autocomplete=username/current-password.',
  'Reset password không tiết lộ email có tồn tại trong hệ thống.',
];

type LoginState = 'default' | 'validation' | 'loading' | 'error';
type ForgotState = 'default' | 'validation' | 'loading' | 'sent';

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark">
      <span className={compact ? 'brand-icon compact' : 'brand-icon'}><Warehouse aria-hidden="true" /></span>
      <span><strong>Hoa Nam</strong><em>WMS</em></span>
    </div>
  );
}

function AuthContext({ kind }: { kind: 'login' | 'forgot' }) {
  return (
    <div className="auth-context" aria-hidden="true">
      <BrandMark />
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />
      <div className="warehouse-scene">
        <div className="rack"><span /><span /><span /></div>
        <div className="scene-core"><Warehouse /><strong>{kind === 'login' ? 'Bắt đầu ca làm việc' : 'Khôi phục truy cập'}</strong><span>Hoa Nam Warehouse</span></div>
        <div className="rack"><span /><span /><span /></div>
      </div>
      <div className="floating-metric metric-a"><span><MonitorCog /></span><div><small>Đơn hàng hôm nay</small><strong>624</strong><em>+8,24%</em></div></div>
      <div className="floating-metric metric-b"><span><PackageCheck /></span><div><small>Tồn kho khả dụng</small><strong>12,4k</strong><em>+12,6%</em></div></div>
      <div className="visual-footer-mask" />
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="field-error" role="alert"><AlertCircle aria-hidden="true" /> {children}</p>;
}

function LoginMock({ state }: { state: LoginState }) {
  const [showPassword, setShowPassword] = useState(false);
  const isLoading = state === 'loading';
  const hasValidation = state === 'validation';

  return (
    <div className="auth-canvas">
      <AuthContext kind="login" />
      <div className="auth-form-pane">
        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <BrandMark compact />
          <div className="form-heading"><h3>Chào mừng bạn đến Hoa Nam WMS! <span>👋🏻</span></h3><p>Đăng nhập bằng tài khoản được cấp để bắt đầu ca làm việc.</p></div>
          {state === 'error' && <div className="inline-alert danger"><AlertCircle aria-hidden="true" /><div><strong>Không thể đăng nhập</strong><span>Thông tin đăng nhập không chính xác. Vui lòng kiểm tra và thử lại.</span></div></div>}
          <div className="field-group">
            <label htmlFor={`login-identifier-${state}`}>Email hoặc tên đăng nhập</label>
            <div className="input-shell"><Mail aria-hidden="true" /><Input id={`login-identifier-${state}`} autoComplete="username" placeholder="Nhập email hoặc tên đăng nhập" aria-invalid={hasValidation} disabled={isLoading} /></div>
            {hasValidation ? <FieldError>Vui lòng nhập email hoặc tên đăng nhập</FieldError> : <span className="field-space" />}
          </div>
          <div className="field-group">
            <label htmlFor={`login-password-${state}`}>Mật khẩu</label>
            <div className="input-shell password-shell">
              <LockKeyhole aria-hidden="true" />
              <Input id={`login-password-${state}`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" aria-invalid={hasValidation} disabled={isLoading} />
              <Button type="button" variant="ghost" size="icon" className="password-toggle" disabled={isLoading} onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff /> : <Eye />}</Button>
            </div>
            {hasValidation ? <FieldError>Vui lòng nhập mật khẩu</FieldError> : <span className="field-space" />}
          </div>
          <div className="form-options">
            <label className="remember-option"><Checkbox disabled={isLoading} /><span>Duy trì đăng nhập trên thiết bị này</span></label>
            <a href="#forgot-prototype" aria-disabled={isLoading} tabIndex={isLoading ? -1 : undefined} onClick={(event) => { if (isLoading) event.preventDefault(); }}>Quên mật khẩu?</a>
          </div>
          <Button type="submit" className="primary-action" disabled={isLoading}>{isLoading ? <><LoaderCircle className="animate-spin" /> Đang xác thực…</> : <>Đăng nhập <ArrowRight /></>}</Button>
          <p className="security-note"><ShieldCheck /> Phiên đăng nhập được bảo vệ theo vai trò và phạm vi kho.</p>
        </form>
      </div>
    </div>
  );
}

function ForgotMock({ state }: { state: ForgotState }) {
  const isLoading = state === 'loading';
  const hasValidation = state === 'validation';

  return (
    <div className="auth-canvas">
      <AuthContext kind="forgot" />
      <div className="auth-form-pane">
        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <BrandMark compact />
          <div className="form-heading"><h3>Quên mật khẩu? <span>🔒</span></h3><p>Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP gồm 6 chữ số.</p></div>
          {state === 'sent' && <div className="inline-alert success"><CheckCircle2 aria-hidden="true" /><div><strong>Kiểm tra email của bạn</strong><span>Nếu email đã được đăng ký, mã OTP sẽ được gửi trong ít phút.</span></div></div>}
          <div className="field-group">
            <label htmlFor={`forgot-email-${state}`}>Email đã đăng ký</label>
            <div className="input-shell"><Mail aria-hidden="true" /><Input id={`forgot-email-${state}`} type="email" inputMode="email" autoComplete="email" placeholder="Nhập email đã đăng ký" aria-invalid={hasValidation} disabled={isLoading || state === 'sent'} defaultValue={state === 'sent' ? 'l***@hoanam.vn' : ''} /></div>
            {hasValidation ? <FieldError>Email không đúng định dạng</FieldError> : <span className="field-space" />}
          </div>
          {state === 'sent' ? <div className="resend-row"><span>Chưa nhận được mã?</span><Button type="button" variant="ghost" disabled className="resend-button">Gửi lại sau 00:52</Button></div> : <Button type="submit" className="primary-action" disabled={isLoading}>{isLoading ? <><LoaderCircle className="animate-spin" /> Đang gửi mã…</> : <>Gửi mã OTP <ArrowRight /></>}</Button>}
          <a className="back-link" href="#login-prototype"><ArrowLeft /> Quay lại đăng nhập</a>
        </form>
      </div>
    </div>
  );
}

function SectionHeading({ number, eyebrow, title, note }: { number: string; eyebrow: string; title: string; note?: string }) {
  return <div className="section-heading"><span className="section-number">{number}</span><div><span className="section-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{note && <Badge variant="outline" className="section-note">{note}</Badge>}</div>;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <main className="review-shell">
      <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Mở điều hướng"><Menu /></button>
      <aside className={sidebarOpen ? 'review-sidebar open' : 'review-sidebar'} aria-label="Điều hướng review board">
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Đóng điều hướng"><X /></button>
        <div className="sidebar-brand"><span className="sidebar-logo">HN</span><div><strong>WMS Hoa Nam</strong><span>Authentication UI/UX Review</span></div></div>
        <div className="sidebar-meta"><span>Tablet+</span><span>Target 92/100</span></div>
        <nav onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setSidebarOpen(false); }}>
          <span className="nav-label">OVERVIEW</span>
          <a href="#overview"><LayoutDashboard /> Tổng quan</a><a href="#evidence"><ClipboardCheck /> Bằng chứng đánh giá</a>
          <span className="nav-label">PROTOTYPE</span>
          <a href="#login-prototype"><LockKeyhole /> Đăng nhập</a><a href="#forgot-prototype"><Mail /> Quên mật khẩu</a>
          <a href="#dashboard-prototype"><LayoutDashboard /> Tổng quan vận hành</a>
            <details className="hn-sku-nav" open><summary><Boxes /> Danh mục</summary><a href="#sku-prototype"><span aria-hidden="true">•</span> Danh sách SKU</a><a href="#catalog-prototype"><span aria-hidden="true">•</span> Danh mục sản phẩm</a><a href="#agency-prototype"><span aria-hidden="true">•</span> Đại lý / nơi nhận</a><a href="#defect-prototype"><span aria-hidden="true">•</span> Bệnh / lỗi</a></details>
          <span className="nav-label">HANDOFF</span>
          <a href="#dev-spec"><Boxes /> DEV Specification</a><a href="#acceptance"><CheckCircle2 /> Acceptance Criteria</a>
        </nav>
        <div className="sidebar-footer"><Palette /><span><strong>Hoa Nam Design v2</strong>Web management · Implementation-ready</span></div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Đóng điều hướng" onClick={() => setSidebarOpen(false)} />}

      <div className="review-content">
        <section id="overview" className="hero-section">
          <div className="hero-copy">
            <span className="hero-kicker">HOA NAM DESIGN V2 · WAREHOUSE ENTERPRISE · TABLET+</span>
            <h1>Hoa Nam WMS<br /><span>Web management upgrade</span></h1>
            <p>Review board và prototype dùng Design v2 làm ngôn ngữ thống nhất cho màu sắc, bố cục, typography, card, khoảng cách và trạng thái vận hành.</p>
            <div className="hero-actions"><a className="hero-primary" href="#login-prototype">Xem prototype <ArrowRight /></a><a className="hero-secondary" href="https://duc-nguyen98.github.io/ScannerHNApp/" target="_blank" rel="noreferrer">Scanner Design v2 <ExternalLink /></a></div>
            <div className="hero-callout"><Sparkles /><span><strong>Design language đã khóa:</strong> palette Hoa Nam, Public Sans, surface sáng, trạng thái rõ ràng và control 44–48px cho tablet.</span></div>
          </div>
          <div className="score-comparison" aria-label="So sánh điểm hiện tại và đề xuất">
            <Card className="score-card current-card"><CardContent><span>CURRENT</span><strong>69<small>/100</small></strong><div className="score-track"><i style={{ width: '69%' }} /></div><p>Sạch và dùng được, nhưng còn lỗi responsive và dấu vết template.</p></CardContent></Card>
            <div className="score-arrow"><ArrowRight /></div>
            <Card className="score-card target-card"><CardContent><span>DESIGN V2 ALIGNED</span><strong>92<small>/100</small></strong><div className="score-track"><i style={{ width: '92%' }} /></div><p>Nhất quán với Hoa Nam Design v2, tablet-ready và có state contract rõ cho DEV/QA.</p></CardContent></Card>
          </div>
        </section>

        <section id="evidence" className="content-section">
          <SectionHeading number="01" eyebrow="EVIDENCE" title="Bằng chứng đánh giá trực tiếp" note="07 viewport checks" />
          <div className="metrics-grid">
            <article><span className="metric-icon purple"><Palette /></span><strong>Design v2</strong><p>Baseline giao diện đã chốt</p></article>
            <article><span className="metric-icon amber"><PanelLeftClose /></span><strong>400–440px</strong><p>Chiều rộng form mục tiêu</p></article>
            <article><span className="metric-icon cyan"><ScanLine /></span><strong>44–48px</strong><p>Control tối ưu cho tablet</p></article>
            <article><span className="metric-icon green"><ShieldCheck /></span><strong>AA</strong><p>CTA và focus đạt tương phản</p></article>
          </div>
          <div className="evidence-table-wrap"><table className="evidence-table"><thead><tr><th>Ưu tiên</th><th>Màn hình</th><th>Điểm cần cải thiện</th><th>Yêu cầu sửa</th></tr></thead><tbody>{issues.map((issue) => <tr key={`${issue.priority}-${issue.finding}`}><td><span className={`priority ${issue.priority.toLowerCase()}`}>{issue.priority}</span></td><td>{issue.screen}</td><td>{issue.finding}</td><td>{issue.action}</td></tr>)}</tbody></table></div>
          <div className="viewport-strip"><strong>Test matrix</strong>{['768×1024', '900×768', '960×768', '1024×768', '1280×720', '1440×900', '1920×1080'].map((size) => <span key={size}>{size}</span>)}</div>
        </section>

        <section id="login-prototype" className="content-section">
          <SectionHeading number="02" eyebrow="AUTH-01" title="Prototype — Đăng nhập" note="Current 7.2 → Target 9.1" />
          <Tabs defaultValue="default" className="prototype-tabs"><TabsList className="state-tabs" aria-label="Trạng thái đăng nhập"><TabsTrigger value="default">Mặc định</TabsTrigger><TabsTrigger value="validation">Validation</TabsTrigger><TabsTrigger value="loading">Loading</TabsTrigger><TabsTrigger value="error">Auth failed</TabsTrigger></TabsList><TabsContent value="default"><LoginMock state="default" /></TabsContent><TabsContent value="validation"><LoginMock state="validation" /></TabsContent><TabsContent value="loading"><LoginMock state="loading" /></TabsContent><TabsContent value="error"><LoginMock state="error" /></TabsContent></Tabs>
          <div className="change-grid"><article><span>01</span><h3>Form không co hẹp</h3><p>Giữ content width 400–440px, kể cả khi layout chuyển sang hai cột.</p></article><article><span>02</span><h3>Touch-first cho tablet</h3><p>Input và CTA 48px; icon/link có hit-area tối thiểu 44px.</p></article><article><span>03</span><h3>State rõ ràng</h3><p>Validation, loading và lỗi xác thực có visual contract riêng.</p></article></div>
        </section>

        <section id="forgot-prototype" className="content-section">
          <SectionHeading number="03" eyebrow="AUTH-02" title="Prototype — Quên mật khẩu" note="Current 6.5 → Target 9.0" />
          <Tabs defaultValue="default" className="prototype-tabs"><TabsList className="state-tabs" aria-label="Trạng thái quên mật khẩu"><TabsTrigger value="default">Mặc định</TabsTrigger><TabsTrigger value="validation">Validation</TabsTrigger><TabsTrigger value="loading">Đang gửi</TabsTrigger><TabsTrigger value="sent">Đã gửi OTP</TabsTrigger></TabsList><TabsContent value="default"><ForgotMock state="default" /></TabsContent><TabsContent value="validation"><ForgotMock state="validation" /></TabsContent><TabsContent value="loading"><ForgotMock state="loading" /></TabsContent><TabsContent value="sent"><ForgotMock state="sent" /></TabsContent></Tabs>
          <div className="security-contract"><ShieldCheck /><div><strong>Security copy contract</strong><p>Sau khi gửi, luôn dùng thông báo trung tính “Nếu email đã được đăng ký…” để tránh tiết lộ tài khoản có tồn tại.</p></div></div>
        </section>

        <DashboardPrototype />
        <PrototypeHistory />
        <MasterDataDemoProvider>
          <SkuPrototype />
          <CatalogPrototype />
          <AgencyPrototype />
          <DefectPrototype />
        </MasterDataDemoProvider>

        <section id="dev-spec" className="content-section">
          <SectionHeading number="04" eyebrow="HANDOFF" title="DEV Specification" note="P0 → P1 → P2" />
          <div className="spec-grid">
            <article className="spec-card"><span className="spec-index">A</span><h3>Shared AuthLayout</h3><ul><li><code>min-height: 100dvh</code></li><li>Desktop: visual 64% / form 36%</li><li>Tablet: ẩn visual, form căn giữa</li><li>Không để minh họa quyết định chiều cao</li></ul></article>
            <article className="spec-card"><span className="spec-index">B</span><h3>Hoa Nam composition</h3><ul><li>Public Sans cho toàn hệ thống</li><li>Card sáng, radius mềm, shadow nhẹ</li><li>Palette <code>#0C6286</code> / <code>#0C5D7D</code></li><li>Spacing 4 / 8 / 12 / 16 / 24</li></ul></article>
            <article className="spec-card"><span className="spec-index">C</span><h3>Form primitives</h3><ul><li>Control height 48px</li><li>Label ≥14px; body ≥16px</li><li>Focus ring rõ bằng bàn phím</li><li>Error space được giữ ổn định</li></ul></article>
            <article className="spec-card"><span className="spec-index">D</span><h3>Request state</h3><ul><li>Disable toàn bộ form khi pending</li><li>Không double-submit</li><li>Không hiển thị raw API/CORS</li><li>Retry có kiểm soát</li></ul></article>
          </div>
          <div className="token-board"><div><span>Hoa Nam primary</span><i className="token-color primary-token" /><code>#0C6286</code></div><div><span>CTA accessible</span><i className="token-color cta-token" /><code>#0C5D7D</code></div><div><span>Ink</span><i className="token-color ink-token" /><code>#16313B</code></div><div><span>Surface</span><i className="token-color surface-token" /><code>#FAFCFC</code></div><div><span>Success</span><i className="token-color success-token" /><code>#28C76F</code></div><div><span>Danger</span><i className="token-color danger-token" /><code>#EA5455</code></div></div>
        </section>

        <section id="acceptance" className="content-section acceptance-section">
          <SectionHeading number="05" eyebrow="QA READY" title="Acceptance Criteria" note="8 checks" />
          <div className="acceptance-grid">{acceptance.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, '0')}</span><Check aria-hidden="true" /><p>{item}</p></article>)}</div>
          <div className="final-gate"><div><span>Definition of done</span><h3>0 lỗi P0 · 0 lỗi P1 xác nhận · Pass toàn bộ viewport tablet+</h3></div><Badge className="ready-badge"><CheckCircle2 /> READY FOR DEV REVIEW</Badge></div>
        </section>

        <footer><BrandMark compact /><span>Hoa Nam WMS · Authentication UI/UX Upgrade Review</span><a href="#overview">Về đầu trang ↑</a></footer>
      </div>
    </main>
  );
}
