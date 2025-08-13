"use client";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Edit3,
  Trash2,
  UploadCloud,
  PlusCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AddTimekeeping,
  DeleteTimekeeping,
  getTimekeeping,
  getAllEmployee,
} from "@/lib/api";

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
  date: string; // "yyyy-MM-dd"
  timeIn: string; // "HH:mm" or "-"
  timeOut: string; // "HH:mm" or "-"
  status: string; // Present | Absent | Leave | Half-day
}

// Map API -> UI
const mapApiToRecord = (it: any): AttendanceRecord => ({
  id: String(it.id ?? it.pk ?? crypto.randomUUID()),
  employeeId: Number(it.employee ?? it.employee_id ?? 0),
  date: it.date ?? it.attendance_date ?? "",
  timeIn: it.time_in ?? it.timeIn ?? "-",
  timeOut: it.time_out ?? it.timeOut ?? "-",
  status: it.status ?? "Present",
});

// Build POST body with employee ID
const buildPostBody = (p: {
  employeeId: number;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: string;
}) => ({
  employee: p.employeeId, // ✅ send the ID
  date: p.date,
  time_in: p.timeIn || null,
  time_out: p.timeOut || null,
  status: p.status,
});

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(""); // string for Select; convert to Number on submit
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [statusValue, setStatusValue] = useState<string>("Present");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Build a map of employeeId -> name for rendering/search
  const employeesMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const e of employees) {
      const full =
        e.name ||
        [e.first_name, e.last_name].filter(Boolean).join(" ").trim() ||
        String(e.email || "");
      if (e.id != null) m.set(Number(e.id), full || "Unknown");
    }
    return m;
  }, [employees]);

  // Load employees + timekeeping
  useEffect(() => {
    (async () => {
      try {
        const [empList, timeList] = await Promise.all([
          getAllEmployee(),
          getTimekeeping(),
        ]);
        setEmployees(Array.isArray(empList) ? empList : []);
        const mapped = Array.isArray(timeList)
          ? timeList.map(mapApiToRecord)
          : [];
        setAttendanceData(mapped);
      } catch (err: any) {
        toast({
          title: "Error",
          description:
            err?.message || "Failed to load attendance or employees.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleAddAttendance = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedEmployeeId) {
      toast({
        title: "Employee required",
        description: "Please choose an employee.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please choose a date.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const timeIn = String(formData.get("timeIn") || "");
    const timeOut = String(formData.get("timeOut") || "");
    const employeeIdNum = Number(selectedEmployeeId);

    const body = buildPostBody({
      employeeId: employeeIdNum,
      date: format(selectedDate, "yyyy-MM-dd"),
      timeIn: timeIn || undefined,
      timeOut: timeOut || undefined,
      status: statusValue,
    });

    try {
      setSubmitting(true);
      const created = await AddTimekeeping(body);
      const mapped = mapApiToRecord(created);
      setAttendanceData((prev) => [mapped, ...prev]);

      toast({ title: "Success", description: "Attendance record added." });
      event.currentTarget.reset();
      setSelectedDate(new Date());
      setSelectedEmployeeId("");
      setStatusValue("Present");
    } catch (err: any) {
      toast({
        title: "Add failed",
        description: err?.message || "Could not add attendance record.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DeleteTimekeeping(id);
      setAttendanceData((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted", description: "Attendance record removed." });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete attendance record.",
        variant: "destructive",
      });
    }
  };

  // Compute display + search
  const filteredAttendanceData = useMemo(() => {
    if (!searchTerm) return attendanceData;
    const q = searchTerm.toLowerCase();
    return attendanceData.filter((r) => {
      const name = employeesMap.get(r.employeeId) || "Unknown";
      return (
        name.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [attendanceData, searchTerm, employeesMap]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Log Attendance</CardTitle>
          <CardDescription>
            Manually add or import attendance records for employees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAddAttendance}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end"
          >
            {/* Employee Select (uses ID) */}
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => {
                    const label =
                      e.name ||
                      [e.first_name, e.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim() ||
                      String(e.email || `#${e.id}`);
                    return (
                      <SelectItem key={String(e.id)} value={String(e.id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
              <Label htmlFor="timeIn">Time In</Label>
              <Input id="timeIn" name="timeIn" type="time" />
            </div>

            <div>
              <Label htmlFor="timeOut">Time Out</Label>
              <Input id="timeOut" name="timeOut" type="time" />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="Half-day">Half-day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 lg:col-span-1 flex space-x-3">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {submitting ? "Adding..." : "Add Record"}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full md:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Import from Biometric/CSV
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supports .csv, .xls, .xlsx files from common biometric devices.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary">Attendance Records</CardTitle>
            <CardDescription>
              View and manage employee attendance.
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading attendance...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendanceData.length > 0 ? (
                  filteredAttendanceData.map((record) => {
                    const employeeName =
                      employeesMap.get(record.employeeId) || "Unknown";
                    return (
                      <TableRow
                        key={record.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {employeeName}
                        </TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.timeIn}</TableCell>
                        <TableCell>{record.timeOut}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              record.status === "Present"
                                ? "bg-green-100 text-green-700"
                                : record.status === "Absent"
                                ? "bg-red-100 text-red-700"
                                : record.status === "Leave"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-accent mr-2"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-destructive"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No attendance records found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
