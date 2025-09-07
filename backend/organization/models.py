from datetime import time, datetime, timedelta, date as ddate
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models

# Create your models here.
class Business(models.Model):
    name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=100, blank=True, null=True)  # optional
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Branch(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["business__name", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["business", "name"],
                name="uniq_branch_name_per_business",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.business.name})"

class WorkSchedulePolicy(models.Model):
    branch = models.OneToOneField(
        Branch,
        on_delete=models.CASCADE,
        related_name='work_schedule',
    )

    time_in = models.TimeField(default=time(9, 0))
    time_out = models.TimeField(default=time(18, 0))  # 6PM typical office end
    grace_minutes = models.PositiveSmallIntegerField(default=0)

    break_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    min_hours_required = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal("8.00"),
        help_text="Minimum working hours to be considered present",
    )

    is_flexible = models.BooleanField(default=False)

    # CSV of weekdays: 0=Mon ... 6=Sun
    regular_work_days = models.CharField(
        max_length=20,
        default="0,1,2,3,4",
        help_text="Comma-separated weekdays: 0=Mon, 6=Sun",
    )

    created_at = models.DateTimeField(auto_now_add=True)  # optional
    updated_at = models.DateTimeField(auto_now=True)      # optional

    class Meta:
        ordering = ["branch__business__name", "branch__name"]
        verbose_name = "Work Schedule Policy"
        verbose_name_plural = "Work Schedule Policies"

    def __str__(self):
        return f"Schedule for {self.branch.name}"

    # ---- Helpers ----
    def get_work_days(self) -> set[int]:
        parts = [p.strip() for p in (self.regular_work_days or "").split(",") if p.strip()]
        out: set[int] = set()
        for p in parts:
            try:
                v = int(p)
                if 0 <= v <= 6:
                    out.add(v)
            except ValueError:
                continue
        return out or {0, 1, 2, 3, 4}

    @property
    def expected_daily_hours(self) -> Decimal:
        """
        Duration from time_in to time_out minus breaks.
        Supports overnight (out <= in).
        """
        anchor = ddate(2000, 1, 1)
        dt_in = datetime.combine(anchor, self.time_in)
        dt_out = datetime.combine(anchor, self.time_out)
        if dt_out <= dt_in:
            dt_out += timedelta(days=1)
        total_hours = Decimal((dt_out - dt_in).total_seconds()) / Decimal(3600)
        return (total_hours - (self.break_hours or Decimal("0.00"))).quantize(Decimal("0.01"))

    # ---- Validation ----
    def clean(self):
        if self.break_hours < 0:
            raise ValidationError({"break_hours": "break_hours cannot be negative."})
        if self.min_hours_required < 0:
            raise ValidationError({"min_hours_required": "min_hours_required cannot be negative."})

        # Suggestion: min_hours should not exceed expected day hours
        try:
            if self.min_hours_required > self.expected_daily_hours:
                raise ValidationError({
                    "min_hours_required": "min_hours_required cannot exceed expected_daily_hours."
                })
        except Exception:
            # If expected_daily_hours fails (e.g., invalid times), let DB save and show error elsewhere.
            pass