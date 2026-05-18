#!/usr/bin/env python3
"""
Consolidated Bug Report Generator — Flux Gantt Plugin
Generates a professional PDF from all bug markdown files and screenshots.
"""

import os
import re
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem
)
from reportlab.platypus import BalancedColumns
from reportlab.graphics.shapes import Drawing, Line
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# ─── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
BUGS_DIR     = SCRIPT_DIR / "bugs"
SCREENSHOTS_DIR = SCRIPT_DIR / "screenshots"
OUTPUT_FILE  = SCRIPT_DIR / "CONSOLIDATED_BUG_REPORT_REDMINEFLUX_GANTT_2026-05-17.pdf"

# ─── Severity / Priority maps ─────────────────────────────────────────────────
SEVERITY_ORDER  = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
PRIORITY_MAP    = {"Critical": "P0", "High": "P1", "Medium": "P1", "Low": "P2"}
SEVERITY_COLORS = {
    "Critical": colors.HexColor("#C0392B"),
    "High":     colors.HexColor("#E67E22"),
    "Medium":   colors.HexColor("#F39C12"),
    "Low":      colors.HexColor("#27AE60"),
}

LANG_FULL = {
    "es": "Spanish",     "fr": "French",       "pt": "Portuguese",
    "pt-BR": "Pt. Brazil","pl": "Polish",      "ru": "Russian",
    "nl": "Dutch",        "ja": "Japanese",    "zh": "Chinese (Simplified)",
    "de": "German",
}

MODULE_MAP = {
    "BUG-001": "Project Gantt / Empty State",
    "BUG-002": "Modal UI / Accessibility",
    "BUG-003": "Global Gantt / Date Display",
    "BUG-004": "Full Plugin UI",
    "BUG-005": "Date Range / Calendar",
    "BUG-006": "Baseline Management",
    "BUG-007": "Unversioned Panel",
    "BUG-008": "Row Actions / Accessibility",
    "BUG-009": "Baseline Management",
    "BUG-010": "Admin Plugin Settings",
    "BUG-011": "Gantt Bar Tooltips",
    "BUG-012": "Release / Version Terminology",
    "BUG-013": "Project Gantt / Empty State",
    "BUG-014": "Export Menu",
}

# ─── Parse Markdown Bug Files ─────────────────────────────────────────────────

