import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PayrollRecordsPage = () => {
  const payrollRecords = [
 {
 employee: "kazura ezcak",
 month: "July 1, 2025",
 component: "manager (EARNING)",
 amount: 12.00,
 is13thMonth: true,
 payrollCycle: "Monthly",
    },
    // Add more sample data as needed
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payroll Records</h1>
      <Table>
        <TableCaption>A list of recent payroll records.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Component</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Is 13th Month</TableHead>
            <TableHead>Payroll Cycle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollRecords.map((record, index) => (
            <TableRow key={index}>
              {/* <TableCell>{record.employeeName}</TableCell> */}
              {/* <TableCell>{record.payPeriod}</TableCell> */}
              <TableCell>{record.component}</TableCell>
              <TableCell>{record.amount.toFixed(2)}</TableCell>
              <TableCell>{record.is13thMonth ? 'Yes' : 'No'}</TableCell>
              <TableCell>{record.payrollCycle}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayrollRecordsPage;