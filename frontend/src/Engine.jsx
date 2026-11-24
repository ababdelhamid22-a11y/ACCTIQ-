import React, {useState, useEffect, useRef} from "react";
import {API, call, fmt} from "./api.js";

const demo = {framework: "IFRS", transaction_kind: "acquisition", asset_type: "equipment",
  transaction: "شراء آلة إنتاج بقيمة 1,500,000 جنيه، عمرها الإنتاجي 10 سنوات، وستكون متاحة للاستخدام في الشهر القادم.",
  amount: 1500000, useful_life_years: 10, available_for_use: "2026-12-01", residual_value: 0, materiality_threshold: 50000,
  vat_recoverable: 0, settlement: "payable", fiscal_year_end_month: 12, probable_benefits: null, cost_measurable: null,
  improves_or_replaces_part: null, fair_value_reliable: null, scope_confirmed: false, componentized: false, components: []};
const STATUS_AR = {PREFERRED: "مفضّل", CONDITIONAL: "مشروط", REJECTED: "مرفوض"};
const toTri = v => v === "" ? null : v === "true";
const fromTri = v => v === null ? "" : String(v);

function Tri({label, value, onChange}) {
  return <label>{label}<select value={fromTri(value)} onChange={e => onChange(toTri(e.target.value))}>
    <option value="">غير معروف</option><option value="true">نعم</option><option value="false">لا</option></select></label>;
}
function Journal({lines}) {
  if (!lines?.length) return null;
  return <div className="tw"><table className="j"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr></thead>
    <tbody>{lines.map((l, i) => <tr key={i}><td>{l.account}</td><td>{l.debit ? fmt(l.debit) : ""}</td><td>{l.credit ? fmt(l.credit) : ""}</td></tr>)}</tbody></table></div>;
}