def parse_bug_file(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")

    # --- YAML frontmatter ---
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not fm_match:
        return None
    fm_text = fm_match.group(1)
    body    = text[fm_match.end():]

    def fm(key):
        m = re.search(rf"^{key}:\s*(.+)$", fm_text, re.MULTILINE)
        return m.group(1).strip() if m else ""

    # Derive language code from filename (e.g. BUG-001-de-...)
    stem = path.stem  # e.g. BUG-001-de-empty-state...
    parts = stem.split("-")
    lang_code = ""
    if len(parts) >= 3:
        candidate = parts[2]
        # handle pt-BR
        if candidate == "pt" and len(parts) > 3 and parts[3].upper() == "BR":
            lang_code = "pt-BR"
        else:
            lang_code = candidate

    # Extract title from first H1
    title_m = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
    title = title_m.group(1).strip() if title_m else stem

    # Extract sections
    def section(name):
        pat = rf"##\s+{re.escape(name)}\s*\n(.*?)(?=\n##\s|\Z)"
        m = re.search(pat, body, re.DOTALL)
        return m.group(1).strip() if m else ""

    untranslated  = section("Untranslated Text")
    expected      = section("Expected Translation") or section(r"Expected Translation \(.+?\)")
    steps         = section("Steps to Reproduce")
    evidence      = section("Evidence")
    bug_type      = section("Type")
    notes         = section("Notes") or section("Root Cause") or section("Additional Notes")

    # Also try translated expected with language in parentheses
    if not expected:
        m2 = re.search(r"## Expected Translation.*?\n(.*?)(?=\n## |\Z)", body, re.DOTALL)
        if m2:
            expected = m2.group(1).strip()

    bug_id_raw = fm("bug_id") or parts[0] + "-" + parts[1]
    severity   = fm("severity").split()[0] if fm("severity") else "Medium"

    base_bug_id = re.match(r"BUG-\d+", bug_id_raw)
    base_id = base_bug_id.group(0) if base_bug_id else bug_id_raw

    return {
        "id":          f"{bug_id_raw}-{lang_code}",
        "base_id":     base_id,
        "lang_code":   lang_code,
        "lang_full":   LANG_FULL.get(lang_code, lang_code),
        "severity":    severity,
        "priority":    PRIORITY_MAP.get(severity, "P2"),
        "module":      MODULE_MAP.get(base_id, fm("phase") or "General"),
        "title":       title,
        "untranslated": untranslated,
        "expected":    expected,
        "steps":       steps,
        "evidence":    evidence,
        "type":        bug_type,
        "notes":       notes,
        "phase":       fm("phase"),
        "status":      "Open",
        "file":        path,
    }


def load_all_bugs() -> list[dict]:
    bugs = []
    for md_file in sorted(BUGS_DIR.glob("BUG-*.md")):
        bug = parse_bug_file(md_file)
        if bug:
            bugs.append(bug)
    # Sort: severity first, then base_id, then language
    bugs.sort(key=lambda b: (
        SEVERITY_ORDER.get(b["severity"], 9),
        b["base_id"],
        b["lang_code"]
    ))
    return bugs


def find_screenshots(bug: dict) -> list[Path]:
    """Find screenshots that match this bug's base_id and language."""
    base = bug["base_id"].replace("BUG-", "").zfill(3)  # e.g. "001"
    lang = bug["lang_code"]
    matches = []
    for png in sorted(SCREENSHOTS_DIR.glob("*.png")):
        name = png.name.lower()
        # Must contain the language code and the bug number
        if f"-{lang}-" in name or f"-{lang.replace('-', '-').lower()}-" in name:
            # Check if bug number appears in the filename
            if f"bug-{base.lstrip('0') or '0'}-" in name or f"bug-0{base.lstrip('0') or '0'}-" in name or \
               re.search(rf"bug-0*{int(base)}-", name):
                matches.append(png)
    return matches[:2]  # max 2 screenshots per bug


# ─── PDF Styles ───────────────────────────────────────────────────────────────

def make_styles():
    base = getSampleStyleSheet()

    styles = {
        "cover_title": ParagraphStyle("CoverTitle",
            fontName="Helvetica-Bold", fontSize=28, textColor=colors.HexColor("#1A1A2E"),
            spaceAfter=8, alignment=TA_CENTER, leading=34),
        "cover_sub": ParagraphStyle("CoverSub",
            fontName="Helvetica", fontSize=14, textColor=colors.HexColor("#4A4A6A"),
            spaceAfter=6, alignment=TA_CENTER),
        "cover_meta": ParagraphStyle("CoverMeta",
            fontName="Helvetica", fontSize=11, textColor=colors.HexColor("#666688"),
            spaceAfter=4, alignment=TA_CENTER),
        "section_header": ParagraphStyle("SectionHeader",
            fontName="Helvetica-Bold", fontSize=16, textColor=colors.HexColor("#1A1A2E"),
            spaceBefore=14, spaceAfter=8, leading=20),
        "bug_title": ParagraphStyle("BugTitle",
            fontName="Helvetica-Bold", fontSize=13, textColor=colors.HexColor("#1A1A2E"),
            spaceBefore=4, spaceAfter=4, leading=16),
        "field_label": ParagraphStyle("FieldLabel",
            fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#444466"),
            spaceBefore=6, spaceAfter=2),
        "field_value": ParagraphStyle("FieldValue",
            fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#222244"),
            spaceAfter=2, leading=13),
        "code": ParagraphStyle("Code",
            fontName="Courier", fontSize=8, textColor=colors.HexColor("#1A1A2E"),
            backColor=colors.HexColor("#F5F5FA"), spaceAfter=2, leading=12,
            leftIndent=6, rightIndent=6, borderPadding=4),
        "caption": ParagraphStyle("Caption",
            fontName="Helvetica-Oblique", fontSize=8, textColor=colors.HexColor("#888899"),
            alignment=TA_CENTER, spaceAfter=4),
        "toc_header": ParagraphStyle("TocHeader",
            fontName="Helvetica-Bold", fontSize=14, textColor=colors.HexColor("#1A1A2E"),
            spaceAfter=8),
        "toc_entry": ParagraphStyle("TocEntry",
            fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#333355"),
            spaceAfter=3, leftIndent=8),
        "small": ParagraphStyle("Small",
            fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#555577"),
            spaceAfter=2),
        "body": ParagraphStyle("Body",
            fontName="Helvetica", fontSize=9.5, textColor=colors.HexColor("#222244"),
            spaceAfter=4, leading=14),
        "normal": base["Normal"],
    }
    return styles


# ─── Page Template (header/footer) ───────────────────────────────────────────

class PageTemplate:
    def __init__(self, title="Consolidated Bug Report"):
        self.title = title

    def __call__(self, canvas_obj, doc):
        canvas_obj.saveState()
        W, H = A4

        # Header bar
        canvas_obj.setFillColor(colors.HexColor("#1A1A2E"))
        canvas_obj.rect(0, H - 28*mm, W, 28*mm, fill=1, stroke=0)

        canvas_obj.setFont("Helvetica-Bold", 10)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.drawString(15*mm, H - 18*mm, "Flux Gantt Plugin — Bug Report")

        canvas_obj.setFont("Helvetica", 9)
        canvas_obj.setFillColor(colors.HexColor("#AAAACC"))
        canvas_obj.drawRightString(W - 15*mm, H - 18*mm, "2026-05-17 | Confidential")

        # Footer bar
        canvas_obj.setFillColor(colors.HexColor("#F0F0F7"))
        canvas_obj.rect(0, 0, W, 14*mm, fill=1, stroke=0)

        canvas_obj.setFillColor(colors.HexColor("#1A1A2E"))
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawString(15*mm, 5*mm, "RedmineFlux Gantt Plugin — Language Compatibility QA")
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawRightString(W - 15*mm, 5*mm, f"Page {doc.page}")

        canvas_obj.restoreState()


# ─── Build content blocks ─────────────────────────────────────────────────────

def cover_page(styles, bugs):
    story = []
    story.append(Spacer(1, 40*mm))

    story.append(Paragraph("CONSOLIDATED BUG REPORT", styles["cover_title"]))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        "RedmineFlux Gantt Plugin — Language Compatibility Testing",
        styles["cover_sub"]
    ))
    story.append(Spacer(1, 12*mm))

    # Decorative line
    story.append(HRFlowable(width="60%", thickness=2,
                             color=colors.HexColor("#4A4ACA"), hAlign="CENTER"))
    story.append(Spacer(1, 12*mm))

    meta = [
        ("Date", "2026-05-17"),
        ("Plugin", "redmineflux_gantt_plugin"),
        ("Environment", "http://localhost:3006 (Redmine 5.x)"),
        ("Tester", "Automated QA (Playwright MCP)"),
        ("Languages Tested", "10 (es, fr, pt, pt-BR, pl, ru, nl, ja, zh, de)"),
        ("Total Bugs Reported", str(len(bugs))),
        ("Critical Bugs", str(sum(1 for b in bugs if b["severity"] == "Critical"))),
        ("Report Status", "Open — Pending Developer Review"),
    ]

    table_data = [[Paragraph(f"<b>{k}</b>", styles["field_value"]),
                   Paragraph(v, styles["field_value"])] for k, v in meta]
    t = Table(table_data, colWidths=[55*mm, 100*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8F8FC")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1),
         [colors.HexColor("#F8F8FC"), colors.HexColor("#EEEEF8")]),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#4A4ACA")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    story.append(t)
    story.append(Spacer(1, 20*mm))

    # Severity summary badges
    sev_counts = defaultdict(int)
    for b in bugs:
        sev_counts[b["severity"]] += 1

    badge_data = [[
        Paragraph(f"<b>{sev_counts.get('Critical', 0)}</b>", ParagraphStyle("bc",
            fontName="Helvetica-Bold", fontSize=22, textColor=colors.white,
            alignment=TA_CENTER)),
        Paragraph(f"<b>{sev_counts.get('Medium', 0)}</b>", ParagraphStyle("bm",
            fontName="Helvetica-Bold", fontSize=22, textColor=colors.white,
            alignment=TA_CENTER)),
        Paragraph(f"<b>{sev_counts.get('Low', 0)}</b>", ParagraphStyle("bl",
            fontName="Helvetica-Bold", fontSize=22, textColor=colors.white,
            alignment=TA_CENTER)),
    ], [
        Paragraph("CRITICAL", ParagraphStyle("lc", fontName="Helvetica-Bold",
            fontSize=9, textColor=colors.white, alignment=TA_CENTER)),
        Paragraph("MEDIUM", ParagraphStyle("lm", fontName="Helvetica-Bold",
            fontSize=9, textColor=colors.white, alignment=TA_CENTER)),
        Paragraph("LOW", ParagraphStyle("ll", fontName="Helvetica-Bold",
            fontSize=9, textColor=colors.white, alignment=TA_CENTER)),
    ]]

    badge_table = Table(badge_data, colWidths=[45*mm, 45*mm, 45*mm],
                        rowHeights=[18*mm, 8*mm])
    badge_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#C0392B")),
        ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#F39C12")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#27AE60")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))

    badge_wrapper = Table([[badge_table]], colWidths=[A4[0] - 40*mm])
    badge_wrapper.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(badge_wrapper)

    story.append(PageBreak())
    return story


def toc_page(styles, bugs):
    story = []
    story.append(Paragraph("Table of Contents", styles["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1,
                             color=colors.HexColor("#CCCCDD")))
    story.append(Spacer(1, 4*mm))

    sections = [
        ("1. Executive Summary", ""),
        ("2. Bug Summary Table", ""),
        ("3. Critical Bugs", ""),
        ("4. Medium Severity Bugs", ""),
        ("5. Low Severity Bugs", ""),
        ("6. Appendix — Language Coverage Matrix", ""),
    ]

    for label, _ in sections:
        story.append(Paragraph(label, styles["toc_entry"]))

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph("<b>Bug Index by Language:</b>", styles["field_label"]))

    lang_groups = defaultdict(list)
    for b in bugs:
        lang_groups[b["lang_full"]].append(b["base_id"])

    for lang_full in sorted(lang_groups.keys()):
        bug_ids = sorted(set(lang_groups[lang_full]))
        story.append(Paragraph(
            f"• <b>{lang_full}</b>: {', '.join(bug_ids)}",
            styles["toc_entry"]
        ))

    story.append(PageBreak())
    return story


def executive_summary(styles, bugs):
    story = []
    story.append(Paragraph("1. Executive Summary", styles["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CCCCDD")))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        "This report consolidates all bugs identified during language compatibility testing of the "
        "<b>RedmineFlux Gantt Plugin</b> across 10 locales. Testing was performed using automated "
        "Playwright browser automation (Playwright MCP) against a live Redmine 5.x instance "
        "at http://localhost:3006. Each language went through a full test workflow covering: "
        "Admin Settings, Global Gantt, Project Gantt, Release management, Issue management, "
        "Baseline management, and Unversioned panel.",
        styles["body"]
    ))
    story.append(Spacer(1, 3*mm))

    sev_counts = defaultdict(int)
    lang_counts = defaultdict(int)
    for b in bugs:
        sev_counts[b["severity"]] += 1
        lang_counts[b["lang_code"]] += 1

    # Stats table
    stats = [
        ["Metric", "Value"],
        ["Total Bug Instances Reported", str(len(bugs))],
        ["Critical", str(sev_counts.get("Critical", 0))],
        ["Medium", str(sev_counts.get("Medium", 0))],
        ["Low", str(sev_counts.get("Low", 0))],
        ["Languages Tested", "10"],
        ["Language with Most Bugs", max(lang_counts, key=lang_counts.get) + f" ({max(lang_counts.values())} bugs)"],
        ["Language with Fewest Bugs (excl. zh)", "French fr (8 bugs)"],
    ]

    st = Table(stats, colWidths=[80*mm, 70*mm])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A2E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.HexColor("#F8F8FC"), colors.HexColor("#EEEEF8")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCDD")),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 1), (1, -1), "CENTER"),
    ]))
    story.append(st)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        "<b>Key Finding:</b> All 10 languages share a common set of 10 untranslated string categories "
        "(BUG-001, 002, 005–011, 013). These represent hardcoded English strings in the plugin codebase "
        "not covered by any locale file. Chinese Simplified (zh) additionally has 2 Critical-severity bugs "
        "— a broken date interpolation and an almost entirely untranslated UI — making the plugin "
        "non-functional for that locale.",
        styles["body"]
    ))
    story.append(PageBreak())
    return story


