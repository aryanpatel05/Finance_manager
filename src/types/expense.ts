export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  receipt?: string; // base64 encoded image or file data URL
  receiptName?: string; // original filename
}

export interface RecurringExpense {
  id: string;
  label: string;
  amount: number;
  category: string;
}

export interface SavedLabel {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export interface MonthlySaving {
  id: string;
  userId: string;
  month: string; // "YYYY-MM"
  year: number;
  income: number;
  expenses: number;
  saved: number;
  savingsRate?: number;
}

export type ExpenseCategory =
  | "Food & Dining"
  | "Transportation"
  | "Shopping"
  | "Entertainment"
  | "Bills & Utilities"
  | "Healthcare"
  | "Education"
  | "Savings & Investment"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Savings & Investment",
  "Other",
];
