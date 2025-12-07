import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search, X, Pencil, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Expense, EXPENSE_CATEGORIES } from "@/types/expense";
import { format, isWithinInterval, parseISO } from "date-fns";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: {
    amount: number;
    category: string;
    description: string;
    date: string;
    receipt?: string;
    receiptName?: string;
  }) => void;
}

export const ExpenseList = ({ expenses, onDelete, onEdit }: ExpenseListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDialogOpen(true);
  };

  const handleViewReceipt = (expense: Expense) => {
    setViewingReceipt(expense);
    setReceiptDialogOpen(true);
  };

  const filteredExpenses = expenses.filter((expense) => {
    // Search by description or category
    const matchesSearch =
      searchQuery === "" ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by category
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;

    // Filter by date range
    let matchesDateRange = true;
    if (startDate && endDate) {
      try {
        const expenseDate = parseISO(expense.date);
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        matchesDateRange = isWithinInterval(expenseDate, { start, end });
      } catch (error) {
        matchesDateRange = true;
      }
    } else if (startDate) {
      try {
        const expenseDate = parseISO(expense.date);
        const start = parseISO(startDate);
        matchesDateRange = expenseDate >= start;
      } catch (error) {
        matchesDateRange = true;
      }
    } else if (endDate) {
      try {
        const expenseDate = parseISO(expense.date);
        const end = parseISO(endDate);
        matchesDateRange = expenseDate <= end;
      } catch (error) {
        matchesDateRange = true;
      }
    }

    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || startDate || endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1"
            />
            <span className="text-muted-foreground text-center sm:text-left">to</span>
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1"
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              Showing {sortedExpenses.length} of {expenses.length} expenses
            </p>
          )}
        </div>
        {sortedExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No expenses recorded yet. Add your first expense to get started!
          </p>
        ) : (
          <ScrollArea className="max-h-[320px] pr-4">
            <div className="space-y-3">
              {sortedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm sm:text-base">₹{expense.amount.toFixed(2)}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                        {expense.category}
                      </span>
                      {expense.receipt && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                          <FileText className="h-3 w-3" />
                          Receipt
                        </span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                        {expense.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-1 self-end sm:self-auto">
                    {expense.receipt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewReceipt(expense)}
                        className="hover:bg-muted h-8 w-8 sm:h-10 sm:w-10"
                        title="View Receipt"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(expense)}
                      className="hover:bg-muted h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(expense.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <EditExpenseDialog
          expense={editingExpense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onEdit={onEdit}
        />
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Receipt - {viewingReceipt?.receiptName}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {viewingReceipt?.receipt && (
                <>
                  {viewingReceipt.receipt.startsWith("data:image") ? (
                    <img
                      src={viewingReceipt.receipt}
                      alt="Receipt"
                      className="w-full rounded-md border"
                    />
                  ) : viewingReceipt.receipt.startsWith("data:application/pdf") ? (
                    <div className="text-center p-8 border rounded-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">PDF Receipt</p>
                      <Button asChild>
                        <a
                          href={viewingReceipt.receipt}
                          download={viewingReceipt.receiptName}
                          className="inline-flex items-center gap-2"
                        >
                          Download PDF
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Receipt file attached</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
