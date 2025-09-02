"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Example API calls (replace with your real API utils)
async function fetchBusinesses() {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/businesses/");
  return res.json();
}

async function fetchBranches() {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/branches/");
  return res.json();
}

async function fetchSchedules() {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/work-schedules/");
  return res.json();
}

export default function WorkSchedulePage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");

  useEffect(() => {
    fetchBusinesses().then(setBusinesses);
    fetchBranches().then(setBranches);
    fetchSchedules().then(setSchedules);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scheduleData = {
      business: selectedBusiness,
      branch: selectedBranch,
      time_in: timeIn,
      time_out: timeOut,
    };

    console.log("Saving schedule:", scheduleData);

    // Example POST request (replace with your backend endpoint)
    await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/work-schedules/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheduleData),
    });

    // Refresh schedules after saving
    fetchSchedules().then(setSchedules);

    // Reset form
    setSelectedBusiness("");
    setSelectedBranch("");
    setTimeIn("");
    setTimeOut("");
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
            {/* Business Selector */}
            <div className="space-y-2">
              <Label>Business</Label>
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selector */}
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((br) => (
                    <SelectItem key={br.id} value={br.id}>
                      {br.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time In */}
            <div className="space-y-2">
              <Label>Time In</Label>
              <Input
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                required
              />
            </div>

            {/* Time Out */}
            <div className="space-y-2">
              <Label>Time Out</Label>
              <Input
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Save Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card className="w-full shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">All Work Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length > 0 ? (
                schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.business_name || s.business}</TableCell>
                    <TableCell>{s.branch_name || s.branch}</TableCell>
                    <TableCell>{s.time_in}</TableCell>
                    <TableCell>{s.time_out}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
