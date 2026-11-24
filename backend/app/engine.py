"""ACCTIQ V13.1 - IAS 16 scenario engine (pure Python, no web framework).

Everything here is deterministic: scores and confidence are computed from the
facts and the recognition criteria, never hard-coded per scenario.
"""
import calendar
from datetime import date
from decimal import Decimal as D, ROUND_HALF_UP

OFFICIAL_SOURCES = {
    "IFRS": {"IAS 16": "https://www.ifrs.org/issued-standards/list-of-standards/ias-16-property-plant-and-equipment/"},
    "EAS": {
        "EAS 10": "https://fra.gov.eg/wp-content/uploads/2024/03/%D8%AA%D8%B9%D8%AF%D9%8A%D9%84-%D9%85%D8%B9%D9%8A%D8%A7%D8%B1-%D8%A7%D9%84%D9%85%D8%AD%D8%A7%D8%B3%D8%A8%D8%A9-%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%8A-%D8%B1%D9%82%D9%85-10-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%A7%D9%84%D8%AB%D8%A7%D8%A8%D8%AA%D8%A9-%D9%88-%D8%A7%D9%87%D9%84%D8%A7%D9%83%D9%87%D8%A7.pdf",
        "FRA Registry": "https://fra.gov.eg/%D9%85%D8%B9%D8%A7%D9%8A%D9%8A%D8%B1-%D8%A7%D9%84%D9%85%D8%AD%D8%A7%D8%B3%D8%A8%D8%A9%D9%88%D9%85%D8%B1%D8%A7%D9%82%D8%A8%D9%8A-%D8%A7%D9%84%D8%AD%D8%B3%D8%A7%D8%A8%D8%A7%D8%AA/",
    },
}
IAS16 = OFFICIAL_SOURCES["IFRS"]["IAS 16"]
ASSET_NAMES = {"equipment": "الأصول الثابتة – معدات", "building": "الأصول الثابتة – مباني",
               "vehicle": "الأصول الثابتة – وسائل نقل", "land": "الأصول الثابتة – أراضي",
               "other": "الأصول الثابتة – أخرى"}
SETTLE_NAMES = {"cash": "النقدية", "bank": "البنك", "payable": "الدائنون"}
KINDS = ("acquisition", "subsequent_expenditure")

# (keywords, standard, message, blocking)
SCOPE_RULES = [
    (("بضاعة", "مخزون", "inventory"), "IAS 2", "النص يوحي بشراء مخزون وليس أصلًا ثابتًا.", True),
    (("محتفظ بها للبيع", "held for sale"), "IFRS 5", "النص يوحي بأصل محتفظ به للبيع (خارج نطاق IAS 16).", True),
    (("برنامج", "ترخيص", "براءة", "software", "patent"), "IAS 38", "النص يوحي بأصل غير ملموس.", True),
    (("عقار استثماري", "investment property"), "IAS 40", "النص يوحي بعقار استثماري.", True),
    (("إيجار", "استئجار", "lease"), "IFRS 16", "النص يوحي بعقد إيجار.", True),
    (("صيانة", "إصلاح", "ترميم", "repair", "maintenance"), "IAS 16 para 12", "النص يوحي بصيانة؛ لو هي مصروف لاحق اختر نوع المعاملة المناسب.", False),
]


def q(x):
    return D(x).quantize(D("0.01"), ROUND_HALF_UP)


def f(x):
    return float(q(x))


def dec(v, default="0"):
    try:
        return D(str(default if v in (None, "") else v))
    except Exception:
        return None


def tri(v):
    return None if v is None else bool(v)


def month_end(y, m):
    return date(y, m, calendar.monthrange(y, m)[1])


def fy_end(avail, m):
    e = month_end(avail.year, m)
    return e if avail <= e else month_end(avail.year + 1, m)


def first_period_fraction(avail, m):
    end = fy_end(avail, m)
    days_fy = (end - month_end(end.year - 1, m)).days
    used = (end - avail).days + 1
    return min(D(1), D(used) / D(days_fy)), used, days_fy


