"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Building,
  UserCheck,
  Phone,
  Edit3,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEmployeeById } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ✅ FIXED: Added salary_rate to interface
interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive" | "On Leave";
  avatarUrl?: string;
  phone?: string;
  joinDate?: string;
  employeeIdNo?: string;
  salary_rate?: {
    amount: string;
    start_date: string;
    end_date: string | null;
  };
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.employeeId as string;

  const { data: employee, isLoading, isError } = useQuery<Employee>({
    queryKey: ["employee-id", employeeId],
    queryFn: () => getAllEmployeeById(employeeId),
    enabled: !!employeeId, // only run if we have an ID
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="text-center py-10 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-destructive mb-4">
          Employee Not Found
        </h2>
        <p className="text-muted-foreground mb-6">
          The employee you are looking for does not exist.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/employees">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employees
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button variant="secondary">
          <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={employee.avatarUrl} alt={employee.name} />
              <AvatarFallback className="text-3xl">
                {employee.name?.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                {employee.name}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {employee.role}
              </CardDescription>
              <Badge
                variant={
                  employee.status === "Active"
                    ? "default"
                    : employee.status === "On Leave"
                    ? "secondary"
                    : "outline"
                }
                className={`mt-2 text-xs ${
                  employee.status === "Active"
                    ? "bg-green-500/20 text-green-700 border-green-500/30"
                    : employee.status === "On Leave"
                    ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                    : "bg-red-500/20 text-red-700 border-red-500/30"
                }`}
              >
                {employee.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <h3 className="text-xl font-semibold text-primary mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{employee.phone || "Not Provided"}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-primary mb-3">
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <span>Role: {employee.role}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span>Department: {employee.department}</span>
              </div>
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                <span>Employee ID: {employee.employeeIdNo || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>
                  Join Date:{" "}
                  {employee.joinDate
                    ? new Date(employee.joinDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </section>

          {/* ✅ FIXED: Show salary details if available */}
          {employee.salary_rate && (
            <section>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Salary Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="flex items-center space-x-3">
                  <span>
                    Amount: ₱{employee.salary_rate.amount}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span>
                    Start Date:{" "}
                    {new Date(employee.salary_rate.start_date).toLocaleDateString()}
                  </span>
                </div>
                {employee.salary_rate.end_date && (
                  <div className="flex items-center space-x-3">
                    <span>
                      End Date:{" "}
                      {new Date(employee.salary_rate.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 border-t text-xs text-muted-foreground">
          This information is for administrative purposes only. Last updated:{" "}
          {new Date().toLocaleDateString()}.
        </CardFooter>
      </Card>
    </div>
  );
}
