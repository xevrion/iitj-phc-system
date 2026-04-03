#!/usr/bin/env python3

from __future__ import annotations

import csv
import json
import math
import re
import subprocess
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
LAB_ROOT = ROOT / "docs" / "Lab 9 10"
DATA_DIR = LAB_ROOT / "data"


SPRINT_WINDOWS = [
    ("Sprint 0", date(2026, 1, 15), date(2026, 1, 24)),
    ("Sprint 1", date(2026, 1, 25), date(2026, 2, 7)),
    ("Sprint 2", date(2026, 2, 8), date(2026, 2, 21)),
    ("Sprint 3", date(2026, 2, 22), date(2026, 3, 7)),
    ("Sprint 4", date(2026, 3, 8), date(2026, 3, 18)),
    ("Sprint 5", date(2026, 3, 19), date(2026, 4, 1)),
]


WORK_ITEMS = [
    {
        "id": "backend_foundation",
        "label": "Backend scaffolding and healthcheck",
        "planned_start": "2026-01-15",
        "done": "2026-02-25",
        "sprint": "Sprint 0",
    },
    {
        "id": "schema_alignment",
        "label": "Prisma schema alignment",
        "planned_start": "2026-01-25",
        "done": "2026-02-27",
        "sprint": "Sprint 1",
    },
    {
        "id": "auth_jwt",
        "label": "JWT authentication and route guards",
        "planned_start": "2026-01-25",
        "done": "2026-02-27",
        "sprint": "Sprint 1",
    },
    {
        "id": "patient_profiles",
        "label": "Patient profile and QR lookup",
        "planned_start": "2026-01-25",
        "done": "2026-02-27",
        "sprint": "Sprint 1",
    },
    {
        "id": "visit_lifecycle",
        "label": "Visit lifecycle workflow",
        "planned_start": "2026-02-08",
        "done": "2026-02-27",
        "sprint": "Sprint 2",
    },
    {
        "id": "doctor_attendance",
        "label": "Doctor availability and attendance",
        "planned_start": "2026-02-08",
        "done": "2026-02-27",
        "sprint": "Sprint 2",
    },
    {
        "id": "prescriptions",
        "label": "Prescription creation and dispensing",
        "planned_start": "2026-02-22",
        "done": "2026-02-27",
        "sprint": "Sprint 3",
    },
    {
        "id": "lab_core",
        "label": "Lab requests and report upload",
        "planned_start": "2026-02-22",
        "done": "2026-02-27",
        "sprint": "Sprint 3",
    },
    {
        "id": "patient_lab_access",
        "label": "Patient lab report access controls",
        "planned_start": "2026-02-22",
        "done": "2026-03-24",
        "sprint": "Sprint 5",
    },
    {
        "id": "medicine_inventory",
        "label": "Medicine inventory",
        "planned_start": "2026-03-08",
        "done": "2026-03-18",
        "sprint": "Sprint 4",
    },
    {
        "id": "billing",
        "label": "Billing and stock deduction",
        "planned_start": "2026-03-08",
        "done": "2026-03-18",
        "sprint": "Sprint 4",
    },
    {
        "id": "appointments",
        "label": "Appointment booking",
        "planned_start": "2026-03-08",
        "done": "2026-03-18",
        "sprint": "Sprint 4",
    },
    {
        "id": "qr_checkin",
        "label": "QR check-in",
        "planned_start": "2026-03-08",
        "done": "2026-03-18",
        "sprint": "Sprint 4",
    },
    {
        "id": "external_documents",
        "label": "External document digitization",
        "planned_start": "2026-03-08",
        "done": "2026-03-18",
        "sprint": "Sprint 4",
    },
    {
        "id": "admin_users",
        "label": "Admin user management",
        "planned_start": "2026-03-19",
        "done": "2026-03-24",
        "sprint": "Sprint 5",
    },
    {
        "id": "events",
        "label": "PHC event publishing",
        "planned_start": "2026-03-19",
        "done": "2026-03-24",
        "sprint": "Sprint 5",
    },
    {
        "id": "reports",
        "label": "Usage and attendance reports",
        "planned_start": "2026-03-19",
        "done": "2026-03-24",
        "sprint": "Sprint 5",
    },
    {
        "id": "lab_request_detail",
        "label": "Single lab request detail endpoint",
        "planned_start": "2026-03-19",
        "done": "2026-03-24",
        "sprint": "Sprint 5",
    },
    {
        "id": "notifications",
        "label": "Doctor availability notifications",
        "planned_start": "2026-03-19",
        "done": "2026-03-25",
        "sprint": "Sprint 5",
    },
    {
        "id": "e2e_docs",
        "label": "Full-system E2E and API documentation",
        "planned_start": "2026-03-19",
        "done": "2026-03-25",
        "sprint": "Sprint 5",
    },
    {
        "id": "ldap_bind",
        "label": "LDAP bind authentication",
        "planned_start": "2026-03-19",
        "done": "2026-03-25",
        "sprint": "Sprint 5",
    },
]


