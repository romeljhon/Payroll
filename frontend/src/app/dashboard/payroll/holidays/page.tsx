
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: "Regular" | "Special Non-Working";
  multiplier: number;
  isNational: boolean;
}

const initialHolidays: Holiday[] = [
  { id: "1", name: "New Year's Day", date: new Date("2024-01-01"), type: "Regular", multiplier: 2.0, isNational: true },
  { id: "2", name: "Labor Day", date: new Date("2024-05-01"), type: "Regular", multiplier: 2.0, isNational: true },
  { id: "3", name: "Ninoy Aquino Day", date: new Date("2024-08-21"), type: "Special Non-Working", multiplier: 1.3, isNational: true },
  { id: "4", name: "Company Anniversary", date: new Date("2024-10-26"), type: "Special Non-Working", multiplier: 1.5, isNational: false },
];

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleAddHoliday = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newHoliday: Holiday = {
      id: String(Date.now()),
      name: formData.get("name") as string,
      date: selectedDate || new Date(),
      type: formData.get("type") as "Regular" | "Special Non-Working",
      multiplier: parseFloat(formData.get("multiplier") as string),
      isNational: formData.get("isNational") === "on",
    };
    setHolidays([newHoliday, ...holidays]);
    toast({ title: "Success", description: "New holiday has been added." });
    event.currentTarget.reset();
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Add holiday</CardTitle>
          <CardDescription>Create a new holiday entry for payroll computation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g., Christmas Day" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select holiday type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular Holiday</SelectItem>
                  <SelectItem value="Special Non-Working">Special Non-Working Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplier</Label>
              <Input id="multiplier" name="multiplier" type="number" step="0.1" defaultValue="2.0" required />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2 pt-4">
              <Checkbox id="isNational" name="isNational" />
              <Label htmlFor="isNational" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Is national
              </Label>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2 pt-4 border-t">
                <Button type="submit" className="bg-primary hover:bg-primary/90">Save</Button>
                <Button type="button" variant="secondary">Save and add another</Button>
                <Button type="button" variant="secondary">Save and continue editing</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Holiday List</CardTitle>
          <CardDescription>List of all configured holidays.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>National</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>{format(holiday.date, "yyyy-MM-dd")}</TableCell>
                  <TableCell>{holiday.type}</TableCell>
                  <TableCell>{holiday.multiplier.toFixed(2)}</TableCell>
                  <TableCell>{holiday.isNational ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent mr-2">
                      <Edit className="h-4 w-4" />
                       <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
