import React, {useState} from "react";
import {Icon, Ring, Robot, HeroArt} from "./ui.jsx";

const MONTHS = ["يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر"];
const REV = [4.2, 4.7, 4.6, 6.1, 6.7, 7.7], EXP = [2.4, 2.6, 2.5, 3.9, 4.0, 3.9], NET = [5.4, 6.0, 5.9, 7.2, 8.0, 9.1];

function Chart() {
  const W = 600, H = 250, L = 46, B = 34, T = 14, ph = H - B - T, max = 10, bw = 20;
  const gx = i => L + 36 + i * ((W - L - 20) / 6), y = v => T + ph - (v / max) * ph;
  return <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="الأداء المالي (بيانات توضيحية)">
    {[0, 2, 4, 6, 8, 10].map(t => <g key={t}><line x1={L} x2={W - 6} y1={y(t)} y2={y(t)} stroke="rgba(120,170,230,.14)"/>
      <text x={L - 8} y={y(t) + 4} textAnchor="end" className="axis">{t === 0 ? "0" : t + ".0M"}</text></g>)}
    {MONTHS.map((m, i) => <g key={m}>
      <rect x={gx(i) - bw - 1} y={y(REV[i])} width={bw} height={y(0) - y(REV[i])} rx="3" fill="#2f9bff"/>
      <rect x={gx(i) + 1} y={y(EXP[i])} width={bw} height={y(0) - y(EXP[i])} rx="3" fill="#a66bff"/>
      <text x={gx(i)} y={H - 10} textAnchor="middle" className="axis">{m}</text></g>)}
    <polyline fill="none" stroke="#34e07a" strokeWidth="2.5" points={NET.map((v, i) => `${gx(i)},${y(v)}`).join(" ")}/>
    {NET.map((v, i) => <circle key={i} cx={gx(i)} cy={y(v)} r="4" fill="#34e07a"/>)}
  </svg>;
}

function Kpi({icon, tone, label, value, delta, demo}) {
  return <div className="card kpi"><div className={"kpiIcon " + tone}><Icon name={icon} size={26}/></div>
    <div className="kpiBody"><div className="kpiLabel">{label}{demo && <i className="demo">توضيحي</i>}</div>
      <div className="kpiValue">{value}</div>
      {delta && <div className="kpiDelta">▲ {delta}</div>}</div></div>;
}

export default function Dashboard({history, go, notify}) {
  const [q, setQ] = useState("");
  const analyzed = history.length, approved = history.filter(h => h.approval === "approved").length;
  const rate = analyzed ? Math.round((approved / analyzed) * 100) : 0;
  const last = history.find(h => h.status === "PROVISIONAL_RECOMMENDATION");
  const alerts = last?.warnings?.length ? last.warnings.slice(0, 3).map((t, i) => ({tone: i ? "info" : "warn", t}))
    : [{tone: "ok", t: "المعالجة المحاسبية متوافقة مع المعيار IFRS 16 — عقود الإيجار."},
      {tone: "warn", t: "يوجد أصل ثابت لم يتم احتساب إهلاكه منذ 3 أشهر."},
      {tone: "info", t: "مراجعة مخصص الديون المشكوك في تحصيلها وفقًا لـ IFRS 9."}];
  const ask = e => { e.preventDefault(); go("engine", q.trim()); };
  const soon = () => notify("هذه الميزة قيد التطوير وستتوفر قريبًا.");

  return <div className="dash">
    <section className="card hero"><HeroArt/><div className="heroTxt"><h2>من المعاملة إلى القرار الصحيح</h2>
      <p>تحليل • معيار • بدائل • توصية • أثر</p><i className="heroLine"/></div></section>

    <section className="card assistant"><div className="astTop"><div><div className="astTitle">المساعد المحاسبي الذكي <b className="aiTag">AI</b></div>
      <p>اكتب وصف أي معاملة وسنحلّلها في محرك اتخاذ القرار ونقترح لك المعالجة والبدائل بالمعايير.</p></div><Robot/></div>
      <form className="ask" onSubmit={ask}><button aria-label="إرسال" type="submit"><Icon name="send" size={18}/></button>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="اكتب سؤالك هنا ..."/></form></section>

    <Kpi icon="bars" tone="green" label="إجمالي الإيرادات" value="8,300,000 ج.م" delta="15.6%+" demo/>
    <Kpi icon="wallet" tone="purple" label="إجمالي المصروفات" value="5,820,000 ج.م" delta="8.4%+" demo/>
    <Kpi icon="coins" tone="blue" label="صافي الربح" value="2,480,000 ج.م" delta="12.8%+" demo/>
    <div className="card kpi ringKpi"><div className="kpiBody"><div className="kpiLabel">نسبة اعتماد القرارات</div>
      <div className="kpiSub">{analyzed} قرار محلَّل • {approved} معتمد</div></div><Ring value={rate} label="" color="#34e07a" size={86}/></div>

    <section className="card alerts"><h3><Icon name="bell" size={20}/> تنبيهات وتوصيات ذكية{!last && <i className="demo">توضيحي</i>}</h3>
      {alerts.map((a, i) => <div className={"alertRow " + a.tone} key={i}><span className="ai"><Icon name={a.tone === "ok" ? "check" : a.tone === "warn" ? "warn" : "info"} size={18}/></span><p>{a.t}</p></div>)}</section>

    <section className="card perf"><h3><Icon name="bars" size={20}/> الأداء المالي<i className="demo">توضيحي</i></h3><Chart/>
      <div className="legend"><span><i style={{background: "#2f9bff"}}/>الإيرادات</span><span><i style={{background: "#a66bff"}}/>المصروفات</span><span><i style={{background: "#34e07a"}}/>صافي الربح</span></div></section>

    <section className="card engineCard"><h3><Icon name="target" size={20}/> محرك اتخاذ القرار</h3>
      {["تحليل المعاملة وفقًا للمعايير", "عرض البدائل المحاسبية", "التوصية بالمعالجة الأمثل", "تقييم الأثر المالي والضريبي"].map(t =>
        <div className="chk" key={t}><Icon name="check" size={16}/>{t}</div>)}
      <button className="primary glow" onClick={() => go("engine")}>ابدأ تحليل معاملة جديدة</button></section>

    <section className="card tools"><h3><Icon name="grid" size={20}/> أدوات سريعة</h3><div className="toolGrid">
      {[["pie", "تحليل الانحرافات"], ["table", "تسوية الحسابات"], ["scale", "تقييم الالتزامات"], ["coins", "تحليل الربحية"], ["cal", "إعداد القوائم المالية"]].map(([ic, t]) =>
        <button className="tool" key={t} onClick={soon}><Icon name={ic} size={26}/><span>{t}</span></button>)}</div></section>

    <section className="card reports"><h3><Icon name="doc" size={20}/> أبرز التقارير</h3>
      {["قائمة الدخل", "قائمة المركز المالي", "قائمة التدفقات النقدية", "تقرير الالتزام بالمعايير (IFRS)"].map(t =>
        <button className="rep" key={t} onClick={soon}><Icon name="down" size={16}/>{t}</button>)}</section>

    <section className="card inds"><h3><Icon name="bars" size={20}/> مؤشرات القرار<i className="demo">توضيحي</i></h3><div className="ringRow">
      <Ring value={96} label="كفاءة التشغيل" color="#34e07a"/><Ring value={88} label="الربحية" color="#2de2c0"/><Ring value={92} label="السيولة" color="#22d3ee"/></div></section>
  </div>;
}
