'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ViewingRequest {
  id: string;
  requestType: string;
  viewingDate: string | null;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  language: string | null;
  message: string | null;
  offerAmount: string | null;
  status: string;
  createdAt: string;
  confirmedBy: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  completedBy: string | null;
  completedByName: string | null;
  completedAt: string | null;
  cancelledBy: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  property: {
    id: string;
    title: string;
    slug: string;
    location: string;
    price: string;
  } | null;
}

export default function ViewingRequestsTable() {
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/viewing-request' 
        : `/api/viewing-request?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching viewing requests:', error);
      toast.error('Failed to load viewing requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/viewing-request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Request ${newStatus.toLowerCase()}`);
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || ''}>
        {status}
      </Badge>
    );
  };

  const getRequestTypeBadge = (type: string) => {
    return type === 'SCHEDULE_VIEWING' ? (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Calendar className="w-3 h-3 mr-1" />
        Viewing
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <ExternalLink className="w-3 h-3 mr-1" />
        Offer
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PENDING')}
        >
          <Clock className="w-4 h-4 mr-1" />
          Pending
        </Button>
        <Button
          variant={filter === 'CONFIRMED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('CONFIRMED')}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Confirmed
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('COMPLETED')}
        >
          Completed
        </Button>
      </div>

      {/* Table */}
      {requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No viewing requests found.
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date/Offer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {getRequestTypeBadge(request.requestType)}
                  </TableCell>
                  
                  <TableCell>
                    {request.property ? (
                      <div className="flex flex-col gap-1">
                        <Link 
                          href={`/properties/${request.property.slug}`}
                          className="font-medium hover:text-primary transition-colors"
                          target="_blank"
                        >
                          {request.property.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {request.property.location}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-muted-foreground italic">
                          General Inquiry
                        </span>
                        <span className="text-xs text-muted-foreground">
                          No specific property
                        </span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{request.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <a 
                          href={`tel:${request.countryCode}${request.phone}`}
                          className="hover:text-primary"
                        >
                          {request.countryCode} {request.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <a 
                          href={`mailto:${request.email}`}
                          className="hover:text-primary"
                        >
                          {request.email}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {request.requestType === 'MAKE_OFFER' && request.offerAmount ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          ฿{request.offerAmount}
                        </span>
                        {request.property?.price && (
                          <span className="text-xs text-muted-foreground">
                            Asking: ฿{request.property.price}
                          </span>
                        )}
                      </div>
                    ) : request.viewingDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(request.viewingDate), 'MMM d, yyyy')}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  
                  <TableCell>
                    {request.confirmedByName ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {request.confirmedByName}
                        </span>
                        {request.confirmedAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(request.confirmedAt), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    ) : request.completedByName ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          {request.completedByName}
                        </span>
                        {request.completedAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(request.completedAt), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    ) : request.cancelledByName ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">
                          {request.cancelledByName}
                        </span>
                        {request.cancelledAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(request.cancelledAt), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(request.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(request.id, 'CONFIRMED')}
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(request.id, 'CANCELLED')}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {request.status === 'CONFIRMED' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(request.id, 'COMPLETED')}
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(request.id, 'CANCELLED')}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

