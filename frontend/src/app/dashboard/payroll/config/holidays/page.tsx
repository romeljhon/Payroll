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
import { Loader2, Trash, Pencil, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddHolidays, DeleteHolidays, getHolidays, UpdateHolidays } from "@/lib/api";
import { useMediaQuery } from "@/hooks/use-media-query";

const holidaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["REGULAR", "SPECIAL"]),
  multiplier: z.string().min(1, "Multiplier is required"),
  is_national: z.boolean(),
});
type HolidayFormValues = z.infer<typeof holidaySchema>;

export default function HolidayPage() {
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set());

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

  async function onSubmit(values: HolidayFormValues) {
    setSaving(true);
    try {
      if (editingId) {
        await UpdateHolidays(editingId, values);
        toast({ title: "Holiday Updated", description: `${values.name} updated successfully.` });
      } else {
        await AddHolidays(values);
        toast({ title: "Holiday Created", description: `${values.name} added successfully.` });
      }
      form.reset();
      setEditingId(null);
      await fetchHolidays();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message ?? "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await DeleteHolidays(id);
      toast({ title: "Holiday Deleted" });
      await fetchHolidays();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message ?? "Something went wrong." });
    }
  }

  function handleEdit(holiday: any) {
    setEditingId(holiday.id);
    form.reset({ ...holiday });
  }
  
  const toggleRowExpansion = (id: any) => {
    setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        return newSet;
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">
            {editingId ? "Edit Holiday" : "Create Holiday"}
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <CardContent className="space-y-4 flex-grow">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Holiday name" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="REGULAR">REGULAR</SelectItem><SelectItem value="SPECIAL">SPECIAL</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="multiplier" render={({ field }) => (<FormItem><FormLabel>Multiplier</FormLabel><FormControl><Input placeholder="e.g. 1.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="is_national" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} /></FormControl><FormLabel>Is National?</FormLabel></FormItem>)} />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" className="w-full sm:w-auto flex-grow bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? "Update Holiday" : "Create Holiday"}
              </Button>
              {editingId && <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { form.reset(); setEditingId(null); }}>Cancel</Button>}
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader><CardTitle className="text-2xl text-primary">Holiday List</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] sm:hidden"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Multiplier</TableHead>
                    <TableHead className="hidden sm:table-cell">National</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.length === 0 ? (
                    <TableRow><TableCell colSpan={isDesktop ? 7 : 4} className="text-center py-10">No holidays found.</TableCell></TableRow>
                  ) : (
                    holidays.map((holiday) => (
                      <>
                        <TableRow key={holiday.id}>
                          <TableCell className="sm:hidden"><Button size="icon" variant="ghost" onClick={() => toggleRowExpansion(holiday.id)}><ChevronDown className={`h-4 w-4 transition-transform ${expandedRows.has(holiday.id) ? 'rotate-180' : ''}`} /></Button></TableCell>
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell>{holiday.date}</TableCell>
                          <TableCell className="hidden sm:table-cell">{holiday.type}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right">{holiday.multiplier}</TableCell>
                          <TableCell className="hidden sm:table-cell">{holiday.is_national ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(holiday)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="destructive" onClick={() => handleDelete(holiday.id)}><Trash className="h-4 w-4" /></Button></div></TableCell>
                        </TableRow>
                        {expandedRows.has(holiday.id) && !isDesktop && (
                           <TableRow><TableCell colSpan={4} className="p-4 bg-muted/30"><div className="grid grid-cols-2 gap-4 text-sm"><div className="font-medium">Type</div><div>{holiday.type}</div><div className="font-medium">Multiplier</div><div>{holiday.multiplier}</div><div className="font-medium">National</div><div>{holiday.is_national ? "Yes" : "No"}</div></div></TableCell></TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}