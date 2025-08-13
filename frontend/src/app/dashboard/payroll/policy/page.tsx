'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useCallback } from 'react';
import { AddPolicy, getBusiness, getPolicys } from '@/lib/api';

/* ----------------------------- Helpers ----------------------------- */
const maxDigitsBefore = (n: number, max: number) => {
  const s = String(n);
  const [intPart] = s.split('.');
  const digits = intPart.replace(/^[-+]/, '');
  return digits.length <= max;
};
const twoDecimalPlaces = (n: number) => Number.isInteger(Math.round(n * 100));
const toMoney = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

/* ------------------------------ Schema ----------------------------- */
const formSchema = z.object({
  business: z.string({ required_error: 'Please select a business.' }).min(1, 'Please select a business.'),
  graceMinutes: z.coerce.number().min(0, { message: 'Grace minutes cannot be negative.' })
    .refine(n => maxDigitsBefore(n, 3), { message: 'Ensure that there are no more than 3 digits before the decimal point.' }),
  standardWorkingDays: z.coerce.number().min(0, { message: 'Standard working days cannot be negative.' })
    .refine(n => maxDigitsBefore(n, 3), { message: 'Ensure that there are no more than 3 digits before the decimal point.' }),
  latePenaltyPerMinute: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 3), { message: 'Ensure that there are no more than 3 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),
  undertimePenaltyPerMinute: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 3), { message: 'Ensure that there are no more than 3 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),
  absentPenaltyPerDay: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 5), { message: 'Ensure that there are no more than 5 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),

  // Multipliers: ≤ 2 digits before decimal, 2 decimals max
  otMultiplier: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 2), { message: 'Ensure that there are no more than 2 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),
  restDayMultiplier: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 2), { message: 'Ensure that there are no more than 2 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),
  holidayRegularMultiplier: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 2), { message: 'Ensure that there are no more than 2 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),
  holidaySpecialMultiplier: z.coerce.number().min(0)
    .refine(n => maxDigitsBefore(n, 2), { message: 'Ensure that there are no more than 2 digits before the decimal point.' })
    .refine(twoDecimalPlaces, { message: 'Must have at most 2 decimal places.' }),
});

type PayrollPolicyFormValues = z.infer<typeof formSchema>;

interface Business {
  id: string | number;
  name: string;
}

/* ------------------------------ Page ------------------------------- */
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

  const reloadPolicies = useCallback(async () => {
    try {
      const data = await getPolicys();
      setPolicyList(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: 'Error fetching policies',
        description: error?.message || 'Failed to load policies',
        variant: 'destructive',
      });
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  // Submit
  async function onSubmit(values: PayrollPolicyFormValues) {
    setSubmitting(true);
    try {
      const selectedBizId = Number(values.business);

      // Prevent duplicates (client-side), still enforced by DRF server-side
      const exists =
        policyList.some(p =>
          // try to match by id if available
          Number(p.business ?? p.business_id) === selectedBizId
          // or fallback to name match if API doesn't include raw id
          || String(p.business_name)?.toLowerCase() ===
             (businessList.find(b => Number(b.id) === selectedBizId)?.name ?? '').toLowerCase()
        );

      if (exists) {
        form.setError('business', { message: 'Payroll policy with this business already exists.' });
        setSubmitting(false);
        return;
      }

      // Payload — stringifying decimals avoids float precision issues with DecimalField
      const payload = {
        business: selectedBizId,
        grace_minutes: values.graceMinutes, // integer ok
        standard_working_days: values.standardWorkingDays, // integer/decimal ok
        late_penalty_per_minute: toMoney(values.latePenaltyPerMinute),
        undertime_penalty_per_minute: toMoney(values.undertimePenaltyPerMinute),
        absent_penalty_per_day: toMoney(values.absentPenaltyPerDay),
        ot_multiplier: toMoney(values.otMultiplier),
        rest_day_multiplier: toMoney(values.restDayMultiplier),
        holiday_regular_multiplier: toMoney(values.holidayRegularMultiplier),
        holiday_special_multiplier: toMoney(values.holidaySpecialMultiplier),
      };

      await AddPolicy(payload);

      toast({
        title: 'Policy Added',
        description: 'The payroll policy was successfully created.',
      });

      form.reset({
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
      });

      await reloadPolicies();
    } catch (e: any) {
      // Try to parse DRF error JSON and map to fields
      let payload: any = null;
      try {
        payload = JSON.parse(e.message);
      } catch {
        /* not JSON */
      }

      if (payload && typeof payload === 'object') {
        const map: Record<string, keyof PayrollPolicyFormValues> = {
          business: 'business',
          grace_minutes: 'graceMinutes',
          standard_working_days: 'standardWorkingDays',
          late_penalty_per_minute: 'latePenaltyPerMinute',
          undertime_penalty_per_minute: 'undertimePenaltyPerMinute',
          absent_penalty_per_day: 'absentPenaltyPerDay',
          ot_multiplier: 'otMultiplier',
          rest_day_multiplier: 'restDayMultiplier',
          holiday_regular_multiplier: 'holidayRegularMultiplier',
          holiday_special_multiplier: 'holidaySpecialMultiplier',
        };

        let anyFieldMapped = false;
        Object.entries(payload).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? String(val[0]) : String(val);
          const fieldName = map[key];
          if (fieldName) {
            form.setError(fieldName, { message: msg });
            anyFieldMapped = true;
          }
        });

        if (!anyFieldMapped) {
          toast({ title: 'Error adding policy', description: e.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Error adding policy', description: e?.message || 'Something went wrong.', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Load businesses
  useEffect(() => {
    (async () => {
      try {
        const data: Business[] = await getBusiness();
        setBusinessList(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: 'Error fetching businesses',
          description: error?.message || 'Failed to load business list',
          variant: 'destructive',
        });
      } finally {
        setLoadingBusinesses(false);
      }
    })();
  }, []);

  // Load policies
  useEffect(() => {
    reloadPolicies();
  }, [reloadPolicies]);

  // Input configs (consistent max/step with schema & DRF)
  const inputs: Array<{
    name: keyof PayrollPolicyFormValues;
    label: string;
    step: string;
    max?: number;
  }> = [
    { name: 'graceMinutes', label: 'Grace minutes', step: '1', max: 999 },
    { name: 'standardWorkingDays', label: 'Standard working days', step: '1', max: 999 },
    { name: 'latePenaltyPerMinute', label: 'Late penalty per minute', step: '0.01', max: 999.99 },
    { name: 'undertimePenaltyPerMinute', label: 'Undertime penalty per minute', step: '0.01', max: 999.99 },
    { name: 'absentPenaltyPerDay', label: 'Absent penalty per day', step: '0.01', max: 99999.99 },
    { name: 'otMultiplier', label: 'OT multiplier', step: '0.01', max: 99.99 },
    { name: 'restDayMultiplier', label: 'Rest day multiplier', step: '0.01', max: 99.99 },
    { name: 'holidayRegularMultiplier', label: 'Holiday regular multiplier', step: '0.01', max: 99.99 },
    { name: 'holidaySpecialMultiplier', label: 'Holiday special multiplier', step: '0.01', max: 99.99 },
  ];

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
                {/* Business */}
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
                            <SelectItem key={String(b.id)} value={String(b.id)}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Numeric fields */}
                {inputs.map((cfg) => (
                  <FormField
                    key={cfg.name}
                    control={form.control}
                    name={cfg.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{cfg.label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={cfg.step}
                            min={0}
                            {...(cfg.max ? { max: cfg.max } : {})}
                            {...field}
                          />
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
        <p className="mt-8">Loading policies...</p>
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
