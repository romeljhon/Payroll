
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { useRolesAndPermissions } from "@/hooks/roles-and-permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Mock data for payslips
const payslips = [
  {
    id: "PYS001",
    payPeriod: "15-06-2024 to 30-06-2024",
    dateGenerated: "01-07-2024",
    netPay: "₱24,500.00",
    status: "Paid",
  },
  {
    id: "PYS002",
    payPeriod: "01-06-2024 to 15-06-2024",
    dateGenerated: "16-06-2024",
    netPay: "₱24,500.00",
    status: "Paid",
  },
  {
    id: "PYS003",
    payPeriod: "15-05-2024 to 31-05-2024",
    dateGenerated: "01-06-2024",
    netPay: "₱23,900.00",
    status: "Paid",
  },
  {
    id: "PYS004",
    payPeriod: "01-05-2024 to 15-05-2024",
    dateGenerated: "16-05-2024",
    netPay: "₱24,500.00",
    status: "Paid",
  },
];

export default function MyPayslipsPage() {
  const { role, permissions } = useRolesAndPermissions();
  const router = useRouter();

  useEffect(() => {
    // Redirect if the user is not an employee
    if (role !== 'employee') {
      router.push('/dashboard');
    }
  }, [role, router]);

  const handleViewPayslip = (payslipId: string) => {
    router.push(`/dashboard/my-payslips/${payslipId}`);
  };

  // Render a loading state or null while redirecting
  if (role !== 'employee') {
    return null;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Payslips</CardTitle>
          <CardDescription>View and download your payslip history.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Date Generated</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">{payslip.payPeriod}</TableCell>
                    <TableCell>{payslip.dateGenerated}</TableCell>
                    <TableCell className="text-right font-mono">{payslip.netPay}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={payslip.status === "Paid" ? "success" : "secondary"}>
                        {payslip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" aria-label="View payslip" onClick={() => handleViewPayslip(payslip.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Download payslip">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
