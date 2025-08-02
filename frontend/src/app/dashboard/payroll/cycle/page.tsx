
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  business: z.string({
    required_error: "Please select a business.",
  }).min(1, "Please select a business."),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  cycleType: z.string({
    required_error: "Please select a cycle type.",
  }).min(1, "Please select a cycle type."),
  startDay: z.coerce.number().min(1, {
    message: "Start day is required.",
  }).max(31, { message: "Start day cannot be greater than 31." }),
  endDay: z.coerce.number().min(1, {
    message: "End day is required.",
  }).max(31, { message: "End day cannot be greater than 31." }),
});

export default function PayrollCyclePage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        business: undefined,
        name: "",
        cycleType: undefined,
        startDay: undefined,
        endDay: undefined,
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    console.log(values);
    toast({
      title: "Payroll Cycle Created",
      description: `The payroll cycle "${values.name}" has been successfully added.`,
    });
    form.reset();
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-primary">Add Payroll Cycle</CardTitle>
        <CardDescription>Define a new payroll cycle for a business entity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="business"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a business" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {/* Replace with actual business data */}
                        <SelectItem value="PayEase Corp">PayEase Corp</SelectItem>
                        <SelectItem value="Wayne Enterprises">Wayne Enterprises</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Select the business for this payroll cycle.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cycle Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Monthly (1st-15th)" {...field} />
                    </FormControl>
                    <FormDescription>
                        Enter a descriptive name for the cycle.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="cycleType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cycle Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select cycle type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
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
                <FormField
                control={form.control}
                name="startDay"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Day</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>
                        Enter the start day of the payroll cycle.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="endDay"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Day</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 15" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>
                        Enter the end day of the payroll cycle.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Add Cycle</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
