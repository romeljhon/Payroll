
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, Search } from "lucide-react"; // Removed Filter icon as it's not used directly
import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subMonths, format, getYear, parseISO } from "date-fns";

interface PayslipHistoryEntry {
  id: string;
  period: string; // e.g., "June 2024"
  dateGenerated: string; // ISO string e.g., "2024-07-05"
  netPay: number;
  status: "Viewed" | "Unread";
}

const initialPayslipHistory: PayslipHistoryEntry[] = [
  { id: "1", period: "June 2024", dateGenerated: "2024-06-05", netPay: 50800.50, status: "Viewed" },
  { id: "2", period: "May 2024", dateGenerated: "2024-05-05", netPay: 49500.75, status: "Viewed" },
  { id: "3", period: "April 2024", dateGenerated: "2024-04-05", netPay: 51200.00, status: "Unread" },
  { id: "4", period: "March 2024", dateGenerated: "2024-03-05", netPay: 48000.20, status: "Viewed" },
  { id: "5", period: "February 2024", dateGenerated: "2024-02-05", netPay: 50000.00, status: "Viewed" },
  { id: "6", period: "January 2024", dateGenerated: "2024-01-05", netPay: 49000.00, status: "Viewed" },
  { id: "7", period: "December 2023", dateGenerated: "2023-12-05", netPay: 52000.00, status: "Viewed" },
];

export default function PayslipHistoryPage() {
  const [payslips] = useState<PayslipHistoryEntry[]>(initialPayslipHistory);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all-time");
  const [employeeName, setEmployeeName] = useState("Employee");


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setEmployeeName(storedEmail.split('@')[0] || "Employee");
      }
    }
  }, []);

  const filteredPayslips = useMemo(() => {
    let result = payslips;

    // Filter by search term (period)
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      result = result.filter(payslip =>
        payslip.period.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    // Filter by date range
    if (dateFilter !== "all-time") {
      const now = new Date();
      result = result.filter(payslip => {
        const payslipDate = parseISO(payslip.dateGenerated);
        switch (dateFilter) {
          case "last-3-months":
            return payslipDate >= subMonths(now, 3);
          case "last-6-months":
            return payslipDate >= subMonths(now, 6);
          case "this-year":
            return getYear(payslipDate) === getYear(now);
          default:
            return true;
        }
      });
    }

    return result;
  }, [payslips, searchTerm, dateFilter]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <CardTitle className="text-primary">My Payslip History</CardTitle>
            <CardDescription>Access and download your past payslips, {employeeName}.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by period..." 
                className="pl-10 w-full" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Payroll Period</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayslips.length > 0 ? filteredPayslips.map((payslip) => (
                <TableRow key={payslip.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{payslip.period}</TableCell>
                  <TableCell>{format(parseISO(payslip.dateGenerated), "yyyy-MM-dd")}</TableCell>
                  <TableCell className="text-right">₱{payslip.netPay.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payslip.status === 'Viewed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {payslip.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" className="hover:border-accent hover:text-accent">
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="hover:border-primary hover:text-primary">
                      <Download className="mr-1 h-4 w-4" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No payslips found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-6 bg-secondary/50 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-primary mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground">
          If you have any questions about your payslips or find any discrepancies, please contact the HR department or your manager.
          You can typically find contact information in your employee handbook or company portal.
        </p>
      </div>
    </div>
  );
}

    