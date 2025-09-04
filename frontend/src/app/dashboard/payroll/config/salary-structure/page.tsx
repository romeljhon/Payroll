"use client";

import { useEffect, useMemo, useState } from "react";
import { GitMerge, Edit, Trash2, Check, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import {
  getSalaryStructure,
  AddSalaryStructure,
  DeleteSalaryStructure,
  UpdateSalaryStructure,
  getPositions,
  getSalaryComponent,
} from "@/lib/api";

/* ----------------------------- UI Types ----------------------------- */
interface SalaryComponentUI {
  id: string;
  name: string;
  code: string;
}
interface PositionUI {
  id: string;
  name: string;
}
interface SalaryStructureUI {
  id: string;
  positionId: string;
  componentId: string;
  amount: number;
  isPercentage: boolean;
}

/* ----------------------------- Component ---------------------------- */
export default function SalaryStructurePage() {
  const { toast } = useToast();

  // lookups
  const [components, setComponents] = useState<SalaryComponentUI[]>([]);
  const [positions, setPositions] = useState<PositionUI[]>([]);

  // list
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructureUI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // add form state
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [componentForms, setComponentForms] = useState<
    { componentId: string; amount: string; isPercentage: boolean }[]
  >([{ componentId: "", amount: "", isPercentage: false }]);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ positionId: string; componentId: string; amount: string; isPercentage: boolean } | null>(null);

  /* ----------------------------- helpers ----------------------------- */
  const positionNameById = useMemo(() => {
    const m = new Map<string, string>();
    positions.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [positions]);

  const componentNameById = useMemo(() => {
    const m = new Map<string, string>();
    components.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [components]);

  /* ------------------------------ load ------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [apiComponents, apiPositions, apiStructures] = await Promise.all([
          getSalaryComponent(),
          getPositions(),
          getSalaryStructure(),
        ]);

        const mappedComponents: SalaryComponentUI[] = (apiComponents ?? []).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          code: c.code,
        }));

        const mappedPositions: PositionUI[] = (apiPositions ?? []).map((p: any) => ({
          id: String(p.id),
          name: p.name ?? p.title ?? p.position_name ?? `Position ${p.id}`,
        }));

        const mappedStructures: SalaryStructureUI[] = (apiStructures ?? []).map((s: any) => ({
          id: String(s.id),
          positionId: String(s.position),
          componentId: String(s.component),
          amount: Number(s.amount ?? 0),
          isPercentage: Boolean(s.is_percentage),
        }));

        setComponents(mappedComponents);
        setPositions(mappedPositions);
        setSalaryStructures(mappedStructures);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Failed to load",
          description: err?.message ?? "Please check your connection and auth token.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  /* ------------------------------- add ------------------------------- */
  const handleAddSalaryStructure = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPositionId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a position." });
      return;
    }

    const validComponents = componentForms.filter((cf) => cf.componentId && cf.amount);
    if (validComponents.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one component with amount." });
      return;
    }

    try {
      setLoading(true);

      const body = {
        position: Number(selectedPositionId),
        components: validComponents.map((cf) => ({
          component: Number(cf.componentId),
          amount: cf.amount,
          is_percentage: cf.isPercentage,
        })),
      };

      const created = await AddSalaryStructure(body);

      // merge into UI list (flatten components for table)
      const newStructures: SalaryStructureUI[] = body.components.map((c, idx) => ({
        id: `${created.id}-${idx}`,
        positionId: String(body.position),
        componentId: String(c.component),
        amount: Number(c.amount),
        isPercentage: Boolean(c.is_percentage),
      }));

      setSalaryStructures((prev) => [...prev, ...newStructures]);

      toast({
        title: "Created",
        description: `Added ${newStructures.length} component(s) for ${positionNameById.get(selectedPositionId) ?? "position"}.`,
      });

      // reset
      (event.target as HTMLFormElement).reset();
      setSelectedPositionId("");
      setComponentForms([{ componentId: "", amount: "", isPercentage: false }]);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Create failed",
        description: err?.message ?? "Could not create salary structure.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComponentField = () => {
    setComponentForms((prev) => [...prev, { componentId: "", amount: "", isPercentage: false }]);
  };

  const removeComponentField = (index: number) => {
    setComponentForms((prev) => prev.filter((_, i) => i !== index));
  };

  /* ------------------------------ delete ----------------------------- */
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await DeleteSalaryStructure(id);
      setSalaryStructures((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted", description: "Salary structure removed." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err?.message ?? "Could not delete salary structure.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- edit ------------------------------ */
  const startEdit = (s: SalaryStructureUI) => {
    setEditingId(s.id);
    setEditDraft({
      positionId: s.positionId,
      componentId: s.componentId,
      amount: String(s.amount),
      isPercentage: s.isPercentage,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;

    const { positionId, componentId, amount, isPercentage } = editDraft;
    const parsedAmount = parseFloat(amount);
    if (!positionId || !componentId || Number.isNaN(parsedAmount)) {
      toast({ variant: "destructive", title: "Invalid fields", description: "Complete all fields with valid values." });
      return;
    }

    try {
      setLoading(true);
      const body = {
        position: Number(positionId),
        component: Number(componentId),
        amount: parsedAmount,
        is_percentage: isPercentage,
      };
      const updated = await UpdateSalaryStructure(editingId, body);

      setSalaryStructures((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                id: String(updated.id ?? editingId),
                positionId: String(updated.position ?? positionId),
                componentId: String(updated.component ?? componentId),
                amount: Number(updated.amount ?? parsedAmount),
                isPercentage: Boolean(updated.is_percentage ?? isPercentage),
              }
            : s
        )
      );

      toast({ title: "Updated", description: "Salary structure saved." });
      cancelEdit();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err?.message ?? "Could not update salary structure.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Create */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center">
            <GitMerge className="mr-2 h-6 w-6" />
            Add Salary Structure
          </CardTitle>
          <CardDescription>Assign salary components and amounts to job positions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSalaryStructure} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="position">Position:</Label>
              <Select
                value={selectedPositionId}
                onValueChange={setSelectedPositionId}
                disabled={loading || positions.length === 0}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder={loading ? "Loading..." : positions.length ? "Select position" : "No positions found"} />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {componentForms.map((cf, idx) => (
              <div key={idx} className="p-4 border rounded-md space-y-4 relative">
                <div className="space-y-2">
                  <Label>Component:</Label>
                  <Select
                    value={cf.componentId}
                    onValueChange={(v) =>
                      setComponentForms((prev) => prev.map((item, i) => (i === idx ? { ...item, componentId: v } : item)))
                    }
                    disabled={loading || components.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading..." : components.length ? "Select component" : "No components found"} />
                    </SelectTrigger>
                    <SelectContent>
                      {components.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount:</Label>
                  <Input
                    type="number"
                    step="any"
                    value={cf.amount}
                    onChange={(e) =>
                      setComponentForms((prev) => prev.map((item, i) => (i === idx ? { ...item, amount: e.target.value } : item)))
                    }
                    placeholder="Enter amount"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={cf.isPercentage}
                    onCheckedChange={(v) =>
                      setComponentForms((prev) => prev.map((item, i) => (i === idx ? { ...item, isPercentage: Boolean(v) } : item)))
                    }
                  />
                  <Label>Is percentage</Label>
                </div>

                {componentForms.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-600"
                    onClick={() => removeComponentField(idx)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addComponentField} className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add Component
            </Button>

            <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-lg bg-background text-foreground border border-border">
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
              {salaryStructures.map((s) => {
                const isEditing = editingId === s.id;
                const draft = editDraft ?? { positionId: "", componentId: "", amount: "", isPercentage: false };

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Select
                          value={draft.positionId}
                          onValueChange={(v) => setEditDraft((prev) => (prev ? { ...prev, positionId: v } : prev))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        positionNameById.get(s.positionId) ?? s.positionId
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={draft.componentId}
                          onValueChange={(v) => setEditDraft((prev) => (prev ? { ...prev, componentId: v } : prev))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select component" />
                          </SelectTrigger>
                          <SelectContent>
                            {components.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        componentNameById.get(s.componentId) ?? s.componentId
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={draft.amount}
                          onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, amount: e.target.value } : prev))}
                          type="number"
                          step="any"
                        />
                      ) : s.isPercentage ? (
                        `${s.amount}%`
                      ) : (
                        `₱${s.amount.toFixed(2)}`
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`pct-${s.id}`}
                            checked={draft.isPercentage}
                            onCheckedChange={(v) =>
                              setEditDraft((prev) => (prev ? { ...prev, isPercentage: Boolean(v) } : prev))
                            }
                          />
                          <Label htmlFor={`pct-${s.id}`}>Percentage</Label>
                        </div>
                      ) : s.isPercentage ? (
                        "Percentage"
                      ) : (
                        "Fixed"
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" className="hover:text-green-600 mr-1" onClick={saveEdit} disabled={loading}>
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Save</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:text-muted-foreground" onClick={cancelEdit} disabled={loading}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cancel</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-accent mr-2"
                            onClick={() => startEdit(s)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-destructive"
                            onClick={() => handleDelete(s.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

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