def depreciation(cost, resid, life, avail, fy_month, land, comps):
    if land:
        return {"annual": 0.0, "first_period": 0.0, "method": "none_land", "components": []}
    items = comps or [{"name": "الأصل", "cost": cost, "life": life, "residual": resid}]
    rows, annual, base_total = [], D(0), D(0)
    for c in items:
        base = c["cost"] - c["residual"]
        a = base / c["life"]
        rows.append({"name": c["name"], "annual": f(a)})
        annual += a
        base_total += base
    frac, used, days_fy = first_period_fraction(avail, fy_month)
    first = min(annual * frac, base_total)
    return {"annual": f(annual), "first_period": f(first), "first_period_days": used,
            "fiscal_year_days": days_fy, "method": "components" if comps else "straight_line",
            "components": rows if comps else []}


def journal(debit_name, amount, vat, settle):
    lines = [{"account": debit_name, "debit": f(amount), "credit": 0.0}]
    if vat > 0:
        lines.append({"account": "ضريبة القيمة المضافة – قابلة للخصم", "debit": f(vat), "credit": 0.0})
    lines.append({"account": settle, "debit": 0.0, "credit": f(amount + vat)})
    assert round(sum(l["debit"] for l in lines) - sum(l["credit"] for l in lines), 2) == 0
    return lines


def facts_gate(r):
    e = []
    amount = dec(r.get("amount"))
    if amount is None or amount <= 0:
        e.append("قيمة المعاملة يجب أن تكون أكبر من صفر")
    kind, atype = r.get("transaction_kind", "acquisition"), r.get("asset_type", "equipment")
    if kind not in KINDS:
        e.append("نوع المعاملة غير مدعوم")
    if atype not in ASSET_NAMES:
        e.append("نوع الأصل غير مدعوم")
    try:
        date.fromisoformat(str(r.get("available_for_use")))
    except Exception:
        e.append("تاريخ إتاحة الأصل للاستخدام (بصيغة YYYY-MM-DD)")
    land = atype == "land"
    life, resid = dec(r.get("useful_life_years")), dec(r.get("residual_value"))
    if not land and (life is None or life <= 0):
        e.append("العمر الإنتاجي")
    if resid is None or resid < 0 or (amount and not land and amount > 0 and resid >= amount):
        e.append("القيمة المتبقية يجب أن تكون صفرًا أو أكبر وأقل من المبلغ")
    vat = dec(r.get("vat_recoverable"))
    if vat is None or vat < 0:
        e.append("ضريبة القيمة المضافة القابلة للخصم يجب ألا تكون سالبة")
    if not 1 <= int(r.get("fiscal_year_end_month") or 12) <= 12:
        e.append("شهر نهاية السنة المالية")
    if kind == "subsequent_expenditure" and r.get("improves_or_replaces_part") is None:
        e.append("هل المصروف يستبدل جزءًا جوهريًا أو يحسّن الأصل؟")
    if r.get("componentized"):
        comps = r.get("components") or []
        total = D(0)
        if not comps:
            e.append("بيانات المكونات (التكلفة والعمر لكل مكون)")
        for c in comps:
            cc, cl = dec(c.get("cost")), dec(c.get("life"))
            if not cc or cc <= 0 or not cl or cl <= 0:
                e.append("كل مكون يحتاج تكلفة وعمرًا أكبر من صفر")
                break
            total += cc
        if comps and amount and abs(total - amount) > D("0.01"):
            e.append("مجموع تكلفة المكونات يجب أن يساوي مبلغ المعاملة")
    return e


def scope_flags(text):
    t = (text or "").lower()
    return [{"standard": s, "message": m, "blocking": b} for kws, s, m, b in SCOPE_RULES if any(k in t for k in kws)]


