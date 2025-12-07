import { useState } from "react";
import { RecurringExpense } from "@/types/expense";
import { EXPENSE_CATEGORIES } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Repeat, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RecurringExpensesProps {
  recurringExpenses: RecurringExpense[];
  onAdd: (expense: Omit<RecurringExpense, "id">) => void;
  onUpdate: (id: string, updates: Partial<RecurringExpense>) => void;
  onDelete: (id: string) => void;
}

export const RecurringExpenses = ({
  recurringExpenses,
  onAdd,
  onUpdate,
  onDelete,
}: RecurringExpensesProps) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const totalRecurring = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    if (!label.trim() || !category) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill all fields",
      });
      return;
    }

    if (editingId) {
      onUpdate(editingId, { label: label.trim(), amount: numAmount, category });
      toast({
        title: "Updated!",
        description: "Recurring expense updated successfully",
      });
    } else {
      onAdd({ label: label.trim(), amount: numAmount, category });
      toast({
        title: "Added!",
        description: "Recurring expense added successfully",
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setLabel("");
    setAmount("");
    setCategory("");
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id);
    setLabel(expense.label);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast({
      title: "Deleted!",
      description: "Recurring expense removed",
    });
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recurring Expenses</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Recurring Expense</DialogTitle>
                <DialogDescription>
                  Manage your monthly recurring expenses like subscriptions, SIPs, etc.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Netflix, SIP, Gym"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingId ? "Update" : "Add"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {recurringExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recurring expenses yet. Add one to get started!
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {recurringExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{expense.label}</div>
                    <div className="text-xs text-muted-foreground">{expense.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">₹{expense.amount.toLocaleString()}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Monthly</span>
                <span className="text-primary">₹{totalRecurring.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