SPRINT5_ITEMS = [
    ("Patient lab report access", "2026-03-24"),
    ("PHC event publishing", "2026-03-24"),
    ("Usage and attendance reports", "2026-03-24"),
    ("Lab request detail endpoint", "2026-03-24"),
    ("Admin user management", "2026-03-24"),
    ("Doctor availability notifications", "2026-03-25"),
    ("Full-system E2E flow", "2026-03-25"),
    ("API documentation closeout", "2026-03-25"),
    ("LDAP bind authentication", "2026-03-25"),
]


COCOMO_COST_DRIVERS = {
    "RELY": 1.15,
    "DATA": 1.08,
    "CPLX": 1.15,
    "TIME": 1.00,
    "STOR": 1.00,
    "VIRT": 1.00,
    "TURN": 1.00,
    "ACAP": 0.86,
    "AEXP": 0.91,
    "PCAP": 0.86,
    "VEXP": 1.00,
    "LEXP": 0.95,
    "MODP": 0.91,
    "TOOL": 0.91,
    "SCED": 1.04,
}


FUNCTION_POINT_WEIGHTS = {
    "EI": 4,
    "EO": 5,
    "EQ": 4,
    "ILF": 10,
    "EIF": 5,
}


FUNCTION_POINT_GSC = {
    "data_communications": 3,
    "distributed_processing": 2,
    "performance": 4,
    "heavily_used_configuration": 3,
    "transaction_rate": 4,
    "online_data_entry": 4,
    "end_user_efficiency": 4,
    "online_update": 4,
    "complex_processing": 4,
    "reusability": 3,
    "installation_ease": 2,
    "operational_ease": 3,
    "multiple_sites": 2,
    "facilitate_change": 4,
}


HALSTEAD_OPERATORS = {
    "=>",
    "++",
    "--",
    "&&",
    "||",
    "===",
    "!==",
    "==",
    "!=",
    ">=",
    "<=",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "??",
    "?.",
    "...",
    "+",
    "-",
    "*",
    "/",
    "%",
    "=",
    ">",
    "<",
    "!",
    "?",
    ":",
    ".",
    ",",
    ";",
    "(",
    ")",
    "{",
    "}",
    "[",
    "]",
}

HALSTEAD_KEYWORDS = {
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "case",
    "break",
    "continue",
    "return",
    "throw",
    "try",
    "catch",
    "finally",
    "import",
    "from",
    "export",
    "const",
    "let",
    "var",
    "new",
    "await",
    "async",
    "class",
    "extends",
    "default",
    "in",
    "of",
    "typeof",
    "instanceof",
    "null",
    "true",
    "false",
}


@dataclass
class Endpoint:
    method: str
    path: str
    router_name: str
    route_file: str


def run_git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True)


def daterange(start: date, end: date) -> list[date]:
    current = start
    days = []
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"//.*", "", text)
    return text


def strip_comments_and_strings(text: str) -> str:
    text = strip_comments(text)
    text = re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
    text = re.sub(r"'(?:\\.|[^'\\])*'", "''", text)
    text = re.sub(r"`(?:\\.|[^`\\])*`", "``", text, flags=re.S)
    return text


def count_sloc(path: Path) -> int:
    text = strip_comments(path.read_text(encoding="utf-8"))
    return sum(1 for line in text.splitlines() if line.strip())


def list_source_files() -> list[Path]:
    files = []
    files.extend(sorted((ROOT / "backend" / "src").rglob("*.js")))
    files.append(ROOT / "backend" / "prisma" / "schema.prisma")
    files.append(ROOT / "backend" / "prisma" / "seed.js")
    return files


