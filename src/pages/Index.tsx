import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AddExpenseDialog } from "@/components/dashboard/AddExpenseDialog";
import { AutoLabelDialog } from "@/components/dashboard/AutoLabelDialog";
import { AddIncomeDialog } from "@/components/dashboard/AddIncomeDialog";
import { IncomeList } from "@/components/dashboard/IncomeList";
import { ExpenseList } from "@/components/dashboard/ExpenseList";
import { ExpenseCharts } from "@/components/dashboard/ExpenseCharts";
import { MonthlyReports } from "@/components/dashboard/MonthlyReports";
import { RecurringExpenses } from "@/components/dashboard/RecurringExpenses";
import { ThemeToggle } from "@/components/ThemeToggle";
import { account } from "@/integrations/appwrite/client";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { SavingsHistory } from "@/components/dashboard/SavingsHistory";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Settings,
  Sparkles,
  LogOut,
  User,
} from "lucide-react";
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
import { format } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const {
    expenses,
    monthlySalary,
    salaryRenewalDate,
    recurringExpenses,
    savedLabels,
    userCreatedAt,
    monthlyHistory,
    incomes,
    deleteMonthlySaving,
    addExpense,
    addIncome,
    deleteIncome,
    deleteExpense,
    updateExpense,
    saveSalary,
    addSavedLabel,
    deleteSavedLabel,
    isLoading,
  } = useExpenses();
  const [newSalary, setNewSalary] = useState(monthlySalary.toString());
  const [newRenewalDate, setNewRenewalDate] = useState(salaryRenewalDate.toString());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setNewSalary(monthlySalary.toString());
    setNewRenewalDate(salaryRenewalDate.toString());
  }, [monthlySalary, salaryRenewalDate]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await account.get();
      } catch (error) {
        navigate("/auth");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const currentMonthExpenses = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const renewalDay = salaryRenewalDate || 1;
    let monthStart, monthEnd;

    if (currentDay >= renewalDay) {
      monthStart = new Date(today.getFullYear(), today.getMonth(), renewalDay);
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, renewalDay - 1, 23, 59, 59, 999);
    } else {
      monthStart = new Date(today.getFullYear(), today.getMonth() - 1, renewalDay);
      monthEnd = new Date(today.getFullYear(), today.getMonth(), renewalDay - 1, 23, 59, 59, 999);
    }

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
  }, [expenses, salaryRenewalDate]);

  const currentMonthIncomes = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const renewalDay = salaryRenewalDate || 1;
    let monthStart, monthEnd;

    if (currentDay >= renewalDay) {
      monthStart = new Date(today.getFullYear(), today.getMonth(), renewalDay);
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, renewalDay - 1, 23, 59, 59, 999);
    } else {
      monthStart = new Date(today.getFullYear(), today.getMonth() - 1, renewalDay);
      monthEnd = new Date(today.getFullYear(), today.getMonth(), renewalDay - 1, 23, 59, 59, 999);
    }

    return incomes.filter((inc) => {
      const d = new Date(inc.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [incomes, salaryRenewalDate]);

  const totalRecurringExpenses = useMemo(
    () => recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [recurringExpenses]
  );

  const totalExpensesThisMonth = useMemo(
    () => currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0) + totalRecurringExpenses,
    [currentMonthExpenses, totalRecurringExpenses]
  );

  const totalExpensesAllTime = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const totalRandomIncome = useMemo(
    () => currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0),
    [currentMonthIncomes]
  );

  const totalIncome = monthlySalary + totalRandomIncome;
  const remainingBalance = totalIncome - totalExpensesThisMonth;
  const savingsRate = totalIncome > 0 ? ((remainingBalance / totalIncome) * 100) : 0;

  const handleUpdateSalary = () => {
    const salary = parseFloat(newSalary);
    const renewalDay = parseInt(newRenewalDate);

    if (salary > 0 && renewalDay >= 1 && renewalDay <= 31) {
      if (window.confirm(`Update salary to ₹${salary.toLocaleString()} and renewal date to day ${renewalDay}?`)) {
        saveSalary(salary, renewalDay);
        setSettingsOpen(false);
        toast.success("Settings updated successfully");
      }
    } else {
      toast.error("Please enter valid salary and date (1-31)");
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Finance Manager
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Track. Analyze. Save.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <AutoLabelDialog
                savedLabels={savedLabels}
                onAddLabel={addSavedLabel}
                onDeleteLabel={deleteSavedLabel}
                onSelectLabel={(label) => {
                  addExpense({
                    amount: label.amount,
                    category: label.category,
                    description: label.name,
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
              />
              <AddIncomeDialog
                currentSalary={monthlySalary}
                salaryRenewalDate={salaryRenewalDate}
                onUpdateSalary={saveSalary}
                onAddIncome={addIncome}
              />
              <AddExpenseDialog onAdd={addExpense} />

              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                      Update your monthly salary here.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="salary">Monthly Salary (₹)</Label>
                      <Input
                        id="salary"
                        type="number"
                        value={newSalary}
                        onChange={(e) => setNewSalary(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="renewalDate">Salary Renewal Date (Day of Month)</Label>
                      <Input
                        id="renewalDate"
                        type="number"
                        min="1"
                        max="31"
                        value={newRenewalDate}
                        onChange={(e) => setNewRenewalDate(e.target.value)}
                        placeholder="e.g. 1 for 1st of month"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your monthly budget will reset on this day.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateSalary}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">
              Financial Overview
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6 lg:mb-8">
          <StatsCard
            title="Total Income"
            value={`₹${totalIncome.toLocaleString()}`}
            icon={TrendingUp}
            trend={{
              value: totalRandomIncome > 0 ? `+₹${totalRandomIncome.toLocaleString()} extra` : "Base salary only",
              isPositive: true
            }}
            className="text-green-600"
          />
          <StatsCard
            title="Monthly Salary"
            value={`₹${monthlySalary.toLocaleString()}`}
            icon={DollarSign}
            trend={{
              value: "Base Budget",
              isPositive: true
            }}
          />
          <StatsCard
            title="Monthly Expense"
            value={`₹${totalExpensesThisMonth.toLocaleString()}`}
            icon={TrendingDown}
            trend={{
              value: `${currentMonthExpenses.length} transactions`,
              isPositive: false,
            }}
          />
          <StatsCard
            title="Remaining Balance"
            value={`₹${remainingBalance.toLocaleString()}`}
            icon={Wallet}
            trend={{
              value: `${savingsRate.toFixed(1)}% saved`,
              isPositive: remainingBalance >= 0,
            }}
            className={remainingBalance < 0 ? "border-destructive text-destructive" : ""}
          />
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ExpenseCharts expenses={expenses} />
            <MonthlyReports expenses={expenses} monthlySalary={monthlySalary} recurringTotal={totalRecurringExpenses} incomes={incomes} />
          </div>
          <div>
            <IncomeList incomes={currentMonthIncomes} onDelete={deleteIncome} />
            <ExpenseList expenses={expenses} onDelete={deleteExpense} onEdit={updateExpense} />
            <SavingsHistory
              expenses={expenses}
              monthlySalary={monthlySalary}
              userCreatedAt={userCreatedAt}
              monthlyHistory={monthlyHistory}
              onDelete={deleteMonthlySaving}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
