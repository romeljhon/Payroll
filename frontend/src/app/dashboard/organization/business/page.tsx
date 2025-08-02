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
import { Edit, Trash2, PlusCircle, Briefcase } from "lucide-react";
import React, { useState } from "react";
import AddBusinessDialog from "@/components/dashboard/organization/add-business-dialog";
import { DeleteBusiness, getBusiness, UpdateBusiness } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EditBusinessDialog from "@/components/dashboard/organization/edit-business-dialog";

interface Business {
  id: string;
  name: string;
  tax_id: string;
  address: string;
}

export default function BusinessPage() {
  const [isAddBusinessDialogOpen, setIsAddBusinessDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const queryClient = useQueryClient();

  // Fetch businesses
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: getBusiness,
  });

  // Delete business mutation
  const deleteMutation = useMutation({
    mutationFn: DeleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast({
        title: "Deleted",
        description: "Business has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete business.",
        variant: "destructive",
      });
    },
  });

  // Update business mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Business> }) =>
      UpdateBusiness(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      setEditingBusiness(null);
      toast({
        title: "Updated",
        description: "Business updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update business.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBusinessAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["businesses"] });
  };

  const handleBusinessSave = (updatedData: Partial<Business>) => {
    if (editingBusiness) {
      updateMutation.mutate({ id: editingBusiness.id, body: updatedData });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary flex items-center">
              <Briefcase className="mr-2 h-6 w-6" /> Businesses
            </CardTitle>
            <CardDescription>Manage your business entities.</CardDescription>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsAddBusinessDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Business
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-muted-foreground">Loading businesses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Registration Number</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((business: Business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.name}</TableCell>
                    <TableCell>{business.tax_id}</TableCell>
                    <TableCell>{business.address}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-accent mr-2"
                        onClick={() => setEditingBusiness(business)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => handleDelete(business.id)}
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

      <AddBusinessDialog
        isOpen={isAddBusinessDialogOpen}
        onOpenChange={setIsAddBusinessDialogOpen}
        onBusinessAdded={handleBusinessAdded}
      />

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
