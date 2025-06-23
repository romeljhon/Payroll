
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit3, Trash2, UploadCloud, PlusCircle, Search } from "lucide-react";
import { format } from "date-fns";
import React, { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  timeIn: string;
  timeOut: string;
  status: string;
}

const initialAttendanceData: AttendanceRecord[] = [
  { id: "1", employeeName: "Alice Wonderland", date: "2024-07-15", timeIn: "09:00", timeOut: "17:00", status: "Present" },
  { id: "2", employeeName: "Bob The Builder", date: "2024-07-15", timeIn: "09:05", timeOut: "17:02", status: "Present" },
  { id: "3", employeeName: "Charlie Chaplin", date: "2024-07-15", timeIn: "-", timeOut: "-", status: "Absent" },
  { id: "4", employeeName: "Diana Prince", date: "2024-07-14", timeIn: "10:00", timeOut: "16:00", status: "Leave" },
];

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(initialAttendanceData);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddAttendance = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newRecord: AttendanceRecord = {
      id: String(Date.now()),
      employeeName: formData.get("employeeName") as string,
      date: format(selectedDate || new Date(), "yyyy-MM-dd"),
      timeIn: formData.get("timeIn") as string,
      timeOut: formData.get("timeOut") as string,
      status: formData.get("status") as string,
    };
    setAttendanceData([newRecord, ...attendanceData]);
    toast({ title: "Success", description: "Attendance record added." });
    event.currentTarget.reset();
    setSelectedDate(new Date()); // Reset date picker to today
  };

  const filteredAttendanceData = useMemo(() => {
    if (!searchTerm) return attendanceData;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return attendanceData.filter(record =>
      record.employeeName.toLowerCase().includes(lowercasedSearchTerm) ||
      record.date.toLowerCase().includes(lowercasedSearchTerm) ||
      record.status.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [attendanceData, searchTerm]);
  
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Log Attendance</CardTitle>
          <CardDescription>Manually add or import attendance records for employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAttendance} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div>
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input id="employeeName" name="employeeName" placeholder="e.g., John Doe" required />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
              <Select name="status" defaultValue="Present" required>
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
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Record
                </Button>
            </div>
          </form>
          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full md:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Import from Biometric/CSV
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Supports .csv, .xls, .xlsx files from common biometric devices.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary">Attendance Records</CardTitle>
            <CardDescription>View and manage employee attendance.</CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendanceData.length > 0 ? filteredAttendanceData.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{record.employeeName}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.timeIn}</TableCell>
                  <TableCell>{record.timeOut}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-1 text-xs rounded-full ${
                       record.status === 'Present' ? 'bg-green-100 text-green-700' :
                       record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                       record.status === 'Leave' ? 'bg-yellow-100 text-yellow-700' :
                       'bg-gray-100 text-gray-700'
                     }`}>
                       {record.status}
                     </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent mr-2">
                      <Edit3 className="h-4 w-4" />
                       <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No attendance records found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    