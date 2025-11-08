'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
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
  Briefcase,
  MoreHorizontal,
  MapPin,
  FileText,
} from 'lucide-react';
import React, { useState } from 'react';
import AddBusinessDialog from '@/components/dashboard/organization/add-business-dialog';
import { DeleteBusiness, getBusiness, UpdateBusiness } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditBusinessDialog from '@/components/dashboard/organization/edit-business-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Business {
  id: string;
  name: string;
  tax_id: string;
  address: string;
}

// ✅ Stub data if API is not reachable
const STUB_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    tax_id: 'ACM-12345',
    address: '123 Main Street, Metro City',
  },
  {
    id: '2',
    name: 'TechNova Ltd.',
    tax_id: 'TN-67890',
    address: '45 Innovation Drive, Silicon Valley',
  },
];

export default function BusinessPage() {
  const [isAddBusinessDialogOpen, setIsAddBusinessDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      try {
        const res = await getBusiness();
        return res?.length ? res : STUB_BUSINESSES;
      } catch (err) {
        console.warn('API failed, using stub data', err);
        toast({ variant: 'destructive', title: 'API Error', description: 'Showing stub data as a fallback.' });
        return STUB_BUSINESSES;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DeleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({
        title: 'Deleted',
        description: 'Business has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete business.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Business> }) =>
      UpdateBusiness(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setEditingBusiness(null);
      toast({
        title: 'Updated',
        description: 'Business updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update business.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBusinessAdded = (newBusiness: Business) => {
    queryClient.setQueryData<Business[]>(['businesses'], (oldData) => 
      oldData ? [...oldData, newBusiness] : [newBusiness]
    );
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
  };

  const handleBusinessSave = (updatedData: Partial<Business>) => {
    if (editingBusiness) {
      updateMutation.mutate({ id: editingBusiness.id, body: updatedData });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary" /> Businesses</h1>
          <p className="text-muted-foreground">Manage your business entities.</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 w-full md:w-auto"
          onClick={() => setIsAddBusinessDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Business
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
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business: Business) => (
            <Card key={business.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row justify-between items-start pb-4">
                <div className="font-semibold text-lg text-primary">{business.name}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingBusiness(business)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(business.id)} className="text-red-500 focus:text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{business.tax_id}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{business.address}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAddBusinessDialogOpen && (
        <AddBusinessDialog
          isOpen={isAddBusinessDialogOpen}
          onOpenChange={setIsAddBusinessDialogOpen}
          onBusinessAdded={handleBusinessAdded}
        />
      )}

      {editingBusiness && (
        <EditBusinessDialog
          isOpen={!!editingBusiness}
          business={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSave={handleBusinessSave}
        />
      )}
    </div>
  );
}