def compute_loc_metrics() -> dict:
    production_files = list_source_files()
    backend_src_files = sorted((ROOT / "backend" / "src").rglob("*.js"))
    service_files = sorted((ROOT / "backend" / "src" / "services").glob("*.js"))
    controller_files = sorted((ROOT / "backend" / "src" / "controllers").glob("*.js"))
    route_files = sorted((ROOT / "backend" / "src" / "routes").glob("*.js"))

    return {
        "production_sloc": sum(count_sloc(path) for path in production_files),
        "backend_src_sloc": sum(count_sloc(path) for path in backend_src_files),
        "service_sloc": sum(count_sloc(path) for path in service_files),
        "controller_sloc": sum(count_sloc(path) for path in controller_files),
        "route_sloc": sum(count_sloc(path) for path in route_files),
        "file_count": len(production_files),
    }


def parse_endpoints() -> list[Endpoint]:
    mount_map = {
        "auth.routes.js": [("router", "/api/v1/auth")],
        "patient.routes.js": [("router", "/api/v1/patients")],
        "visit.routes.js": [("router", "/api/v1/visits")],
        "doctor.routes.js": [("router", "/api/v1/doctors")],
        "prescription.routes.js": [
            ("visitPrescriptionRouter", "/api/v1/visits/:visitId/prescription"),
            ("prescriptionRouter", "/api/v1/prescriptions"),
        ],
        "lab.routes.js": [
            ("visitLabRouter", "/api/v1/visits/:visitId/lab-requests"),
            ("labRouter", "/api/v1/lab-requests"),
        ],
        "medicine.routes.js": [("router", "/api/v1/medicines")],
        "billing.routes.js": [
            ("visitBillingRouter", "/api/v1/visits/:visitId/bill"),
            ("billRouter", "/api/v1/bills"),
        ],
        "appointment.routes.js": [("router", "/api/v1/appointments")],
        "checkin.routes.js": [("router", "/api/v1/checkin")],
        "document.routes.js": [("router", "/api/v1/patients/:id/documents")],
        "admin.routes.js": [("router", "/api/v1/admin")],
        "event.routes.js": [("router", "/api/v1/events")],
        "notification.routes.js": [("router", "/api/v1/notifications")],
        "healthcheck.routes.js": [("router", "/api/v1/healthcheck")],
    }

    route_pattern = re.compile(r'(\w+)\.(get|post|put|delete|patch)\(\s*"([^"]*)"')
    endpoints: list[Endpoint] = []

    for route_file in sorted((ROOT / "backend" / "src" / "routes").glob("*.js")):
        text = route_file.read_text(encoding="utf-8")
        mounts = dict(mount_map.get(route_file.name, []))
        for router_name, method, suffix in route_pattern.findall(text):
            if router_name not in mounts:
                continue
            base = mounts[router_name]
            if suffix == "/":
                full_path = base
            else:
                full_path = f"{base}{suffix}"
            endpoints.append(
                Endpoint(
                    method=method.upper(),
                    path=full_path,
                    router_name=router_name,
                    route_file=route_file.name,
                )
            )

    unique = {}
    for endpoint in endpoints:
        unique[(endpoint.method, endpoint.path)] = endpoint
    return sorted(unique.values(), key=lambda item: (item.path, item.method))


def compute_function_points(endpoints: list[Endpoint], model_count: int) -> dict:
    inputs = [ep for ep in endpoints if ep.method in {"POST", "PUT", "PATCH", "DELETE"}]
    outputs = [
        ep
        for ep in endpoints
        if ep.method == "GET"
        and any(token in ep.path for token in ("/reports", "/attendance", "/events", "/healthcheck"))
    ]
    inquiries = [
        ep
        for ep in endpoints
        if ep.method == "GET" and ep not in outputs
    ]

    counts = {
        "EI": len(inputs),
        "EO": len(outputs),
        "EQ": len(inquiries),
        "ILF": model_count,
        "EIF": 1,
    }
    ufp = sum(counts[key] * FUNCTION_POINT_WEIGHTS[key] for key in counts)
    total_di = sum(FUNCTION_POINT_GSC.values())
    vaf = 0.65 + (0.01 * total_di)
    fp = round(ufp * vaf, 2)

    return {
        "counts": counts,
        "weights": FUNCTION_POINT_WEIGHTS,
        "ufp": ufp,
        "vaf": round(vaf, 2),
        "total_di": total_di,
        "fp": fp,
    }


