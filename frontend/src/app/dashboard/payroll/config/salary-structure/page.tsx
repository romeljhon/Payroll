"use client";

import { useEffect, useMemo, useState } from "react";
import { GitMerge, Edit, Trash2, Check, X, Plus, Minus, ChevronDown } from "lucide-react";
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
import { useMediaQuery } from "@/hooks/use-media-query";

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

export default function SalaryStructurePage() {
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [components, setComponents] = useState<SalaryComponentUI[]>([]);
  const [positions, setPositions] = useState<PositionUI[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructureUI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [componentForms, setComponentForms] = useState<
    { componentId: string; amount: string; isPercentage: boolean }[]
  >([{ componentId: "", amount: "", isPercentage: false }]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ positionId: string; componentId: string; amount: string; isPercentage: boolean } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const positionNameById = useMemo(() => new Map(positions.map((p) => [p.id, p.name])), [positions]);
  const componentNameById = useMemo(() => new Map(components.map((c) => [c.id, c.name])), [components]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [apiComponents, apiPositions, apiStructures] = await Promise.all([
          getSalaryComponent(),
          getPositions(),
          getSalaryStructure(),
        ]);

        setComponents((apiComponents ?? []).map((c: any) => ({ id: String(c.id), name: c.name, code: c.code })));
        setPositions((apiPositions ?? []).map((p: any) => ({ id: String(p.id), name: p.name ?? `Position ${p.id}` })));
        setSalaryStructures((apiStructures ?? []).map((s: any) => ({ id: String(s.id), positionId: String(s.position), componentId: String(s.component), amount: Number(s.amount ?? 0), isPercentage: Boolean(s.is_percentage) })));

      } catch (err: any) {
        toast({ variant: "destructive", title: "Failed to load", description: err?.message ?? "Check connection." });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleAddSalaryStructure = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPositionId) return toast({ variant: "destructive", title: "Error", description: "Please select a position." });

    const validComponents = componentForms.filter((cf) => cf.componentId && cf.amount);
    if (validComponents.length === 0) return toast({ variant: "destructive", title: "Error", description: "Add at least one component." });

    try {
      setLoading(true);
      const body = { position: Number(selectedPositionId), components: validComponents.map((cf) => ({ component: Number(cf.componentId), amount: cf.amount, is_percentage: cf.isPercentage })) };
      const created = await AddSalaryStructure(body);
      const newStructures = (created.components ?? [created]).map((c: any, idx: number) => ({ id: `${c.id}-${idx}`, positionId: String(body.position), componentId: String(c.component), amount: Number(c.amount), isPercentage: Boolean(c.is_percentage) }));
      setSalaryStructures((prev) => [...prev, ...newStructures]);
      toast({ title: "Created", description: `Added components for ${positionNameById.get(selectedPositionId) ?? "position"}.` });
      (event.target as HTMLFormElement).reset();
      setSelectedPositionId("");
      setComponentForms([{ componentId: "", amount: "", isPercentage: false }]);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Create failed", description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const addComponentField = () => setComponentForms((prev) => [...prev, { componentId: "", amount: "", isPercentage: false }]);
  const removeComponentField = (index: number) => setComponentForms((prev) => prev.filter((_, i) => i !== index));

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await DeleteSalaryStructure(id);
      setSalaryStructures((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted", description: "Salary structure removed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s: SalaryStructureUI) => {
    setEditingId(s.id);
    setEditDraft({ positionId: s.positionId, componentId: s.componentId, amount: String(s.amount), isPercentage: s.isPercentage });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    const { positionId, componentId, amount, isPercentage } = editDraft;

    try {
      setLoading(true);
      const body = { position: Number(positionId), component: Number(componentId), amount: parseFloat(amount), is_percentage: isPercentage };
      const updated = await UpdateSalaryStructure(editingId, body);
      setSalaryStructures((prev) => prev.map((s) => s.id === editingId ? { ...s, ...updated } : s));
      toast({ title: "Updated", description: "Salary structure saved." });
      cancelEdit();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center"><GitMerge className="mr-2 h-6 w-6" /> Add Salary Structure</CardTitle>
          <CardDescription>Assign salary components to job positions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSalaryStructure} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={selectedPositionId} onValueChange={setSelectedPositionId} disabled={loading || positions.length === 0}>
                <SelectTrigger id="position"><SelectValue placeholder="Select position..." /></SelectTrigger>
                <SelectContent>{positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {componentForms.map((cf, idx) => (
              <div key={idx} className="p-4 border rounded-md space-y-4 relative bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Component</Label>
                    <Select value={cf.componentId} onValueChange={(v) => setComponentForms(prev => prev.map((item, i) => i === idx ? { ...item, componentId: v } : item))} disabled={loading || components.length === 0}>
                      <SelectTrigger><SelectValue placeholder="Select component..." /></SelectTrigger>
                      <SelectContent>{components.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" step="any" value={cf.amount} onChange={(e) => setComponentForms(prev => prev.map((item, i) => i === idx ? { ...item, amount: e.target.value } : item))} placeholder="Enter amount" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id={`isPercentage-${idx}`} checked={cf.isPercentage} onCheckedChange={(v) => setComponentForms(prev => prev.map((item, i) => i === idx ? { ...item, isPercentage: Boolean(v) } : item))} />
                  <Label htmlFor={`isPercentage-${idx}`}>Is percentage</Label>
                </div>
                {componentForms.length > 1 && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-600" onClick={() => removeComponentField(idx)}><Minus className="h-4 w-4" /></Button>}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={addComponentField} className="flex items-center"><Plus className="mr-2 h-4 w-4" /> Add Component</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 flex-grow sm:flex-grow-0" disabled={loading}>Save Structure</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-background text-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-primary">Existing Salary Structures</CardTitle>
          <CardDescription>Manage current salary structures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryStructures.map((s) => {
                  const isEditing = editingId === s.id;
                  const draft = editDraft ?? { positionId: "", componentId: "", amount: "", isPercentage: false };
                  return (
                    <>
                      <TableRow key={s.id}>
                        <TableCell>
                           <Button size="icon" variant="ghost" onClick={() => toggleRowExpansion(s.id)} className="sm:hidden">
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedRows.has(s.id) ? 'rotate-180' : ''}`} />
                           </Button>
                        </TableCell>
                        <TableCell>{positionNameById.get(s.positionId) ?? s.positionId}</TableCell>
                        <TableCell>{componentNameById.get(s.componentId) ?? s.componentId}</TableCell>
                        <TableCell className="text-right">{s.isPercentage ? `${s.amount}%` : `₱${s.amount.toFixed(2)}`}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={saveEdit} disabled={loading}><Check className="h-4 w-4 text-green-600" /></Button>
                              <Button variant="ghost" size="icon" onClick={cancelEdit} disabled={loading}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEdit(s)} disabled={loading}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} disabled={loading}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(s.id) && !isDesktop && (
                         <TableRow>
                            <TableCell colSpan={5} className="p-4 bg-muted/30">
                               <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="font-medium">Type</div><div>{s.isPercentage ? "Percentage" : "Fixed"}</div>
                               </div>
                            </TableCell>
                         </TableRow>
                      )}
                    </>
                  );
                })}
                {salaryStructures.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10">No salary structures.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
