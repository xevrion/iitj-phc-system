# Lab 9 & 10 Deliverable

This folder contains the complete Lab 9 & 10 assignment package for the IITJ PHC System.

## Main files

- `Group1_Lab910.tex`: LaTeX source for the report
- `Group1_Lab910.pdf`: compiled submission PDF
- `IEEEtran.cls`: local IEEE conference class file used for compilation

## Supporting material

- `data/`: generated metric tables and summary JSON used by the report
- `figures/`: rendered charts used in the PDF
- `scripts/generate_metrics.py`: rebuilds repository-derived metrics
- `scripts/render_charts.py`: regenerates chart assets from the metric CSV files

## Regeneration flow

From the repo root:

```bash
python3 'docs/Lab 9 10/scripts/generate_metrics.py'
python3 'docs/Lab 9 10/scripts/render_charts.py'
cd 'docs/Lab 9 10'
pdflatex -interaction=nonstopmode 'Group1_Lab910.tex'
pdflatex -interaction=nonstopmode 'Group1_Lab910.tex'
```

## Notes

- The report is based on the current repository state and project timeline in `README.md` and `docs/SRS 2.0.pdf`.
- Local LaTeX intermediates such as `.aux`, `.log`, and `.out` are intentionally not tracked.
- `AGENTS.md` is not part of this deliverable and must not be committed.
