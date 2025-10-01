"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBranches } from "@/lib/api";

// ✅ Stub data in case API is down
const STUB_BRANCHES = [
  { id: 1, name: "Downtown Branch" },
  { id: 2, name: "Innovation Hub" },
];

const STUB_SCHEDULES = [
  {
    id: 101,
    branch_name: "Downtown Branch",
    branch: 1,
    time_in: "08:00:00",
    time_out: "17:00:00",
    grace_minutes: 15,
    break_hours: "1.00",
    min_hours_required: "8.00",
    is_flexible: false,
    regular_work_days: "0,1,2,3,4",
  },
  {
    id: 102,
    branch_name: "Innovation Hub",
    branch: 2,
    time_in: "09:00:00",
    time_out: "18:00:00",
    grace_minutes: 10,
    break_hours: "1.00",
    min_hours_required: "8.00",
    is_flexible: true,
    regular_work_days: "0,1,2,3,4",
  },
];

// ✅ Fetch schedules API with fallback
async function fetchSchedules(): Promise<any[]> {
  const token = localStorage.getItem("token");
  if (!token) return STUB_SCHEDULES;

  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_BASE_URL + "/api/work-schedule-policies/",
      {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length === 0) return STUB_SCHEDULES;
    return data;
  } catch (err) {
    console.warn("Schedules API failed, using stub data", err);
    return STUB_SCHEDULES;
  }
}

export default function WorkSchedulePage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Form states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [graceMinutes, setGraceMinutes] = useState("15");
  const [breakHours, setBreakHours] = useState("1.00");
  const [minHours, setMinHours] = useState("8.00");
  const [isFlexible, setIsFlexible] = useState(false);
  const [regularDays, setRegularDays] = useState<number[]>([]);

  useEffect(() => {
    // Branches with fallback
    getBranches()
      .then((b) => setBranches(b?.length ? b : STUB_BRANCHES))
      .catch((err) => {
        console.warn("Branches API failed, using stub data", err);
        setBranches(STUB_BRANCHES);
      });

    // Schedules with fallback
    fetchSchedules().then(setSchedules).catch(() => setSchedules(STUB_SCHEDULES));
  }, []);

  const handleDayToggle = (day: number) => {
    setRegularDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scheduleData = {
      branch: Number(selectedBranch),
      time_in: timeIn ? `${timeIn}:00` : null,
      time_out: timeOut ? `${timeOut}:00` : null,
      grace_minutes: Number(graceMinutes),
      break_hours: breakHours,
      min_hours_required: minHours,
      is_flexible: isFlexible,
      regular_work_days: regularDays.sort().join(","), // "0,1,2,3,4"
    };

    console.log("Saving schedule:", scheduleData);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found. Using stub only.");
      return;
    }

    try {
      await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/work-schedule-policies/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scheduleData),
        }
      );
      fetchSchedules().then(setSchedules).catch(() => setSchedules(STUB_SCHEDULES));
    } catch (err) {
      console.warn("Failed to save schedule, stub only", err);
      // keep stub
    }

    // Reset form
    setSelectedBranch("");
    setTimeIn("");
    setTimeOut("");
    setGraceMinutes("15");
    setBreakHours("1.00");
    setMinHours("8.00");
    setIsFlexible(false);
    setRegularDays([]);
  };

  return (
    <div className="flex flex-row gap-8 p-6">
      {/* Create Schedule Form */}
      <Card className="w-full max-w-lg shadow-lg rounded-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Create Work Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branch Selector */}
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((br) => (
                    <SelectItem key={br.id} value={String(br.id)}>
                      {br.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time In</Label>
              <Input
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Time Out</Label>
              <Input
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Grace Minutes</Label>
              <Input
                type="number"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Break Hours</Label>
              <Input
                type="number"
                value={breakHours}
                onChange={(e) => setBreakHours(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Hours Required</Label>
              <Input
                type="number"
                value={minHours}
                onChange={(e) => setMinHours(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={isFlexible}
                onCheckedChange={(checked) => setIsFlexible(!!checked)}
              />
              <Label>Flexible Schedule</Label>
            </div>

            {/* Regular Work Days */}
            <div className="space-y-2">
              <Label>Regular Work Days</Label>
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <Button
                    type="button"
                    key={day}
                    variant={regularDays.includes(i) ? "default" : "outline"}
                    onClick={() => handleDayToggle(i)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Save Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card className="w-full shadow-lg rounded-2xl overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold">All Work Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Grace (min)</TableHead>
                <TableHead>Break (hrs)</TableHead>
                <TableHead>Min Hours</TableHead>
                <TableHead>Flexible</TableHead>
                <TableHead>Regular Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length > 0 ? (
                schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.branch_name || s.branch}</TableCell>
                    <TableCell>{s.time_in}</TableCell>
                    <TableCell>{s.time_out}</TableCell>
                    <TableCell>{s.grace_minutes}</TableCell>
                    <TableCell>{s.break_hours}</TableCell>
                    <TableCell>{s.min_hours_required}</TableCell>
                    <TableCell>{s.is_flexible ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {s.regular_work_days
                        ?.split(",")
                        .map((d: string) =>
                          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Number(d)]
                        )
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No schedules found
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
