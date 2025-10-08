"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HolidayPage from "./holidays/page";
import SalaryStructurePage from "./salary-structure/page";
import SalaryComponentPage from "./salary-component/page";
import AddPayrollPolicyPage from "./policy/page";
import PayrollCyclePage from "./cycle/page";

export default function Page() {
  return (
    <div className="w-full bg-card rounded-2xl shadow-lg border p-4 md:p-6">
      <Tabs defaultValue="cycle" className="w-full">
        {/* Tab Buttons */}
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 rounded-xl border bg-muted p-1 h-auto md:h-10">
          <TabsTrigger
            value="cycle"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Payroll Cycle
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Payroll Policy
          </TabsTrigger>
          <TabsTrigger
            value="component"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Salary Component
          </TabsTrigger>
          <TabsTrigger
            value="structure"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Salary Structure
          </TabsTrigger>
          <TabsTrigger
            value="holidays"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Holidays
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="cycle" className="mt-6 space-y-2">
          <PayrollCyclePage />
        </TabsContent>

        <TabsContent value="policy" className="mt-6 space-y-3">
          <AddPayrollPolicyPage />
        </TabsContent>

        <TabsContent value="component" className="mt-6 space-y-2">
          <SalaryComponentPage />
        </TabsContent>

        <TabsContent value="structure" className="mt-6 space-y-2">
          <SalaryStructurePage />
        </TabsContent>

        <TabsContent value="holidays" className="mt-3 space-y-2">
          <HolidayPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
