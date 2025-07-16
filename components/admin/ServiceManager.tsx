'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, ButtonLoading } from '@/components/ui/loading-spinner';
import { useServices } from '@/hooks/use-services';
import { serviceSchema } from '@/lib/validations/booking';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  DollarSign,
  Clock,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';

interface ServiceManagerProps {
  className?: string;
}

export function ServiceManager({ className }: ServiceManagerProps) {
  const { services, loading, createService, updateService, deleteService, refetch } = useServices({
    includeInactive: true,
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      pricePerHour: 0,
      imageUrl: '',
      category: '',
      isActive: true,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      pricePerHour: 0,
      imageUrl: '',
      category: '',
      isActive: true,
    },
  });

  const handleCreateService = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createService(data);
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      console.error('Error creating service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    editForm.reset({
      name: service.name,
      description: service.description,
      basePrice: service.base_price,
      pricePerHour: service.price_per_hour,
      imageUrl: service.image_url,
      category: service.category_id || '',
      isActive: service.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateService = async (data: any) => {
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      await updateService(selectedService.id, data);
      setIsEditDialogOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      await deleteService(selectedService.id);
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleServiceStatus = async (service: any) => {
    try {
      await updateService(service.id, {
        name: service.name,
        description: service.description,
        basePrice: service.base_price,
        pricePerHour: service.price_per_hour,
        imageUrl: service.image_url,
        category: service.category_id,
        isActive: !service.is_active,
      });
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading services..." />;
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600">Manage your service offerings and pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Add a new service to your offerings
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateService)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Junk Removal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Professional removal of unwanted items..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="99" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="pricePerHour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Hour ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active Service</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this service available for booking
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <ButtonLoading isLoading={isSubmitting} loadingText="Creating...">
                      Create Service
                    </ButtonLoading>
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className={`${!service.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleServiceStatus(service)}
                >
                  {service.is_active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-gray-600 line-clamp-2">
                {service.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Base Price
                  </span>
                  <span className="font-medium">${service.base_price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Per Hour
                  </span>
                  <span className="font-medium">${service.price_per_hour}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditService(service)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedService(service);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first service offering.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service details and pricing
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateService)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="pricePerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Hour ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Service</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this service available for booking
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <ButtonLoading isLoading={isSubmitting} loadingText="Updating...">
                    Update Service
                  </ButtonLoading>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action will deactivate the service and prevent new bookings.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="py-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">{selectedService.name}</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will deactivate the service. Existing bookings will not be affected.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteService} disabled={isSubmitting}>
              <ButtonLoading isLoading={isSubmitting} loadingText="Deleting...">
                Delete Service
              </ButtonLoading>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
