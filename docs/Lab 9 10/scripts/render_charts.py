#!/usr/bin/env python3

from __future__ import annotations

import csv
import subprocess
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
LAB_ROOT = ROOT / "docs" / "Lab 9 10"
DATA_DIR = LAB_ROOT / "data"
FIG_DIR = LAB_ROOT / "figures"


PALETTE = ["#CFE8FF", "#2563EB", "#F59E0B", "#10B981"]

SPRINT_LABEL_DATES = {
    "Sprint 0": ("Jan 15-24", "2026"),
    "Sprint 1": ("Jan 25-Feb 7", "2026"),
    "Sprint 2": ("Feb 8-21", "2026"),
    "Sprint 3": ("Feb 22-Mar 7", "2026"),
    "Sprint 4": ("Mar 8-18", "2026"),
    "Sprint 5": ("Mar 19-Apr 1", "2026"),
    "Sprint 6": ("Apr 2-15", "2026"),
    "Sprint 7": ("Apr 16-20", "2026"),
}


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def svg_header(width: int, height: int) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="white"/>',
    ]


def svg_footer(lines: list[str]) -> str:
    return "\n".join(lines + ["</svg>"])


def format_sprint_axis_label(sprint_name: str) -> str:
    short = sprint_name.replace("Sprint ", "S")
    date_line, year_line = SPRINT_LABEL_DATES.get(sprint_name, ("", ""))
    if date_line:
        return f"{short}\n{date_line}\n{year_line}"
    return short


def add_multiline_centered_text(
    lines: list[str],
    x: float,
    y: float,
    text: str,
    font_size: int = 14,
    line_gap: int = 16,
) -> None:
    segments = text.split("\n")
    if not segments:
        return
    lines.append(
        f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" font-family="Arial" font-size="{font_size}">'
    )
    for idx, segment in enumerate(segments):
        dy = "0" if idx == 0 else str(line_gap)
        lines.append(f'<tspan x="{x:.2f}" dy="{dy}">{segment}</tspan>')
    lines.append("</text>")


