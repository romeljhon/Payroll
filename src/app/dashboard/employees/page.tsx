
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserPlus, Edit, Trash2, Search, Filter, Eye } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import AddEmployeeDialog from "@/components/dashboard/employees/add-employee-dialog";
import { useToast } from "@/hooks/use-toast";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive" | "On Leave";
  avatarUrl?: string;
}

const initialEmployees: Employee[] = [
  { id: "1", name: "Alice Wonderland", email: "alice@payease.com", role: "Software Engineer", department: "Engineering", status: "Active", avatarUrl: "https://placehold.co/40x40.png?text=AW" },
  { id: "2", name: "Bob The Builder", email: "bob@payease.com", role: "Project Manager", department: "Management", status: "Active" },
  { id: "3", name: "Charlie Chaplin", email: "charlie@payease.com", role: "UX Designer", department: "Design", status: "On Leave", avatarUrl: "https://placehold.co/40x40.png?text=CC" },
  { id: "4", name: "Diana Prince", email: "diana@payease.com", role: "HR Specialist", department: "Human Resources", status: "Inactive" },
  { id: "5", name: "Edward Elric", email: "edward@payease.com", role: "QA Tester", department: "Engineering", status: "Active", avatarUrl: "https://placehold.co/40x40.png?text=EE" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeAdded = (newEmployee: Employee) => {
    setEmployees(prevEmployees => [newEmployee, ...prevEmployees]);
    setIsAddEmployeeDialogOpen(false);
    toast({
      title: "Employee Added",
      description: `${newEmployee.name} has been successfully added.`,
    });
  };

  return (
    <div className="space-y-8 mx-auto max-w-7xl px-4 md:px-0">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-primary">Employee Management</CardTitle>
            <CardDescription>View, add, and manage employee information.</CardDescription>
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
                <Button variant="outline" className="flex-grow sm:flex-grow-0"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 flex-grow sm:flex-grow-0"
                  onClick={() => setIsAddEmployeeDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[150px]">Role</TableHead>
                  <TableHead className="min-w-[150px]">Department</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person portrait"/>
                          <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span>{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          employee.status === "Active" ? "default" :
                          employee.status === "On Leave" ? "secondary" : "outline"
                        }
                        className={
                          employee.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30" :
                          employee.status === "On Leave" ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30" :
                          "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30"
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/employees/${employee.id}`} className="flex items-center w-full">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
