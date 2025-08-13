"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Layers } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSalaryComponent } from "@/lib/api";

interface SalaryComponent {
  id: number;
  name: string;
  code: string;
  type: "Earning" | "Deduction";
  isTaxable: boolean;
}

export default function SalaryComponentPage() {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchComponents() {
      try {
        const data = await getSalaryComponent();
        // map API fields to UI state
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          type: item.component_type === "EARNING" ? "Earning" : "Deduction",
          isTaxable: item.is_taxable,
        }));
        setComponents(mapped);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch salary components",
        });
      }
    }
    fetchComponents();
  }, [toast]);

  const handleAddComponent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newComponent: SalaryComponent = {
      id: Date.now(), // temporary ID
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      type: formData.get("type") as "Earning" | "Deduction",
      isTaxable: formData.get("isTaxable") === "on",
    };
    if (!newComponent.name || !newComponent.code || !newComponent.type) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields.",
      });
      return;
    }
    setComponents([newComponent, ...components]);
    toast({ title: "Success", description: "New salary component has been added." });
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-8">
      {/* Add Component Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary flex items-center">
            <Layers className="mr-2 h-6 w-6" /> Add Salary Component
          </CardTitle>
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
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Save Component
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Component List */}
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
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        component.type === "Earning" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
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
              {components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No salary components found.
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
