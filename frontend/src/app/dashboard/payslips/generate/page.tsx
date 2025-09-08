"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Send, FileSearch, Gift, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAllEmployee, getPayrollCycle } from "@/lib/api";

interface Employee {
  id: string;
  name: string;
}

interface PayrollCycle {
  id: number;
  name: string;
  cycle_type: string;
}

interface PayslipComponent {
  component: string;
  code: string;
  type: "EARNING" | "DEDUCTION";
  amount: string;
}

interface PayslipData {
  employeeName: string;
  employeePosition: string;
  employeeBranch: string;
  period: string;
  cycleType: string;
  components: PayslipComponent[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
}

export default function GeneratePayslipsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();
  const [selectedCycle, setSelectedCycle] = useState<string | undefined>();
  const [payslipPreview, setPayslipPreview] = useState<PayslipData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [canPreview, setCanPreview] = useState(false);
  const [include13th, setInclude13th] = useState(false);

  const { toast } = useToast();

  // ✅ Fetch employees & payroll cycles
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllEmployee();
        const mappedEmployees = data.map((emp: any) => ({
          id: String(emp.id),
          name: `${emp.first_name} ${emp.last_name}`,
        }));
        setEmployees(mappedEmployees);

        const cycleData = await getPayrollCycle();
        setCycles(cycleData);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Fetch Error",
          description: err.message || "Could not load data.",
        });
      }
    }
    fetchData();
  }, []);

  // ✅ Generate payroll (POST /api/generate/)
  const handleGeneratePayroll = async () => {
    if (!selectedEmployee || !selectedPeriod || !selectedCycle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select employee, period, and cycle.",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/generate/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: Number(selectedEmployee),
            month: selectedPeriod,
            cycle_type: selectedCycle,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to generate payroll");

      toast({
        title: "Payroll Generated",
        description: "Payroll successfully generated. You can now preview.",
      });
      setCanPreview(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Payroll generation failed.",
      });
    }
  };

  // ✅ Preview payslip (GET /api/payslip/)
  const handlePreviewPayslip = async () => {
    if (!selectedEmployee || !selectedPeriod || !selectedCycle) return;

    try {
      const token = localStorage.getItem("token");
      const url = new URL(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/payslip/"
      );
      url.searchParams.append("employee_id", selectedEmployee);
      url.searchParams.append("month", selectedPeriod);
      url.searchParams.append("cycle_type", selectedCycle);
      url.searchParams.append("include_13th", include13th ? "true" : "false");

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch payslip");

      setPayslipPreview({
        employeeName: data.employee?.name,
        employeePosition: data.employee?.position,
        employeeBranch: data.employee?.branch,
        period: data.month,
        cycleType: data.cycle_type,
        components: data.components || [],
        totalEarnings: data.total_earnings,
        totalDeductions: data.total_deductions,
        netPay: data.net_pay,
      });

      toast({
        title: "Preview Loaded",
        description: `Payslip for ${data.employee?.name}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to preview payslip.",
      });
    }
  };

  // ✅ Run 13th month (POST /api/13th/)
  const handleRun13thMonth = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/13th/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: Number(selectedEmployee),
            year: new Date().getFullYear(),
            cycle_type: selectedCycle || "MONTHLY",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to run 13th month");

      toast({
        title: "13th Month Processed",
        description: "13th month successfully calculated.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "13th month processing failed.",
      });
    }
  };

  // ✅ Run Batch Payroll (POST /api/batch/)
  const handleRunBatch = async () => {
    if (employees.length === 0 || !selectedPeriod || !selectedCycle) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/batch/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_ids: employees.map((e) => Number(e.id)),
            month: selectedPeriod,
            cycle_type: selectedCycle,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to run batch payroll");

      toast({
        title: "Batch Payroll Generated",
        description: "Batch payroll successfully processed.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Batch payroll failed.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">
            Generate & Distribute Payslips
          </CardTitle>
          <CardDescription>
            Select employee, payroll cycle, and period to generate payslips.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Selection Panel */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cycle">Payroll Cycle</Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger id="cycle">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((c) => (
                    <SelectItem key={c.id} value={c.cycle_type}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">Payroll Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {["2025-07", "2025-08", "2025-09"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 13th month switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="include13th"
                checked={include13th}
                onCheckedChange={setInclude13th}
              />
              <Label htmlFor="include13th">Include 13th Month</Label>
            </div>

            <Button
              onClick={handleGeneratePayroll}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Send className="mr-2 h-4 w-4" /> Generate Payroll
            </Button>

            <Button
              onClick={handlePreviewPayslip}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <FileSearch className="mr-2 h-4 w-4" /> Preview Payslip
            </Button>

            <Button
              onClick={handleRun13thMonth}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Gift className="mr-2 h-4 w-4" /> Run 13th Month
            </Button>

            <Button
              onClick={handleRunBatch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="mr-2 h-4 w-4" /> Run Batch Payroll
            </Button>
          </div>

          {/* Preview Box */}
          <div className="md:col-span-2">
            {payslipPreview ? (
              <Card className="border-accent shadow-md">
                <CardHeader>
                  <CardTitle className="text-accent">
                    Payslip: {payslipPreview.employeeName}
                  </CardTitle>
                  <CardDescription>
                    {payslipPreview.employeePosition} •{" "}
                    {payslipPreview.employeeBranch} <br />
                    Period: {payslipPreview.period} (
                    {payslipPreview.cycleType})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">Earnings</h4>
                  <ul className="mb-4">
                    {payslipPreview.components
                      .filter((c) => c.type === "EARNING")
                      .map((c, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{c.component}</span>
                          <span>₱{parseFloat(c.amount).toFixed(2)}</span>
                        </li>
                      ))}
                  </ul>

                  <h4 className="font-semibold mb-2">Deductions</h4>
                  <ul className="mb-4">
                    {payslipPreview.components
                      .filter((c) => c.type === "DEDUCTION")
                      .map((c, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{c.component}</span>
                          <span>-₱{parseFloat(c.amount).toFixed(2)}</span>
                        </li>
                      ))}
                  </ul>

                  <div className="border-t pt-2 mt-2">
                    <p>
                      <strong>Total Earnings:</strong> ₱
                      {payslipPreview.totalEarnings.toFixed(2)}
                    </p>
                    <p>
                      <strong>Total Deductions:</strong> ₱
                      {payslipPreview.totalDeductions.toFixed(2)}
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      Net Pay: ₱{payslipPreview.netPay.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed rounded-lg p-10 bg-muted/50">
                <p className="text-muted-foreground">
                  Generate payroll and then preview payslip.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
