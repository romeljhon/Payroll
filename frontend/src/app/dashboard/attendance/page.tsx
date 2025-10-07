"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { CalendarIcon, PlusCircle, Lock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";

import {
  AddTimekeeping,
  getAllBranchesByBusiness,
  getAllEmployeeByBranch,
  getTimekeepingByBusinessBranch,
} from "@/lib/api";

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
  const { plan } = useSubscription();
  const router = useRouter();

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [statusValue, setStatusValue] = useState<string>("Present");
  const [submitting, setSubmitting] = useState(false);

  // === Load businesses & branches on mount ===
  useEffect(() => {
    if (plan === 'Basic') return;
    (async () => {
      try {
        const bizList = await getAllBranchesByBusiness();
        setBusinesses(Array.isArray(bizList) ? bizList : []);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load businesses & branches",
          variant: "destructive",
        });
      }
    })();
  }, [plan, toast]);

  // === Load employees when branch changes ===
  useEffect(() => {
    if (!selectedBranch) return;
    (async () => {
      try {
        const empList = await getAllEmployeeByBranch(selectedBranch);
        setEmployees(Array.isArray(empList) ? empList : []);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load employees",
          variant: "destructive",
        });
      }
    })();
  }, [selectedBranch, toast]);

  // === Load attendance when branch + business changes ===
  useEffect(() => {
    if (!selectedBranch || !selectedBusinessId) return;
    (async () => {
      try {
        const timeList = await getTimekeepingByBusinessBranch(
          selectedBusinessId,
          selectedBranch
        );
        setAttendanceData(
          Array.isArray(timeList) ? timeList.map(mapApiToRecord) : []
        );
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load attendance records",
          variant: "destructive",
        });
      }
    })();
  }, [selectedBranch, selectedBusinessId, toast]);

  // Employee map for dropdown
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

  // === Submit Attendance ===
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
      toast({
        title: "Failed",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (plan === 'Basic') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-4">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Feature Locked</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          The <b>Attendance</b> feature is only available on the <b>Pro</b> and <b>Enterprise</b> plans. Please upgrade to access this feature.
        </p>
        <Button onClick={() => router.push('/pricing')}>
          Upgrade Your Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* === TOP GRID: Attendance Form + Business/Branch Selection === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT SIDE: Attendance Form */}
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
                    <option value="">Select Employee</option>
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
                        {selectedDate
                          ? format(selectedDate, "PPP")
                          : "Pick date"}
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

        {/* RIGHT SIDE: Business → Branch Cards */}
        <div className="grid grid-cols-1 gap-4">
          {businesses.map((biz) => (
            <Card key={biz.business.id} className="shadow-lg">
              <CardHeader>
                <CardTitle>{biz.business.name}</CardTitle>
                <CardDescription>Branches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {biz.branches.map((br: any) => (
                  <Button
                    key={br.id}
                    variant={selectedBranch === br.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => {
                      setSelectedBranch(br.id);
                      setSelectedBusinessId(biz.business.id);
                    }}
                  >
                    {br.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* === Attendance History Table === */}
      <Card className="shadow-lg">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 dark:border-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Employee</th>
                  <th className="px-3 py-2 text-left">Time In</th>
                  <th className="px-3 py-2 text-left">Time Out</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((rec) => (
                    <tr
                      key={rec.id}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-3 py-2">{rec.date}</td>
                      <td className="px-3 py-2">
                        {employeesMap.get(rec.employeeId) ??
                          `#${rec.employeeId}`}
                      </td>
                      <td className="px-3 py-2">{rec.timeIn}</td>
                      <td className="px-3 py-2">{rec.timeOut}</td>
                      <td className="px-3 py-2">{rec.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
