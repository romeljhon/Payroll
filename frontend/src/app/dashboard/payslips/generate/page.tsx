"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer, Mail, Eye, Download, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAllEmployee, getPayrollCycle, SinglePayslip } from "@/lib/api";

interface Employee {
  id: string;
  name: string;
}

interface PayrollCycle {
  id: number;
  name: string;
  cycle_type: string;
}

interface PayslipData {
  employeeName: string;
  period: string;
  basicSalary: number;
  overtimePay: number;
  allowances: number;
  totalEarnings: number;
  taxDeduction: number;
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
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

  const { toast } = useToast();

  // Fetch employees & payroll cycles
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

  const handleGeneratePreview = () => {
    if (!selectedEmployee || !selectedPeriod || !selectedCycle) {
      toast({ variant: "destructive", title: "Error", description: "Please select employee, period, and cycle." });
      return;
    }

    const emp = employees.find(e => e.id === selectedEmployee);
    const mockData: PayslipData = {
      employeeName: emp ? emp.name : "N/A",
      period: selectedPeriod,
      basicSalary: 50000,
      overtimePay: 5000,
      allowances: 2000,
      totalEarnings: 57000,
      taxDeduction: 4000,
      sssDeduction: 1200,
      philhealthDeduction: 800,
      pagibigDeduction: 200,
      totalDeductions: 6200,
      netPay: 50800,
    };

    setPayslipPreview(mockData);
    toast({ title: "Preview Generated", description: `Payslip preview for ${mockData.employeeName} for ${mockData.period}.` });
  };

  const handleSendPayslip = async () => {
    if (!payslipPreview || !selectedEmployee || !selectedPeriod || !selectedCycle) {
      toast({ variant: "destructive", title: "Error", description: "Please generate a preview first." });
      return;
    }

    try {
      const payload = {
        employee_id: Number(selectedEmployee),
        month: new Date().toISOString().split("T")[0], // e.g. "2025-08-01"
        payroll_cycle: selectedCycle,
        period: selectedPeriod,
        business_name: "ADEEVA Clinic", // you can make this dynamic if needed
      };

      await SinglePayslip(payload);

      toast({ title: "Payslip Sent", description: `Payslip for ${payslipPreview.employeeName} emailed successfully.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to send payslip." });
    }
  };

  const handlePrintPayslip = () => {
    if (!payslipPreview) {
      toast({ variant: "destructive", title: "Error", description: "Generate a preview first." });
      return;
    }
    window.print();
    toast({ title: "Printing Payslip", description: "Payslip sent to printer." });
  };

  const handleDownloadPDF = () => {
    if (!payslipPreview) {
      toast({ variant: "destructive", title: "Error", description: "Please generate a preview first before downloading." });
      return;
    }
    toast({ 
      title: "PDF Download Simulated", 
      description: `A PDF for ${payslipPreview.employeeName} for ${payslipPreview.period} would be downloaded here.` 
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Generate & Distribute Payslips</CardTitle>
          <CardDescription>Select employee, payroll cycle, and period to generate payslips.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
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
                  {cycles.map(c => (
                    <SelectItem key={c.id} value={c.cycle_type}>{c.name}</SelectItem>
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
                  {["July 2025", "August 2025", "September 2025"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGeneratePreview} className="w-full bg-primary hover:bg-primary/90">
              <Eye className="mr-2 h-4 w-4" /> Generate Preview
            </Button>
          </div>

          <div className="md:col-span-2">
            {payslipPreview ? (
              <Card className="border-accent shadow-md">
                <CardHeader>
                  <CardTitle className="text-accent">Payslip Preview: {payslipPreview.employeeName}</CardTitle>
                  <CardDescription>Period: {payslipPreview.period}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payslip Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm p-4 border rounded-lg bg-background">
                    <div><strong>Basic Salary:</strong> ₱{payslipPreview.basicSalary.toFixed(2)}</div>
                    <div><strong>Tax Deduction:</strong> ₱{payslipPreview.taxDeduction.toFixed(2)}</div>
                    <div><strong>Overtime Pay:</strong> ₱{payslipPreview.overtimePay.toFixed(2)}</div>
                    <div><strong>SSS Deduction:</strong> ₱{payslipPreview.sssDeduction.toFixed(2)}</div>
                    <div><strong>Allowances:</strong> ₱{payslipPreview.allowances.toFixed(2)}</div>
                    <div><strong>PhilHealth:</strong> ₱{payslipPreview.philhealthDeduction.toFixed(2)}</div>
                    <div className="font-semibold">Total Earnings: ₱{payslipPreview.totalEarnings.toFixed(2)}</div>
                    <div><strong>Pag-IBIG:</strong> ₱{payslipPreview.pagibigDeduction.toFixed(2)}</div>
                    <div></div>
                    <div className="font-semibold">Total Deductions: ₱{payslipPreview.totalDeductions.toFixed(2)}</div>
                  </div>

                  <div className="text-right text-lg font-bold text-primary mt-4 pt-4 border-t">
                    Net Pay: ₱{payslipPreview.netPay.toFixed(2)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-6 justify-end">
                    <Button variant="outline" onClick={handlePrintPayslip}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    <Button onClick={handleSendPayslip} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Mail className="mr-2 h-4 w-4" /> Email Payslip</Button>
                    <Button variant="secondary" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed rounded-lg p-10 bg-muted/50">
                <p className="text-muted-foreground">Select employee, cycle, and period to generate a payslip preview.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Bulk Actions</CardTitle>
          <CardDescription>Generate or distribute payslips for multiple employees at once.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button variant="outline" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary">
            <Send className="mr-2 h-4 w-4" /> Generate All for Period
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Mail className="mr-2 h-4 w-4" /> Email All Generated Payslips
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
