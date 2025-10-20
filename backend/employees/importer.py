
import csv
from .models import Employee

class EmployeeImporter:
    def __init__(self, file):
        self.file = file

    def import_employees(self):
        reader = csv.reader(self.file)
        next(reader)  # Skip header row
        for row in reader:
            self.create_employee(row)

    def create_employee(self, row):
        employee = Employee(
            first_name=row[0],
            last_name=row[1],
            email=row[2],
            # Add other fields as needed
        )
        employee.save()
