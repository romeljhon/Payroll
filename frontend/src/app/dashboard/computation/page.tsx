
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Calculator, Save, Upload, Download, Filter, Lock } from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";

interface PayrollRow {
  id: string;
  employeeName: string;
  basicSalary: number;
  daysWorked: number;
  overtimeHours: number;
  deductions: number;
  netPay?: number; // Calculated
}

const initialPayrollData: PayrollRow[] = [
  { id: "1", employeeName: "Alice Wonderland", basicSalary: 50000, daysWorked: 22, overtimeHours: 5, deductions: 2500 },
  { id: "2", employeeName: "Bob The Builder", basicSalary: 45000, daysWorked: 20, overtimeHours: 2, deductions: 2200 },
  { id: "3", employeeName: "Charlie Chaplin", basicSalary: 60000, daysWorked: 22, overtimeHours: 0, deductions: 3000 },
  { id: "4", employeeName: "Diana Prince", basicSalary: 75000, daysWorked: 21, overtimeHours: 10, deductions: 4000 },
];

// Basic calculation logic (Excel-like)
const calculateNetPay = (row: PayrollRow): number => {
  const dailyRate = row.basicSalary / 22; // Assuming 22 working days a month
  const grossPayForDaysWorked = dailyRate * row.daysWorked;
  const overtimeRatePerHour = (dailyRate / 8) * 1.25; // Assuming 8 hours/day, 25% OT premium
  const overtimePay = overtimeRatePerHour * row.overtimeHours;
  const totalGrossPay = grossPayForDaysWorked + overtimePay;
  return totalGrossPay - row.deductions;
};

export default function PayrollComputationPage() {
  const [payrollData, setPayrollData] = useState<PayrollRow[]>([]);
  const [filterTerm, setFilterTerm] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { plan } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (plan === 'Enterprise') {
      setPayrollData(initialPayrollData.map(row => ({ ...row, netPay: calculateNetPay(row) })));
    }
  }, [plan]);

  const handleInputChange = (id: string, field: keyof PayrollRow, value: string | number) => {
    setPayrollData(prevData =>
      prevData.map(row =>
        row.id === id ? { ...row, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value } : row
      )
    );
  };

  const handleRecalculateAll = () => {
    setPayrollData(prevData =>
      prevData.map(row => ({ ...row, netPay: calculateNetPay(row) }))
    );
    toast({ title: "Payroll Recalculated", description: "All net pays have been updated." });
  };

  const handleSaveChanges = () => {
    console.log("Saving payroll data:", payrollData);
    toast({ title: "Changes Saved", description: "Payroll data has been successfully saved." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Import Simulated",
        description: `File "${file.name}" selected. In a real app, this data would be processed.`,
      });
      if(event.target) {
        event.target.value = "";
      }
    }
  };

  const filteredPayrollData = useMemo(() => {
    if (!filterTerm) return payrollData;
    const lowercasedFilterTerm = filterTerm.toLowerCase();
    return payrollData.filter(row =>
      row.employeeName.toLowerCase().includes(lowercasedFilterTerm)
    );
  }, [payrollData, filterTerm]);

  if (plan !== 'Enterprise') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-4">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Feature Locked</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          The <b>Payroll Computation</b> feature is only available on the <b>Enterprise</b> plan. Please upgrade to access this exclusive feature.
        </p>
        <Button onClick={() => router.push('/pricing')}>
          Upgrade to Enterprise
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary">Payroll Computation</CardTitle>
            <CardDescription>Calculate salaries, overtime, and deductions. Resembles a spreadsheet for easy editing.</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" /> Import Data</Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileSelected}
            />
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
            <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <Button onClick={handleRecalculateAll} variant="secondary">
              <Calculator className="mr-2 h-4 w-4" /> Recalculate All
            </Button>
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Filter employees..." 
                className="max-w-xs"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
              <Button variant="outline" size="icon" aria-label="Apply filter"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Employee Name</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead className="text-right">Days Worked</TableHead>
                  <TableHead className="text-right">OT Hours</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrollData.length > 0 ? filteredPayrollData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" value={row.basicSalary} onChange={(e) => handleInputChange(row.id, 'basicSalary', e.target.value)} className="w-28 text-right h-8" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" value={row.daysWorked} onChange={(e) => handleInputChange(row.id, 'daysWorked', e.target.value)} className="w-20 text-right h-8" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" value={row.overtimeHours} onChange={(e) => handleInputChange(row.id, 'overtimeHours', e.target.value)} className="w-20 text-right h-8" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" value={row.deductions} onChange={(e) => handleInputChange(row.id, 'deductions', e.target.value)} className="w-24 text-right h-8" />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {row.netPay !== undefined ? `₱${row.netPay.toFixed(2)}` : 'N/A'}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                       No employees found matching your filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Note: Net Pay is automatically calculated. Click 'Recalculate All' to update after manual changes or 'Save Changes' to persist.</p>
        </CardContent>
      </Card>
    </div>
  );
}
