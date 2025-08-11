
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GitMerge, Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: "Earning" | "Deduction";
  isTaxable: boolean;
}

interface SalaryStructure {
    id: string;
    position: string;
    component: string;
    amount: number;
    isPercentage: boolean;
}

const initialComponents: SalaryComponent[] = [
  { id: "1", name: "Basic Salary", code: "BASIC", type: "Earning", isTaxable: true },
  { id: "2", name: "Transportation Allowance", code: "TRANSPO", type: "Earning", isTaxable: false },
  { id: "3", name: "SSS Contribution", code: "SSS", type: "Deduction", isTaxable: false },
  { id: "4", name: "Late Penalty", code: "LATE", type: "Deduction", isTaxable: false },
];

const initialPositions = [
  { id: "1", name: "Software Engineer" },
  { id: "2", name: "Project Manager" },
  { id: "3", name: "UX Designer" },
  { id: "4", name: "HR Specialist" },
];

const initialStructures: SalaryStructure[] = [
    { id: '1', position: 'Software Engineer', component: 'Basic Salary', amount: 75000, isPercentage: false },
    { id: '2', position: 'Software Engineer', component: 'Transportation Allowance', amount: 2000, isPercentage: false },
    { id: '3', position: 'Project Manager', component: 'Basic Salary', amount: 90000, isPercentage: false },
];

export default function SalaryStructurePage() {
  const [components] = useState<SalaryComponent[]>(initialComponents);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>(initialStructures);
  const { toast } = useToast();

  const handleAddSalaryStructure = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const position = formData.get("position") as string;
    const component = formData.get("component") as string;
    const amount = formData.get("amount") as string;
    const isPercentage = formData.get("isPercentage") === "on";

    if (!position || !component || !amount) {
        toast({ variant: "destructive", title: "Error", description: "Please fill all fields for the salary structure." });
        return;
    }

    const newStructure: SalaryStructure = {
        id: String(Date.now()),
        position,
        component,
        amount: parseFloat(amount),
        isPercentage,
    };
    
    setSalaryStructures(prev => [...prev, newStructure]);

    toast({ title: "Success", description: `Salary structure added successfully for ${position}.` });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary flex items-center"><GitMerge className="mr-2 h-6 w-6" />Add Salary Structure</CardTitle>
           <CardDescription>Assign salary components and amounts to job positions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSalaryStructure} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="position">Position:</Label>
                <Select name="position" required>
                    <SelectTrigger id="position">
                        <SelectValue placeholder="-------" />
                    </SelectTrigger>
                    <SelectContent>
                        {initialPositions.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="component">Component:</Label>
                <Select name="component" required>
                    <SelectTrigger id="component">
                        <SelectValue placeholder="-------" />
                    </SelectTrigger>
                    <SelectContent>
                        {components.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount">Amount:</Label>
                <Input id="amount" name="amount" type="number" step="any" placeholder="Enter amount" required />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="isPercentage" name="isPercentage" />
                <Label htmlFor="isPercentage">Is percentage</Label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary/90">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Existing Salary Structures</CardTitle>
          <CardDescription>Review and manage current salary structures.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryStructures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell className="font-medium">{structure.position}</TableCell>
                  <TableCell>{structure.component}</TableCell>
                  <TableCell>{structure.isPercentage ? `${structure.amount}%` : `₱${structure.amount.toFixed(2)}`}</TableCell>
                  <TableCell>{structure.isPercentage ? "Percentage" : "Fixed"}</TableCell>
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
               {salaryStructures.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No salary structures defined yet.
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
