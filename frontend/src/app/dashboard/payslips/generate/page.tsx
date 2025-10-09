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
import {
  getAllEmployee,
  getPayrollCycle,
  getBusiness,
  getAllBranchesByBusiness,
  generatePayroll,
  previewPayslip,
  run13thMonth,
  runBatchGeneration,
} from "@/lib/api";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

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
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [selectedPeriod, setSelectedPeriod] = useState<string>();
  const [selectedCycle, setSelectedCycle] = useState<string>();
  const [selectedBusiness, setSelectedBusiness] = useState<string>();
  const [selectedBranch, setSelectedBranch] = useState<string>();

  const [payslipPreview, setPayslipPreview] = useState<PayslipData | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [include13th, setInclude13th] = useState(false);

  const { toast } = useToast();
  const { plan } = useSubscription();
  const router = useRouter();

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, cycleRes, bizRes] = await Promise.all([
          getAllEmployee(),
          getPayrollCycle(),
          getBusiness(),
        ]);

        setEmployees(empRes?.data || []);
        setCycles(cycleRes?.data || []);
        setBusinesses(bizRes?.data || []);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error",
          description: "Could not load required data. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (plan !== "Basic") fetchData();
  }, [plan, toast]);

  // Load branches when business changes
  useEffect(() => {
    if (!selectedBusiness) {
      setBranches([]);
      return;
    }

    getAllBranchesByBusiness(selectedBusiness)
      .then((res) => setBranches(res?.data || []))
      .catch((err) => {
        console.error("Failed to fetch branches:", err);
        toast({
          title: "Error",
          description: "Could not load branches for the selected business.",
          variant: "destructive",
        });
      });
  }, [selectedBusiness, toast]);

  const handleGeneratePayroll = async () => {
    if (!selectedEmployee || !selectedPeriod || !selectedCycle) {
      toast({
        title: "Missing Information",
        description: "Please select an employee, period, and cycle.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await generatePayroll(
        selectedEmployee,
        selectedPeriod,
        selectedCycle,
        include13th
      );
      setPayslipPreview(response?.data || null);
      toast({
        title: "Payroll Generated",
        description: "Payroll data has been successfully generated.",
      });
    } catch (error) {
      console.error("Payroll generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate payroll. Please check your selections.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewPayslip = async () => {
    if (!selectedEmployee || !selectedPeriod || !selectedCycle) {
      toast({
        title: "Missing Information",
        description: "Please select an employee, period, and cycle to preview.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await previewPayslip(
        selectedEmployee,
        selectedPeriod,
        selectedCycle,
        include13th
      );
      setPayslipPreview(response?.data || null);
      toast({
        title: "Preview Loaded",
        description: "Payslip preview has been successfully loaded.",
      });
    } catch (error) {
      console.error("Payslip preview failed:", error);
      toast({
        title: "Preview Failed",
        description: "Could not load payslip preview.",
        variant: "destructive",
      });
    }
  };

  const handleRun13thMonth = async () => {
    if (!selectedPeriod) {
      toast({
        title: "Missing Period",
        description: "Please select a period to run 13th month pay.",
        variant: "destructive",
      });
      return;
    }

    try {
      await run13thMonth(selectedPeriod, selectedBusiness, selectedBranch);
      toast({
        title: "13th Month Processed",
        description: `Successfully ran 13th month pay for ${selectedPeriod}.`,
      });
    } catch (error) {
      console.error("13th month run failed:", error);
      toast({
        title: "Process Failed",
        description: "Could not run 13th month pay.",
        variant: "destructive",
      });
    }
  };

  const handleRunBatch = async () => {
    if (!selectedPeriod || !selectedCycle) {
      toast({
        title: "Missing Information",
        description: "Please select a period and cycle for batch generation.",
        variant: "destructive",
      });
      return;
    }

    try {
      await runBatchGeneration(
        selectedPeriod,
        selectedCycle,
        selectedBusiness,
        selectedBranch
      );
      toast({
        title: "Batch Generation Started",
        description: "Payroll generation for the selected group has begun.",
      });
    } catch (error) {
      console.error("Batch run failed:", error);
      toast({
        title: "Batch Failed",
        description: "Could not start batch generation.",
        variant: "destructive",
      });
    }
  };

  if (plan === "Basic") {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <Lock className="w-16 h-16 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Feature Locked</h2>
        <p className="text-muted-foreground max-w-md mt-2">
          Payroll generation is a premium feature. Please upgrade your plan to
          access it.
        </p>
        <Button
          onClick={() => router.push("/dashboard/subscription")}
          className="mt-6"
        >
          Upgrade Plan <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Generate Payroll
        </h1>
        <p className="text-muted-foreground">
          Create and review payroll data before distribution.
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>1. Select Filters</CardTitle>
              <CardDescription>
                Target specific employees or groups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business */}
              <div>
                <Label htmlFor="business">Business (Optional)</Label>
                <Select
                  value={selectedBusiness}
                  onValueChange={setSelectedBusiness}
                >
                  <SelectTrigger id="business">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {(businesses ?? []).map((biz) => (
                      <SelectItem key={biz.id} value={biz.id.toString()}>
                        {biz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch */}
              <div>
                <Label htmlFor="branch">Branch (Optional)</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                  disabled={!selectedBusiness}
                >
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {(branches ?? []).map((br) => (
                      <SelectItem key={br.id} value={br.id.toString()}>
                        {br.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}
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
                    {(employees ?? []).map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cycle */}
                <div>
                  <Label htmlFor="cycle">Payroll Cycle</Label>
                  <Select
                    value={selectedCycle}
                    onValueChange={setSelectedCycle}
                  >
                    <SelectTrigger id="cycle">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(cycles ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.cycle_type}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period */}
                <div>
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Select" />
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
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>2. Choose Action</CardTitle>
              <CardDescription>
                Generate data or run batch processes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include13th" className="font-medium">
                    Include 13th Month Pay
                  </Label>
                  <Switch
                    id="include13th"
                    checked={include13th}
                    onCheckedChange={setInclude13th}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toggle to include in individual previews.
                </p>
              </div>

              <Button
                onClick={handleGeneratePayroll}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Users className="mr-2 h-4 w-4" /> Generate for Employee
              </Button>

              <Button
                onClick={handlePreviewPayslip}
                variant="outline"
                className="w-full"
              >
                <FileSearch className="mr-2 h-4 w-4" /> Preview Payslip
              </Button>

              <Separator />

              <Button
                onClick={handleRunBatch}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Users className="mr-2 h-4 w-4" /> Run Batch Generation
              </Button>

              <Button
                onClick={handleRun13thMonth}
                variant="secondary"
                className="w-full"
              >
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
              <CardDescription>
                Review the generated payslip details here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payslipPreview ? (
                <pre className="text-left bg-muted p-4 rounded-md overflow-x-auto text-sm">
                  {JSON.stringify(payslipPreview, null, 2)}
                </pre>
              ) : (
                <div className="w-full p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                  <FileSearch className="mx-auto h-12 w-12" />
                  <p className="mt-4">Payslip preview will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
