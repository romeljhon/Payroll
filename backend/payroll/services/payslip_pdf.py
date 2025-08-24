# payroll/services/payslip_pdf.py
from __future__ import annotations

from io import BytesIO
from datetime import date
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def _peso(amount: Decimal) -> str:
    return f"₱{amount:,.2f}"


def generate_payslip_pdf(snapshot: dict, business_name: str | None = None) -> bytes:
    """
    Build a simple payslip PDF from the snapshot dict returned by
    get_employee_payslip_snapshot().

    Expected snapshot keys:
      - employee_id, employee_name
      - month (date)
      - cycle_type (str) and/or run_id (int)
      - rows: [{component, type, amount}]
      - totals: {earnings, deductions, net_pay}
    """
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Payslip",
        author=business_name or "Payroll System",
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Small", fontSize=9, leading=12))
    styles.add(ParagraphStyle(name="Header", fontSize=14, leading=18, spaceAfter=6, spaceBefore=6))

    story = []

    # Header
    title = business_name or "Payslip"
    period = snapshot.get("month")
    cycle_type = snapshot.get("cycle_type") or snapshot.get("payroll_cycle")  # ✅ MODIFIED: tolerate old key
    run_id = snapshot.get("run_id")  # ✅ MODIFIED

    safe_period = period.strftime("%B %Y") if isinstance(period, date) else str(period)

    # Build a friendly cycle/run label
    cycle_label = cycle_type or ""
    if run_id:
        cycle_label = f"{cycle_label} • Run #{run_id}" if cycle_label else f"Run #{run_id}"

    story.append(Paragraph(title, styles["Title"]))
    story.append(Paragraph(f"Payroll Period: {safe_period}" + (f" ({cycle_label})" if cycle_label else ""), styles["Normal"]))
    story.append(Spacer(1, 6))

    # Employee section
    emp_name = snapshot.get("employee_name") or "Employee"
    emp_id = snapshot.get("employee_id")
    story.append(Paragraph("<b>Employee Information</b>", styles["Header"]))
    story.append(Paragraph(f"Name: {emp_name}", styles["Normal"]))
    story.append(Paragraph(f"Employee ID: {emp_id}", styles["Normal"]))
    story.append(Spacer(1, 8))

    # Line items table
    rows = snapshot.get("rows", [])
    table_data = [["Component", "Type", "Amount"]]
    for r in rows:
        # amounts may be Decimal or str; normalize to Decimal for formatting
        amt = r["amount"]
        amt_dec = amt if isinstance(amt, Decimal) else Decimal(str(amt))
        table_data.append([r["component"], r["type"], _peso(amt_dec)])

    tbl = Table(table_data, colWidths=[90 * mm, 30 * mm, 40 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (1, 1), (1, -1), "CENTER"),
        ("ALIGN", (2, 1), (2, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
    ]))
    story.append(Paragraph("<b>Details</b>", styles["Header"]))
    story.append(tbl)
    story.append(Spacer(1, 10))

    # Totals
    totals = snapshot.get("totals", {})
    earn = totals.get("earnings", 0)
    ded = totals.get("deductions", 0)
    net = totals.get("net_pay", 0)

    # Normalize to Decimal for formatting
    earn_dec = earn if isinstance(earn, Decimal) else Decimal(str(earn))
    ded_dec = ded if isinstance(ded, Decimal) else Decimal(str(ded))
    net_dec = net if isinstance(net, Decimal) else Decimal(str(net))

    totals_tbl = Table(
        [
            ["Earnings", _peso(earn_dec)],
            ["Deductions", _peso(ded_dec)],
            ["Net Pay", _peso(net_dec)],
        ],
        colWidths=[90 * mm, 70 * mm]
    )
    totals_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 0.5, colors.black),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(Paragraph("<b>Totals</b>", styles["Header"]))
    story.append(totals_tbl)
    story.append(Spacer(1, 12))

    story.append(Paragraph("This is a system-generated payslip.", styles["Small"]))

    doc.build(story)
    return buffer.getvalue()
