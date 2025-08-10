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
