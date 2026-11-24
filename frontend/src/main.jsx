import React, {useState, useEffect} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
import {Icon, Logo} from "./ui.jsx";
import Dashboard from "./Dashboard.jsx";
import Engine from "./Engine.jsx";
import {Decisions, Settings} from "./Pages.jsx";
import {loadHistory, saveHistory} from "./api.js";

const NAV = [
  ["home", "home", "الرئيسية"], ["assistant", "bot", "المساعد الذكي", "engine"], ["tx", "edit", "تسجيل المعاملات", "engine"],
  ["journal", "book", "القيود اليومية", null], ["ifrs", "book", "دليل المعايير IFRS", null], ["engine", "target", "محرك اتخاذ القرار"],
  ["comply", "shield", "فحص الالتزام", null], ["reports", "bars", "التقارير المالية", null], ["analysis", "trend", "التحليل المالي", null],
  ["budget", "cal", "الموازنات والتنبؤات", null], ["assets", "cube", "الأصول الثابتة", null], ["stock", "box", "المخزون", null],
  ["tax", "pct", "الضرائب", null], ["decisions", "db", "سجل القرارات"], ["settings", "gear", "الإعدادات"],
];

function App() {
  const [page, setPage] = useState("home"), [prefill, setPrefill] = useState(""), [open, setOpen] = useState(false);
  const [toast, setToast] = useState(""), [history, setHistory] = useState(loadHistory);
  useEffect(() => saveHistory(history), [history]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);

  const go = (p, text) => { setPage(p); setOpen(false); if (text) setPrefill(text); window.scrollTo(0, 0); };
  const pick = ([id, , , target]) => {
    if (target === null) { setToast("هذه الميزة قيد التطوير وستتوفر قريبًا."); setOpen(false); return; }
    go(target || id);
  };
  const analyzed = (form, d) => setHistory(h => [{
    id: d.decision_id, ts: Date.now(), text: form.transaction.slice(0, 120), amount: form.amount, status: d.status,
    selected: d.alternatives?.find(a => a.id === d.selected)?.name, warnings: d.warnings || [], approval: null}, ...h]);
  const approved = (id, decision) => setHistory(h => h.map(x => x.id === id ? {...x, approval: decision} : x));

  return <div className="app">
    <aside className={open ? "open" : ""}><div className="asideTop"><Logo/><button className="x" onClick={() => setOpen(false)} aria-label="إغلاق"><Icon name="close"/></button></div>
      <nav>{NAV.map(n => <button key={n[0]} className={"nav" + (n[0] === page ? " active" : "") + (n[3] === null ? " soon" : "")}
        onClick={() => pick(n)}><Icon name={n[1]} size={20}/><span>{n[2]}</span>{n[3] === null && <em>قريبًا</em>}</button>)}</nav>
      <div className="warning">HUMAN APPROVAL REQUIRED<br/>توصيات قابلة للمراجعة</div></aside>
    {open && <div className="scrim" onClick={() => setOpen(false)}/>}
    <div className="mainWrap">
      <header className="top"><button className="burger" onClick={() => setOpen(true)} aria-label="القائمة"><Icon name="menu" size={24}/></button>
        <div className="topLogo"><Logo small/></div>
        <div className="tag">Think Accounting. <b>Decide Smarter.</b></div>
        <div className="topTools"><button aria-label="بحث" onClick={() => go("engine")}><Icon name="search"/></button>
          <button aria-label="تنبيهات" className="dotBtn" onClick={() => go("home")}><Icon name="bell"/></button>
          <button aria-label="مساعدة" onClick={() => setToast("اكتب وصف معاملتك في المساعد وسنحلّلها لك.")}><Icon name="help"/></button>
          <div className="me"><span className="av"><Icon name="user" size={20}/></span><div><b>المستخدم</b><small>المدير المالي</small></div></div></div></header>
      <main>
        {page === "home" && <Dashboard history={history} go={go} notify={setToast}/>}
        {page === "engine" && <Engine prefill={prefill} onAnalyzed={analyzed} onApproved={approved}/>}
        {page === "decisions" && <Decisions history={history} clear={() => setHistory([])}/>}
        {page === "settings" && <Settings/>}
      </main>
    </div>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<App/>);
