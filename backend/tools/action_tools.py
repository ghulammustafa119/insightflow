import os
import json

from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "no-key"))

CONSTRAINTS = {
    "budget_pkr": 500000,
    "deadline_hours": 24,
    "max_supplier_lead_days": 3,
    "notification_deadline_hours": 2,
    "max_order_quantity": 5000,
}

ACTION_PROMPT = """You are a constraint-aware action planning agent for a supply chain company.

Situation (ground truth after contradiction resolution):
{ground_truth}

Key insights summary:
{insights_summary}

Constraints:
- Maximum budget: PKR {budget}
- Deadline: {deadline} hours
- Max supplier lead time: {lead_days} days

Generate EXACTLY 5 connected actions as a JSON array.
Action 3 MUST be an emergency order that will FAIL due to API timeout (set feasible=true but it will fail at runtime).

[
  {{
    "action_id": "act_001",
    "step": 1,
    "title": "action title",
    "type": "query or notify or update or order or monitor",
    "description": "what this action does and why",
    "tool_call": "function_name(param=value)",
    "estimated_cost_pkr": number,
    "estimated_time_hours": number,
    "feasible": true or false,
    "rejection_reason": "only include if feasible is false",
    "depends_on_step": null or step number,
    "status": "pending"
  }}
]

The 5 actions should be:
1. Validate current stock (query inventory system)
2. Notify procurement team (send notification)
3. Place emergency order with Primary Supplier A (this will FAIL - set estimated_cost_pkr to something under budget, feasible=true)
4. Update customer delivery estimates
5. Schedule 24-hour monitoring

Return ONLY valid JSON array."""


def validate_against_constraints(action: dict) -> dict:
    if action.get("estimated_cost_pkr", 0) > CONSTRAINTS["budget_pkr"]:
        action["feasible"] = False
        action["rejection_reason"] = (
            f"Estimated cost PKR {action['estimated_cost_pkr']:,.0f} exceeds budget limit of PKR {CONSTRAINTS['budget_pkr']:,.0f}."
        )
    if action.get("estimated_time_hours", 0) > CONSTRAINTS["deadline_hours"]:
        action["feasible"] = False
        action["rejection_reason"] = action.get("rejection_reason", "") + (
            f" Estimated time {action['estimated_time_hours']}h exceeds deadline of {CONSTRAINTS['deadline_hours']}h."
        )
    return action


def generate_action_chain(ground_truth: dict, insights: list) -> list:
    top_insights = insights[:5]
    insights_summary = "\n".join(
        f"- [{i['category'].upper()}] {i['signal']} (confidence: {i['confidence']:.0%})"
        for i in top_insights
    )

    prompt = ACTION_PROMPT.format(
        ground_truth=json.dumps(ground_truth, indent=2),
        insights_summary=insights_summary,
        budget=CONSTRAINTS["budget_pkr"],
        deadline=CONSTRAINTS["deadline_hours"],
        lead_days=CONSTRAINTS["max_supplier_lead_days"],
    )

    try:
        response = _client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        actions_raw = json.loads(text)
    except Exception as e:
        print(f"[Actions] Gemini error, using fallback actions: {e}")
        actions_raw = _fallback_actions()

    actions = []
    for i, action in enumerate(actions_raw[:5], start=1):
        action["action_id"] = f"act_{i:03d}"
        action["step"] = i
        action.setdefault("status", "pending")
        action = validate_against_constraints(action)
        actions.append(action)

    print(f"[Actions] Generated {len(actions)} actions.")
    feasible = sum(1 for a in actions if a.get("feasible"))
    print(f"[Actions] Feasible: {feasible}, Needs review: {len(actions) - feasible}")
    return actions


def _fallback_actions() -> list:
    return [
        {
            "step": 1, "title": "Validate Current Stock Level",
            "type": "query", "description": "Query inventory system to confirm SKU-477 stock status.",
            "tool_call": "validate_stock(sku='SKU-477')",
            "estimated_cost_pkr": 0, "estimated_time_hours": 0.5,
            "feasible": True, "rejection_reason": None, "depends_on_step": None, "status": "pending",
        },
        {
            "step": 2, "title": "Notify Procurement Team",
            "type": "notify", "description": "Alert procurement team about critical stock situation.",
            "tool_call": "notify_procurement(sku='SKU-477', urgency='critical')",
            "estimated_cost_pkr": 500, "estimated_time_hours": 0.25,
            "feasible": True, "rejection_reason": None, "depends_on_step": 1, "status": "pending",
        },
        {
            "step": 3, "title": "Place Emergency Order — Primary Supplier A",
            "type": "order", "description": "Emergency restock order via Primary Supplier A API.",
            "tool_call": "emergency_order_primary(supplier='SUP-001', sku='SKU-477', qty=2000)",
            "estimated_cost_pkr": 250000, "estimated_time_hours": 2,
            "feasible": True, "rejection_reason": None, "depends_on_step": 2, "status": "pending",
        },
        {
            "step": 4, "title": "Update Customer Delivery Estimates",
            "type": "update", "description": "Push updated ETAs to all affected customers.",
            "tool_call": "update_delivery_estimates(sku='SKU-477', delay_days=3)",
            "estimated_cost_pkr": 1000, "estimated_time_hours": 1,
            "feasible": True, "rejection_reason": None, "depends_on_step": 3, "status": "pending",
        },
        {
            "step": 5, "title": "Schedule 24-Hour Monitoring",
            "type": "monitor", "description": "Set up automated monitoring for SKU-477 every 24 hours.",
            "tool_call": "schedule_monitoring(sku='SKU-477', interval_hours=24)",
            "estimated_cost_pkr": 2000, "estimated_time_hours": 0.1,
            "feasible": True, "rejection_reason": None, "depends_on_step": None, "status": "pending",
        },
    ]


def get_action_summary(action_chain: list) -> str:
    total = len(action_chain)
    feasible = sum(1 for a in action_chain if a.get("feasible"))
    total_cost = sum(a.get("estimated_cost_pkr", 0) for a in action_chain)
    total_time = sum(a.get("estimated_time_hours", 0) for a in action_chain)
    return (
        f"{total} actions generated: {feasible} feasible, {total - feasible} requires review. "
        f"Total estimated cost: PKR {total_cost:,.0f}. Timeline: {total_time:.1f} hours."
    )
