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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
}

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
        toast({
          variant: "destructive",
          title: "Fetch Error",
          description: err.message || "Could not load employee data.",
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
    setSelectedId(id); // ✅ store the selected id in state
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
          setSelectedId(null); // ✅ clear after done
        }
      } else {
        setSelectedId(null); // ✅ clear if cancelled
      }
    });
  };

  return (
    <div className="space-y-8 mx-auto max-w-7xl px-4 md:px-0">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-primary">Employee Management</CardTitle>
            <CardDescription>
              View, add, and manage employee information.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex-grow sm:flex-grow-0">
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
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <TableCell>
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.branch_name}</TableCell>
                    <TableCell>{employee.hire_date}</TableCell>
                    <TableCell>
                      <Badge variant={employee.active ? "default" : "outline"}>
                        {employee.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                            // Optional: visually indicate “busy” for this row
                            disabled={selectedId === employee.id}
                          >
                            {selectedId === employee.id
                              ? "⏳ Deleting..."
                              : "🗑️ Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No employees found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
