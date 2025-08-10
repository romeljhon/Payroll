# payroll/services/mandatories.py
from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Literal, Tuple

from payroll.models import PayrollPolicy

Q2 = Decimal("0.01")
def q2(x: Decimal) -> Decimal:
    return x.quantize(Q2, rounding=ROUND_HALF_UP)

# --- Core PH math (can be swapped with DB-driven values later) ---
@dataclass(frozen=True)
class PHRates:
    # SSS
    sss_min_sc: Decimal = Decimal("4000")
    sss_max_sc: Decimal = Decimal("30000")
    sss_ee_share: Decimal = Decimal("0.045")  # employee share (approx)
    # PhilHealth
    ph_min_base: Decimal = Decimal("10000")
    ph_max_base: Decimal = Decimal("80000")
    ph_rate: Decimal    = Decimal("0.05")
    ph_ee_split: Decimal = Decimal("0.50")
    # Pag-IBIG
    hdmf_min_base: Decimal = Decimal("1000")
    hdmf_max_base: Decimal = Decimal("5000")
    hdmf_rate_low: Decimal = Decimal("0.01")
    hdmf_rate_high: Decimal = Decimal("0.02")
    hdmf_high_threshold: Decimal = Decimal("1500")
    # TRAIN (monthly)
    tax_brackets: Tuple[Tuple[Decimal, Decimal, Decimal, str], ...] = (
        (Decimal("0.00"),     Decimal("0.00"),     Decimal("0.00"),  "EXEMPT up to ~20,833"),
        (Decimal("20833.00"), Decimal("0.00"),     Decimal("0.20"),  "Over 20,833 up to 33,333"),
        (Decimal("33333.00"), Decimal("2500.00"),  Decimal("0.25"),  "Over 33,333 up to 66,667"),
        (Decimal("66667.00"), Decimal("10833.33"), Decimal("0.30"),  "Over 66,667 up to 166,667"),
        (Decimal("166667.00"),Decimal("40833.33"), Decimal("0.32"),  "Over 166,667 up to 666,667"),
        (Decimal("666667.00"),Decimal("200833.33"),Decimal("0.35"),  "Over 666,667"),
    )

def _sss_ee(base_monthly: Decimal, r: PHRates) -> Decimal:
    msc = max(r.sss_min_sc, min(base_monthly, r.sss_max_sc))
    return q2(msc * r.sss_ee_share)

def _phic_ee(base_monthly: Decimal, r: PHRates) -> Decimal:
    b = max(r.ph_min_base, min(base_monthly, r.ph_max_base))
    return q2(b * r.ph_rate * r.ph_ee_split)

def _hdmf_ee(base_monthly: Decimal, r: PHRates) -> Decimal:
    b = max(r.hdmf_min_base, min(base_monthly, r.hdmf_max_base))
    rate = r.hdmf_rate_low if base_monthly <= r.hdmf_high_threshold else r.hdmf_rate_high
    return q2(b * rate)

def _withholding_tax_monthly(taxable_monthly: Decimal, r: PHRates) -> Decimal:
    x = taxable_monthly
    if x <= r.tax_brackets[0][0]:
        return Decimal("0.00")
    tax = Decimal("0.00")
    for lb, base_tax, pct, _ in r.tax_brackets:
        if x > lb:
            tax = base_tax + (x - lb) * pct
        else:
            break
    return q2(max(tax, Decimal("0.00")))

def load_rates_from_policy(policy: PayrollPolicy | None) -> PHRates:
    """
    Hook to load from DB later. For now we just return defaults.
    You can extend PayrollPolicy to store caps/rates and map them here.
    """
    return PHRates()

def compute_mandatories_monthly(
    gross_monthly: Decimal,
    policy: PayrollPolicy | None = None,
) -> Dict[str, Decimal]:
    """
    Compute employee-side mandatories on a MONTHLY basis.
    Returns dict { 'SSS_EE': Decimal, 'PHIC_EE': Decimal, 'HDMF_EE': Decimal, 'TAX_WHT': Decimal }
    TAX_WHT = TRAIN withholding computed on (gross - SSS - PHIC - HDMF).
    """
    r = load_rates_from_policy(policy)
    sss = _sss_ee(gross_monthly, r)
    phic = _phic_ee(gross_monthly, r)
    hdmf = _hdmf_ee(gross_monthly, r)
    taxable = max(Decimal("0.00"), gross_monthly - sss - phic - hdmf)
    tax_wht = _withholding_tax_monthly(taxable, r)
    return {
        "SSS_EE": sss,
        "PHIC_EE": phic,
        "HDMF_EE": hdmf,
        "TAX_WHT": tax_wht,
    }

def allocate_to_cycle(
    monthly_amounts: Dict[str, Decimal],
    cycle: Literal["MONTHLY", "SEMI_1", "SEMI_2"],
    split: Tuple[Decimal, Decimal] = (Decimal("0.50"), Decimal("0.50")),
) -> Dict[str, Decimal]:
    """
    Allocate monthly mandatories to a cycle.
    Default: split 50/50 across semi-monthly periods.
    For MONTHLY, keep full amount.
    """
    if cycle == "MONTHLY":
        return {k: q2(v) for k, v in monthly_amounts.items()}
    first, second = split
    if cycle == "SEMI_1":
        factor = first
    else:
        factor = second
    return {k: q2(v * factor) for k, v in monthly_amounts.items()}
