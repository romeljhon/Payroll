
# email_sender/models.py
from django.db import models
from django.utils import timezone

class EmailSentLog(models.Model):
    """Tracks the number of emails sent per month."""
    # The first day of the month for which we are tracking.
    month = models.DateField(unique=True)
    # The number of emails sent in this month.
    count = models.PositiveIntegerField(default=0)
    # The monthly limit.
    limit = models.PositiveIntegerField(default=300)

    def __str__(self):
        return f"{self.month.strftime('%B %Y')}: {self.count}/{self.limit}"

    @classmethod
    def get_current_log(cls):
        """Gets or creates the log for the current month."""
        today = timezone.now().date()
        current_month = today.replace(day=1)
        log, _ = cls.objects.get_or_create(month=current_month)
        return log

    def is_limit_reached(self) -> bool:
        """Checks if the email limit has been reached for this month."""
        return self.count >= self.limit

    def increment_count(self):
        """Increments the sent email count for this month."""
        self.count += 1
        self.save(update_fields=["count"])
