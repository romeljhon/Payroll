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
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { AddPolicy, getBusiness, getPolicys } from '@/lib/api';

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

interface Business {
  id: string;
  name: string;
}

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

  const [businessList, setBusinessList] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [policyList, setPolicyList] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);

  // ✅ Submit handler
  async function onSubmit(values: PayrollPolicyFormValues) {
    setSubmitting(true);
    try {
      await AddPolicy({
        business: values.business,
        grace_minutes: values.graceMinutes,
        standard_working_days: values.standardWorkingDays,
        late_penalty_per_minute: values.latePenaltyPerMinute,
        undertime_penalty_per_minute: values.undertimePenaltyPerMinute,
        absent_penalty_per_day: values.absentPenaltyPerDay,
        ot_multiplier: values.otMultiplier,
        rest_day_multiplier: values.restDayMultiplier,
        holiday_regular_multiplier: values.holidayRegularMultiplier,
        holiday_special_multiplier: values.holidaySpecialMultiplier,
      });

      toast({
        title: 'Policy Added',
        description: 'The payroll policy was successfully created.',
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error adding policy',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Fetch businesses on mount
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const data: Business[] = await getBusiness();
        setBusinessList(data);
      } catch (error: any) {
        toast({
          title: 'Error fetching businesses',
          description: error.message || 'Failed to load business list',
          variant: 'destructive',
        });
      } finally {
        setLoadingBusinesses(false);
      }
    }
    fetchBusinesses();
  }, []);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const data = await getPolicys();
        setPolicyList(data);
      } catch (error: any) {
        toast({
          title: 'Error fetching policies',
          description: error.message || 'Failed to load policies',
          variant: 'destructive',
        });
      } finally {
        setLoadingPolicies(false);
      }
    }
    fetchPolicies();
  }, []);


  return (

    <>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingBusinesses ? 'Loading...' : 'Select a business'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {businessList.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {[
                  { name: 'graceMinutes', label: 'Grace minutes' },
                  { name: 'standardWorkingDays', label: 'Standard working days' },
                  { name: 'latePenaltyPerMinute', label: 'Late penalty per minute', step: '0.01' },
                  { name: 'undertimePenaltyPerMinute', label: 'Undertime penalty per minute', step: '0.01' },
                  { name: 'absentPenaltyPerDay', label: 'Absent penalty per day', step: '0.01' },
                  { name: 'otMultiplier', label: 'OT multiplier', step: '0.01' },
                  { name: 'restDayMultiplier', label: 'Rest day multiplier', step: '0.01' },
                  { name: 'holidayRegularMultiplier', label: 'Holiday regular multiplier', step: '0.01' },
                  { name: 'holidaySpecialMultiplier', label: 'Holiday special multiplier', step: '0.01' },
                ].map((fieldConfig) => (
                  <FormField
                    key={fieldConfig.name}
                    control={form.control}
                    name={fieldConfig.name as keyof PayrollPolicyFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldConfig.label}</FormLabel>
                        <FormControl>
                          <Input type="number" step={fieldConfig.step || '1'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? 'Adding...' : 'Add Policy'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {loadingPolicies ? (
        <p>Loading policies...</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Business</th>
                <th className="border px-4 py-2">Grace Minutes</th>
                <th className="border px-4 py-2">Working Days</th>
                <th className="border px-4 py-2">Late Penalty</th>
                <th className="border px-4 py-2">Undertime Penalty</th>
                <th className="border px-4 py-2">Absent Penalty</th>
                <th className="border px-4 py-2">OT Multiplier</th>
                <th className="border px-4 py-2">Rest Day Multiplier</th>
                <th className="border px-4 py-2">Holiday Regular Multiplier</th>
                <th className="border px-4 py-2">Holiday Special Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {policyList.length > 0 ? (
                policyList.map((policy) => (
                  <tr key={policy.id}>
                    <td className="border px-4 py-2">{policy.business_name}</td>
                    <td className="border px-4 py-2">{policy.grace_minutes}</td>
                    <td className="border px-4 py-2">{policy.standard_working_days}</td>
                    <td className="border px-4 py-2">{policy.late_penalty_per_minute}</td>
                    <td className="border px-4 py-2">{policy.undertime_penalty_per_minute}</td>
                    <td className="border px-4 py-2">{policy.absent_penalty_per_day}</td>
                    <td className="border px-4 py-2">{policy.ot_multiplier}</td>
                    <td className="border px-4 py-2">{policy.rest_day_multiplier}</td>
                    <td className="border px-4 py-2">{policy.holiday_regular_multiplier}</td>
                    <td className="border px-4 py-2">{policy.holiday_special_multiplier}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="border px-4 py-2 text-center">
                    No policies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
