'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTimekeeping } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Clock,
  Calendar,
  User,
  Download,
} from 'lucide-react';

interface TimekeepingRecord {
  id: number;
  employee_name: string;
  date: string;
  time_in: string;
  time_out: string;
  hours_worked: string;
}

// Stub data in case the API fails
const stubTimekeeping: TimekeepingRecord[] = [
  {
    id: 1,
    employee_name: 'Alice Johnson',
    date: '2024-07-28',
    time_in: '08:03:00',
    time_out: '17:05:00',
    hours_worked: '8.03',
  },
  {
    id: 2,
    employee_name: 'Bob Reyes',
    date: '2024-07-28',
    time_in: '09:00:00',
    time_out: '18:10:00',
    hours_worked: '8.17',
  },
];

export default function TimekeepingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const { data: records = [], isLoading } = useQuery<TimekeepingRecord[]>({
    queryKey: ['timekeeping', dateFilter],
    queryFn: async () => {
      try {
        const data = await getTimekeeping();
        // The API returns all records, so we filter by date on the client
        return data.filter((rec: any) => rec.date === dateFilter);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to fetch records', description: 'Using sample data as a fallback.' });
        return stubTimekeeping.filter(rec => rec.date === dateFilter);
      }
    },
  });

  const filteredRecords = records.filter((rec) =>
    rec.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (time: string) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = ((hour + 11) % 12) + 1;
    return `${formattedHour}:${m} ${suffix}`;
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <Clock className="mr-3 h-8 w-8" />
              Timekeeping Records
            </CardTitle>
            <CardDescription className="text-md ml-11">View and manage daily employee time logs.</CardDescription>
          </div>
          <Button className='shadow-sm'>
              <Download className='mr-2 h-4 w-4'/>
              Export Data
          </Button>
        </CardHeader>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name..."
                className="pl-10 shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-auto">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    type="date"
                    className="pl-10 shadow-inner w-full"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><User className="inline-block mr-2 h-4 w-4"/>Employee</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead className="text-right">Hours Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.employee_name}</TableCell>
                      <TableCell className="font-mono text-sm">{formatTime(rec.time_in)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatTime(rec.time_out)}</TableCell>
                      <TableCell className="text-right font-semibold">{parseFloat(rec.hours_worked).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No records found for the selected date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