def analyze(r):
    missing = facts_gate(r)
    if missing:
        return {"status": "NEEDS_FACTS", "missing_facts": missing}
    fw = str(r.get("framework", "IFRS")).upper()
    if fw == "EAS":
        return {"status": "BLOCKED", "message": "لا يتم تشغيل معالجة EAS تفصيلية دون قاعدة EAS موثقة ومتحقق منها. تم منع الاستنتاج بدل اختلاق قاعدة.",
                "source": OFFICIAL_SOURCES["EAS"]["FRA Registry"]}
    flags = scope_flags(r.get("transaction"))
    blocking = [x for x in flags if x["blocking"]]
    if blocking and not r.get("scope_confirmed"):
        return {"status": "SCOPE_REVIEW", "flags": flags, "source": IAS16,
                "message": "قد تكون المعاملة خارج نطاق IAS 16. أكّد النطاق يدويًا للمتابعة أو راجع المعيار المقترح."}

    kind, atype = r.get("transaction_kind", "acquisition"), r.get("asset_type", "equipment")
    land = atype == "land"
    amount, vat = dec(r.get("amount")), dec(r.get("vat_recoverable"))
    life, resid, thr = dec(r.get("useful_life_years")), dec(r.get("residual_value")), dec(r.get("materiality_threshold"))
    avail = date.fromisoformat(str(r["available_for_use"]))
    fym = int(r.get("fiscal_year_end_month") or 12)
    settle = SETTLE_NAMES.get(r.get("settlement", "payable"), "الدائنون")
    comps = []
    if r.get("componentized"):
        comps = [{"name": c.get("name") or "مكون", "cost": dec(c["cost"]), "life": dec(c["life"]),
                  "residual": dec(c.get("residual"))} for c in r["components"]]
    dep = depreciation(amount, resid, life, avail, fym, land, comps)

    # Criteria: (key, text, value) value True / False / None(unknown)
    first = ("probable_benefits", "IAS 16.7(a): احتمال تدفق منافع اقتصادية مستقبلية", tri(r.get("probable_benefits"))) \
        if kind == "acquisition" else \
        ("improves_or_replaces_part", "IAS 16.13: استبدال جزء جوهري أو تحسين الأصل", tri(r.get("improves_or_replaces_part")))
    crit = [first,
            ("cost_measurable", "IAS 16.7(b): إمكانية قياس التكلفة بموثوقية", tri(r.get("cost_measurable"))),
            ("policy_threshold", "سياسة الرسملة/الأهمية النسبية", None if thr == 0 else amount > thr)]
    val = {True: 1.0, None: 0.5, False: 0.0}
    match = sum(val[c[2]] for c in crit) / len(crit)
    completeness = sum(c[2] is not None for c in crit) / len(crit)
    unknown = [c for c in crit if c[2] is None]
    recog_fail = [c for c in crit[:2] if c[2] is False]
    policy_fail = crit[2][2] is False
    select_exp = bool(recog_fail or policy_fail)
    selected = "ALT-EXP" if select_exp else "ALT-CAP"
    clarity = abs(match - 0.5) * 2
    confidence = round(min(0.95, 0.6 * completeness + 0.4 * clarity), 2)

    cap_score, exp_score = round(100 * match), round(100 * (1 - match))
    fv = tri(r.get("fair_value_reliable"))
    reval_score = round(cap_score * val[fv])
    asset_acct = ASSET_NAMES[atype] + (" – استبدال/تحسين" if kind == "subsequent_expenditure" else "")
    cap_impact = {"assets": f(amount), "profit_initial": 0.0, "annual_depreciation": dep["annual"],
                  "first_period_depreciation": dep["first_period"]}
    cap_j = journal(asset_acct, amount, vat, settle)

    cap_status = "REJECTED" if recog_fail else ("CONDITIONAL" if (policy_fail or unknown) else "PREFERRED")
    exp_status = "PREFERRED" if select_exp else ("CONDITIONAL" if unknown else "REJECTED")
    cap = {"id": "ALT-CAP", "name": "رسملة كأصل ثابت (نموذج التكلفة)", "status": cap_status, "score": cap_score,
           "why_selected": [f"✓ {c[1]}" for c in crit if c[2] is True],
           "why_rejected": [f"✗ {c[1]}" for c in crit if c[2] is False],
           "needs_confirmation": [c[1] for c in unknown], "journal": cap_j, "impact": cap_impact,
           "standard": "IAS 16", "source": IAS16}
    exp = {"id": "ALT-EXP", "name": "تحميل المصروف فوراً", "status": exp_status, "score": exp_score,
           "why_selected": [f"✗ {c[1]}" for c in (recog_fail or ([crit[2]] if policy_fail else []))],
           "why_rejected": ([] if select_exp else ["معايير الاعتراف لم تفشل، فالتحميل الفوري يخالف IAS 16.7 إلا بحكم سياسة الأهمية النسبية."]),
           "needs_confirmation": [c[1] for c in unknown] if not select_exp else [],
           "journal": journal("مصروف", amount, vat, settle),
           "impact": {"assets": 0.0, "profit_initial": -f(amount), "annual_depreciation": 0.0, "first_period_depreciation": 0.0},
           "standard": "IAS 16 / سياسة الأهمية النسبية", "source": IAS16}
    reval = {"id": "ALT-REVAL", "name": "نموذج إعادة التقييم (اختيار سياسة لفئة الأصول كلها)",
             "status": "REJECTED" if select_exp else "CONDITIONAL", "score": 0 if select_exp else reval_score,
             "why_selected": [] if select_exp else ["يُطبّق على الفئة بأكملها ويتطلب قيمة عادلة موثوقة وإعادة تقييم منتظمة (IAS 16.31)."],
             "why_rejected": ["لا يوجد أصل معترف به ليُعاد تقييمه."] if select_exp else
                             ([] if fv else ["القيمة العادلة الموثوقة غير مؤكدة."]),
             "needs_confirmation": [] if (select_exp or fv is not None) else ["هل يمكن قياس القيمة العادلة بموثوقية؟"],
             "journal": [] if select_exp else cap_j, "impact": {} if select_exp else cap_impact,
             "standard": "IAS 16.31", "source": IAS16}
    alts = [cap, exp] if kind == "subsequent_expenditure" else [cap, exp, reval]

    warnings = [x["message"] for x in flags]
    if land:
        warnings.append("الأرض لا تُهلك عادةً (IAS 16.58)، لذلك الإهلاك صفر.")
    if kind == "subsequent_expenditure" and not select_exp:
        warnings.append("استبعد القيمة الدفترية للجزء المستبدل (IAS 16.13).")
    suggestions = []
    if not comps and not land and atype in ("building", "equipment") and not select_exp:
        suggestions.append("افحص وجود مكونات جوهرية بأعمار مختلفة؛ إن وُجدت فاستهلك كل مكون على حدة (IAS 16.43).")
    sel = {"ALT-CAP": cap, "ALT-EXP": exp}[selected]
    return {
        "status": "PROVISIONAL_RECOMMENDATION", "framework": fw, "kind": kind,
        "applicability": "IAS 16 نقطة الانطلاق، مع مراجعة النطاق والاستثناءات.",
        "selected": selected, "decision_confidence": confidence,
        "confidence_note": "الثقة = 60% اكتمال الأدلة + 40% وضوح الحسم. تقيس جودة الأدلة وليست احتمال صحة محاسبية.",
        "score_basis": "رسملة = نسبة تحقق المعايير؛ مصروف = المكمّل؛ إعادة تقييم = درجة الرسملة × موثوقية القيمة العادلة.",
        "criteria": [{"key": c[0], "text": c[1], "value": c[2]} for c in crit],
        "alternatives": alts, "warnings": warnings, "suggestions": suggestions,
        "needs_confirmation": [c[1] for c in unknown], "depreciation": dep,
        "trace": [
            {"step": "Transaction", "result": r.get("transaction", "")},
            {"step": "Facts", "result": {"amount": f(amount), "vat_recoverable": f(vat), "asset_type": atype, "kind": kind,
                                         "useful_life_years": None if land else float(life), "available_for_use": avail.isoformat()}},
            {"step": "Scope", "result": [x["standard"] for x in flags] or "لا مؤشرات خارج النطاق"},
            {"step": "Criteria", "result": {c[0]: c[2] for c in crit}},
            {"step": "Selection", "result": f"{sel['id']} ({sel['name']}) — confidence {confidence}"},
            {"step": "Depreciation", "result": dep},
            {"step": "Approval", "result": "HUMAN APPROVAL REQUIRED"}],
        "human_approval_required": True, "sources": [IAS16]}
