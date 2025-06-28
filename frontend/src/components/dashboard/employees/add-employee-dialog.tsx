"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Employee } from "@/app/dashboard/employees/page";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SetStateAction, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBranches } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------
const addEmployeeSchema = z.object({
  branch: z.string({ required_error: "Branch is required." }),
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(3, { message: "Phone is required." }),
  position: z.string().min(1, { message: "Position is required." }),
  hire_date: z.string().min(1, { message: "Hire date is required." }),
});

type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEmployeeAdded: (employee: Employee) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AddEmployeeDialog({
  isOpen,
  onOpenChange,
  onEmployeeAdded,
}: AddEmployeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const { toast } = useToast();

  const form = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      branch: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      hire_date: "",
    },
  });

  // -------------------------------------------------------------------------
  // Load branches on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    getBranches()
      .then((result: SetStateAction<{ id: number; name: string; }[]>) => setBranches(result))
      .catch((err: { message: any; }) => {
        console.error("Failed to load branches", err);
        toast({
          variant: "destructive",
          title: "Error loading branches",
          description: err.message ?? "Could not fetch branch list.",
        });
      });
  }, [toast]);

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  async function onSubmit(values: AddEmployeeFormValues) {
    setIsSubmitting(true);

    // TODO: replace this simulated delay with an actual POST to your backend
    await new Promise((r) => setTimeout(r, 800));

    // Find the selected branch object for display purposes
    const branchObj = branches.find((b) => b.id === parseInt(values.branch, 10));

    const newEmployee: Employee = {
      id: Date.now(), // <- replace with id from backend once POST is wired up
      branch_name: branchObj?.name ?? "",
      branch: parseInt(values.branch, 10),
      position: values.position,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      hire_date: values.hire_date,
      active: true,
    };

    onEmployeeAdded(newEmployee);
    form.reset();
    setIsSubmitting(false);
  }

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Add Employee</DialogTitle>
          <DialogDescription>
            Fill in the details and click “Save” to add a new employee.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
            {/* Branch */}
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* First & last name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kazue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ezuak" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="kazue@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="123‑456‑7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Position */}
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hire date */}
            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Employee"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}