def bug_summary_table(styles, bugs):
    story = []
    story.append(Paragraph("2. Bug Summary Table", styles["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CCCCDD")))
    story.append(Spacer(1, 3*mm))

    header = ["Bug ID", "Title (Short)", "Severity", "Priority", "Module", "Language", "Status"]
    rows   = [header]

    for b in bugs:
        short_title = b["base_id"] + " — " + b["title"].split("—")[-1].strip()
        if len(short_title) > 55:
            short_title = short_title[:52] + "..."
        rows.append([
            b["base_id"],
            Paragraph(short_title, ParagraphStyle("ts", fontName="Helvetica",
                      fontSize=7.5, leading=10)),
            b["severity"],
            b["priority"],
            Paragraph(b["module"], ParagraphStyle("ms", fontName="Helvetica",
                      fontSize=7.5, leading=10)),
            b["lang_full"],
            b["status"],
        ])

    col_w = [18*mm, 60*mm, 18*mm, 14*mm, 38*mm, 24*mm, 14*mm]
    t = Table(rows, colWidths=col_w, repeatRows=1)

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A2E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CCCCDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ALIGN", (2, 1), (3, -1), "CENTER"),
        ("ALIGN", (6, 1), (6, -1), "CENTER"),
    ]
    # Row-based severity coloring
    for i, b in enumerate(bugs, start=1):
        row_bg = colors.HexColor("#FFF5F5") if b["severity"] == "Critical" else \
                 colors.HexColor("#FFFBF0") if b["severity"] == "Medium"   else \
                 colors.HexColor("#F5FFF8")
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), row_bg))
        sev_col = SEVERITY_COLORS.get(b["severity"], colors.grey)
        style_cmds.append(("TEXTCOLOR", (2, i), (2, i), sev_col))
        style_cmds.append(("FONTNAME", (2, i), (2, i), "Helvetica-Bold"))

    t.setStyle(TableStyle(style_cmds))
    story.append(t)
    story.append(PageBreak())
    return story


