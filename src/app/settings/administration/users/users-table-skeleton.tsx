'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

export function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Skeleton height={40} className="max-w-sm" />
        <div className="ml-auto flex items-center space-x-2">
          <Skeleton height={40} width={120} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton height={20} /></TableHead>
              <TableHead><Skeleton height={20} /></TableHead>
              <TableHead><Skeleton height={20} /></TableHead>
              <TableHead><Skeleton height={20} /></TableHead>
              <TableHead><Skeleton height={20} /></TableHead>
              <TableHead><Skeleton height={20} /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div>
                      <Skeleton height={16} width={120} />
                      <Skeleton height={14} width={180} className="mt-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton height={20} width={60} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Skeleton height={20} width={40} />
                    <Skeleton height={20} width={30} />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton height={16} width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton height={16} width={70} />
                </TableCell>
                <TableCell>
                  <Skeleton height={32} width={32} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}