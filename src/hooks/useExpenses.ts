import { useState, useEffect } from "react";
import { Expense, RecurringExpense, SavedLabel, MonthlySaving, Income } from "@/types/expense";
import { account, databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { ID, Query, Models } from "appwrite";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth, getYear } from "date-fns";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [salaryRenewalDate, setSalaryRenewalDate] = useState<number>(1);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [savedLabels, setSavedLabels] = useState<SavedLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlySaving[]>([]);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);

  const fetchAllData = async (uid: string) => {
    try {
      if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.EXPENSES_COLLECTION_ID || !APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID) {
        console.warn("Appwrite configuration missing");
        return;
      }

      // 1. Fetch Expenses
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.EXPENSES_COLLECTION_ID,
        [
          Query.equal("userId", uid),
          Query.orderDesc("date")
        ]
      );

      const mappedExpenses: Expense[] = response.documents.map((doc: Models.Document) => {
        const d = doc as unknown as Models.Document & {
          description: string;
          amount: number | string;
          category: string;
          date: string;
          receipt?: string;
          receipt_name?: string;
        };
        return {
          id: doc.$id,
          description: d.description,
          amount: Number(d.amount),
          category: d.category,
          date: d.date,
          receipt: d.receipt || undefined,
          receiptName: d.receipt_name || undefined,
          createdAt: doc.$createdAt,
        };
      });

      setExpenses(mappedExpenses);

      // 2. Fetch Monthly Savings History
      const savingsResponse = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID,
        [
          Query.equal("userId", uid),
          Query.orderDesc("month")
        ]
      );

      const mappedHistory: MonthlySaving[] = savingsResponse.documents.map((doc: Models.Document) => {
        const d = doc as unknown as Models.Document & MonthlySaving;
        return {
          id: doc.$id,
          userId: d.userId,
          month: d.month,
          year: d.year,
          income: d.income,
          expenses: d.expenses,
          saved: d.saved,
          savingsRate: d.savingsRate
        }
      });

      setMonthlyHistory(mappedHistory);

      // 3. Fetch Incomes
      if (APPWRITE_CONFIG.INCOMES_COLLECTION_ID) {
        try {
          const incomeResponse = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.INCOMES_COLLECTION_ID,
            [
              Query.equal("userId", uid),
              Query.orderDesc("dateReceived") // Updated to match DB column
            ]
          );
          const mappedIncomes: Income[] = incomeResponse.documents.map((doc: Models.Document) => {
            // Map DB columns (source, dateReceived) to App types (description, date)
            const d = doc as unknown as Models.Document & { source: string; amount: number; dateReceived: string };
            return {
              id: doc.$id,
              description: d.source || "Income", // Map source -> description
              amount: Number(d.amount),
              date: d.dateReceived || doc.$createdAt, // Map dateReceived -> date
              createdAt: doc.$createdAt
            };
          });
          setIncomes(mappedIncomes);
        } catch (e) {
          console.warn("Failed to fetch incomes (collection might not exist yet)", e);
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fetch Error: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const checkAndGenerateMonthlySaving = async (uid: string, currentSalary: number, allExpenses: Expense[], createdAt: string) => {
    // Logic:
    // 1. Identify "Previous Month" (e.g., if today is Dec 5th, previous is Nov)
    // 2. Check if "Previous Month" exists in `monthlyHistory` (or fetch from DB to be safe)
    // 3. If NOT exists, calculate totals from `allExpenses` for that month.
    // 4. Create document in `monthly_savings`.

    const today = new Date();
    // If we are in Dec 2025, we want to check for Nov 2025.

    // Better approach: Get previous month string "YYYY-MM"
    const previousMonthDate = subMonths(today, 1);
    const targetMonthStr = format(previousMonthDate, "yyyy-MM");

    // CRITICAL FIX: Do not generate reports for months BEFORE the user created their account.
    // For example, if user joined in Dec 2025, do NOT generate Nov 2025 report.
    if (createdAt) {
      const createdDate = new Date(createdAt);
      // If the END of the previous month is BEFORE the creation date, skip it.
      // e.g. Nov 30 is before Dec 1 (Creation), so skip Nov.
      if (endOfMonth(previousMonthDate) < createdDate) {
        console.log(`Skipping report generation for ${targetMonthStr} as it is before account creation.`);
        return;
      }
    }

    if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID) return;

    try {
      // Check if report exists
      const check = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID,
        [
          Query.equal("userId", uid),
          Query.equal("month", targetMonthStr)
        ]
      );

      if (check.documents.length === 0) {
        // Report missing, generate it!
        console.log(`Generating savings report for ${targetMonthStr}...`);

        const start = startOfMonth(previousMonthDate);
        const end = endOfMonth(previousMonthDate);

        // Filter expenses for that month
        const expensesForMonth = allExpenses.filter(e => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        });

        const totalExpenses = expensesForMonth.reduce((sum, e) => sum + e.amount, 0);
        const saved = currentSalary - totalExpenses;
        const savingsRate = currentSalary > 0 ? (saved / currentSalary) : 0;

        await databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID,
          ID.unique(),
          {
            userId: uid,
            month: targetMonthStr,
            year: getYear(previousMonthDate),
            income: currentSalary,
            expenses: totalExpenses,
            saved: saved,
            savingsRate: savingsRate
          }
        );

        toast.success(`Generated financial report for ${format(previousMonthDate, "MMMM")}`);
        // Refresh history
        fetchAllData(uid);
      }
    } catch (err) {
      console.error("Error generating monthly report:", err);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const user = await account.get();
        // Console log removed for security
        setUserId(user.$id);
        setUserCreatedAt(user.$createdAt);

        let currentSalary = 0;
        // Fetch salary from preferences
        const prefs = await account.getPrefs();
        if (prefs.salary) {
          currentSalary = Number(prefs.salary);
          setMonthlySalary(currentSalary);
        }
        if (prefs.salaryDate) {
          setSalaryRenewalDate(Number(prefs.salaryDate));
        }

        await fetchAllData(user.$id);

      } catch (error) {
        console.error("Auth Check Failed:", error);
        setUserId(null);
        setExpenses([]);
        setUserCreatedAt(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetch();
  }, []);

  // Effect to trigger report generation once expenses are loaded and user is logged in
  useEffect(() => {
    if (userId && expenses.length > 0 && monthlySalary > 0 && userCreatedAt) {
      checkAndGenerateMonthlySaving(userId, monthlySalary, expenses, userCreatedAt);
    }
  }, [userId, expenses.length, monthlySalary, userCreatedAt]);


  const saveSalary = async (salary: number, renewalDate?: number) => {
    setMonthlySalary(salary);
    if (renewalDate) setSalaryRenewalDate(renewalDate);
    // Sync to Appwrite preferences
    try {
      const prefs = await account.getPrefs();
      await account.updatePrefs({
        ...prefs,
        salary: salary,
        salaryDate: renewalDate || (prefs.salaryDate ? Number(prefs.salaryDate) : 1)
      });
    } catch (error) {
      console.error("Failed to sync salary to cloud:", error);
      toast.error("Failed to sync salary to cloud, but saved locally.");
    }
  };

  const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    if (!userId) {
      toast.error("You must be logged in");
      return;
    }

    if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.EXPENSES_COLLECTION_ID) {
      toast.error("Appwrite Config Missing");
      return;
    }

    try {
      // Construct payload carefully to avoid sending undefined values
      const payload: Record<string, string | number | undefined> = {
        userId: userId,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
      };

      // Only include receipt fields if they have values
      if (expense.receipt) {
        payload.receipt = expense.receipt;
      }
      if (expense.receiptName) {
        payload.receipt_name = expense.receiptName;
      }

      const doc = await databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.EXPENSES_COLLECTION_ID,
        ID.unique(),
        payload as unknown as object
      );

      const newExpense: Expense = {
        id: doc.$id,
        description: doc.description,
        amount: Number(doc.amount),
        category: doc.category,
        date: doc.date,
        receipt: doc.receipt || undefined,
        receiptName: doc.receipt_name || undefined,
        createdAt: doc.$createdAt,
      };

      setExpenses([newExpense, ...expenses]);
      toast.success("Expense added");
    } catch (error) {
      console.error("Error adding expense:", error);
      // Show exact error message from Appwrite
      toast.error("Add Failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!userId) {
      toast.error("You must be logged in");
      return;
    }

    if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.EXPENSES_COLLECTION_ID) {
      return;
    }

    try {
      const updateData: Record<string, unknown> = { ...updates };
      // Map frontend fields to DB fields if names differ
      if (updateData.receiptName) {
        updateData.receipt_name = updateData.receiptName;
        delete updateData.receiptName;
      }
      delete updateData.id;
      delete updateData.createdAt;

      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.EXPENSES_COLLECTION_ID,
        id,
        updateData
      );

      setExpenses(
        expenses.map((expense) =>
          expense.id === id ? { ...expense, ...updates } : expense
        )
      );
      toast.success("Expense updated");
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Update Failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const deleteExpense = async (id: string) => {
    if (!userId) {
      toast.error("You must be logged in");
      return;
    }

    if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.EXPENSES_COLLECTION_ID) {
      return;
    }

    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.EXPENSES_COLLECTION_ID,
        id
      );

      setExpenses(expenses.filter((expense) => expense.id !== id));
      toast.success("Expense deleted");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Delete Failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Recurring expenses - stored in localStorage for now
  const saveRecurringExpenses = (newRecurring: RecurringExpense[]) => {
    setRecurringExpenses(newRecurring);
    localStorage.setItem("finance-crm-recurring", JSON.stringify(newRecurring));
  };

  const addRecurringExpense = (expense: Omit<RecurringExpense, "id">) => {
    const newRecurring: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
    };
    saveRecurringExpenses([...recurringExpenses, newRecurring]);
  };

  const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
    saveRecurringExpenses(
      recurringExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteRecurringExpense = (id: string) => {
    saveRecurringExpenses(recurringExpenses.filter((e) => e.id !== id));
  };

  // Saved labels - stored in localStorage for now
  const saveSavedLabels = (newLabels: SavedLabel[]) => {
    setSavedLabels(newLabels);
    localStorage.setItem("finance-crm-saved-labels", JSON.stringify(newLabels));
  };

  const addSavedLabel = (label: Omit<SavedLabel, "id">) => {
    const newLabel: SavedLabel = {
      ...label,
      id: crypto.randomUUID(),
    };
    saveSavedLabels([...savedLabels, newLabel]);
  };

  const deleteSavedLabel = (id: string) => {
    saveSavedLabels(savedLabels.filter((l) => l.id !== id));
  };

  // Load localStorage data for salary, recurring, labels
  useEffect(() => {
    const storedSalary = localStorage.getItem("finance-crm-salary");
    const storedRecurring = localStorage.getItem("finance-crm-recurring");
    const storedLabels = localStorage.getItem("finance-crm-saved-labels");

    // Salary is now fetched from Appwrite prefs, but we can keep local storage check if we want offline support later
    // For now, let's trust the sync or default to 0
    if (storedSalary) {
      // Optional: we could use this as initial value before auth load
      // setMonthlySalary(Number(storedSalary)); 
    }

    if (storedRecurring) {
      setRecurringExpenses(JSON.parse(storedRecurring));
    }

    if (storedLabels) {
      setSavedLabels(JSON.parse(storedLabels));
    }
  }, []);

  const deleteMonthlySaving = async (id: string) => {
    if (!userId) {
      toast.error("You must be logged in");
      return;
    }

    if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID) {
      return;
    }

    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.MONTHLY_SAVINGS_COLLECTION_ID,
        id
      );

      setMonthlyHistory(monthlyHistory.filter((item) => item.id !== id));
      toast.success("Report deleted");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Delete Failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const addIncome = async (income: Omit<Income, "id" | "createdAt">) => {
    if (!userId) {
      toast.error("You must be logged in");
      return;
    }
    if (!APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.INCOMES_COLLECTION_ID) {
      toast.error("Incomes collection not configured");
      return;
    }

    try {
      const payload = {
        userId: userId,
        source: income.description,
        amount: income.amount,
        dateReceived: income.date,
        incomeId: ID.unique(),
      };
      console.log("Adding Income Payload:", payload);

      const doc = await databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.INCOMES_COLLECTION_ID,
        ID.unique(),
        payload
      );

      const newIncome: Income = {
        id: doc.$id,
        description: doc.source,
        amount: Number(doc.amount),
        date: doc.dateReceived,
        createdAt: doc.$createdAt,
      };
      setIncomes([newIncome, ...incomes]);
      toast.success("Income added successfully");
    } catch (error) {
      console.error("Error adding income", error);
      toast.error("Failed to add income: " + (error instanceof Error ? error.message : "check permissions"));
    }
  };

  const deleteIncome = async (id: string) => {
    if (!userId || !APPWRITE_CONFIG.DATABASE_ID || !APPWRITE_CONFIG.INCOMES_COLLECTION_ID) return;
    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.INCOMES_COLLECTION_ID,
        id
      );
      setIncomes(incomes.filter(i => i.id !== id));
      toast.success("Income deleted");
    } catch (error) {
      toast.error("Failed to delete income");
    }
  };

  return {
    expenses,
    monthlySalary,
    salaryRenewalDate,
    recurringExpenses,
    savedLabels,
    userCreatedAt,
    monthlyHistory,
    incomes,
    addExpense,
    deleteExpense,
    updateExpense,
    saveSalary,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    addSavedLabel,
    deleteSavedLabel,
    deleteMonthlySaving,
    addIncome,
    deleteIncome,
    isLoading,
  };
};