def compute_halstead() -> dict:
    tokens = []
    token_pattern = re.compile(
        r"[A-Za-z_]\w*|\d+(?:\.\d+)?|=>|===|!==|==|!=|>=|<=|\+\+|--|\+=|-=|\*=|/=|%=|&&|\|\||\?\?|\?\.|\.{3}|[+\-*/%=<>!?:.,;()[\]{}]"
    )
    for path in sorted((ROOT / "backend" / "src").rglob("*.js")):
        text = strip_comments_and_strings(path.read_text(encoding="utf-8"))
        tokens.extend(token_pattern.findall(text))

    operators = []
    operands = []
    for token in tokens:
        if token in HALSTEAD_OPERATORS or token in HALSTEAD_KEYWORDS:
            operators.append(token)
        elif re.fullmatch(r"\d+(?:\.\d+)?", token):
            operands.append(token)
        else:
            operands.append(token)

    n1 = len(set(operators))
    n2 = len(set(operands))
    N1 = len(operators)
    N2 = len(operands)
    vocabulary = n1 + n2
    length = N1 + N2
    volume = length * math.log2(vocabulary) if vocabulary > 1 else 0.0
    difficulty = (n1 / 2) * (N2 / n2) if n2 else 0.0
    effort = difficulty * volume
    time_required_seconds = effort / 18 if effort else 0.0
    delivered_bugs = volume / 3000 if volume else 0.0

    return {
        "distinct_operators": n1,
        "distinct_operands": n2,
        "total_operators": N1,
        "total_operands": N2,
        "program_vocabulary": vocabulary,
        "program_length": length,
        "volume": round(volume, 2),
        "difficulty": round(difficulty, 2),
        "effort": round(effort, 2),
        "time_seconds": round(time_required_seconds, 2),
        "estimated_delivered_bugs": round(delivered_bugs, 2),
    }


def compute_cocomo(kloc: float) -> dict:
    eaf = 1.0
    for value in COCOMO_COST_DRIVERS.values():
        eaf *= value

    a = 3.2
    b = 1.05
    c = 2.5
    d = 0.38
    effort = a * (kloc**b) * eaf
    schedule = c * (effort**d)
    staffing = effort / schedule if schedule else 0.0
    productivity = kloc / effort if effort else 0.0

    return {
        "mode": "Organic",
        "kloc": round(kloc, 3),
        "eaf": round(eaf, 3),
        "effort_person_months": round(effort, 2),
        "development_time_months": round(schedule, 2),
        "average_staffing": round(staffing, 2),
        "productivity_kloc_per_pm": round(productivity, 3),
        "cost_drivers": COCOMO_COST_DRIVERS,
    }


def compute_schema_model_count() -> int:
    schema = (ROOT / "backend" / "prisma" / "schema.prisma").read_text(encoding="utf-8")
    return len(re.findall(r"^model\s+\w+", schema, flags=re.M))


def read_test_cases() -> list[dict]:
    path = ROOT / "test_cases.csv"
    with path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def parse_response_time(raw: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)", raw or "")
    return float(match.group(1)) if match else None


def compute_test_metrics(test_cases: list[dict]) -> dict:
    pass_count = sum(1 for row in test_cases if row["Status"] == "PASS")
    fail_count = sum(1 for row in test_cases if row["Status"] != "PASS")

    module_times: dict[str, list[float]] = defaultdict(list)
    type_times: dict[str, list[float]] = defaultdict(list)
    for row in test_cases:
        response_time = parse_response_time(row["Response Time (ms)"])
        if response_time is None:
            continue
        module_times[row["Module"]].append(response_time)
        type_times[row["Type"]].append(response_time)

    module_rows = []
    for module, values in sorted(module_times.items()):
        module_rows.append(
            {
                "module": module,
                "count": len(values),
                "avg_ms": round(sum(values) / len(values), 2),
                "min_ms": round(min(values), 2),
                "max_ms": round(max(values), 2),
            }
        )

    threshold_rows = []
    thresholds = {
        "Login": 3000,
        "Patient retrieval": 3000,
        "Prescription retrieval": 3000,
        "Bill generation": 5000,
        "QR check-in": 3000,
    }
    measured = {
        "Login": 77,
        "Patient retrieval": 233,
        "Prescription retrieval": 1215,
        "Bill generation": 1151,
        "QR check-in": 796,
    }
    for metric, threshold in thresholds.items():
        actual = measured[metric]
        threshold_rows.append(
            {
                "metric": metric,
                "threshold_ms": threshold,
                "actual_ms": actual,
                "headroom_ms": threshold - actual,
                "utilization_pct": round((actual / threshold) * 100, 2),
            }
        )

    return {
        "documented_test_cases": len(test_cases),
        "pass_count": pass_count,
        "fail_count": fail_count,
        "pass_rate_pct": round((pass_count / len(test_cases)) * 100, 2) if test_cases else 0.0,
        "module_rows": module_rows,
        "threshold_rows": threshold_rows,
        "type_rows": [
            {
                "type": key,
                "avg_ms": round(sum(values) / len(values), 2),
                "count": len(values),
            }
            for key, values in sorted(type_times.items())
        ],
    }


