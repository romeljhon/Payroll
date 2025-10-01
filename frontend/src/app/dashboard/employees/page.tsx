"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Filter, Eye } from "lucide-react";
import Link from "next/link";
import AddEmployeeDialog from "@/components/dashboard/employees/add-employee-dialog";
import { useToast } from "@/hooks/use-toast";
import { DeleteEmployee, getAllEmployee } from "@/lib/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export interface Employee {
  id: number;
  branch_name: string;
  position: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hire_date: string;
  active: boolean;
  branch: number;
  salary_rate: any;
}

// ✅ Stub data if API fails
const stubEmployees: Employee[] = [
  {
    id: 1,
    branch_name: "Main Branch",
    position: "Manager",
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice.johnson@example.com",
    phone: "09171234567",
    hire_date: "2024-06-01",
    active: true,
    branch: 101,
    salary_rate: 50000,
  },
  {
    id: 2,
    branch_name: "Cebu Branch",
    position: "Sales Associate",
    first_name: "Bob",
    last_name: "Reyes",
    email: "bob.reyes@example.com",
    phone: "09179876543",
    hire_date: "2024-08-12",
    active: false,
    branch: 102,
    salary_rate: 25000,
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const employees = await getAllEmployee();
        setEmployees(employees);
      } catch (err: any) {
        setEmployees(stubEmployees);
        toast({
          variant: "destructive",
          title: "Using Sample Data",
          description:
            "The server is unreachable. Showing sample employees instead.",
        });
      }
    }
    fetchData();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEmployeeAdded = (newEmployee: Employee) => {
    setEmployees((prevEmployees) => [newEmployee, ...prevEmployees]);
    setIsAddEmployeeDialogOpen(false);
    toast({
      title: "Employee Added",
      description: `${newEmployee.first_name} ${newEmployee.last_name} has been successfully added.`,
    });
  };

  const handleDelete = async (id: number) => {
    setSelectedId(id);
    MySwal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await DeleteEmployee(id);
          setEmployees((prev) => prev.filter((emp) => emp.id !== id));
          toast({
            title: "Employee Deleted",
            description: `Employee has been successfully removed.`,
          });
          MySwal.fire("Deleted!", "The employee has been removed.", "success");
        } catch (err: any) {
          toast({
            variant: "destructive",
            title: "Delete Failed",
            description: err.message || "Could not delete employee.",
          });
          MySwal.fire(
            "Error!",
            err.message || "Could not delete employee.",
            "error"
          );
        } finally {
          setSelectedId(null);
        }
      } else {
        setSelectedId(null);
      }
    });
  };

  return (
    <div className="space-y-8 mx-auto max-w-7xl px-4 md:px-0">
      <Card className="shadow-lg dark:bg-gray-900 dark:text-gray-100">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-primary">Employee Management</CardTitle>
            <CardDescription className="dark:text-gray-400">
              View, add, and manage employee information.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <Input
                placeholder="Search employees..."
                className="pl-10 w-full dark:bg-gray-800 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-grow sm:flex-grow-0 dark:border-gray-700 dark:text-gray-100"
              >
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 flex-grow sm:flex-grow-0"
                onClick={() => setIsAddEmployeeDialogOpen(true)}
              >
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className="relative shadow-md dark:bg-gray-800 dark:text-gray-100"
                >
                  {/* Three dots menu in top right */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="dark:bg-gray-800 dark:border-gray-700"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/employees/${employee.id}`}
                            className="flex items-center w-full"
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 focus:text-red-600"
                          disabled={selectedId === employee.id}
                        >
                          {selectedId === employee.id
                            ? "⏳ Deleting..."
                            : "🗑️ Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardHeader>
                    <CardTitle>
                      {employee.first_name} {employee.last_name}
                      
                    </CardTitle>
                    <CardDescription>{employee.position}   <Badge
                      variant={employee.active ? "default" : "outline"}
                      className="dark:border-gray-500"
                    >
                      {employee.active ? "Active" : "Inactive"}
                    </Badge></CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>Email:</strong> {employee.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {employee.phone}
                    </p>
                    <p>
                      <strong>Branch:</strong> {employee.branch_name}
                    </p>
                    <p>
                      <strong>Hire Date:</strong> {employee.hire_date}
                    </p>
                  
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground dark:text-gray-400">
              No employees found matching your criteria.
            </p>
          )}
        </CardContent>
      </Card>

      <AddEmployeeDialog
        isOpen={isAddEmployeeDialogOpen}
        onOpenChange={setIsAddEmployeeDialogOpen}
        onEmployeeAdded={handleEmployeeAdded}
      />
    </div>
  );
}
