import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User, UserUpdateRequest } from "@/types";
import { authApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  username: z.string().optional(),
  display_name: z.string().optional(),
  old_password: z.string().min(8, "Password must be at least 8 characters."),
  new_password: z.string().optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  // If new password is provided, confirm password must match
  if (data.new_password && data.new_password !== data.confirm_password) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsForm({ isOpen, onClose }: SettingsFormProps) {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || undefined,
      display_name: user?.display_name || undefined,
      old_password: undefined,
      new_password: undefined,
      confirm_password: undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user) throw new Error("User not authenticated");

      // Only include fields that should be updated
      const updateData: UserUpdateRequest = {};

      if (data.old_password !== user.password) {
        throw new Error("Invalid current password");
      }

      if (data.username) {
        updateData.username = data.username;
      }

      if (data.display_name !== undefined) {
        updateData.display_name = data.display_name;
      }

      // Only include password if new password is provided
      if (data.new_password) {
        updateData.password = data.new_password;
      }

      // Add old_password for validation
      const requestData = {
        ...updateData,
        old_password: data.old_password,
      };

      return authApi.updateUser(requestData, user.id, user.token);
    },
    onSuccess: (updatedUser: User) => {
      toast({
        title: "Settings updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Update the user in the auth context by using the loginMutation's setQueryData
      loginMutation.mutate(updatedUser);

      // Close the dialog
      onClose();
      
      // Reset the form
      form.reset({
        username: updatedUser.username,
        display_name: updatedUser.display_name || "",
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    },
    onError: (error: Error) => {
      // Check for 409 conflict error (username taken)
      if (error.message.includes("already exists") || error.message.includes("already taken")) {
        form.setError("username", {
          type: "manual",
          message: "Username is already taken",
        });
      } else if (error.message.includes("password") || error.message.includes("invalid credentials")) {
        form.setError("old_password", {
          type: "manual",
          message: "Invalid current password",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Update your account information below
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Display Name (Optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is how your name will appear in the app
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Current Password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your current password to confirm changes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="New Password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to keep current password
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm New Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}