export default function Engine({prefill, onAnalyzed, onApproved}) {
  const [form, setForm] = useState(demo), [data, setData] = useState(null), [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""), [ap, setAp] = useState({approver: "", note: ""}), [apRes, setApRes] = useState(null);
  const txRef = useRef(null);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const num = k => e => set(k, e.target.value === "" ? null : Number(e.target.value));
  const setComp = (i, k, v) => set("components", form.components.map((c, j) => j === i ? {...c, [k]: v} : c));

  useEffect(() => {
    if (prefill) { set("transaction", prefill); setTimeout(() => txRef.current?.focus(), 50); }
  }, [prefill]);

  async function analyze() {
    setBusy(true); setErr(""); setApRes(null);
    try {
      const d = await call("/api/v1/scenarios/analyze", form);
      setData(d); onAnalyzed?.(form, d);
    } catch (e) {
      setData(null);
      setErr(e instanceof TypeError ? `تعذّر الاتصال بالخادم (${API}). شغّل الـ backend وتأكد من إعدادات CORS.` : e.message);
    }
    setBusy(false);
  }
  async function approve(decision) {
    setErr("");
    try {
      const r = await call("/api/v1/scenarios/approve", {decision_id: data.decision_id, approver: ap.approver, decision, note: ap.note});
      setApRes(r); onApproved?.(data.decision_id, decision, ap.approver);
    } catch (e) { setErr(e.message); }
  }

  const ok = data?.status === "PROVISIONAL_RECOMMENDATION";
  const sel = ok && data.alternatives.find(x => x.id === data.selected);
  return <div className="engine">
    <div className="pageHead"><h1>محرك اتخاذ القرار</h1>
      <p>ما البدائل؟ ولماذا اخترنا هذه المعالجة؟ وما أثر كل بديل؟ (نطاق النموذج حاليًا: IAS 16)</p></div>
    <section className="grid">
      <div className="card form"><h2>الوقائع</h2>
        <div className="two"><label>المرجعية<select value={form.framework} onChange={e => set("framework", e.target.value)}><option>IFRS</option><option>EAS</option></select></label>
          <label>نوع المعاملة<select value={form.transaction_kind} onChange={e => set("transaction_kind", e.target.value)}>
            <option value="acquisition">اقتناء أصل</option><option value="subsequent_expenditure">مصروف لاحق على أصل</option></select></label></div>
        <label>نوع الأصل<select value={form.asset_type} onChange={e => set("asset_type", e.target.value)}>
          <option value="equipment">معدات</option><option value="building">مباني</option><option value="vehicle">وسائل نقل</option><option value="land">أراضي</option><option value="other">أخرى</option></select></label>
        <label>وصف المعاملة<textarea ref={txRef} value={form.transaction} onChange={e => set("transaction", e.target.value)}/></label>
        <div className="two"><label>المبلغ (بدون ضريبة قابلة للخصم)<input type="number" value={form.amount ?? ""} onChange={num("amount")}/></label>
          <label>العمر الإنتاجي (سنة)<input type="number" disabled={form.asset_type === "land"} value={form.useful_life_years ?? ""} onChange={num("useful_life_years")}/></label></div>
        <div className="two"><label>متاح للاستخدام<input type="date" value={form.available_for_use || ""} onChange={e => set("available_for_use", e.target.value || null)}/></label>
          <label>القيمة المتبقية<input type="number" value={form.residual_value ?? ""} onChange={num("residual_value")}/></label></div>
        <div className="two"><label>حد الرسملة (سياسة)<input type="number" value={form.materiality_threshold ?? ""} onChange={num("materiality_threshold")}/></label>
          <label>ضريبة قيمة مضافة قابلة للخصم<input type="number" value={form.vat_recoverable ?? ""} onChange={num("vat_recoverable")}/></label></div>
        <div className="two"><label>طريقة السداد<select value={form.settlement} onChange={e => set("settlement", e.target.value)}>
          <option value="payable">دائنون</option><option value="bank">بنك</option><option value="cash">نقدية</option></select></label>
          <label>شهر نهاية السنة المالية<select value={form.fiscal_year_end_month} onChange={e => set("fiscal_year_end_month", Number(e.target.value))}>
            {Array.from({length: 12}, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label></div>
        {form.transaction_kind === "acquisition"
          ? <Tri label="احتمال تدفق منافع اقتصادية مستقبلية؟" value={form.probable_benefits} onChange={v => set("probable_benefits", v)}/>
          : <Tri label="هل يستبدل جزءًا جوهريًا أو يحسّن الأصل؟" value={form.improves_or_replaces_part} onChange={v => set("improves_or_replaces_part", v)}/>}
        <Tri label="التكلفة قابلة للقياس بموثوقية؟" value={form.cost_measurable} onChange={v => set("cost_measurable", v)}/>
        <Tri label="القيمة العادلة قابلة للقياس بموثوقية؟" value={form.fair_value_reliable} onChange={v => set("fair_value_reliable", v)}/>
        <label className="check"><input type="checkbox" checked={form.componentized} onChange={e => set("componentized", e.target.checked)}/> توجد مكونات جوهرية بأعمار مختلفة</label>
        {form.componentized && <div className="comps">{form.components.map((c, i) => <div className="comp" key={i}>
          <input placeholder="المكون" value={c.name} onChange={e => setComp(i, "name", e.target.value)}/>
          <input type="number" placeholder="التكلفة" value={c.cost ?? ""} onChange={e => setComp(i, "cost", Number(e.target.value))}/>
          <input type="number" placeholder="العمر" value={c.life ?? ""} onChange={e => setComp(i, "life", Number(e.target.value))}/>
          <button className="mini" onClick={() => set("components", form.components.filter((_, j) => j !== i))}>حذف</button></div>)}
          <button className="mini" onClick={() => set("components", [...form.components, {name: "", cost: null, life: null, residual: 0}])}>+ إضافة مكوّن</button></div>}
        {data?.status === "SCOPE_REVIEW" && <label className="check"><input type="checkbox" checked={form.scope_confirmed} onChange={e => set("scope_confirmed", e.target.checked)}/> أؤكد أن المعاملة ضمن نطاق IAS 16</label>}
        <button className="primary" onClick={analyze} disabled={busy}>{busy ? "جاري التحليل..." : "حلّل السيناريو"}</button>
      </div>

      <div className="card result"><div className="resultHead"><h2>القرار والبدائل</h2>{data && <span className="status">{data.status}</span>}</div>
        {err && <div className="blocked"><p>{err}</p></div>}
        {!data && !err && <div className="empty">أدخل الوقائع واضغط «حلّل السيناريو».</div>}
        {data?.status === "NEEDS_FACTS" && <div className="blocked"><h3>Facts Gate</h3><p>لا يمكن اتخاذ قرار قبل استكمال/تصحيح:</p><ul>{data.missing_facts.map(x => <li key={x}>{x}</li>)}</ul></div>}
        {data?.status === "BLOCKED" && <div className="blocked"><h3>Decision Blocked</h3><p>{data.message}</p></div>}
        {data?.status === "SCOPE_REVIEW" && <div className="blocked"><h3>مراجعة النطاق</h3><p>{data.message}</p><ul>{data.flags.map(x => <li key={x.standard}>{x.standard}: {x.message}</li>)}</ul></div>}
        {ok && <>
          <div className="selected"><span>المعالجة المفضلة</span><strong>{sel.name}</strong><b>{Math.round(data.decision_confidence * 100)}%</b></div>
          <p className="note">{data.confidence_note}</p>
          {data.warnings.map(w => <div className="warnBox" key={w}>⚠ {w}</div>)}
          {data.suggestions.map(w => <div className="tip" key={w}>💡 {w}</div>)}
          {data.needs_confirmation.length > 0 && <div className="warnBox">يلزم تأكيد: {data.needs_confirmation.join(" • ")}</div>}
          <div className="impact big"><span>إهلاك السنة الأولى: {fmt(data.depreciation.first_period)}</span><span>إهلاك سنوي: {fmt(data.depreciation.annual)}</span></div>
          <div className="alts">{data.alternatives.map(a => <div className={"alt " + a.status} key={a.id}>
            <div className="altTop"><strong>{a.name}</strong><span>{STATUS_AR[a.status]} • {a.score}/100</span></div>
            {[...a.why_selected, ...a.why_rejected].map(x => <div className="reason" key={x}>{x}</div>)}
            {a.needs_confirmation.map(x => <div className="reason warn" key={x}>؟ {x}</div>)}
            <Journal lines={a.journal}/>
            {a.impact?.assets !== undefined && <div className="impact"><span>الأصول: {fmt(a.impact.assets)}</span><span>الربح الأولي: {fmt(a.impact.profit_initial)}</span></div>}
          </div>)}</div>
          <p className="note">{data.score_basis}</p>
          <div className="approval">⚠ HUMAN APPROVAL REQUIRED — توصية قابلة للمراجعة وليست اعتمادًا محاسبيًا نهائيًا.</div>
          <div className="apform"><input placeholder="اسم المعتمِد" value={ap.approver} onChange={e => setAp({...ap, approver: e.target.value})}/>
            <input placeholder="ملاحظة (اختياري)" value={ap.note} onChange={e => setAp({...ap, note: e.target.value})}/>
            <div className="two"><button className="primary" disabled={ap.approver.trim().length < 2} onClick={() => approve("approved")}>اعتماد</button>
              <button className="ghost" disabled={ap.approver.trim().length < 2} onClick={() => approve("rejected")}>رفض</button></div>
            {apRes && <p className="note">تم تسجيل القرار ({apRes.decision}) في سجل التدقيق رقم {apRes.audit_seq}.</p>}</div>
        </>}
      </div>
    </section>
    {data?.trace && <section className="card trace"><h2>مسار القرار</h2><div className="timeline">{data.trace.map((t, i) =>
      <div className="step" key={i}><div className="dot">{i + 1}</div><div><b>{t.step}</b><p>{typeof t.result === "string" ? t.result : JSON.stringify(t.result)}</p></div></div>)}</div></section>}
  </div>;
}
