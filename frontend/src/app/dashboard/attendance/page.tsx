"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AddTimekeeping,
  getTimekeeping,
  getAllEmployee,
} from "@/lib/api";

// ---- Mock Data for demo ---- //
const businesses = [
  {
    id: 1,
    name: "Tech Solutions Inc.",
    branches: [
      { id: 101, name: "Manila Branch" },
      { id: 102, name: "Cebu Branch" },
    ],
  },
  {
    id: 2,
    name: "Global Foods Corp.",
    branches: [
      { id: 201, name: "Davao Branch" },
      { id: 202, name: "Baguio Branch" },
    ],
  },
];

// ---- Interfaces ---- //
interface Employee {
  id: number | string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
}
interface AttendanceRecord {
  id: string;
  employeeId: number;
  date: string;
  timeIn: string;
  timeOut: string;
  status: string;
}

// ---- Helpers ---- //
const mapApiToRecord = (it: any): AttendanceRecord => ({
  id: String(it.id ?? it.pk ?? crypto.randomUUID()),
  employeeId: Number(it.employee ?? it.employee_id ?? 0),
  date: it.date ?? it.attendance_date ?? "",
  timeIn: it.time_in ?? "-",
  timeOut: it.time_out ?? "-",
  status: it.status ?? "Present",
});

export default function AttendancePage() {
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusValue, setStatusValue] = useState<string>("Present");
  const [submitting, setSubmitting] = useState(false);

  // Load employees + timekeeping
  useEffect(() => {
    (async () => {
      try {
        const [empList, timeList] = await Promise.all([
          getAllEmployee(),
          getTimekeeping(),
        ]);
        setEmployees(Array.isArray(empList) ? empList : []);
        setAttendanceData(
          Array.isArray(timeList) ? timeList.map(mapApiToRecord) : []
        );
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load data",
          variant: "destructive",
        });
      }
    })();
  }, [toast]);

  // Employee map
  const employeesMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const e of employees) {
      const full =
        e.name ||
        [e.first_name, e.last_name].filter(Boolean).join(" ").trim() ||
        String(e.email || "");
      if (e.id != null) m.set(Number(e.id), full);
    }
    return m;
  }, [employees]);

  const handleAddAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedDate || !selectedBranch) return;
    try {
      setSubmitting(true);
      const body = {
        employee: Number(selectedEmployeeId),
        date: format(selectedDate, "yyyy-MM-dd"),
        time_in: (e.currentTarget as any).timeIn.value || null,
        time_out: (e.currentTarget as any).timeOut.value || null,
        status: statusValue,
        branch: selectedBranch,
      };
      const created = await AddTimekeeping(body);
      setAttendanceData((prev) => [mapApiToRecord(created), ...prev]);
      toast({ title: "Success", description: "Attendance added" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* === LEFT SIDE: Attendance Form === */}
      {selectedBranch ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Attendance for Branch #{selectedBranch}</CardTitle>
            <CardDescription>
              Add a record for employees assigned to this branch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddAttendance}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <Label>Employee</Label>
                <select
                  className="border rounded-md w-full p-2"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {employeesMap.get(Number(e.id))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Time In</Label>
                <Input type="time" name="timeIn" />
              </div>

              <div>
                <Label>Time Out</Label>
                <Input type="time" name="timeOut" />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  className="border rounded-md w-full p-2"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                >
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Leave</option>
                  <option>Half-day</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {submitting ? "Adding..." : "Add Attendance"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg flex items-center justify-center">
          <CardContent>
            <p className="text-muted-foreground">
              Please select a branch first to log attendance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* === RIGHT SIDE: Business → Branch Cards === */}
      <div className="grid grid-cols-1 gap-4">
        {businesses.map((biz) => (
          <Card key={biz.id} className="shadow-lg">
            <CardHeader>
              <CardTitle>{biz.name}</CardTitle>
              <CardDescription>Branches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {biz.branches.map((br) => (
                <Button
                  key={br.id}
                  variant={selectedBranch === br.id ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setSelectedBranch(br.id)}
                >
                  {br.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
