import random
import time
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _mock_delay():
    time.sleep(random.uniform(0.1, 0.5))


def _tool_validate_stock(**kwargs):
    _mock_delay()
    return {
        "stock_level": "8%",
        "units_remaining": 198,
        "days_remaining": 2,
        "sku": "SKU-477",
        "status": "critical",
    }


def _tool_notify_procurement(**kwargs):
    _mock_delay()
    return {
        "status": "sent",
        "recipients": ["procurement@company.com", "manager@company.com"],
        "message_id": "MSG-4421",
        "timestamp": _now(),
    }


def _tool_emergency_order_primary(**kwargs):
    _mock_delay()
    raise TimeoutError("Primary Supplier A API timeout after 30s. Connection refused.")


def _tool_emergency_order_fallback(**kwargs):
    _mock_delay()
    return {
        "order_id": "ORD-ALT-9921",
        "supplier": "Backup Supplier B",
        "eta_days": 3,
        "units_ordered": 2000,
        "cost_pkr": 180000,
        "status": "confirmed",
    }


def _tool_update_delivery_estimates(**kwargs):
    _mock_delay()
    return {
        "customers_notified": 142,
        "old_eta": "2026-05-19",
        "new_eta": "2026-05-22",
        "notification_sent": True,
    }


def _tool_schedule_monitoring(**kwargs):
    _mock_delay()
    return {
        "job_id": "MON-001",
        "interval_hours": 24,
        "next_check": "2026-05-20T10:00:00Z",
        "alerts_configured": ["stock_below_500", "supplier_delay"],
    }


MOCK_TOOLS = {
    "validate_stock": _tool_validate_stock,
    "notify_procurement": _tool_notify_procurement,
    "emergency_order_primary": _tool_emergency_order_primary,
    "emergency_order_fallback": _tool_emergency_order_fallback,
    "update_delivery_estimates": _tool_update_delivery_estimates,
    "schedule_monitoring": _tool_schedule_monitoring,
}


def _parse_tool_name(tool_call_str: str) -> str:
    return tool_call_str.split("(")[0].strip()


def update_state(current_state: dict, step: int, result: dict) -> dict:
    state = dict(current_state)
    if step == 1:
        state["stock_verified"] = True
        state["stock_level"] = result.get("stock_level", "unknown")
    elif step == 2:
        state["procurement_notified"] = True
    elif step == 3:
        state["order_placed"] = True
        state["order_details"] = result
    elif step == 4:
        state["customers_notified"] = result.get("customers_notified", 0)
    elif step == 5:
        state["monitoring_active"] = True
    return state


def simulate_execution(action_chain: list) -> list:
    initial_state = {
        "stock_risk": "critical",
        "stock_verified": False,
        "procurement_notified": False,
        "order_placed": False,
        "customers_notified": 0,
        "monitoring_active": False,
        "stockout_risk_percent": 87,
    }

    current_state = dict(initial_state)
    execution_log = []

    for action in action_chain:
        step = action["step"]
        title = action["title"]

        if not action.get("feasible", True):
            print(f"[Sim] Step {step} SKIPPED — {action.get('rejection_reason','')}")
            execution_log.append({
                "step": step,
                "title": title,
                "status": "skipped",
                "state_before": dict(current_state),
                "state_after": dict(current_state),
                "result": None,
                "error": None,
                "recovery": action.get("rejection_reason"),
                "latency_ms": 0,
                "cost_usd": 0.0,
                "start_time": _now(),
                "end_time": _now(),
            })
            continue

        start_time = _now()
        state_before = dict(current_state)
        tool_name = _parse_tool_name(action.get("tool_call", ""))

        # Map by step number as fallback so Gemini-generated names still work
        STEP_TOOL_MAP = {
            1: _tool_validate_stock,
            2: _tool_notify_procurement,
            3: _tool_emergency_order_primary,
            4: _tool_update_delivery_estimates,
            5: _tool_schedule_monitoring,
        }
        tool_fn = MOCK_TOOLS.get(tool_name) or STEP_TOOL_MAP.get(step)

        t0 = time.time()
        status = "success"
        result = None
        error = None
        recovery = None

        if step == 3:
            print(f"[Sim] Step {step}: {title} — calling {tool_name}...")
            try:
                result = tool_fn()
            except TimeoutError as e:
                error = str(e)
                print(f"[Sim] Step {step} FAILED: {error}")
                print(f"[Sim] Step {step} RECOVERY: Switching to Backup Supplier B...")
                try:
                    result = _tool_emergency_order_fallback()
                    status = "recovered"
                    recovery = "Primary Supplier A timed out. Order successfully placed via Backup Supplier B (ORD-ALT-9921)."
                    print(f"[Sim] Step {step} RECOVERED: {recovery}")
                except Exception as e2:
                    status = "failed"
                    error = str(e2)
        else:
            print(f"[Sim] Step {step}: {title} — calling {tool_name}...")
            try:
                result = tool_fn() if tool_fn else {}
                status = "success"
                print(f"[Sim] Step {step} SUCCESS")
            except Exception as e:
                status = "failed"
                error = str(e)
                print(f"[Sim] Step {step} FAILED: {error}")

        latency_ms = int((time.time() - t0) * 1000)
        cost_usd = round(random.uniform(0.001, 0.005), 4)

        if result:
            current_state = update_state(current_state, step, result)

        execution_log.append({
            "step": step,
            "title": title,
            "status": status,
            "state_before": state_before,
            "state_after": dict(current_state),
            "result": result,
            "error": error,
            "recovery": recovery,
            "latency_ms": latency_ms,
            "cost_usd": cost_usd,
            "start_time": start_time,
            "end_time": _now(),
        })

    if execution_log:
        execution_log[-1]["state_after"]["stockout_risk_percent"] = 12

    return execution_log


def get_final_state_comparison(execution_log: list) -> dict:
    if not execution_log:
        return {"before": {}, "after": {}}
    return {
        "before": execution_log[0]["state_before"],
        "after": execution_log[-1]["state_after"],
    }
