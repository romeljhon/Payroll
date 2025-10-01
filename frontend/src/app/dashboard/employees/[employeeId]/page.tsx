'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Building,
  UserCheck,
  Phone,
  Edit3,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllEmployeeById } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatarUrl?: string;
  phone?: string;
  joinDate?: string;
  employeeIdNo?: string;
  salary_rate?: {
    amount: string;
    start_date: string;
    end_date: string | null;
  };
}

// ✅ Stub data for fallback
const STUB_EMPLOYEE: Employee = {
  id: 'stub-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'Software Engineer',
  department: 'Development',
  status: 'Active',
  avatarUrl: '',
  phone: '0917-123-4567',
  joinDate: '2024-01-15',
  employeeIdNo: 'EMP-001',
  salary_rate: {
    amount: '55000',
    start_date: '2024-01-15',
    end_date: null,
  },
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.employeeId as string;

  const { data: apiEmployee, isLoading, isError } = useQuery<Employee>({
    queryKey: ['employee-id', employeeId],
    queryFn: () => getAllEmployeeById(employeeId),
    enabled: !!employeeId,
  });

  // ✅ Use stub data if API fails or returns nothing
  const employee = useMemo<Employee>(() => {
    if (isError || !apiEmployee) return STUB_EMPLOYEE;
    return apiEmployee;
  }, [apiEmployee, isError]);

  if (isLoading) {
    return (
      <div className='space-y-6 max-w-6xl mx-auto'>
        <Skeleton className='h-10 w-48' />
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-6'>
            <Card className='shadow-lg'>
              <CardHeader className='flex flex-row items-center space-x-4 pb-4'>
                <Skeleton className='h-24 w-24 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-8 w-64' />
                  <Skeleton className='h-5 w-48' />
                </div>
              </CardHeader>
              <CardContent className='space-y-6 pt-4'>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className='space-y-3'>
                    <Skeleton className='h-6 w-1/3' />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <Skeleton className='h-10 w-full' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className='lg:col-span-1'>
            <Card className='shadow-lg'>
              <CardHeader>
                <Skeleton className='h-8 w-3/4' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-20 w-full' />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-6xl mx-auto'>
      <div className='flex justify-between items-center'>
        <Button variant='outline' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to Employees
        </Button>
        <Button variant='secondary'>
          <Edit3 className='mr-2 h-4 w-4' /> Edit Profile
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
        {/* Left Column: Employee Details */}
        <div className='lg:col-span-2 space-y-8'>
          <Card className='shadow-lg overflow-hidden'>
            <CardHeader className='bg-muted/30 p-6 border-b'>
              <div className='flex items-start space-x-6'>
                <Avatar className='h-24 w-24 border-4 border-background shadow-md'>
                  <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                  <AvatarFallback className='text-3xl'>
                    {employee.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className='text-3xl font-bold text-primary'>
                    {employee.name}
                  </CardTitle>
                  <CardDescription className='text-lg text-muted-foreground'>
                    {employee.role}
                  </CardDescription>
                  <Badge
                    variant={
                      employee.status === 'Active'
                        ? 'default'
                        : employee.status === 'On Leave'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={`mt-2 text-xs ${
                      employee.status === 'Active'
                        ? 'bg-green-500/20 text-green-700 border-green-500/30'
                        : employee.status === 'On Leave'
                        ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-700 border-red-500/30'
                    }`}>
                    {employee.status}
                  </Badge>
                  {isError && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      ⚠️ API unavailable — showing stub data.
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-6 space-y-8'>
              <section>
                <h3 className='text-xl font-semibold text-primary mb-4'>
                  Contact Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm'>
                  <div className='flex items-center space-x-3'>
                    <Mail className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                    <span className='truncate'>{employee.email}</span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <Phone className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                    <span>{employee.phone || 'Not Provided'}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className='text-xl font-semibold text-primary mb-4'>
                  Employment Details
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm'>
                  <div className='flex items-center space-x-3'>
                    <Briefcase className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                    <span>
                      <span className='font-medium'>Role:</span> {employee.role}
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <Building className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                    <span>
                      <span className='font-medium'>Department:</span>{' '}
                      {employee.department}
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <UserCheck className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                    <span>
                      <span className='font-medium'>Employee ID:</span>{' '}
                      {employee.employeeIdNo || 'N/A'}
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <Calendar className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                    <span>
                      <span className='font-medium'>Join Date:</span>{' '}
                      {employee.joinDate
                        ? new Date(employee.joinDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Salary & Other Details */}
        <div className='lg:col-span-1 space-y-8'>
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='text-xl font-semibold text-primary'>
                Salary Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {employee.salary_rate ? (
                <>
                  <div className='flex items-start space-x-3'>
                    <DollarSign className='h-6 w-6 text-green-500 mt-1 flex-shrink-0' />
                    <div>
                      <p className='text-2xl font-bold'>
                        ₱{Number(employee.salary_rate.amount).toLocaleString()}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Current Salary
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start space-x-3 text-sm'>
                    <Clock className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                    <div>
                      <p>
                        <span className='font-medium'>Effective Date:</span>{' '}
                        {new Date(
                          employee.salary_rate.start_date
                        ).toLocaleDateString()}
                      </p>
                      {employee.salary_rate.end_date && (
                        <p>
                          <span className='font-medium'>End Date:</span>{' '}
                          {new Date(
                            employee.salary_rate.end_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className='text-muted-foreground'>
                  No salary information available.
                </p>
              )}
            </CardContent>
            <CardFooter className='bg-muted/30 p-4 border-t text-xs text-muted-foreground'>
              Salary details are confidential.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
