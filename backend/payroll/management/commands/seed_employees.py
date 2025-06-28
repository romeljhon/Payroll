from django.core.management.base import BaseCommand
from employees.models import Employee
from payroll.models import Position
from organization.models import Branch, Business  # Adjust if your app is named differently
from faker import Faker
import random
from datetime import date

fake = Faker("en_PH")


class Command(BaseCommand):
    help = "Seed restaurant-style employees with assigned positions and branches"

    def handle(self, *args, **kwargs):
        self.stdout.write("[INFO] Seeding Mock Restaurant Employees...")

        # ✅ Create default Business
        default_business, _ = Business.objects.get_or_create(
            name="PizzaHub Inc."
        )

        # ✅ Create default Branch under the Business
        default_branch, _ = Branch.objects.get_or_create(
            name="Main Branch",
            business=default_business
        )

        # ✅ Create common restaurant positions
        position_titles = [
            "Cashier", "Service Crew", "Cook", "Pizza Maker",
            "Store Supervisor", "Dishwasher", "Delivery Rider"
        ]

        positions = {}
        for title in position_titles:
            pos, _ = Position.objects.get_or_create(name=title)
            positions[title] = pos

        # ✅ Generate mock employees
        num_employees = 10
        created_count = 0

        for _ in range(num_employees):
            full_name = fake.name()
            email = fake.unique.email()
            first_name, last_name = full_name.split(" ", 1) if " " in full_name else (full_name, "")

            position = random.choice(list(positions.values()))
            hire_date = fake.date_between(start_date="-2y", end_date="today")

            employee, created = Employee.objects.get_or_create(
                first_name=first_name,
                last_name=last_name,
                defaults={
                    "email": email,
                    "position": position,
                    "hire_date": hire_date,
                    "branch": default_branch,
                }
            )

            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Seeded {created_count} employees under '{default_branch.name}'"))
