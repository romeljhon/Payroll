'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast, useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  business: z.string({
    required_error: 'Please select a business.',
  }),
  graceMinutes: z.coerce.number().min(0, { message: 'Grace minutes cannot be negative.' }),
  standardWorkingDays: z.coerce.number().min(0, { message: 'Standard working days cannot be negative.' }),
  latePenaltyPerMinute: z.coerce.number().min(0, { message: 'Late penalty per minute cannot be negative.' }),
  undertimePenaltyPerMinute: z.coerce.number().min(0, { message: 'Undertime penalty per minute cannot be negative.' }),
  absentPenaltyPerDay: z.coerce.number().min(0, { message: 'Absent penalty per day cannot be negative.' }),
  otMultiplier: z.coerce.number().min(0, { message: 'OT multiplier cannot be negative.' }),
  restDayMultiplier: z.coerce.number().min(0, { message: 'Rest day multiplier cannot be negative.' }),
  holidayRegularMultiplier: z.coerce.number().min(0, { message: 'Holiday regular multiplier cannot be negative.' }),
  holidaySpecialMultiplier: z.coerce.number().min(0, { message: 'Holiday special multiplier cannot be negative.' }),
});

type PayrollPolicyFormValues = z.infer<typeof formSchema>;

// Dummy data for the business dropdown
const businesses = [
  { id: '1', name: 'Business A' },
  { id: '2', name: 'Business B' },
  { id: '3', name: 'Business C' },
];

export default function AddPayrollPolicyPage() {
  const form = useForm<PayrollPolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business: '',
      graceMinutes: 0,
      standardWorkingDays: 0,
      latePenaltyPerMinute: 0,
      undertimePenaltyPerMinute: 0,
      absentPenaltyPerDay: 0,
      otMultiplier: 0,
      restDayMultiplier: 0,
      holidayRegularMultiplier: 0,
      holidaySpecialMultiplier: 0,
    },
  });

  function onSubmit(values: PayrollPolicyFormValues) {
    // Do something with the form values.
    // This can be type-safe and validated.
    console.log(values);
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-primary">Add Payroll Policy</CardTitle>
        <CardDescription>Configure the payroll policies for a business entity.</CardDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a business" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="graceMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace minutes</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standardWorkingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard working days</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="latePenaltyPerMinute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late penalty per minute</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="undertimePenaltyPerMinute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Undertime penalty per minute</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="absentPenaltyPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Absent penalty per day</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OT multiplier</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restDayMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rest day multiplier</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="holidayRegularMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday regular multiplier</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="holidaySpecialMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday special multiplier</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Add Policy</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}