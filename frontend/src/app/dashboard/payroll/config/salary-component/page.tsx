"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Layers } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getSalaryComponent,
  AddSalaryComponent,
  DeleteSalaryComponent,
  UpdateSalaryComponent,
} from "@/lib/api";

interface SalaryComponent {
  id: number;
  name: string;
  code: string;
  type: "Earning" | "Deduction";
  isTaxable: boolean;
}

export default function SalaryComponentPage() {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [editComponent, setEditComponent] = useState<SalaryComponent | null>(null);
  const { toast } = useToast();

  // ✅ Fetch salary components
  useEffect(() => {
    async function fetchComponents() {
      try {
        const data = await getSalaryComponent();
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

  // ✅ Add component
  const handleAddComponent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newComponent = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      component_type: formData.get("type") === "Earning" ? "EARNING" : "DEDUCTION",
      is_taxable: formData.get("isTaxable") === "on",
    };

    try {
      const created = await AddSalaryComponent(newComponent);
      setComponents([
        {
          id: created.id,
          name: created.name,
          code: created.code,
          type: created.component_type === "EARNING" ? "Earning" : "Deduction",
          isTaxable: created.is_taxable,
        },
        ...components,
      ]);
      toast({ title: "Success", description: "New salary component has been added." });
      event.currentTarget.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add component",
      });
    }
  };

  // ✅ Delete component
  const handleDelete = async (id: number) => {
    try {
      await DeleteSalaryComponent(id);
      setComponents(components.filter((c) => c.id !== id));
      toast({ title: "Deleted", description: "Component removed successfully." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete component",
      });
    }
  };

  // ✅ Update component
  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editComponent) return;

    const formData = new FormData(event.currentTarget);
    const updated = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      component_type: formData.get("type") === "Earning" ? "Earning" : "DEDUCTION",
      is_taxable: formData.get("isTaxable") === "on",
    };

    try {
      const result = await UpdateSalaryComponent(editComponent.id, updated);
      setComponents(
        components.map((c) =>
          c.id === editComponent.id
            ? {
                ...c,
                name: result.name,
                code: result.code,
                type: result.component_type === "EARNING" ? "Earning" : "Deduction",
                isTaxable: result.is_taxable,
              }
            : c
        )
      );
      setEditComponent(null);
      toast({ title: "Updated", description: "Component updated successfully." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update component",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Add Component Form */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center">
            <Layers className="mr-2 h-6 w-6" /> Add Salary Component
          </CardTitle>
          <CardDescription>Define a new component for earnings or deductions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddComponent} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="e.g., Overtime Pay" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" placeholder="e.g., OT_PAY" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
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
              <div className="flex items-center space-x-2 self-end pb-1">
                <Checkbox id="isTaxable" name="isTaxable" />
                <Label htmlFor="isTaxable">Is taxable</Label>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                Save Component
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Component List */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-primary">Component List</CardTitle>
          <CardDescription>List of all configured salary components.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                          component.type === "Earning"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {component.type}
                      </span>
                    </TableCell>
                    <TableCell>{component.isTaxable ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-accent"
                          onClick={() => setEditComponent(component)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-destructive"
                          onClick={() => handleDelete(component.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {components.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      No salary components found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editComponent} onOpenChange={() => setEditComponent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salary Component</DialogTitle>
          </DialogHeader>
          {editComponent && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editComponent.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" defaultValue={editComponent.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Component Type</Label>
                <Select name="type" defaultValue={editComponent.type}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Earning">Earning</SelectItem>
                    <SelectItem value="Deduction">Deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTaxable"
                  name="isTaxable"
                  defaultChecked={editComponent.isTaxable}
                />
                <Label htmlFor="isTaxable">Is taxable</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditComponent(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
