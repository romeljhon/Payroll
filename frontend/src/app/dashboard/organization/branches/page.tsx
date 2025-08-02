"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Edit, Trash2, PlusCircle, GitBranch } from "lucide-react";
import React, { useState } from "react";
import AddBranchDialog from "@/components/dashboard/organization/add-branch-dialog";
import { DeleteBranches, getBranches, UpdateBranches } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import EditBranchDialog from "@/components/dashboard/organization/edit-branch-dialog";

interface Branch {
  id: number;
  name: string;
  address: string;
  business_name: string;
}

export default function BranchesPage() {
  const [isAddBranchDialogOpen, setIsAddBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const queryClient = useQueryClient();

  const {
    data: branches = [],
    isLoading,
    refetch,
    error,
  } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: getBranches,
  });

  const deleteMutation = useMutation({
    mutationFn: DeleteBranches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({
        title: "Deleted",
        description: "Branch has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete branch.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Branch> }) =>
      UpdateBranches(id.toString(), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setEditingBranch(null);
      toast({
        title: "Updated",
        description: "Branch updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update branch.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleBranchAdded = () => {
    refetch();
    toast({
      title: "Branch Added",
      description: "New branch has been added successfully.",
    });
  };

  const handleBranchSave = (updatedData: Partial<Branch>) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, body: updatedData });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary flex items-center">
              <GitBranch className="mr-2 h-6 w-6" /> Branches
            </CardTitle>
            <CardDescription>Manage your company's branches.</CardDescription>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsAddBranchDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Branch
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-destructive">Failed to load branches.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell>{branch.business_name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-accent mr-2"
                        onClick={() => setEditingBranch(branch)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => handleDelete(branch.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddBranchDialog
        isOpen={isAddBranchDialogOpen}
        onOpenChange={setIsAddBranchDialogOpen}
        onBranchAdded={handleBranchAdded}
      />

      {editingBranch && (
        <EditBranchDialog
          isOpen={!!editingBranch}
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onSave={handleBranchSave}
        />
      )}
    </div>
  );
}
