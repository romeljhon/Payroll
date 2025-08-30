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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Save, X } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getPositions,
  AddPositions,
  DeletePositions,
  UpdatePositions,
} from "@/lib/api";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

interface Position {
  id: number;
  name: string;
}

export default function PositionsPage() {
  const [positionName, setPositionName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: positions = [],
    isLoading,
    isError,
  } = useQuery<Position[]>({
    queryKey: ["positions"],
    queryFn: getPositions,
  });

  const addMutation = useMutation({
    mutationFn: AddPositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Success",
        description: `Position "${positionName}" has been added.`,
      });
      setPositionName("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add position.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: DeletePositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Deleted",
        description: "Position has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete position.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Position> }) =>
      UpdatePositions(id.toString(), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Updated",
        description: "Position updated successfully.",
      });
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update position.",
      });
    },
  });

  const handleAddPosition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!positionName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Position name cannot be empty.",
      });
      return;
    }
    addMutation.mutate({ name: positionName });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (position: Position) => {
    setEditingId(position.id);
    setEditingName(position.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Position name cannot be empty.",
      });
      return;
    }

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, body: { name: editingName } });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Add Position</CardTitle>
          <CardDescription>Create a new job position.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPosition}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Marketing Manager"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
              >
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Position List</CardTitle>
          <CardDescription>List of all available job positions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : isError ? (
            <p className="text-destructive">Failed to load positions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      {editingId === position.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        position.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {editingId === position.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-green-600"
                              onClick={handleSaveEdit}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-destructive"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-accent"
                              onClick={() => handleEdit(position)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-destructive"
                              onClick={() => handleDelete(position.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
