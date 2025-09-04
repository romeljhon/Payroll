"use client";

import { useEffect, useState } from "react";
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
  Card,
  CardContent,
  CardFooter,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddHolidays, DeleteHolidays, getHolidays, UpdateHolidays } from "@/lib/api";

/* ------------------------- 1. Schema ------------------------- */
const holidaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["REGULAR", "SPECIAL"]),
  multiplier: z.string().min(1, "Multiplier is required"),
  is_national: z.boolean(),
});
type HolidayFormValues = z.infer<typeof holidaySchema>;

/* ------------------------- 2. Component ------------------------- */
export default function HolidayPage() {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: "",
      date: "",
      type: "REGULAR",
      multiplier: "",
      is_national: false,
    },
  });

  /* ------------------------- Load holidays ------------------------- */
  async function fetchHolidays() {
    setLoading(true);
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to load holidays",
        description: err.message ?? "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* ------------------------- Submit ------------------------- */
  async function onSubmit(values: HolidayFormValues) {
    setSaving(true);
    try {
      if (editingId) {
        // ✅ Update
        await UpdateHolidays(editingId, values);
        toast({
          title: "Holiday Updated",
          description: `${values.name} updated successfully.`,
        });
      } else {
        // ✅ Create
        await AddHolidays(values);
        toast({
          title: "Holiday Created",
          description: `${values.name} added successfully.`,
        });
      }

      form.reset();
      setEditingId(null);
      await fetchHolidays();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message ?? "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------- Delete ------------------------- */
  async function handleDelete(id: number) {
    try {
      await DeleteHolidays(id);
      toast({ title: "Holiday Deleted" });
      await fetchHolidays();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message ?? "Something went wrong.",
      });
    }
  }

  /* ------------------------- Edit ------------------------- */
  function handleEdit(holiday: any) {
    setEditingId(holiday.id);
    form.reset({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      multiplier: holiday.multiplier,
      is_national: holiday.is_national,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* -------------------- Form -------------------- */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">
            {editingId ? "Edit Holiday" : "Create Holiday"}
          </CardTitle>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <CardContent className="space-y-1">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Holiday name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REGULAR">REGULAR</SelectItem>
                          <SelectItem value="SPECIAL">SPECIAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Multiplier */}
              <FormField
                control={form.control}
                name="multiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multiplier</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* National Holiday */}
              <FormField
                control={form.control}
                name="is_national"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <FormLabel>Is National?</FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="space-x-2">
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingId ? (
                  "Update Holiday"
                ) : (
                  "Create Holiday"
                )}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* -------------------- List -------------------- */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Holiday List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>National</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No holidays found.
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>{holiday.date}</TableCell>
                      <TableCell>{holiday.type}</TableCell>
                      <TableCell>{holiday.multiplier}</TableCell>
                      <TableCell>{holiday.is_national ? "Yes" : "No"}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(holiday)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
