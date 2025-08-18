"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useToast } from "@/hooks/use-toast";
import { AddPayrollCycle, getBusiness, getPayrollCycle } from "@/lib/api";

const formSchema = z.object({
  business: z.string().min(1, "Please select a business."),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  cycleType: z.string().min(1, "Please select a cycle type."),
  startDay: z.coerce
    .number()
    .min(1)
    .max(31, { message: "Start day must be between 1 and 31" }),
  endDay: z.coerce
    .number()
    .min(1)
    .max(31, { message: "End day must be between 1 and 31" }),
});

export default function PayrollCyclePage() {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business: "",
      name: "",
      cycleType: "",
      startDay: undefined,
      endDay: undefined,
    },
  });

  // Fetch businesses
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const data = await getBusiness();
        setBusinesses(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch businesses.",
          variant: "destructive",
        });
      }
    }
    fetchBusinesses();
  }, [toast]);

  // Fetch cycles
  useEffect(() => {
    async function fetchCycles() {
      try {
        const data = await getPayrollCycle();
        setCycles(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch payroll cycles.",
          variant: "destructive",
        });
      }
    }
    fetchCycles();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        name: values.name,
        cycle_type: values.cycleType.toUpperCase(),
        start_day: values.startDay,
        end_day: values.endDay,
        is_active: true,
        business: parseInt(values.business, 10),
      };

      await AddPayrollCycle(payload);

      toast({
        title: "Success",
        description: `The payroll cycle "${values.name}" has been successfully added.`,
      });

      form.reset();

      // refresh list
      const data = await getPayrollCycle();
      setCycles(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payroll cycle.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Add Payroll Cycle</CardTitle>
          <CardDescription>
            Define a new payroll cycle for a business entity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Select */}
                <FormField
                  control={form.control}
                  name="business"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a business" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {businesses.map((biz) => (
                            <SelectItem
                              key={biz.id}
                              value={biz.id.toString()}
                            >
                              {biz.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the business for this payroll cycle.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cycle Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Monthly (1st-15th)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a descriptive name for the cycle.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cycle Type */}
                <FormField
                  control={form.control}
                  name="cycleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cycle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="BI-WEEKLY">Bi-Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select how often the payroll runs.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div />

                {/* Start Day */}
                <FormField
                  control={form.control}
                  name="startDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the start day of the payroll cycle.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Day */}
                <FormField
                  control={form.control}
                  name="endDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 15"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the end day of the payroll cycle.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Add Cycle
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Table of cycles */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Payroll Cycles</CardTitle>
          <CardDescription>
            List of existing payroll cycles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Cycle Type</TableHead>
                <TableHead>Start Day</TableHead>
                <TableHead>End Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Business</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.length > 0 ? (
                cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>{cycle.name}</TableCell>
                    <TableCell>{cycle.cycle_type}</TableCell>
                    <TableCell>{cycle.start_day}</TableCell>
                    <TableCell>{cycle.end_day}</TableCell>
                    <TableCell>
                      {cycle.is_active ? "Active" : "Inactive"}
                    </TableCell>
                    <TableCell>{cycle.business_name || cycle.business}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No payroll cycles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
