
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, PlusCircle, GitBranch } from "lucide-react";
import React, { useState } from "react";
import AddBranchDialog from "@/components/dashboard/organization/add-branch-dialog";

interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
}

const initialBranches: Branch[] = [
  { id: "1", name: "Main Office", location: "Metropolis", manager: "Clark Kent" },
  { id: "2", name: "Gotham Branch", location: "Gotham City", manager: "Bruce Wayne" },
  { id: "3", name: "Stark Tower", location: "New York", manager: "Tony Stark" },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isAddBranchDialogOpen, setIsAddBranchDialogOpen] = useState(false);

  const handleBranchAdded = (newBranch: Branch) => {
    setBranches(prevBranches => [newBranch, ...prevBranches]);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary flex items-center"><GitBranch className="mr-2 h-6 w-6" /> Branches</CardTitle>
            <CardDescription>Manage your company's branches.</CardDescription>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddBranchDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Branch
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.location}</TableCell>
                  <TableCell>{branch.manager}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddBranchDialog
        isOpen={isAddBranchDialogOpen}
        onOpenChange={setIsAddBranchDialogOpen}
        onBranchAdded={handleBranchAdded}
      />
    </div>
  );
}