def severity_badge(severity: str) -> str:
    colors_map = {
        "Critical": "#C0392B", "High": "#E67E22",
        "Medium": "#F39C12",   "Low": "#27AE60",
    }
    c = colors_map.get(severity, "#888888")
    return f'<font color="{c}"><b>[{severity.upper()}]</b></font>'


def render_bug_section(bug: dict, styles, idx: int) -> list:
    """Render a single bug's detail block."""
    items = []

    # Bug header bar
    sev_color = SEVERITY_COLORS.get(bug["severity"], colors.grey)

    header_data = [[
        Paragraph(f'<b>{bug["base_id"]}</b>',
                  ParagraphStyle("bh", fontName="Helvetica-Bold", fontSize=11,
                                 textColor=colors.white)),
        Paragraph(bug["title"].replace("—", "–"),
                  ParagraphStyle("bt", fontName="Helvetica-Bold", fontSize=10,
                                 textColor=colors.white, leading=13)),
        Paragraph(f'<b>{bug["severity"]}</b>',
                  ParagraphStyle("bs", fontName="Helvetica-Bold", fontSize=9,
                                 textColor=colors.white, alignment=TA_RIGHT)),
    ]]
    header_t = Table(header_data, colWidths=[22*mm, 120*mm, 22*mm])
    header_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), sev_color if bug["severity"] == "Critical"
         else colors.HexColor("#2C3E6E")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    items.append(header_t)

    # Meta row
    meta_data = [[
        Paragraph(f"<b>Language:</b> {bug['lang_full']} ({bug['lang_code']})",
                  styles["field_value"]),
        Paragraph(f"<b>Priority:</b> {bug['priority']}",
                  styles["field_value"]),
        Paragraph(f"<b>Module:</b> {bug['module']}",
                  styles["field_value"]),
        Paragraph(f"<b>Status:</b> {bug['status']}",
                  styles["field_value"]),
    ]]
    meta_t = Table(meta_data, colWidths=[42*mm, 28*mm, 60*mm, 24*mm])
    meta_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0F0F8")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCDD")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    items.append(meta_t)

    # Environment / Preconditions
    env_pre_data = [[
        Paragraph("<b>Environment</b>", styles["field_label"]),
        Paragraph("<b>Preconditions</b>", styles["field_label"]),
    ],[
        Paragraph(
            "Redmine 5.x — http://localhost:3006<br/>"
            "RedmineFlux Gantt Plugin (current dev build)<br/>"
            "Browser: Chromium via Playwright MCP<br/>"
            "OS: Windows 11",
            styles["field_value"]
        ),
        Paragraph(
            "• Admin user logged in<br/>"
            f"• Language set to: <b>{bug['lang_full']}</b> ({bug['lang_code']})<br/>"
            "• Test project: ai-automation-portal<br/>"
            "• Plugin enabled on the project",
            styles["field_value"]
        ),
    ]]
    env_pre_t = Table(env_pre_data, colWidths=[82*mm, 82*mm])
    env_pre_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8E8F4")),
        ("BACKGROUND", (0, 1), (-1, 1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
    ]))
    items.append(env_pre_t)

    # Actual / Expected result side-by-side
    actual_text   = bug.get("untranslated") or "(See steps to reproduce)"
    expected_text = bug.get("expected") or "(See description)"

    act_exp_data = [[
        Paragraph("<b>Actual Result (Untranslated Text)</b>", styles["field_label"]),
        Paragraph("<b>Expected Result (Translated)</b>", styles["field_label"]),
    ],[
        Paragraph(actual_text.replace("`", "").replace("\n", "<br/>"),
                  styles["code"]),
        Paragraph(expected_text.replace("`", "").replace("\n", "<br/>"),
                  styles["code"]),
    ]]
    act_exp_t = Table(act_exp_data, colWidths=[82*mm, 82*mm])
    act_exp_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8E8F4")),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    items.append(act_exp_t)

    # Steps to Reproduce
    steps_text = bug.get("steps", "").strip()
    if steps_text:
        items.append(Paragraph("<b>Steps to Reproduce</b>", styles["field_label"]))
        step_lines = [l.strip() for l in steps_text.splitlines() if l.strip()]
        for line in step_lines:
            line = re.sub(r"^\d+\.\s*", "", line)
            line = line.replace("`", "'")
            items.append(Paragraph(f"• {line}", styles["field_value"]))

    # Notes
    notes_text = (bug.get("notes") or bug.get("type") or "").strip()
    if notes_text:
        items.append(Paragraph("<b>Notes / Additional Observations</b>", styles["field_label"]))
        items.append(Paragraph(
            notes_text.replace("`", "'").replace("\n", " "),
            styles["field_value"]
        ))

    # Screenshots
    screenshots = find_screenshots(bug)
    if screenshots:
        items.append(Paragraph("<b>Screenshot(s)</b>", styles["field_label"]))
        for ss_path in screenshots:
            try:
                img = Image(str(ss_path))
                # Scale to fit within page width while maintaining aspect ratio
                max_w = 164*mm
                max_h = 80*mm
                iw, ih = img.imageWidth, img.imageHeight
                if iw and ih:
                    ratio = min(max_w / iw, max_h / ih)
                    img.drawWidth  = iw * ratio
                    img.drawHeight = ih * ratio
                img.hAlign = "CENTER"
                items.append(img)
                items.append(Paragraph(
                    f"<i>Figure: {ss_path.name}</i>",
                    styles["caption"]
                ))
            except Exception as e:
                items.append(Paragraph(f"[Screenshot: {ss_path.name}]", styles["small"]))
    else:
        items.append(Paragraph(
            "<i>No screenshot captured for this specific bug instance. "
            "See related language screenshots for visual reference.</i>",
            styles["small"]
        ))

    items.append(Spacer(1, 5*mm))
    items.append(HRFlowable(width="100%", thickness=0.5,
                             color=colors.HexColor("#DDDDEE")))
    items.append(Spacer(1, 3*mm))

    return items


