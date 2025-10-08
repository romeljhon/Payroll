
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart as PieChartIcon } from "lucide-react"; 
import { Users, Banknote, FileText } from "lucide-react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import Link from "next/link";

const chartData = [
  { month: "January", totalPayroll: 400000, employeesPaid: 10 },
  { month: "February", totalPayroll: 300000, employeesPaid: 8 },
  { month: "March", totalPayroll: 500000, employeesPaid: 12 },
  { month: "April", totalPayroll: 450000, employeesPaid: 11 },
  { month: "May", totalPayroll: 600000, employeesPaid: 15 },
  { month: "June", totalPayroll: 550000, employeesPaid: 14 },
];

const departmentData = [
  { name: 'Engineering', value: 400, fill: 'hsl(var(--chart-1))' },
  { name: 'Sales', value: 300, fill: 'hsl(var(--chart-2))' },
  { name: 'Marketing', value: 300, fill: 'hsl(var(--chart-3))' },
  { name: 'HR', value: 200, fill: 'hsl(var(--chart-4))' },
];

const chartConfig = {
  totalPayroll: {
    label: "Total Payroll",
    color: "hsl(var(--chart-1))",
  },
  employeesPaid: {
    label: "Employees Paid",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">152</div>
            <p className="text-xs text-muted-foreground">+5 since last month</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Payroll This Month</CardTitle>
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱1,253,400.00</div>
            <p className="text-xs text-muted-foreground">Estimated for June</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Payslips Generated</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">148</div>
            <p className="text-xs text-muted-foreground">For May payroll period</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-accent" />
              Payroll Trend (Last 6 Months)
            </CardTitle>
            <CardDescription>Monthly total payroll amount.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₱${value / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="totalPayroll" stroke="var(--color-totalPayroll)" strokeWidth={2} dot={false} />
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-accent" />
              Payroll by Department
            </CardTitle>
            <CardDescription>Distribution of payroll across departments for the current month.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-xs mx-auto">
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={departmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-accent" />
                Quick Actions
            </CardTitle>
            <CardDescription>Access common payroll tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="py-6 text-base" asChild>
                <Link href="/dashboard/computation">Run New Payroll</Link>
            </Button>
            <Button variant="outline" className="py-6 text-base" asChild>
                <Link href="/dashboard/attendance">Import Attendance</Link>
            </Button>
            <Button variant="outline" className="py-6 text-base" asChild>
                <Link href="/dashboard/payslips/generate">Generate Payslips</Link>
            </Button>
            <Button variant="outline" className="py-6 text-base" asChild>
                <Link href="/dashboard/employees">View Employees</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