def parse_git_commits() -> list[dict]:
    raw = run_git(
        "log",
        "--since=2026-01-15",
        "--until=2026-04-03 23:59:59",
        "--date=short",
        "--pretty=format:%ad|%h|%s",
    )
    commits = []
    for line in raw.splitlines():
        commit_date, sha, subject = line.split("|", 2)
        commits.append({"date": commit_date, "sha": sha, "subject": subject})
    return commits


def compute_throughput(commits: list[dict]) -> dict:
    feat_commits = [commit for commit in commits if commit["subject"].startswith("feat:")]
    by_week = Counter()

    for commit in feat_commits:
        dt = datetime.strptime(commit["date"], "%Y-%m-%d").date()
        iso_year, iso_week, _ = dt.isocalendar()
        by_week[f"{iso_year}-W{iso_week:02d}"] += 1

    week_rows = [{"week": week, "completed_items": count} for week, count in sorted(by_week.items())]
    by_sprint = Counter(item["sprint"] for item in WORK_ITEMS)
    sprint_rows = [
        {"sprint": sprint_name, "completed_items": by_sprint.get(sprint_name, 0)}
        for sprint_name, _, _ in SPRINT_WINDOWS
    ]
    return {
        "feature_commit_count": len(feat_commits),
        "week_rows": week_rows,
        "sprint_rows": sprint_rows,
    }


def compute_code_churn() -> dict:
    raw = run_git(
        "log",
        "--since=2026-01-15",
        "--until=2026-04-03 23:59:59",
        "--numstat",
        "--date=short",
        "--pretty=format:commit|%ad|%h|%s",
    )
    week_totals: dict[str, dict[str, int]] = defaultdict(lambda: {"added": 0, "deleted": 0})
    current_date = None

    for line in raw.splitlines():
        if line.startswith("commit|"):
            _, current_date, _, _ = line.split("|", 3)
            continue
        if not line.strip() or current_date is None:
            continue
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        added, deleted, _ = parts
        if added == "-" or deleted == "-":
            continue
        dt = datetime.strptime(current_date, "%Y-%m-%d").date()
        iso_year, iso_week, _ = dt.isocalendar()
        key = f"{iso_year}-W{iso_week:02d}"
        week_totals[key]["added"] += int(added)
        week_totals[key]["deleted"] += int(deleted)

    rows = []
    for week, values in sorted(week_totals.items()):
        rows.append(
            {
                "week": week,
                "added": values["added"],
                "deleted": values["deleted"],
                "net": values["added"] - values["deleted"],
            }
        )
    return {"rows": rows}


def compute_cfd_rows() -> list[dict]:
    start = min(datetime.strptime(item["planned_start"], "%Y-%m-%d").date() for item in WORK_ITEMS)
    end = date(2026, 4, 3)
    rows = []
    for current in daterange(start, end):
        todo = 0
        in_progress = 0
        done = 0
        for item in WORK_ITEMS:
            planned_start = datetime.strptime(item["planned_start"], "%Y-%m-%d").date()
            done_date = datetime.strptime(item["done"], "%Y-%m-%d").date()
            if current < planned_start:
                todo += 1
            elif current < done_date:
                in_progress += 1
            else:
                done += 1
        rows.append(
            {
                "date": current.isoformat(),
                "todo": todo,
                "in_progress": in_progress,
                "done": done,
            }
        )
    return rows


def compute_cfd_by_sprint_rows() -> list[dict]:
    rows = []
    for sprint_name, _, end in SPRINT_WINDOWS:
        todo = 0
        in_progress = 0
        done = 0
        for item in WORK_ITEMS:
            planned_start = datetime.strptime(item["planned_start"], "%Y-%m-%d").date()
            done_date = datetime.strptime(item["done"], "%Y-%m-%d").date()
            if end < planned_start:
                todo += 1
            elif end < done_date:
                in_progress += 1
            else:
                done += 1
        rows.append(
            {
                "sprint": sprint_name,
                "todo": todo,
                "in_progress": in_progress,
                "done": done,
            }
        )
    return rows


