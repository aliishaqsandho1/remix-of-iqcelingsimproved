import { useState, useEffect, useCallback } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, User, Phone, Check, Loader2 } from "lucide-react";
import { customersApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface MatchingCustomer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  type?: string;
  currentBalance?: number;
}

interface CustomerFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  onSelectExisting?: (customer: MatchingCustomer) => void;
  // For credits page - show initial credit field
  showInitialCredit?: boolean;
}

export function CustomerFormWithDuplicateCheck({ 
  onSubmit, 
  onClose,
  onSelectExisting,
  showInitialCredit = false
}: CustomerFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "+92",
    email: "",
    address: "",
    city: "Mianwali",
    type: "Permanent",
    creditLimit: "50000",
    initialCredit: ""
  });
  
  const [matchingCustomers, setMatchingCustomers] = useState<MatchingCustomer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search for duplicates
  const searchDuplicates = useCallback(async (name: string, phone: string) => {
    if (!name.trim() && (!phone.trim() || phone.trim() === "+92")) {
      setMatchingCustomers([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search by name first
      const nameSearch = name.trim() ? customersApi.getAll({ search: name.trim(), limit: 50 }) : Promise.resolve({ success: true, data: { customers: [] } });
      
      // Search by phone if provided
      const phoneDigits = phone.replace(/[^0-9]/g, '');
      const phoneSearch = phoneDigits.length > 4 ? customersApi.getAll({ search: phoneDigits, limit: 50 }) : Promise.resolve({ success: true, data: { customers: [] } });

      const [nameResult, phoneResult] = await Promise.all([nameSearch, phoneSearch]);

      const nameMatches = nameResult.success ? (nameResult.data?.customers || []) : [];
      const phoneMatches = phoneResult.success ? (phoneResult.data?.customers || []) : [];

      // Combine and deduplicate
      const combined = [...nameMatches];
      phoneMatches.forEach((pm: MatchingCustomer) => {
        if (!combined.find((c: MatchingCustomer) => c.id === pm.id)) {
          combined.push(pm);
        }
      });

      // Filter to show only relevant matches
      const filtered = combined.filter((customer: MatchingCustomer) => {
        const customerName = customer.name?.toLowerCase() || '';
        const searchName = name.trim().toLowerCase();
        const customerPhone = customer.phone?.replace(/[^0-9]/g, '') || '';
        
        // Check if name contains search term or vice versa
        const nameMatch = searchName.length >= 2 && (
          customerName.includes(searchName) || 
          searchName.includes(customerName) ||
          // Check individual words
          searchName.split(' ').some(word => word.length >= 2 && customerName.includes(word))
        );
        
        // Check phone match
        const phoneMatch = phoneDigits.length >= 5 && customerPhone.includes(phoneDigits);
        
        return nameMatch || phoneMatch;
      });

      setMatchingCustomers(filtered.slice(0, 10)); // Show max 10 matches
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching for duplicates:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Effect to trigger search on name/phone change
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      searchDuplicates(formData.name, formData.phone);
    }, 400);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData.name, formData.phone, searchDuplicates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide customer name",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.phone.trim() || formData.phone.trim() === "+92") {
      toast({
        title: "Missing Information",
        description: "Please provide customer phone number",
        variant: "destructive"
      });
      return;
    }

    // Check for exact phone match (potential duplicate)
    const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
    const exactPhoneMatch = matchingCustomers.find(c => 
      c.phone?.replace(/[^0-9]/g, '') === phoneDigits
    );

    if (exactPhoneMatch) {
      toast({
        title: "Duplicate Phone Number",
        description: `A customer with this phone number already exists: ${exactPhoneMatch.name}`,
        variant: "destructive"
      });
      return;
    }

    // Always send prefilled values - only name and phone are user-editable
    const submitData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      type: formData.type,
      creditLimit: parseFloat(formData.creditLimit) || 50000,
      ...(showInitialCredit && formData.initialCredit ? { initialCredit: parseFloat(formData.initialCredit) } : {})
    };

    onSubmit(submitData);
  };

  const handleSelectExisting = (customer: MatchingCustomer) => {
    if (onSelectExisting) {
      onSelectExisting(customer);
    }
    onClose();
  };

  const showDuplicateWarning = matchingCustomers.length > 0;

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add New Customer</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name and Phone - Always visible */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Customer Name *</Label>
            <div className="relative">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter customer name"
                required
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value;
                if (!value.startsWith("+92")) {
                  setFormData({...formData, phone: "+92"});
                } else {
                  setFormData({...formData, phone: value});
                }
              }}
              placeholder="+92XXXXXXXXXX"
              required
            />
          </div>
        </div>

        {/* Duplicate Warning Section */}
        {showDuplicateWarning && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  {matchingCustomers.length} Similar Customer{matchingCustomers.length > 1 ? 's' : ''} Found
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Please verify if any of these existing customers match:
              </p>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {matchingCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border hover:border-primary transition-colors cursor-pointer"
                      onClick={() => handleSelectExisting(customer)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone || 'No phone'}</span>
                            {customer.type && (
                              <Badge variant="outline" className="text-xs">{customer.type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Show initial credit field only when showInitialCredit is true */}
        {showInitialCredit && (
          <div>
            <Label htmlFor="initialCredit">Initial Credit Amount (Optional)</Label>
            <Input
              id="initialCredit"
              type="number"
              step="0.01"
              min="0"
              value={formData.initialCredit}
              onChange={(e) => setFormData({...formData, initialCredit: e.target.value})}
              placeholder="Enter initial credit (optional)"
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={!formData.name.trim() || !formData.phone.trim() || formData.phone.trim() === "+92"}
          >
            Add Customer
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default CustomerFormWithDuplicateCheck;
