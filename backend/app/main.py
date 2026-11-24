import os
from decimal import Decimal
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from . import audit, engine

app = FastAPI(title="ACCTIQ V13.1 - Accounting Scenario & Alternative Treatment Engine", version="13.1.0")
_origins = os.environ.get("ACCTIQ_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


class Component(BaseModel):
    name: str = "مكون"
    cost: Decimal
    life: Decimal
    residual: Decimal = Decimal("0")


class ScenarioRequest(BaseModel):
    framework: str = "IFRS"
    transaction_kind: Literal["acquisition", "subsequent_expenditure"] = "acquisition"
    asset_type: Literal["equipment", "building", "vehicle", "land", "other"] = "equipment"
    transaction: str = ""
    amount: Decimal
    currency: str = "EGP"
    useful_life_years: Optional[Decimal] = None
    available_for_use: Optional[str] = None
    residual_value: Decimal = Decimal("0")
    materiality_threshold: Decimal = Decimal("0")
    vat_recoverable: Decimal = Decimal("0")
    settlement: Literal["cash", "bank", "payable"] = "payable"
    fiscal_year_end_month: int = Field(default=12, ge=1, le=12)
    probable_benefits: Optional[bool] = None
    cost_measurable: Optional[bool] = None
    improves_or_replaces_part: Optional[bool] = None
    fair_value_reliable: Optional[bool] = None
    scope_confirmed: bool = False
    componentized: bool = False
    components: List[Component] = Field(default_factory=list)

    @field_validator("framework", mode="before")
    @classmethod
    def _framework(cls, v):
        v = str(v).strip().upper()
        if v not in {"IFRS", "EAS"}:
            raise ValueError("المرجعيات المدعومة حاليًا: IFRS وEAS فقط")
        return v


class Approval(BaseModel):
    decision_id: str
    approver: str = Field(min_length=2)
    decision: Literal["approved", "rejected"]
    note: str = ""


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "13.1.0", "mode": "prototype"}


@app.get("/api/v1/sources")
def sources():
    return engine.OFFICIAL_SOURCES


@app.post("/api/v1/scenarios/analyze")
def analyze(req: ScenarioRequest):
    data = req.model_dump()
    result = engine.analyze(data)
    entry = audit.append("analysis", {"request": data, "status": result["status"],
                                      "selected": result.get("selected"),
                                      "confidence": result.get("decision_confidence")})
    result["decision_id"], result["audit_seq"] = entry["hash"], entry["seq"]
    return result


@app.post("/api/v1/scenarios/approve")
def approve(a: Approval):
    row = audit.find(a.decision_id)
    if not row or row["type"] != "analysis":
        raise HTTPException(404, "القرار غير موجود في سجل التدقيق")
    if row["payload"]["status"] != "PROVISIONAL_RECOMMENDATION":
        raise HTTPException(409, "لا يمكن اعتماد قرار لم يصل لتوصية مبدئية")
    entry = audit.append("approval", {"decision_id": a.decision_id, "approver": a.approver,
                                      "decision": a.decision, "note": a.note})
    return {"audit_seq": entry["seq"], "hash": entry["hash"], "decision": a.decision}


@app.get("/api/v1/audit/verify")
def audit_verify():
    return audit.verify()
