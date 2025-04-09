import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { accountsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Account } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  description: z.string().optional(),
  type: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().min(0).max(2)
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account;
}

export default function AccountForm({
  isOpen,
  onClose,
  accountToEdit,
}: AccountFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!accountToEdit;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: accountToEdit?.name || "",
      description: accountToEdit?.description || "",
      type: accountToEdit?.type || 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user) throw new Error("User not authenticated");
      return accountsApi.createAccount({
        name: data.name,
        type: data.type,
        description: data.description || null,
        created_at: new Date().toISOString()
      }, user.id, user.token);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts"] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user || !accountToEdit) throw new Error("User not authenticated");
      const { type, ...updateData } = data;
      return accountsApi.updateAccount(
        accountToEdit.id,
        {
          name: updateData.name,
          description: updateData.description || null,
          created_at: accountToEdit.created_at
        },
        user.id,
        user.token
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts"] });
      if (accountToEdit) {
        queryClient.invalidateQueries({
          queryKey: [`/accounts/${accountToEdit.id}`],
        });
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !accountToEdit) throw new Error("User not authenticated or account not specified");
      return accountsApi.deleteAccount(accountToEdit.id, user.id, user.token);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts"] });
      onClose();
      // Navigate to dashboard after deletion
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const openDeleteDialog = () => {
    setConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteAccount = () => {
    if (!accountToEdit) return;
    
    if (confirmName !== accountToEdit.name) {
      toast({
        title: "Error",
        description: "Account name does not match. Deletion cancelled.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Account" : "Create New Account"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your account details below"
                : "Fill in the details for your new financial account"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Main Checking"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a description for this account"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Checking Account</SelectItem>
                        <SelectItem value="1">Cash</SelectItem>
                        <SelectItem value="2">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delete Account Button - Only show when editing */}
              {isEditing && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={openDeleteDialog}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update Account"
                    : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account and all its transactions.
              <div className="mt-4">
                <p className="font-medium mb-2">
                  Enter account name &quot;{accountToEdit?.name}&quot; to confirm:
                </p>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Type account name here"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting || confirmName !== accountToEdit?.name}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
