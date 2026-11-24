import os, sys, tempfile, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app import audit, engine

BASE = dict(transaction="شراء آلة إنتاج", amount=100000, useful_life_years=5, available_for_use="2026-01-01",
            probable_benefits=True, cost_measurable=True, materiality_threshold=1000)


def run(**kw):
    return engine.analyze({**BASE, **kw})


def alt(res, i):
    return next(a for a in res["alternatives"] if a["id"] == i)


class EngineTests(unittest.TestCase):
    def test_normal_capitalization(self):
        r = run(residual_value=10000)
        self.assertEqual(r["selected"], "ALT-CAP")
        self.assertEqual(r["depreciation"]["annual"], 18000.0)
        self.assertEqual(r["depreciation"]["first_period"], 18000.0)  # full year, Jan 1
        self.assertEqual(alt(r, "ALT-CAP")["status"], "PREFERRED")

    def test_first_period_proration(self):
        r = run(available_for_use="2026-07-01")
        self.assertEqual(r["depreciation"]["first_period_days"], 184)
        self.assertAlmostEqual(r["depreciation"]["first_period"], 20000 * 184 / 365, places=2)

    def test_scores_and_confidence_are_computed(self):
        full = run()
        unknown = run(probable_benefits=None, cost_measurable=None)
        self.assertGreater(full["decision_confidence"], unknown["decision_confidence"])
        self.assertNotEqual(alt(full, "ALT-CAP")["score"], alt(unknown, "ALT-CAP")["score"])

    def test_failed_recognition_selects_expense(self):
        r = run(probable_benefits=False)
        self.assertEqual(r["selected"], "ALT-EXP")
        self.assertEqual(alt(r, "ALT-CAP")["status"], "REJECTED")

    def test_below_policy_threshold_selects_expense(self):
        r = run(materiality_threshold=500000)
        self.assertEqual(r["selected"], "ALT-EXP")

    def test_land_not_depreciated(self):
        r = run(asset_type="land", transaction="شراء قطعة أرض", useful_life_years=None)
        self.assertEqual(r["depreciation"]["annual"], 0.0)

    def test_inventory_text_goes_to_scope_review(self):
        r = run(transaction="شراء بضاعة للبيع")
        self.assertEqual(r["status"], "SCOPE_REVIEW")
        self.assertEqual(r["flags"][0]["standard"], "IAS 2")
        self.assertEqual(run(transaction="شراء بضاعة للبيع", scope_confirmed=True)["status"], "PROVISIONAL_RECOMMENDATION")

    def test_maintenance_as_subsequent_expense(self):
        r = run(transaction_kind="subsequent_expenditure", transaction="صيانة دورية", improves_or_replaces_part=False)
        self.assertEqual(r["selected"], "ALT-EXP")
        self.assertEqual([a["id"] for a in r["alternatives"]], ["ALT-CAP", "ALT-EXP"])

    def test_subsequent_requires_answer(self):
        self.assertEqual(run(transaction_kind="subsequent_expenditure")["status"], "NEEDS_FACTS")

    def test_invalid_facts_are_rejected(self):
        self.assertEqual(run(residual_value=100000)["status"], "NEEDS_FACTS")
        self.assertEqual(run(residual_value=-1)["status"], "NEEDS_FACTS")
        self.assertEqual(run(available_for_use=None)["status"], "NEEDS_FACTS")
        self.assertEqual(run(amount=0)["status"], "NEEDS_FACTS")

    def test_eas_blocked(self):
        self.assertEqual(run(framework="EAS")["status"], "BLOCKED")

    def test_vat_journal_balances(self):
        j = alt(run(vat_recoverable=14000), "ALT-CAP")["journal"]
        self.assertEqual(sum(l["debit"] for l in j), sum(l["credit"] for l in j))
        self.assertEqual(j[-1]["credit"], 114000.0)

    def test_components(self):
        comps = [dict(name="جسم", cost=70000, life=10), dict(name="محرك", cost=30000, life=5)]
        r = run(componentized=True, components=comps)
        self.assertEqual(r["depreciation"]["annual"], 13000.0)
        self.assertEqual(r["depreciation"]["method"], "components")
        bad = run(componentized=True, components=[dict(name="x", cost=1, life=5)])
        self.assertEqual(bad["status"], "NEEDS_FACTS")

    def test_decimal_precision(self):
        r = run(amount=0.1 + 0.2, useful_life_years=3, materiality_threshold=0)
        self.assertEqual(alt(r, "ALT-CAP")["journal"][0]["debit"], 0.3)


class AuditTests(unittest.TestCase):
    def test_chain_and_tamper_detection(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "a.jsonl")
            e1 = audit.append("analysis", {"x": 1}, p)
            audit.append("approval", {"decision_id": e1["hash"]}, p)
            self.assertTrue(audit.verify(p)["valid"])
            self.assertEqual(audit.find(e1["hash"], p)["seq"], 1)
            with open(p, encoding="utf-8") as fh:
                text = fh.read().replace('"x": 1', '"x": 2')
            with open(p, "w", encoding="utf-8") as fh:
                fh.write(text)
            self.assertFalse(audit.verify(p)["valid"])


if __name__ == "__main__":
    unittest.main()
