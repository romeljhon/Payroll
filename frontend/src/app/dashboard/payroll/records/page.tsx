"use client";

import React, { useEffect, useState } from "react";
import { getRecords } from "@/lib/api"; // adjust path to your api file
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
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getRecords();
        setRecords(data);
      } catch (err: any) {
        setError(err.message || "Failed to load records");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payroll Records</h1>

      {loading && <p>Loading records...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
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
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.employee_name}</TableCell>
                  <TableCell>
                    {new Date(record.month).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </TableCell>
                  <TableCell>
                    {record.component_name} ({record.component_type})
                  </TableCell>
                  <TableCell>{Number(record.amount).toFixed(2)}</TableCell>
                  <TableCell>{record.is_13th_month ? "Yes" : "No"}</TableCell>
                  <TableCell>{record.payroll_cycle}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default PayrollRecordsPage;
