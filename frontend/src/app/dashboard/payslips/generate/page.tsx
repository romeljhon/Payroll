
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
import { FileSearch, Gift, Users, Lock, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAllEmployee, getPayrollCycle, getBusiness, getAllBranchesByBusiness } from "@/lib/api";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

// Interfaces
interface Employee {
  id: string;
  name: string;
}

interface PayrollCycle {
  id: number;
  name: string;
  cycle_type: string;
}

interface Business {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    name: string;
    business: string;
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
  const [selectedBusiness, setSelectedBusiness] = useState<string | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();

  const [payslipPreview, setPayslipPreview] = useState<PayslipData | null>(null);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [canPreview, setCanPreview] = useState(false);
  const [include13th, setInclude13th] = useState(false);

  const { toast } = useToast();
  const { plan } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    // ... (fetch data logic remains the same)
  }, [plan, toast]);

  const filteredBranches = selectedBusiness
    ? branches.filter((branch) => branch.business === selectedBusiness)
    : branches;

  const handleGeneratePayroll = async () => {
    //  ... (logic is unchanged)
  };

  const handlePreviewPayslip = async () => {
    // ... (logic is unchanged)
  };

  const handleRun13thMonth = async () => {
    // ... (logic is unchanged)
  };

  const handleRunBatch = async () => {
    // ... (logic is unchanged)
  };

  if (plan === 'Basic') {
      // ... (unchanged)
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Generate Payroll</h1>
            <p className="text-muted-foreground">Create and review payroll data before distribution.</p>
        </div>
        <Separator />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>1. Select Filters</CardTitle>
                    <CardDescription>Target specific employees or groups.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="business">Business (Optional)</Label>
                      <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                        <SelectTrigger id="business"><SelectValue placeholder="Select business" /></SelectTrigger>
                        <SelectContent>
                          {businesses.map((biz) => (
                            <SelectItem key={biz.id} value={biz.id.toString()}>{biz.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch (Optional)</Label>
                      <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={!selectedBusiness}>
                        <SelectTrigger id="branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                        <SelectContent>
                          {filteredBranches.map((br) => (
                            <SelectItem key={br.id} value={br.id.toString()}>{br.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employee">Employee</Label>
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                         <SelectTrigger id="employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cycle">Payroll Cycle</Label>
                          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                            <SelectTrigger id="cycle"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {cycles.map((c) => (
                                <SelectItem key={c.id} value={c.cycle_type}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="period">Period</Label>
                          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger id="period"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {["2025-07", "2025-08", "2025-09"].map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>2. Choose Action</CardTitle>
                    <CardDescription>Generate data or run batch processes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg border bg-muted/50">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="include13th" className="font-medium">Include 13th Month Pay</Label>
                          <Switch id="include13th" checked={include13th} onCheckedChange={setInclude13th} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Toggle to include in individual previews.</p>
                    </div>
                    <Button onClick={handleGeneratePayroll} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Users className="mr-2 h-4 w-4" /> Generate for Employee
                    </Button>
                    <Button onClick={handlePreviewPayslip} variant="outline" className="w-full">
                      <FileSearch className="mr-2 h-4 w-4" /> Preview Payslip
                    </Button>
                    
                    <Separator />

                    <Button onClick={handleRunBatch} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Users className="mr-2 h-4 w-4" /> Run Batch Generation
                    </Button>
                    <Button onClick={handleRun13thMonth} variant="secondary" className="w-full">
                      <Gift className="mr-2 h-4 w-4" /> Run 13th Month (Batch)
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
            <Card className="shadow-sm sticky top-24">
                <CardHeader>
                    <CardTitle>3. Preview Result</CardTitle>
                    <CardDescription>Review the generated payslip details here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Preview Box remains here and is unchanged */}
                     <div className="w-full p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                        <FileSearch className="mx-auto h-12 w-12" />
                        <p className="mt-4">Payslip preview will appear here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