def compute_sprint5_burn_rows() -> list[dict]:
    start = date(2026, 3, 19)
    end = date(2026, 4, 1)
    total_scope = len(SPRINT5_ITEMS)
    item_dates = [datetime.strptime(done, "%Y-%m-%d").date() for _, done in SPRINT5_ITEMS]
    rows = []
    for current in daterange(start, end):
        completed = sum(1 for done in item_dates if done <= current)
        rows.append(
            {
                "date": current.isoformat(),
                "total_scope": total_scope,
                "completed": completed,
                "remaining": total_scope - completed,
            }
        )
    return rows


def compute_project_burn_by_sprint_rows() -> list[dict]:
    rows = []
    for sprint_name, _, end in SPRINT_WINDOWS:
        total_scope = 0
        completed = 0
        for item in WORK_ITEMS:
            planned_start = datetime.strptime(item["planned_start"], "%Y-%m-%d").date()
            done_date = datetime.strptime(item["done"], "%Y-%m-%d").date()
            if planned_start <= end:
                total_scope += 1
            if done_date <= end:
                completed += 1
        rows.append(
            {
                "sprint": sprint_name,
                "total_scope": total_scope,
                "completed": completed,
                "remaining": total_scope - completed,
            }
        )
    return rows


def write_endpoint_inventory(endpoints: list[Endpoint]) -> None:
    rows = [
        {
            "method": endpoint.method,
            "path": endpoint.path,
            "router_name": endpoint.router_name,
            "route_file": endpoint.route_file,
        }
        for endpoint in endpoints
    ]
    write_csv(DATA_DIR / "endpoint_inventory.csv", ["method", "path", "router_name", "route_file"], rows)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    loc_metrics = compute_loc_metrics()
    model_count = compute_schema_model_count()
    endpoints = parse_endpoints()
    function_points = compute_function_points(endpoints, model_count)
    halstead = compute_halstead()
    cocomo = compute_cocomo(loc_metrics["production_sloc"] / 1000)
    test_metrics = compute_test_metrics(read_test_cases())
    commits = parse_git_commits()
    throughput = compute_throughput(commits)
    code_churn = compute_code_churn()
    cfd_rows = compute_cfd_rows()
    cfd_by_sprint_rows = compute_cfd_by_sprint_rows()
    burn_rows = compute_sprint5_burn_rows()
    project_burn_rows = compute_project_burn_by_sprint_rows()

    write_endpoint_inventory(endpoints)
    write_csv(
        DATA_DIR / "response_time_by_module.csv",
        ["module", "count", "avg_ms", "min_ms", "max_ms"],
        test_metrics["module_rows"],
    )
    write_csv(
        DATA_DIR / "response_threshold_comparison.csv",
        ["metric", "threshold_ms", "actual_ms", "headroom_ms", "utilization_pct"],
        test_metrics["threshold_rows"],
    )
    write_csv(DATA_DIR / "throughput_by_week.csv", ["week", "completed_items"], throughput["week_rows"])
    write_csv(DATA_DIR / "throughput_by_sprint.csv", ["sprint", "completed_items"], throughput["sprint_rows"])
    write_csv(DATA_DIR / "code_churn_by_week.csv", ["week", "added", "deleted", "net"], code_churn["rows"])
    write_csv(DATA_DIR / "cumulative_flow.csv", ["date", "todo", "in_progress", "done"], cfd_rows)
    write_csv(
        DATA_DIR / "cumulative_flow_by_sprint.csv",
        ["sprint", "todo", "in_progress", "done"],
        cfd_by_sprint_rows,
    )
    write_csv(DATA_DIR / "sprint5_burn.csv", ["date", "total_scope", "completed", "remaining"], burn_rows)
    write_csv(
        DATA_DIR / "project_burn_by_sprint.csv",
        ["sprint", "total_scope", "completed", "remaining"],
        project_burn_rows,
    )

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "loc_metrics": loc_metrics,
        "schema_model_count": model_count,
        "endpoint_count": len(endpoints),
        "function_points": function_points,
        "halstead": halstead,
        "cocomo": cocomo,
        "test_metrics": {
            "documented_test_cases": test_metrics["documented_test_cases"],
            "pass_count": test_metrics["pass_count"],
            "fail_count": test_metrics["fail_count"],
            "pass_rate_pct": test_metrics["pass_rate_pct"],
        },
        "throughput_summary": {
            "feature_commit_count": throughput["feature_commit_count"],
        },
    }
    (DATA_DIR / "metrics_summary.json").write_text(
        json.dumps(summary, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