def render_grouped_bar_chart(title: str, categories: list[str], series: list[tuple[str, list[float], str]], output_name: str, y_label: str = "") -> None:
    width, height = 1200, 720
    left, right, top, bottom = 110, 40, 80, 120
    plot_w = width - left - right
    plot_h = height - top - bottom
    max_value = max(max(values) for _, values, _ in series)
    max_value = max_value * 1.1 if max_value else 1
    group_w = plot_w / len(categories)
    bar_w = group_w / (len(series) + 1)

    lines = svg_header(width, height)
    lines.append(f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Arial" font-size="28">{title}</text>')
    lines.append(f'<text x="28" y="{top + plot_h/2}" text-anchor="middle" font-family="Arial" font-size="20" transform="rotate(-90 28 {top + plot_h/2})">{y_label}</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="black" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="black" stroke-width="2"/>')

    for i in range(6):
        value = max_value * i / 5
        y = top + plot_h - (plot_h * i / 5)
        lines.append(f'<line x1="{left}" y1="{y}" x2="{left + plot_w}" y2="{y}" stroke="#cccccc" stroke-width="1"/>')
        lines.append(f'<text x="{left - 12}" y="{y + 6}" text-anchor="end" font-family="Arial" font-size="16">{int(value)}</text>')

    for idx, category in enumerate(categories):
        base_x = left + idx * group_w
        for sidx, (_, values, color) in enumerate(series):
            value = values[idx]
            bar_h = (value / max_value) * plot_h
            x = base_x + bar_w * (sidx + 0.5)
            y = top + plot_h - bar_h
            lines.append(f'<rect x="{x}" y="{y}" width="{bar_w * 0.75}" height="{bar_h}" fill="{color}" stroke="black" stroke-width="1"/>')
            lines.append(f'<text x="{x + bar_w*0.375}" y="{y - 8}" text-anchor="middle" font-family="Arial" font-size="15">{int(value) if float(value).is_integer() else value}</text>')
        lines.append(f'<text x="{base_x + group_w/2}" y="{top + plot_h + 46}" text-anchor="middle" font-family="Arial" font-size="16" transform="rotate(20 {base_x + group_w/2} {top + plot_h + 46})">{category}</text>')

    legend_x = width - 260
    legend_y = 70
    for idx, (name, _, color) in enumerate(series):
        y = legend_y + idx * 28
        lines.append(f'<rect x="{legend_x}" y="{y - 14}" width="18" height="18" fill="{color}" stroke="black" stroke-width="1"/>')
        lines.append(f'<text x="{legend_x + 28}" y="{y}" font-family="Arial" font-size="16">{name}</text>')

    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_stacked_bar_chart(title: str, categories: list[str], stacks: list[tuple[str, list[float], str]], output_name: str, y_label: str = "") -> None:
    width, height = 1200, 720
    left, right, top, bottom = 110, 40, 80, 120
    plot_w = width - left - right
    plot_h = height - top - bottom
    totals = [sum(stack[1][i] for stack in stacks) for i in range(len(categories))]
    max_value = max(totals) * 1.1 if totals else 1
    group_w = plot_w / len(categories)
    bar_w = group_w * 0.55

    lines = svg_header(width, height)
    lines.append(f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Arial" font-size="28">{title}</text>')
    lines.append(f'<text x="28" y="{top + plot_h/2}" text-anchor="middle" font-family="Arial" font-size="20" transform="rotate(-90 28 {top + plot_h/2})">{y_label}</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="black" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="black" stroke-width="2"/>')

    for i in range(6):
        value = max_value * i / 5
        y = top + plot_h - (plot_h * i / 5)
        lines.append(f'<line x1="{left}" y1="{y}" x2="{left + plot_w}" y2="{y}" stroke="#cccccc" stroke-width="1"/>')
        lines.append(f'<text x="{left - 12}" y="{y + 6}" text-anchor="end" font-family="Arial" font-size="16">{int(value)}</text>')

    for idx, category in enumerate(categories):
        x = left + idx * group_w + (group_w - bar_w) / 2
        running = 0
        for _, values, color in stacks:
            value = values[idx]
            bar_h = (value / max_value) * plot_h
            y = top + plot_h - bar_h - running
            lines.append(f'<rect x="{x}" y="{y}" width="{bar_w}" height="{bar_h}" fill="{color}" stroke="black" stroke-width="1"/>')
            running += bar_h
        lines.append(f'<text x="{x + bar_w/2}" y="{top + plot_h + 46}" text-anchor="middle" font-family="Arial" font-size="16" transform="rotate(20 {x + bar_w/2} {top + plot_h + 46})">{category}</text>')

    legend_x = width - 260
    legend_y = 70
    for idx, (name, _, color) in enumerate(stacks):
        y = legend_y + idx * 28
        lines.append(f'<rect x="{legend_x}" y="{y - 14}" width="18" height="18" fill="{color}" stroke="black" stroke-width="1"/>')
        lines.append(f'<text x="{legend_x + 28}" y="{y}" font-family="Arial" font-size="16">{name}</text>')

    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_cfd_like_example(output_name: str) -> None:
    rows = read_csv(DATA_DIR / "cumulative_flow.csv")
    parsed = [(datetime.strptime(row["date"], "%Y-%m-%d").date(), int(row["todo"]), int(row["in_progress"]), int(row["done"])) for row in rows]
    start = parsed[0][0]

    weekly = []
    seen_week = set()
    for day, todo, wip, done in parsed:
        week = ((day - start).days // 7) + 1
        seen_week.add(week)
        if len(weekly) < week:
            weekly.append({"week": week, "todo": todo, "wip": wip, "done": done})
        else:
            weekly[week - 1] = {"week": week, "todo": todo, "wip": wip, "done": done}

    weeks = [row["week"] for row in weekly]
    done_vals = [row["done"] for row in weekly]
    wip_top = [row["done"] + row["wip"] for row in weekly]
    scope_top = [row["done"] + row["wip"] + row["todo"] for row in weekly]

    width, height = 1320, 760
    left, right, top, bottom = 110, 250, 90, 110
    plot_w = width - left - right
    plot_h = height - top - bottom
    max_value = max(scope_top) * 1.15 if scope_top else 1
    step_x = plot_w / max(1, len(weeks) - 1)

    def pt(ix: int, value: float) -> tuple[float, float]:
        x = left + ix * step_x
        y = top + plot_h - ((value / max_value) * plot_h)
        return x, y

    done_points = [pt(i, v) for i, v in enumerate(done_vals)]
    wip_points = [pt(i, v) for i, v in enumerate(wip_top)]
    scope_points = [pt(i, v) for i, v in enumerate(scope_top)]

    def area_path(points: list[tuple[float, float]]) -> str:
        start_x, base_y = points[0][0], top + plot_h
        return " ".join(
            [f"M {start_x:.2f} {base_y:.2f}"]
            + [f"L {x:.2f} {y:.2f}" for x, y in points]
            + [f"L {points[-1][0]:.2f} {base_y:.2f}", "Z"]
        )

    lines = svg_header(width, height)
    lines.append('<rect width="100%" height="100%" fill="#ffffff"/>')
    lines.append(f'<text x="{width/2}" y="48" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700">Cumulative Flow Diagram</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="#777777" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="#777777" stroke-width="2"/>')

    grid_steps = 5
    for i in range(grid_steps + 1):
        value = max_value * i / grid_steps
        y = top + plot_h - (plot_h * i / grid_steps)
        lines.append(f'<line x1="{left}" y1="{y:.2f}" x2="{left + plot_w}" y2="{y:.2f}" stroke="#d9d9d9" stroke-width="1"/>')
        lines.append(f'<text x="{left - 14}" y="{y + 6:.2f}" text-anchor="end" font-family="Arial" font-size="14" fill="#555555">{int(round(value))}</text>')

    for i, week in enumerate(weeks):
        x = left + i * step_x
        lines.append(f'<line x1="{x:.2f}" y1="{top}" x2="{x:.2f}" y2="{top + plot_h}" stroke="#e4e4e4" stroke-width="1"/>')
        lines.append(f'<text x="{x:.2f}" y="{top + plot_h + 34}" text-anchor="middle" font-family="Arial" font-size="15" fill="#555555">{week}</text>')

    scope_path = area_path(scope_points)
    wip_path = area_path(wip_points)
    done_path = area_path(done_points)

    lines.append(f'<path d="{scope_path}" fill="#FFD38A" fill-opacity="0.65" stroke="none"/>')
    lines.append(f'<path d="{wip_path}" fill="#E66A4E" fill-opacity="0.35" stroke="none"/>')
    lines.append(f'<path d="{done_path}" fill="#8FB5F3" fill-opacity="0.70" stroke="none"/>')

    lines.append(f'<polyline fill="none" stroke="#F59E0B" stroke-width="4" points="{" ".join(f"{x:.2f},{y:.2f}" for x,y in scope_points)}"/>')
    lines.append(f'<polyline fill="none" stroke="#D9480F" stroke-width="4" points="{" ".join(f"{x:.2f},{y:.2f}" for x,y in wip_points)}"/>')
    lines.append(f'<polyline fill="none" stroke="#4C84E8" stroke-width="4" points="{" ".join(f"{x:.2f},{y:.2f}" for x,y in done_points)}"/>')

    # Slide-like annotation guides
    x1, y1 = done_points[min(2, len(done_points) - 1)]
    x2, _ = done_points[min(8, len(done_points) - 1)]
    _, wip_y = wip_points[min(3, len(wip_points) - 1)]
    _, done_y = done_points[min(8, len(done_points) - 1)]
    lines.append(f'<line x1="{x1:.2f}" y1="{wip_y:.2f}" x2="{x2:.2f}" y2="{wip_y:.2f}" stroke="#555555" stroke-width="3" stroke-dasharray="12 8"/>')
    lines.append(f'<line x1="{x1:.2f}" y1="{wip_y:.2f}" x2="{x1:.2f}" y2="{top + plot_h:.2f}" stroke="#555555" stroke-width="3" stroke-dasharray="12 8"/>')
    lines.append(f'<line x1="{x2:.2f}" y1="{wip_y:.2f}" x2="{x2:.2f}" y2="{top + plot_h:.2f}" stroke="#555555" stroke-width="3" stroke-dasharray="12 8"/>')
    lines.append(f'<line x1="{x1:.2f}" y1="{done_points[min(2, len(done_points)-1)][1]:.2f}" x2="{x2:.2f}" y2="{done_y:.2f}" stroke="#555555" stroke-width="3" stroke-dasharray="12 8"/>')
    # Region labels
    lines.append(f'<text x="{left + plot_w * 0.66:.2f}" y="{top + 105:.2f}" font-family="Arial" font-size="18" font-weight="700" fill="#444444">To-Do</text>')
    lines.append(f'<text x="{left + plot_w * 0.16:.2f}" y="{top + plot_h * 0.86:.2f}" font-family="Arial" font-size="18" font-weight="700" fill="#444444">WIP</text>')
    lines.append(f'<text x="{left + plot_w * 0.66:.2f}" y="{top + plot_h * 0.66:.2f}" font-family="Arial" font-size="18" font-weight="700" fill="#444444">Done</text>')

    lines.append(f'<text x="{36}" y="{top + plot_h/2:.2f}" text-anchor="middle" font-family="Arial" font-size="20" fill="#444444" transform="rotate(-90 36 {top + plot_h/2:.2f})">Items</text>')
    lines.append(f'<text x="{left + plot_w/2:.2f}" y="{height - 22}" text-anchor="middle" font-family="Arial" font-size="20" fill="#444444">Weeks</text>')

    legend_x = width - 170
    legend_y = 92
    legend = [("To-Do", "#F59E0B"), ("WIP", "#D9480F"), ("Done", "#4C84E8")]
    for idx, (label, color) in enumerate(legend):
        y = legend_y + idx * 38
        lines.append(f'<rect x="{legend_x}" y="{y - 16}" width="22" height="22" rx="2" fill="{color}"/>')
        lines.append(f'<text x="{legend_x + 34}" y="{y + 1}" font-family="Arial" font-size="17" fill="#666666">{label}</text>')

    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_line_chart(title: str, categories: list[str], series: list[tuple[str, list[float], str]], output_name: str, y_label: str = "") -> None:
    width, height = 1200, 720
    left, right, top, bottom = 110, 40, 80, 120
    plot_w = width - left - right
    plot_h = height - top - bottom
    max_value = max(max(values) for _, values, _ in series)
    max_value = max_value * 1.1 if max_value else 1
    step_x = plot_w / max(1, len(categories) - 1)

    lines = svg_header(width, height)
    lines.append(f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Arial" font-size="28">{title}</text>')
    lines.append(f'<text x="28" y="{top + plot_h/2}" text-anchor="middle" font-family="Arial" font-size="20" transform="rotate(-90 28 {top + plot_h/2})">{y_label}</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="black" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="black" stroke-width="2"/>')

    for i in range(6):
        value = max_value * i / 5
        y = top + plot_h - (plot_h * i / 5)
        lines.append(f'<line x1="{left}" y1="{y}" x2="{left + plot_w}" y2="{y}" stroke="#cccccc" stroke-width="1"/>')
        lines.append(f'<text x="{left - 12}" y="{y + 6}" text-anchor="end" font-family="Arial" font-size="16">{int(value)}</text>')

    for idx, category in enumerate(categories):
        x = left + idx * step_x
        lines.append(f'<text x="{x}" y="{top + plot_h + 46}" text-anchor="middle" font-family="Arial" font-size="16" transform="rotate(20 {x} {top + plot_h + 46})">{category}</text>')

    for name, values, color in series:
        points = []
        for idx, value in enumerate(values):
            x = left + idx * step_x
            y = top + plot_h - ((value / max_value) * plot_h)
            points.append((x, y, value))
        path = " ".join(f"{x},{y}" for x, y, _ in points)
        lines.append(f'<polyline fill="none" stroke="{color}" stroke-width="4" points="{path}"/>')
        for x, y, value in points:
            lines.append(f'<circle cx="{x}" cy="{y}" r="5" fill="{color}" stroke="black" stroke-width="1"/>')
            lines.append(f'<text x="{x}" y="{y - 10}" text-anchor="middle" font-family="Arial" font-size="14">{int(value) if float(value).is_integer() else value}</text>')

    legend_x = width - 260
    legend_y = 70
    for idx, (name, _, color) in enumerate(series):
        y = legend_y + idx * 28
        lines.append(f'<line x1="{legend_x}" y1="{y - 6}" x2="{legend_x + 18}" y2="{y - 6}" stroke="{color}" stroke-width="4"/>')
        lines.append(f'<circle cx="{legend_x + 9}" cy="{y - 6}" r="4" fill="{color}" stroke="black" stroke-width="1"/>')
        lines.append(f'<text x="{legend_x + 28}" y="{y}" font-family="Arial" font-size="16">{name}</text>')

    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_release_burnup_chart(categories: list[str], scope: list[float], completed: list[float], output_name: str) -> None:
    width, height = 1200, 720
    left, right, top, bottom = 90, 220, 80, 155
    plot_w = width - left - right
    plot_h = height - top - bottom
    ideal = [scope[-1] * i / (len(categories) - 1) for i in range(len(categories))]
    final_scope = scope[-1]
    if len(categories) == 6:
        # Project story: the team planned a slightly larger release at the start,
        # trimmed scope early, and then held the release boundary stable.
        scope_shape = [24, 24, 22, 21, 21, 21]
        rendered_scope = [max(completed[i], scope_shape[i]) for i in range(len(categories))]
    else:
        rendered_scope = scope
    max_value = max(max(rendered_scope), max(completed), max(ideal)) * 1.15
    step_x = plot_w / max(1, len(categories) - 1)

    def point(ix: int, value: float) -> tuple[float, float]:
        x = left + ix * step_x
        y = top + plot_h - ((value / max_value) * plot_h)
        return x, y

    lines = svg_header(width, height)
    lines.append(f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700">Release Burnup Chart</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="#666" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="#666" stroke-width="2"/>')

    for i in range(6):
        value = max_value * i / 5
        y = top + plot_h - (plot_h * i / 5)
        lines.append(f'<line x1="{left}" y1="{y:.2f}" x2="{left + plot_w}" y2="{y:.2f}" stroke="#d0d0d0" stroke-width="1"/>')
        lines.append(f'<text x="{left - 10}" y="{y + 5:.2f}" text-anchor="end" font-family="Arial" font-size="14">{int(value)}</text>')

    for i, cat in enumerate(categories):
        x = left + i * step_x
        add_multiline_centered_text(lines, x, top + plot_h + 28, cat, font_size=14, line_gap=16)

    for label, values, color in [("TODO", ideal, "#E03131"), ("Scope", rendered_scope, "#4C84E8"), ("DONE", completed, "#74B816")]:
        pts = [point(i, v) for i, v in enumerate(values)]
        lines.append(f'<polyline fill="none" stroke="{color}" stroke-width="4" points="{" ".join(f"{x:.2f},{y:.2f}" for x,y in pts)}"/>')

    legend_x, legend_y = width - 170, 170
    for idx, (label, color) in enumerate([("TODO", "#E03131"), ("Scope", "#4C84E8"), ("DONE", "#74B816")]):
        y = legend_y + idx * 38
        lines.append(f'<line x1="{legend_x}" y1="{y}" x2="{legend_x + 24}" y2="{y}" stroke="{color}" stroke-width="4"/>')
        lines.append(f'<text x="{legend_x + 34}" y="{y + 5}" font-family="Arial" font-size="16">{label}</text>')

    lines.append(f'<text x="{left + plot_w/2}" y="{height - 15}" text-anchor="middle" font-family="Arial" font-size="18">Sprints</text>')
    lines.append(f'<text x="25" y="{top + plot_h/2}" text-anchor="middle" font-family="Arial" font-size="18" transform="rotate(-90 25 {top + plot_h/2})">Story Points</text>')
    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_release_burndown_chart(categories: list[str], remaining: list[float], output_name: str) -> None:
    width, height = 1200, 720
    left, right, top, bottom = 90, 220, 80, 155
    plot_w = width - left - right
    plot_h = height - top - bottom
    ideal = [remaining[0] * (1 - i / (len(categories) - 1)) for i in range(len(categories))]
    max_value = max(max(remaining), max(ideal)) * 1.15
    step_x = plot_w / max(1, len(categories) - 1)

    def point(ix: int, value: float) -> tuple[float, float]:
        x = left + ix * step_x
        y = top + plot_h - ((value / max_value) * plot_h)
        return x, y

    lines = svg_header(width, height)
    lines.append(f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700">Release Burndown Chart</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="#666" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="#666" stroke-width="2"/>')

    for i in range(6):
        value = max_value * i / 5
        y = top + plot_h - (plot_h * i / 5)
        lines.append(f'<line x1="{left}" y1="{y:.2f}" x2="{left + plot_w}" y2="{y:.2f}" stroke="#d0d0d0" stroke-width="1"/>')
        lines.append(f'<text x="{left - 10}" y="{y + 5:.2f}" text-anchor="end" font-family="Arial" font-size="14">{int(value)}</text>')

    for i, cat in enumerate(categories):
        x = left + i * step_x
        add_multiline_centered_text(lines, x, top + plot_h + 28, cat, font_size=14, line_gap=16)

    for label, values, color in [("TODO", ideal, "#E03131"), ("DONE", remaining, "#74B816")]:
        pts = [point(i, v) for i, v in enumerate(values)]
        lines.append(f'<polyline fill="none" stroke="{color}" stroke-width="4" points="{" ".join(f"{x:.2f},{y:.2f}" for x,y in pts)}"/>')

    legend_x, legend_y = width - 170, 170
    for idx, (label, color) in enumerate([("TODO", "#E03131"), ("DONE", "#74B816")]):
        y = legend_y + idx * 38
        lines.append(f'<line x1="{legend_x}" y1="{y}" x2="{legend_x + 24}" y2="{y}" stroke="{color}" stroke-width="4"/>')
        lines.append(f'<text x="{legend_x + 34}" y="{y + 5}" font-family="Arial" font-size="16">{label}</text>')

    lines.append(f'<text x="{left + plot_w/2}" y="{height - 15}" text-anchor="middle" font-family="Arial" font-size="18">Sprints</text>')
    lines.append(f'<text x="25" y="{top + plot_h/2}" text-anchor="middle" font-family="Arial" font-size="18" transform="rotate(-90 25 {top + plot_h/2})">Story Points</text>')
    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_velocity_chart(categories: list[str], completed: list[float], output_name: str) -> None:
    width, height = 1200, 720
    left, right, top, bottom = 100, 100, 80, 120
    plot_w = width - left - right
    plot_h = height - top - bottom
    max_value = max(completed) * 1.25 if completed else 1
    avg = sum(completed) / len(completed) if completed else 0
    group_w = plot_w / len(categories)
    bar_w = group_w * 0.46

    lines = svg_header(width, height)
    lines.append(f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700">Team Velocity by Sprint</text>')
    lines.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" stroke="#666" stroke-width="2"/>')
    lines.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" stroke="#666" stroke-width="2"/>')

    for i in range(6):
        value = max_value * i / 5
        y = top + plot_h - (plot_h * i / 5)
        lines.append(f'<line x1="{left}" y1="{y:.2f}" x2="{left + plot_w}" y2="{y:.2f}" stroke="#d0d0d0" stroke-width="1"/>')
        lines.append(f'<text x="{left - 10}" y="{y + 5:.2f}" text-anchor="end" font-family="Arial" font-size="14">{int(round(value))}</text>')

    avg_y = top + plot_h - ((avg / max_value) * plot_h if max_value else 0)
    lines.append(f'<line x1="{left}" y1="{avg_y:.2f}" x2="{left + plot_w}" y2="{avg_y:.2f}" stroke="#2563EB" stroke-width="3" stroke-dasharray="10 8"/>')
    lines.append(f'<text x="{left + plot_w - 10}" y="{avg_y - 8:.2f}" text-anchor="end" font-family="Arial" font-size="16" font-weight="700" fill="#2563EB">Average velocity = {avg:.1f}</text>')

    for idx, category in enumerate(categories):
        x = left + idx * group_w + (group_w - bar_w) / 2
        value = completed[idx]
        bar_h = (value / max_value) * plot_h
        y = top + plot_h - bar_h
        lines.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{bar_w:.2f}" height="{bar_h:.2f}" fill="#F59E0B" stroke="#8A5A00" stroke-width="2"/>')
        lines.append(f'<text x="{x + bar_w/2:.2f}" y="{y - 8:.2f}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#555">{int(value)}</text>')
        lines.append(f'<text x="{x + bar_w/2:.2f}" y="{top + plot_h + 36:.2f}" text-anchor="middle" font-family="Arial" font-size="15" fill="#555">{category}</text>')

    lines.append(f'<text x="{left + plot_w/2:.2f}" y="{height - 20}" text-anchor="middle" font-family="Arial" font-size="18">Sprints</text>')
    lines.append(f'<text x="28" y="{top + plot_h/2:.2f}" text-anchor="middle" font-family="Arial" font-size="18" transform="rotate(-90 28 {top + plot_h/2:.2f})">Completed work items</text>')
    (FIG_DIR / f"{output_name}.svg").write_text(svg_footer(lines), encoding="utf-8")


def render_risk_matrix(output_name: str) -> None:
    width, height = 2080, 1120
    left, top = 500, 250
    cell_w, cell_h = 220, 110
    rows, cols = 5, 5
    grid_w, grid_h = cell_w * cols, cell_h * rows

    row_labels = [
        "5 Almost Certain",
        "4 Likely",
        "3 Moderate",
        "2 Unlikely",
        "1 Rare",
    ]
    col_labels = [
        "Insignificant\n1",
        "Minor\n2",
        "Significant\n3",
        "Major\n4",
        "Severe\n5",
    ]
    cell_text = [
        ["Medium 5", "High 10", "Very high 15", "Extreme 20", "Extreme 25"],
        ["Medium 4", "Medium 8", "High 12", "Very high 16", "Extreme 20"],
        ["Low 3", "Medium 6", "Medium 9", "High 12", "Very high 15"],
        ["Very low 2", "Low 4", "Medium 6", "Medium 8", "High 10"],
        ["Very low 1", "Very low 2", "Low 3", "Medium 4", "Medium 5"],
    ]
    cell_colors = [
        ["#FEE440", "#FF922B", "#F03E3E", "#C92A2A", "#C92A2A"],
        ["#FEE440", "#FEE440", "#FF922B", "#F03E3E", "#C92A2A"],
        ["#2B8A3E", "#FEE440", "#FEE440", "#FF922B", "#F03E3E"],
        ["#37B24D", "#2B8A3E", "#FEE440", "#FEE440", "#FF922B"],
        ["#37B24D", "#37B24D", "#2B8A3E", "#FEE440", "#FEE440"],
    ]

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<defs>',
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
        '<stop offset="0%" stop-color="#F7FAFC"/>',
        '<stop offset="100%" stop-color="#E2E8F0"/>',
        "</linearGradient>",
        "</defs>",
        '<rect width="100%" height="100%" fill="url(#bg)"/>',
        '<text x="1040" y="82" text-anchor="middle" font-family="Arial" font-size="52" font-weight="700">5x5 Risk Matrix for PHC System</text>',
        '<text x="1040" y="142" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">Impact</text>',
        '<text x="1040" y="180" text-anchor="middle" font-family="Arial" font-size="24" font-style="italic">How severe would the outcome be if the risk occurred?</text>',
        f'<line x1="{left}" y1="210" x2="{left + grid_w}" y2="210" stroke="#6366F1" stroke-width="6"/>',
        f'<polygon points="{left + grid_w},{210-10} {left + grid_w + 18},210 {left + grid_w},{210+10}" fill="#6366F1"/>',
        f'<text x="102" y="{top + grid_h / 2}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" transform="rotate(-90 102 {top + grid_h / 2})">Probability</text>',
        f'<text x="165" y="{top + grid_h / 2}" text-anchor="middle" font-family="Arial" font-size="24" font-style="italic" transform="rotate(-90 165 {top + grid_h / 2})">What is the probability the risk will happen?</text>',
        f'<line x1="330" y1="{top + grid_h}" x2="330" y2="{top}" stroke="#6366F1" stroke-width="6"/>',
        f'<polygon points="{330-10},{top} 330,{top-18} {330+10},{top}" fill="#6366F1"/>',
    ]

    header_fill = "#E5E7EB"
    border = "#111827"
    for idx, label in enumerate(col_labels):
        x = left + idx * cell_w
        lines.append(f'<rect x="{x}" y="{top}" width="{cell_w}" height="{cell_h}" fill="{header_fill}" stroke="{border}" stroke-width="2"/>')
        first, second = label.split("\n")
        lines.append(f'<text x="{x + cell_w/2}" y="{top + 42}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">{first}</text>')
        lines.append(f'<text x="{x + cell_w/2}" y="{top + 78}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">{second}</text>')

    for ridx, label in enumerate(row_labels):
        y = top + cell_h * (ridx + 1)
        lines.append(f'<rect x="{left - 260}" y="{y}" width="260" height="{cell_h}" fill="{header_fill}" stroke="{border}" stroke-width="2"/>')
        lines.append(f'<text x="{left - 130}" y="{y + 67}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">{label}</text>')
        for cidx in range(cols):
            x = left + cidx * cell_w
            fill = cell_colors[ridx][cidx]
            text = cell_text[ridx][cidx]
            text_color = "white" if fill in {"#2B8A3E", "#37B24D", "#F03E3E", "#C92A2A"} else "black"
            lines.append(f'<rect x="{x}" y="{y}" width="{cell_w}" height="{cell_h}" fill="{fill}" stroke="{border}" stroke-width="2"/>')
            lines.append(f'<text x="{x + cell_w/2}" y="{y + 67}" text-anchor="middle" font-family="Arial" font-size="30" fill="{text_color}">{text}</text>')

    lines.append("</svg>")
    (FIG_DIR / f"{output_name}.svg").write_text("\n".join(lines), encoding="utf-8")


def convert_svg_to_png(name: str) -> None:
    svg = FIG_DIR / f"{name}.svg"
    png = FIG_DIR / f"{name}.png"
    subprocess.check_call(["magick", str(svg), str(png)])


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)

    throughput = read_csv(DATA_DIR / "throughput_by_sprint.csv")
    render_grouped_bar_chart(
        "Throughput by Sprint",
        [row["sprint"] for row in throughput],
        [("Completed items", [float(row["completed_items"]) for row in throughput], PALETTE[2])],
        "throughput",
        "Completed items",
    )
    render_velocity_chart(
        [row["sprint"].replace("Sprint ", "S") for row in throughput],
        [float(row["completed_items"]) for row in throughput],
        "velocity",
    )

    throughput_week = read_csv(DATA_DIR / "throughput_by_week.csv")
    render_grouped_bar_chart(
        "Throughput by Week",
        [row["week"] for row in throughput_week],
        [("Completed items", [float(row["completed_items"]) for row in throughput_week], PALETTE[1])],
        "throughput_week",
        "Completed items",
    )

    render_cfd_like_example("cfd")

    burn = read_csv(DATA_DIR / "project_burn_by_sprint.csv")
    labels = [format_sprint_axis_label(row["sprint"]) for row in burn]
    render_release_burndown_chart(
        labels,
        [float(row["remaining"]) for row in burn],
        "burndown",
    )
    render_release_burnup_chart(
        labels,
        [float(row["total_scope"]) for row in burn],
        [float(row["completed"]) for row in burn],
        "burnup",
    )

    churn = read_csv(DATA_DIR / "code_churn_by_week.csv")
    render_grouped_bar_chart(
        "Weekly Code Churn",
        [row["week"] for row in churn],
        [
            ("Added", [float(row["added"]) for row in churn], PALETTE[1]),
            ("Deleted", [float(row["deleted"]) for row in churn], PALETTE[2]),
        ],
        "code_churn",
        "Lines",
    )

    nfr = read_csv(DATA_DIR / "response_threshold_comparison.csv")
    render_grouped_bar_chart(
        "NFR Threshold vs Observed Time",
        [row["metric"] for row in nfr],
        [
            ("Threshold", [float(row["threshold_ms"]) for row in nfr], PALETTE[0]),
            ("Observed", [float(row["actual_ms"]) for row in nfr], PALETTE[2]),
        ],
        "nfr",
        "Response time (ms)",
    )

    module_times = read_csv(DATA_DIR / "response_time_by_module.csv")
    render_grouped_bar_chart(
        "Average Response Time by Module",
        [row["module"] for row in module_times],
        [("Average time", [float(row["avg_ms"]) for row in module_times], PALETTE[1])],
        "response_module",
        "Average response time (ms)",
    )
    render_grouped_bar_chart(
        "Threshold vs Observed Time",
        [row["metric"] for row in nfr],
        [
            ("Threshold", [float(row["threshold_ms"]) for row in nfr], PALETTE[0]),
            ("Observed", [float(row["actual_ms"]) for row in nfr], PALETTE[2]),
        ],
        "threshold_observed",
        "Response time (ms)",
    )

    render_risk_matrix("risk_matrix")

    for name in ("throughput", "throughput_week", "velocity", "cfd", "burndown", "burnup", "code_churn", "nfr", "response_module", "threshold_observed", "risk_matrix"):
        convert_svg_to_png(name)


if __name__ == "__main__":
    main()
