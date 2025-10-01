'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  PlusCircle,
  GitBranch,
  MoreHorizontal,
  MapPin,
  Briefcase,
} from 'lucide-react';
import React, { useState } from 'react';
import AddBranchDialog from '@/components/dashboard/organization/add-branch-dialog';
import { DeleteBranches, getBranches, UpdateBranches } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import EditBranchDialog from '@/components/dashboard/organization/edit-branch-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Branch {
  id: number;
  name: string;
  address: string;
  business_name: string;
}

// ✅ Stub branches if API is down or returns empty
const STUB_BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Downtown Branch',
    address: '100 Market St, Metro City',
    business_name: 'Acme Corporation',
  },
  {
    id: 2,
    name: 'Innovation Hub',
    address: '200 Tech Park Ave, Silicon Valley',
    business_name: 'TechNova Ltd.',
  },
];

export default function BranchesPage() {
  const [isAddBranchDialogOpen, setIsAddBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const queryClient = useQueryClient();

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      try {
        const result = await getBranches();
        return result?.length ? result : STUB_BRANCHES;
      } catch (err) {
        console.warn('Branches API failed, using stub data', err);
        toast({ variant: 'destructive', title: 'API Error', description: 'Showing stub data as a fallback.' });
        return STUB_BRANCHES;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => DeleteBranches(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: 'Deleted',
        description: 'Branch has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete branch.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Branch> }) =>
      UpdateBranches(id.toString(), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditingBranch(null);
      toast({
        title: 'Updated',
        description: 'Branch updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update branch.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleBranchAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['branches'] });
  };

  const handleBranchSave = (updatedData: Partial<Branch>) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, body: updatedData });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <GitBranch className="mr-2 h-6 w-6 text-primary" /> Branches
          </h1>
          <p className="text-muted-foreground">Manage your company's branches.</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 w-full md:w-auto"
          onClick={() => setIsAddBranchDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Branch
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row justify-between items-center">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row justify-between items-start pb-4">
                <div className="font-semibold text-lg text-primary">{branch.name}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingBranch(branch)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(branch.id)} className="text-red-500 focus:text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{branch.business_name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
