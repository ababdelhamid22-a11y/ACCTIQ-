import React, {useState} from "react";
import {API, call} from "./api.js";

const STATUS_AR = {PROVISIONAL_RECOMMENDATION: "توصية مبدئية", NEEDS_FACTS: "وقائع ناقصة", BLOCKED: "محجوب", SCOPE_REVIEW: "مراجعة نطاق"};
const APPR_AR = {approved: "معتمد", rejected: "مرفوض"};

export function Decisions({history, clear}) {
  const [ver, setVer] = useState(null), [err, setErr] = useState("");
  async function verify() {
    setErr(""); setVer(null);
    try { setVer(await call("/api/v1/audit/verify")); } catch (e) { setErr(e instanceof TypeError ? "تعذّر الاتصال بالخادم" : e.message); }
  }
  return <div><div className="pageHead"><h1>سجل القرارات</h1><p>القرارات التي حلّلتها من هذا الجهاز، مع التحقق من سلامة سجل التدقيق على الخادم.</p></div>
    <section className="card"><div className="resultHead"><h2>القرارات ({history.length})</h2>
      {history.length > 0 && <button className="mini ghost" onClick={clear}>مسح السجل المحلي</button>}</div>
      {!history.length && <div className="empty small">لا توجد قرارات بعد. ابدأ بتحليل معاملة من «محرك اتخاذ القرار».</div>}
      {history.map(h => <div className="hrow" key={h.id}>
        <div><b>{h.text || "معاملة بدون وصف"}</b><p className="note">{new Date(h.ts).toLocaleString("ar-EG")} • المبلغ {Number(h.amount).toLocaleString("en-US")} • {STATUS_AR[h.status] || h.status}{h.selected ? ` • ${h.selected}` : ""}</p></div>
        <span className={"pill " + (h.approval || "")}>{h.approval ? APPR_AR[h.approval] : "بانتظار الاعتماد"}</span></div>)}</section>
    <section className="card" style={{marginTop: 16}}><h2>التدقيق</h2>
      <p className="note">سجل التدقيق مترابط بالتجزئة (hash chain) على الخادم، وأي تلاعب يظهر عند التحقق.</p>
      <button className="mini" onClick={verify}>التحقق من سلامة سجل التدقيق</button>
      {err && <p className="note" style={{color: "#f0a0a0"}}>{err}</p>}
      {ver && <p className="note">{ver.valid ? `✔ السجل سليم (${ver.entries} قيد)` : `✖ تم اكتشاف تلاعب عند القيد ${ver.broken_at}`}</p>}</section></div>;
}

export function Settings() {
  const [h, setH] = useState("");
  async function check() {
    setH("جاري الفحص...");
    try { const r = await call("/api/v1/health"); setH(`✔ الخادم يعمل — الإصدار ${r.version}`); }
    catch (e) { setH(`✖ تعذّر الاتصال بالخادم. تأكد من الرابط وإعدادات CORS.`); }
  }
  return <div><div className="pageHead"><h1>الإعدادات</h1></div>
    <section className="card"><h2>الاتصال بالخادم</h2>
      <p className="note">عنوان الـ API الحالي:</p><code className="code">{API}</code>
      <p className="note">يُضبط وقت البناء عبر المتغير VITE_API_URL. في تطبيق الأندرويد أضِفه في GitHub ← Settings ← Variables ثم أعد تشغيل بناء الـ APK.</p>
      <button className="mini" onClick={check}>فحص الاتصال</button>{h && <p className="note">{h}</p>}</section></div>;
}
