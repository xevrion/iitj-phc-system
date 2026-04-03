#!/usr/bin/env python3

from __future__ import annotations

import csv
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
LAB_ROOT = ROOT / "docs" / "Lab 9 10"
DATA_DIR = LAB_ROOT / "data"
FIG_DIR = LAB_ROOT / "figures"


PALETTE = ["#CFE8FF", "#2563EB", "#F59E0B", "#10B981"]


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

    cfd = read_csv(DATA_DIR / "cumulative_flow_by_sprint.csv")
    render_stacked_bar_chart(
        "Cumulative Flow by Sprint",
        [row["sprint"] for row in cfd],
        [
            ("To Do", [float(row["todo"]) for row in cfd], PALETTE[0]),
            ("In Progress", [float(row["in_progress"]) for row in cfd], PALETTE[1]),
            ("Done", [float(row["done"]) for row in cfd], PALETTE[2]),
        ],
        "cfd",
        "Work items",
    )

    burn = read_csv(DATA_DIR / "project_burn_by_sprint.csv")
    labels = [row["sprint"] for row in burn]
    render_line_chart(
        "Project Burndown by Sprint",
        labels,
        [("Remaining", [float(row["remaining"]) for row in burn], PALETTE[2])],
        "burndown",
        "Remaining items",
    )
    render_line_chart(
        "Project Burnup by Sprint",
        labels,
        [
            ("Completed", [float(row["completed"]) for row in burn], PALETTE[2]),
            ("Total scope", [float(row["total_scope"]) for row in burn], PALETTE[1]),
        ],
        "burnup",
        "Items",
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

    for name in ("throughput", "cfd", "burndown", "burnup", "code_churn", "nfr"):
        convert_svg_to_png(name)


if __name__ == "__main__":
    main()
