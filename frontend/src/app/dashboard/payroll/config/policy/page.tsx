"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import {
  AddPolicy,
  getBusiness,
  getPolicys,
  UpdatePolicy,
  DeletePolicy,
} from "@/lib/api";

/* ---------------- helpers ---------------- */
const maxDigitsBefore = (n: number, max: number) => {
  const s = String(n);
  const [intPart] = s.split(".");
  const digits = intPart.replace(/^[-+]/, "");
  return digits.length <= max;
};
const twoDecimalPlaces = (n: number) => Number.isInteger(Math.round(n * 100));
const toMoney = (n: number) =>
  Number.isFinite(n) ? n.toFixed(2) : "0.00";

/* ---------------- schema ---------------- */
const formSchema = z.object({
  business: z
    .string({ required_error: "Please select a business." })
    .min(1, "Please select a business."),
  graceMinutes: z.coerce
    .number()
    .min(0, { message: "Grace minutes cannot be negative." })
    .refine((n) => maxDigitsBefore(n, 3)),
  standardWorkingDays: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 3)),
  latePenaltyPerMinute: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 3))
    .refine(twoDecimalPlaces),
  undertimePenaltyPerMinute: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 3))
    .refine(twoDecimalPlaces),
  absentPenaltyPerDay: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 5))
    .refine(twoDecimalPlaces),
  otMultiplier: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 2))
    .refine(twoDecimalPlaces),
  restDayMultiplier: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 2))
    .refine(twoDecimalPlaces),
  holidayRegularMultiplier: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 2))
    .refine(twoDecimalPlaces),
  holidaySpecialMultiplier: z.coerce
    .number()
    .min(0)
    .refine((n) => maxDigitsBefore(n, 2))
    .refine(twoDecimalPlaces),
});

type PayrollPolicyFormValues = z.infer<typeof formSchema>;
interface Business {
  id: string | number;
  name: string;
}

