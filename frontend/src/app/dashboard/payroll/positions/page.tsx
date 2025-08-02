
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Position {
  id: string;
  name: string;
}

const initialPositions: Position[] = [
  { id: "1", name: "Software Engineer" },
  { id: "2", name: "Project Manager" },
  { id: "3", name: "UX Designer" },
  { id: "4", name: "HR Specialist" },
];

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [positionName, setPositionName] = useState("");
  const { toast } = useToast();

  const handleAddPosition = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!positionName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Position name cannot be empty.",
      });
      return;
    }
    const newPosition: Position = {
      id: String(Date.now()),
      name: positionName.trim(),
    };
    setPositions([newPosition, ...positions]);
    toast({ title: "Success", description: `Position "${newPosition.name}" has been added.` });
    setPositionName(""); // Clear input after adding
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Add position</CardTitle>
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
                <Button type="submit" className="bg-primary hover:bg-primary/90">Save</Button>
                <Button type="button" variant="secondary">Save and add another</Button>
                <Button type="button" variant="secondary">Save and continue editing</Button>
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
                  <TableCell className="font-medium">{position.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <Button variant="ghost" size="icon" className="hover:text-accent">
                        <Edit className="h-4 w-4" />
                         <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                      </Button>
                    </div>
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
