
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Layers } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: "Earning" | "Deduction";
  isTaxable: boolean;
}

const initialComponents: SalaryComponent[] = [
  { id: "1", name: "Basic Salary", code: "BASIC", type: "Earning", isTaxable: true },
  { id: "2", name: "Transportation Allowance", code: "TRANSPO", type: "Earning", isTaxable: false },
  { id: "3", name: "SSS Contribution", code: "SSS", type: "Deduction", isTaxable: false },
  { id: "4", name: "Late Penalty", code: "LATE", type: "Deduction", isTaxable: false },
];

export default function SalaryComponentPage() {
  const [components, setComponents] = useState<SalaryComponent[]>(initialComponents);
  const { toast } = useToast();

  const handleAddComponent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newComponent: SalaryComponent = {
      id: String(Date.now()),
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      type: formData.get("type") as "Earning" | "Deduction",
      isTaxable: formData.get("isTaxable") === "on",
    };
    if (!newComponent.name || !newComponent.code || !newComponent.type) {
        toast({ variant: "destructive", title: "Error", description: "Please fill all required fields." });
        return;
    }
    setComponents([newComponent, ...components]);
    toast({ title: "Success", description: "New salary component has been added." });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary flex items-center"><Layers className="mr-2 h-6 w-6" /> Add Salary Component</CardTitle>
          <CardDescription>Define a new component for earnings or deductions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddComponent} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g., Overtime Pay" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" placeholder="e.g., OT_PAY" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Component Type</Label>
              <Select name="type" required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Earning">Earning</SelectItem>
                  <SelectItem value="Deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="flex items-center space-x-2 md:pt-8">
              <Checkbox id="isTaxable" name="isTaxable" />
              <Label htmlFor="isTaxable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Is taxable
              </Label>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2 pt-4 border-t">
                <Button type="submit" className="bg-primary hover:bg-primary/90">Save Component</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Component List</CardTitle>
          <CardDescription>List of all configured salary components.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Is Taxable</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>{component.code}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-1 text-xs rounded-full ${
                       component.type === 'Earning' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>
                       {component.type}
                     </span>
                  </TableCell>
                  <TableCell>{component.isTaxable ? "Yes" : "No"}</TableCell>
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
