
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Mock data for a single payslip
const payslipDetails = {
  id: "PYS001",
  payPeriod: "15-06-2024 to 30-06-2024",
  dateGenerated: "01-07-2024",
  netPay: "₱24,500.00",
  status: "Paid",
  employee: {
    name: "John Doe",
    position: "Software Engineer",
  },
  earnings: [
    { description: "Basic Salary", amount: "₱15,000.00" },
    { description: "Overtime Pay", amount: "₱2,500.00" },
    { description: "Holiday Pay", amount: "₱1,000.00" },
  ],
  deductions: [
    { description: "SSS Contribution", amount: "₱1,200.00" },
    { description: "PhilHealth Contribution", amount: "₱800.00" },
    { description: "Pag-IBIG Contribution", amount: "₱500.00" },
    { description: "Withholding Tax", amount: "₱1,500.00" },
  ],
  summary: {
    grossEarnings: "₱18,500.00",
    totalDeductions: "₱4,000.00",
    netPay: "₱14,500.00",
  },
};

export default function DetailedPayslipPage({ params }: { params: { payslipId: string } }) {
  const router = useRouter();
  const payslip = payslipDetails; // In a real app, you would fetch this data based on the payslipId

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Payslip Details</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{payslip.employee.name}</p>
              <p className="text-sm text-muted-foreground">{payslip.employee.position}</p>
            </div>
            <div>
              <p className="font-medium">Pay Period: {payslip.payPeriod}</p>
              <p className="text-sm text-muted-foreground">Date Generated: {payslip.dateGenerated}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold">Earnings</h3>
              <div className="space-y-2">
                {payslip.earnings.map((earning, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{earning.description}</span>
                    <span>{earning.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Deductions</h3>
              <div className="space-y-2">
                {payslip.deductions.map((deduction, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{deduction.description}</span>
                    <span>{deduction.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <div className="w-1/3">
              <div className="flex justify-between">
                <span className="font-semibold">Gross Earnings</span>
                <span>{payslip.summary.grossEarnings}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Deductions</span>
                <span>{payslip.summary.totalDeductions}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Net Pay</span>
                <span>{payslip.summary.netPay}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
