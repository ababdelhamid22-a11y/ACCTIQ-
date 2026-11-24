"""Append-only, hash-chained audit log (JSONL). Pure Python."""
import hashlib, json, os, threading
from datetime import datetime, timezone

_LOCK = threading.Lock()
GENESIS = "0" * 64


def default_path():
    return os.environ.get("ACCTIQ_AUDIT_FILE", "audit_log.jsonl")


def _norm(obj):
    return json.loads(json.dumps(obj, default=str, ensure_ascii=False))


def _hash(prev, body):
    raw = json.dumps(body, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256((prev + raw).encode("utf-8")).hexdigest()


def read_all(path=None):
    path = path or default_path()
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def append(entry_type, payload, path=None):
    path = path or default_path()
    with _LOCK:
        rows = read_all(path)
        prev = rows[-1]["hash"] if rows else GENESIS
        body = {"seq": len(rows) + 1, "ts": datetime.now(timezone.utc).isoformat(),
                "type": entry_type, "payload": _norm(payload)}
        row = {**body, "prev_hash": prev, "hash": _hash(prev, body)}
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    return row


def find(decision_id, path=None):
    for row in read_all(path):
        if row["hash"] == decision_id:
            return row
    return None


def verify(path=None):
    rows, prev = read_all(path), GENESIS
    for i, row in enumerate(rows, 1):
        body = {k: row[k] for k in ("seq", "ts", "type", "payload")}
        if row["seq"] != i or row["prev_hash"] != prev or row["hash"] != _hash(prev, body):
            return {"valid": False, "broken_at": i, "entries": len(rows)}
        prev = row["hash"]
    return {"valid": True, "entries": len(rows), "head": prev}
