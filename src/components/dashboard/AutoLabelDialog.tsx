import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, ChevronDown, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES, ExpenseCategory, SavedLabel } from "@/types/expense";
import { toast } from "sonner";

interface AutoLabelDialogProps {
  savedLabels: SavedLabel[];
  onAddLabel: (label: { name: string; amount: number; category: string }) => void;
  onDeleteLabel: (id: string) => void;
  onSelectLabel: (label: SavedLabel) => void;
}

export const AutoLabelDialog = ({ 
  savedLabels, 
  onAddLabel, 
  onDeleteLabel,
  onSelectLabel 
}: AutoLabelDialogProps) => {
  const [customLabelOpen, setCustomLabelOpen] = useState(false);
  const [labelListOpen, setLabelListOpen] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelAmount, setLabelAmount] = useState("");

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!labelName.trim()) {
      toast.error("Please enter a label name");
      return;
    }

    if (!labelAmount || parseFloat(labelAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    onAddLabel({
      name: labelName,
      amount: parseFloat(labelAmount),
      category: "Other",
    });

    // Reset form
    setLabelName("");
    setLabelAmount("");
    setCustomLabelOpen(false);
    toast.success("Label created successfully!");
  };

  const handleSelectLabel = (label: SavedLabel) => {
    onSelectLabel(label);
    setLabelListOpen(false);
    toast.success(`Added ${label.name} to expenses!`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Tag className="h-4 w-4" />
            Auto Label
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLabelListOpen(true)}>
            Label List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCustomLabelOpen(true)}>
            Custom Label
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Label Dialog */}
      <Dialog open={customLabelOpen} onOpenChange={setCustomLabelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateLabel}>
            <DialogHeader>
              <DialogTitle>Create Custom Label</DialogTitle>
              <DialogDescription>
                Create a reusable label for quick expense entry.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="labelName">Label Name</Label>
                <Input
                  id="labelName"
                  placeholder="e.g., SIP, Apple Music"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="labelAmount">Amount (₹)</Label>
                <Input
                  id="labelAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={labelAmount}
                  onChange={(e) => setLabelAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustomLabelOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Label</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Label List Dialog */}
      <Dialog open={labelListOpen} onOpenChange={setLabelListOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Label List</DialogTitle>
            <DialogDescription>
              Select a label to quickly add it as an expense.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {savedLabels.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No labels created yet. Create one using Custom Label!
              </p>
            ) : (
              <div className="space-y-2">
                {savedLabels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectLabel(label)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{label.name}</p>
                          <p className="text-sm text-muted-foreground">{label.category}</p>
                        </div>
                        <p className="text-lg font-semibold">₹{label.amount.toLocaleString()}</p>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLabel(label.id);
                        toast.success("Label deleted");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
