import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Expense } from "@/types/expense";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface ExpenseChartsProps {
  expenses: Expense[];
}

const COLORS = [
  "hsl(190, 80%, 55%)",  // Cyan/Blue
  "hsl(270, 70%, 65%)",  // Purple
  "hsl(330, 80%, 65%)",  // Pink/Magenta
  "hsl(30, 90%, 60%)",   // Orange
  "hsl(150, 70%, 45%)",  // Green
  "hsl(210, 80%, 60%)",  // Blue
  "hsl(50, 90%, 55%)",   // Yellow/Gold
  "hsl(0, 80%, 65%)",    // Red
  "hsl(170, 70%, 45%)",  // Teal
  "hsl(240, 60%, 70%)"   // Indigo
];

export const ExpenseCharts = ({ expenses }: ExpenseChartsProps) => {
  const [selectedMonth, setSelectedMonth] = useState("all");

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;

    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
  }, [expenses, selectedMonth]);

  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    filteredExpenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [filteredExpenses]);

  const monthlyData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const total = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        month: format(month, "MMM yyyy"),
        amount: Number(total.toFixed(2)),
      };
    });
  }, [expenses]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      months.add(format(date, "yyyy-MM"));
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Expense Breakdown</CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {format(new Date(month), "MMMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="w-full sm:w-1/2 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₹${value}`}
                      contentStyle={{
                        padding: "4px 8px",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4 pt-4 sm:pt-0 w-full sm:w-1/2">
                {categoryData.sort((a, b) => b.value - a.value).map((entry, index) => {
                  const total = categoryData.reduce((sum, e) => sum + e.value, 0);
                  const percent = ((entry.value / total) * 100).toFixed(0);
                  const colorIndex = categoryData.findIndex(item => item.name === entry.name);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[colorIndex % COLORS.length] }}
                      />
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium text-foreground">{entry.name}</span>
                        <span className="text-muted-foreground">- {percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No data available for the selected period
            </p>
          )}
        </CardContent>
      </Card >

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value) => `₹${value}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div >
  );
};
