
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
import { Send, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAllEmployee, getPayrollCycle, getBusiness, getAllBranchesByBusiness } from "@/lib/api";

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

export default function DistributePayslipsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();
  const [selectedCycle, setSelectedCycle] = useState<string | undefined>();
  const [selectedBusiness, setSelectedBusiness] = useState<string | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [isSendingSingle, setIsSendingSingle] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [employeeData, cycleData, businessData, branchData] = await Promise.all([
          getAllEmployee(),
          getPayrollCycle(),
          getBusiness(),
          getAllBranchesByBusiness()
        ]);

        setEmployees(employeeData.map((emp: any) => ({ id: String(emp.id), name: `${emp.first_name} ${emp.last_name}` })));
        setCycles(cycleData);
        setBusinesses(businessData);
        setBranches(branchData);

      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Fetch Error",
          description: err.message || "Could not load initial data.",
        });
      }
    }
    fetchData();
  }, [toast]);

  const filteredBranches = selectedBusiness
    ? branches.filter((branch) => branch.business === selectedBusiness)
    : branches;

  const handleSendSinglePayslip = async () => {
    if (!selectedEmployee || !selectedPeriod || !selectedCycle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select employee, period, and cycle.",
      });
      return;
    }

    setIsSendingSingle(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/send-single-payslip/",
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

      if (!res.ok) throw new Error("Failed to send payslip");

      toast({
        title: "Payslip Sent",
        description: "Payslip has been sent to the employee's email.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send payslip.",
      });
    } finally {
      setIsSendingSingle(false);
    }
  };

  const handleSendBulkPayslips = async () => {
    if (!selectedPeriod || !selectedCycle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select period and cycle.",
      });
      return;
    }

    setIsSendingBulk(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + "/api/send-bulk-payslips/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            month: selectedPeriod,
            cycle_type: selectedCycle,
            business_id: selectedBusiness ? Number(selectedBusiness) : undefined,
            branch_id: selectedBranch ? Number(selectedBranch) : undefined,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to send bulk payslips");

      toast({
        title: "Bulk Payslips Sent",
        description: "Payslips are being sent to all employees.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send bulk payslips.",
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Distribute Payslips</CardTitle>
          <CardDescription>
            Select the period, cycle, and optional filters to send payslips to employees.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selection Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bulk Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Send payslips to all employees matching the selected criteria.
            </p>
            
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
                  ))}\
                </SelectContent>
              </Select>
            </div>

            <hr />

            <Button
              onClick={handleSendBulkPayslips}
              disabled={!selectedPeriod || !selectedCycle || isSendingBulk}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Users className="mr-2 h-4 w-4" /> 
              {isSendingBulk ? 'Sending...' : 'Send Bulk Payslips'}
            </Button>
          </div>

          {/* Single Send Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Single Employee</h3>
             <p className="text-sm text-muted-foreground">
              Send a payslip to a specific employee.
            </p>
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}\
                </SelectContent>
              </Select>
            </div>
            
            <hr />

            <Button
              onClick={handleSendSinglePayslip}
              disabled={!selectedEmployee || !selectedPeriod || !selectedCycle || isSendingSingle}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" /> 
              {isSendingSingle ? 'Sending...' : 'Send Single Payslip'}
            </Button>
          </div>
          
            {/* Global selectors */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-4 border-t">
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
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