/* ---------------- page ---------------- */
export default function AddPayrollPolicyPage() {
  const form = useForm<PayrollPolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business: "",
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

  const [editId, setEditId] = useState<number | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);

  const reloadPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    try {
      const data = await getPolicys();
      setPolicyList(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching policies",
        description: "Could not retrieve policy data.",
        variant: "destructive",
      });
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  // submit add / update
  async function onSubmit(values: PayrollPolicyFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        business: Number(values.business),
        grace_minutes: values.graceMinutes,
        standard_working_days: values.standardWorkingDays,
        late_penalty_per_minute: toMoney(values.latePenaltyPerMinute),
        undertime_penalty_per_minute: toMoney(values.undertimePenaltyPerMinute),
        absent_penalty_per_day: toMoney(values.absentPenaltyPerDay),
        ot_multiplier: toMoney(values.otMultiplier),
        rest_day_multiplier: toMoney(values.restDayMultiplier),
        holiday_regular_multiplier: toMoney(values.holidayRegularMultiplier),
        holiday_special_multiplier: toMoney(values.holidaySpecialMultiplier),
      };

      if (editId) {
        await UpdatePolicy(String(editId), payload);
        toast({ title: "Policy Updated", description: "Policy successfully updated." });
        setEditId(null);
      } else {
        await AddPolicy(payload);
        toast({ title: "Policy Added", description: "Policy successfully created." });
      }

      form.reset();
      await reloadPolicies();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // delete handler
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    try {
      await DeletePolicy(id);
      toast({ title: "Policy Deleted", description: "Policy successfully deleted." });
      await reloadPolicies();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Could not delete the policy.",
        variant: "destructive",
      });
    }
  }

  // edit handler
  function handleEdit(policy: any) {
    setEditId(policy.id);
    form.reset({
      business: String(policy.business),
      graceMinutes: Number(policy.grace_minutes),
      standardWorkingDays: Number(policy.standard_working_days),
      latePenaltyPerMinute: Number(policy.late_penalty_per_minute),
      undertimePenaltyPerMinute: Number(policy.undertime_penalty_per_minute),
      absentPenaltyPerDay: Number(policy.absent_penalty_per_day),
      otMultiplier: Number(policy.ot_multiplier),
      restDayMultiplier: Number(policy.rest_day_multiplier),
      holidayRegularMultiplier: Number(policy.holiday_regular_multiplier),
      holidaySpecialMultiplier: Number(policy.holiday_special_multiplier),
    });
  }

  /* load business + policies */
  useEffect(() => {
    (async () => {
      try {
        const data: Business[] = await getBusiness();
        setBusinessList(data || []);
      } catch (error: any) {
        toast({
          title: "Error fetching businesses",
          description: "Could not retrieve business data.",
          variant: "destructive",
        });
      } finally {
        setLoadingBusinesses(false);
      }
    })();
  }, []);

  useEffect(() => {
    reloadPolicies();
  }, [reloadPolicies]);

  const inputs = [
    { name: "graceMinutes", label: "Grace minutes", step: "1", max: 999 },
    { name: "standardWorkingDays", label: "Standard working days", step: "1", max: 999 },
    { name: "latePenaltyPerMinute", label: "Late penalty per minute", step: "0.01", max: 999.99 },
    { name: "undertimePenaltyPerMinute", label: "Undertime penalty per minute", step: "0.01", max: 999.99 },
    { name: "absentPenaltyPerDay", label: "Absent penalty per day", step: "0.01", max: 99999.99 },
    { name: "otMultiplier", label: "OT multiplier", step: "0.01", max: 99.99 },
    { name: "restDayMultiplier", label: "Rest day multiplier", step: "0.01", max: 99.99 },
    { name: "holidayRegularMultiplier", label: "Holiday regular multiplier", step: "0.01", max: 99.99 },
    { name: "holidaySpecialMultiplier", label: "Holiday special multiplier", step: "0.01", max: 99.99 },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* form */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-primary">
            {editId ? "Edit Payroll Policy" : "Add Payroll Policy"}
          </CardTitle>
          <CardDescription>
            {editId ? "Update the payroll policy details." : "Configure the payroll policies for a business entity."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Business */}
                <FormField
                  control={form.control}
                  name="business"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Business</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingBusinesses ? "Loading..." : "Select a business"} />
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

              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? "Saving..." : editId ? "Update Policy" : "Add Policy"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* policies list */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Existing Policies</h2>
        {loadingPolicies ? (
          <p className="text-muted-foreground">Loading policies...</p>
        ) : policyList.length > 0 ? (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            {policyList.map((policy) => (
              <Card
                key={policy.id}
                className="shadow-md bg-background text-foreground border border-border"
              >
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <CardTitle className="text-primary">{policy.business_name}</CardTitle>
                    <CardDescription>Payroll Policy Details</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                    >
                      {expandedPolicy === policy.id ? "Hide Details" : "View Details"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(policy)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(policy.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                {expandedPolicy === policy.id && (
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
                      <div><span className="font-medium">Grace Minutes:</span> {policy.grace_minutes}</div>
                      <div><span className="font-medium">Working Days:</span> {policy.standard_working_days}</div>
                      <div><span className="font-medium">Late Penalty/min:</span> {policy.late_penalty_per_minute}</div>
                      <div><span className="font-medium">Undertime Penalty/min:</span> {policy.undertime_penalty_per_minute}</div>
                      <div><span className="font-medium">Absent Penalty/day:</span> {policy.absent_penalty_per_day}</div>
                      <div><span className="font-medium">OT Multiplier:</span> {policy.ot_multiplier}</div>
                      <div><span className="font-medium">Rest Day Multiplier:</span> {policy.rest_day_multiplier}</div>
                      <div><span className="font-medium">Holiday Regular Multiplier:</span> {policy.holiday_regular_multiplier}</div>
                      <div><span className="font-medium">Holiday Special Multiplier:</span> {policy.holiday_special_multiplier}</div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            No policies found
          </Card>
        )}
      </div>
    </div>
  );
}
