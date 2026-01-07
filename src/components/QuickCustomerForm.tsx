import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { customersApi } from "@/services/api";
import { CustomerFormWithDuplicateCheck } from "@/components/customers/CustomerFormWithDuplicateCheck";

interface QuickCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: any) => void;
}

export function QuickCustomerForm({ open, onOpenChange, onCustomerCreated }: QuickCustomerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);

    try {
      console.log('Creating customer with data:', formData);

      const response = await customersApi.create(formData);
      
      if (response.success) {
        onCustomerCreated(response.data);
        onOpenChange(false);

        toast({
          title: "Customer Added",
          description: `${response.data.name} has been added successfully`,
        });
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExisting = (customer: any) => {
    // If user selects an existing customer, use that instead
    onCustomerCreated(customer);
    onOpenChange(false);
    toast({
      title: "Customer Selected",
      description: `${customer.name} has been selected`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomerFormWithDuplicateCheck 
        onSubmit={handleSubmit} 
        onClose={() => onOpenChange(false)}
        onSelectExisting={handleSelectExisting}
      />
    </Dialog>
  );
}
