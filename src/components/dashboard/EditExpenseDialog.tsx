import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, ExpenseCategory, Expense } from "@/types/expense";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string, updates: {
    amount: number;
    category: string;
    description: string;
    date: string;
    receipt?: string;
    receiptName?: string;
  }) => void;
}

export const EditExpenseDialog = ({ expense, open, onOpenChange, onEdit }: EditExpenseDialogProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food & Dining");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [receipt, setReceipt] = useState<string>("");
  const [receiptName, setReceiptName] = useState<string>("");

  // Pre-fill form when expense changes
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category as ExpenseCategory);
      setDescription(expense.description);
      setDate(expense.date);
      setReceipt(expense.receipt || "");
      setReceiptName(expense.receiptName || "");
    }
  }, [expense]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setReceipt(reader.result as string);
        setReceiptName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceipt("");
    setReceiptName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!expense) return;

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    onEdit(expense.id, {
      amount: parseFloat(amount),
      category,
      description,
      date,
      receipt: receipt || undefined,
      receiptName: receiptName || undefined,
    });

    onOpenChange(false);
    toast.success("Expense updated successfully!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update your expense details here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            {category === "Other" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-receipt">Receipt (Optional)</Label>
              {!receipt ? (
                <div className="relative">
                  <Input
                    id="edit-receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{receiptName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveReceipt}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {receipt.startsWith("data:image") && (
                    <div className="flex justify-center bg-muted/30 p-2 rounded-md border">
                      <img src={receipt} alt="Receipt" className="h-24 w-auto object-contain rounded shadow-sm" />
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload receipt image or PDF (max 5MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