def detailed_bugs(styles, bugs):
    story = []

    severity_groups = defaultdict(list)
    for b in bugs:
        severity_groups[b["severity"]].append(b)

    section_num = 3
    for sev in ["Critical", "High", "Medium", "Low"]:
        group = severity_groups.get(sev, [])
        if not group:
            continue

        story.append(Paragraph(
            f"{section_num}. {sev} Severity Bugs ({len(group)} instances)",
            styles["section_header"]
        ))
        story.append(HRFlowable(width="100%", thickness=2,
                                 color=SEVERITY_COLORS.get(sev, colors.grey)))
        story.append(Spacer(1, 3*mm))

        for idx, bug in enumerate(group):
            block = render_bug_section(bug, styles, idx)
            story.extend(block)

        story.append(PageBreak())
        section_num += 1

    return story


def appendix(styles, bugs):
    story = []
    story.append(Paragraph("6. Appendix — Language Coverage Matrix", styles["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CCCCDD")))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        "The table below shows which bugs affect each language. "
        "❌ = Bug present, ✅ = Not affected, — = Not applicable for this language.",
        styles["body"]
    ))
    story.append(Spacer(1, 3*mm))

    bug_types = ["BUG-001","BUG-002","BUG-003","BUG-004","BUG-005","BUG-006",
                 "BUG-007","BUG-008","BUG-009","BUG-010","BUG-011","BUG-013","BUG-014"]
    langs     = ["es","fr","pt","pt-BR","pl","ru","nl","ja","zh","de"]

    # Build presence set
    presence = defaultdict(set)
    for b in bugs:
        presence[b["lang_code"]].add(b["base_id"])

    zh_only = {"BUG-003", "BUG-004"}

    header = ["Bug ID"] + [LANG_FULL.get(l, l)[:6] for l in langs]
    matrix = [header]
    for bt in bug_types:
        row = [bt]
        for l in langs:
            if bt in zh_only and l != "zh":
                row.append("—")
            elif bt in presence[l]:
                row.append("❌")
            else:
                row.append("✅")
        matrix.append(row)

    col_w = [20*mm] + [16.2*mm] * 10
    mt = Table(matrix, colWidths=col_w, repeatRows=1)
    mt_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A2E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.HexColor("#F8F8FC"), colors.HexColor("#EEEEF8")]),
    ]
    # Highlight critical rows
    for i, bt in enumerate(bug_types, start=1):
        if bt in zh_only:
            mt_style.append(("BACKGROUND", (0, i), (0, i), colors.HexColor("#FFF0F0")))
            mt_style.append(("TEXTCOLOR", (0, i), (0, i), colors.HexColor("#C0392B")))
    mt.setStyle(TableStyle(mt_style))
    story.append(mt)

    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(
        "<b>Priority Fix Recommendations:</b>",
        styles["field_label"]
    ))
    recs = [
        "P0 — Fix BUG-004-zh and BUG-003-zh immediately (zh plugin non-functional)",
        "P1 — Fix BUG-005 (month names), BUG-009 (baseline validation), BUG-007 (START/DUE labels)",
        "P1 — Fix BUG-001 + BUG-013 (empty state text) across all locales",
        "P2 — Fix BUG-011 (tooltip labels), BUG-014 (export menu), BUG-010 (settings description)",
        "P3 — Fix BUG-002, BUG-006, BUG-008 (accessibility attributes and placeholders)",
    ]
    for r in recs:
        story.append(Paragraph(f"• {r}", styles["field_value"]))

    return story


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Loading bug files...")
    bugs = load_all_bugs()
    print(f"  Loaded {len(bugs)} bug instances.")

    styles = make_styles()

    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        topMargin=35*mm,
        bottomMargin=20*mm,
        leftMargin=15*mm,
        rightMargin=15*mm,
        title="Consolidated Bug Report — Flux Gantt Plugin",
        author="QA Automation — Playwright MCP",
        subject="Language Compatibility Testing",
    )

    page_tmpl = PageTemplate()

    story = []
    story += cover_page(styles, bugs)
    story += toc_page(styles, bugs)
    story += executive_summary(styles, bugs)
    story += bug_summary_table(styles, bugs)
    story += detailed_bugs(styles, bugs)
    story += appendix(styles, bugs)

    print(f"Building PDF: {OUTPUT_FILE}")
    doc.build(story, onFirstPage=page_tmpl, onLaterPages=page_tmpl)
    print(f"Done! PDF saved to: {OUTPUT_FILE}")
    size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
    print(f"File size: {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
