import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types/expense";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Download, FileText, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MonthlyReportsProps {
  expenses: Expense[];
  monthlySalary: number;
  recurringTotal: number;
}

export const MonthlyReports = ({ expenses, monthlySalary, recurringTotal }: MonthlyReportsProps) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, Expense[]>();

    expenses.forEach((expense) => {
      const monthKey = format(new Date(expense.date), "yyyy-MM");
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, []);
      }
      monthsMap.get(monthKey)!.push(expense);
    });

    return Array.from(monthsMap.entries())
      .map(([month, expenses]) => {
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0) + recurringTotal;
        const categoryBreakdown: Record<string, number> = {};

        expenses.forEach((exp) => {
          categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
        });

        return {
          month,
          monthDisplay: format(new Date(month), "MMMM yyyy"),
          expenses,
          totalExpenses,
          balance: monthlySalary - totalExpenses,
          categoryBreakdown,
          transactionCount: expenses.length,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [expenses, monthlySalary, recurringTotal]);

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const generatePDF = (months: string[]) => {
    const doc = new jsPDF();
    const selectedData = monthlyData.filter((data) => months.includes(data.month));

    selectedData.forEach((monthData, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // -- HEADER --
      doc.setFontSize(24);
      doc.setTextColor(33, 33, 33);
      doc.text("Expense Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${format(new Date(), "PPP")}`, 14, 28);
      // Fix: Use "Rs." instead of "₹" to avoid PDF font artifacts
      doc.text(`Monthly Salary: Rs. ${monthlySalary.toLocaleString()}`, 14, 33);

      doc.setDrawColor(230, 230, 230);
      doc.line(14, 38, 196, 38);

      let yPos = 45;

      // -- MONTH TITLE --
      doc.setFontSize(16);
      doc.setTextColor(33, 33, 33);
      doc.text(monthData.monthDisplay, 14, yPos);

      // Badge style (simulated)
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(150, yPos - 5, 46, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Official Statement", 152, yPos);

      yPos += 15;

      // -- SUMMARY CARDS --
      const cardWidth = 58;
      const cardHeight = 25;
      const gap = 6;
      let xPos = 14;

      // Card 1: Total Expenses
      doc.setFillColor(249, 250, 251); // gray-50
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text("Total Expenses", xPos + 5, yPos + 8);
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38); // red-600
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${monthData.totalExpenses.toLocaleString()}`, xPos + 5, yPos + 18);

      xPos += cardWidth + gap;

      // Card 2: Balance
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("Balance", xPos + 5, yPos + 8);
      doc.setFontSize(12);
      const balanceColor = monthData.balance >= 0 ? [22, 163, 74] : [220, 38, 38]; // green-600 or red-600
      doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${monthData.balance.toLocaleString()}`, xPos + 5, yPos + 18);

      xPos += cardWidth + gap;

      // Card 3: Savings Rate
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("Savings Rate", xPos + 5, yPos + 8);
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.setFont("helvetica", "bold");
      const rate = ((monthData.balance / monthlySalary) * 100).toFixed(1);
      doc.text(`${rate}%`, xPos + 5, yPos + 18);

      yPos += 35;

      // -- CATEGORY BREAKDOWN --
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(33, 33, 33);
      doc.text("Category Breakdown", 14, yPos);
      yPos += 5;

      const categoryRows = Object.entries(monthData.categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amt]) => [cat, `Rs. ${amt.toLocaleString()}`]);

      autoTable(doc, {
        startY: yPos,
        head: [["Category", "Amount"]],
        body: categoryRows,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], fontSize: 10, halign: 'left' }, // blue-500
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 15;

      // -- TRANSACTION DETAILS --
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(33, 33, 33);
      doc.text("Transaction Details", 14, yPos);
      yPos += 5;

      const transactionRows = monthData.expenses.map((exp) => [
        format(new Date(exp.date), "MMM dd, yyyy"),
        exp.category,
        exp.description || "-",
        `Rs. ${exp.amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Date", "Category", "Description", "Amount"]],
        body: transactionRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], fontSize: 10, halign: 'left' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });
    });

    const filename = months.length === 1
      ? `expense-report-${monthlyData.find((m) => m.month === months[0])?.monthDisplay}.pdf`
      : `expense-report-multiple-months.pdf`;

    doc.save(filename);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Monthly Reports
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Quick View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh]">
              <DialogHeader>
                <DialogTitle>PDF Report Preview</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-full pr-4">
                <div className="bg-white text-black p-8 min-h-[800px] shadow-sm font-sans">
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Expense Report</h1>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Generated on: {format(new Date(), "PPP")}</p>
                      <p>Monthly Salary: ₹{monthlySalary.toLocaleString()}</p>
                    </div>
                  </div>

                  {monthlyData
                    .filter(d => selectedMonths.length > 0 ? selectedMonths.includes(d.month) : true)
                    .slice(0, selectedMonths.length > 0 ? undefined : 1) // Show only 1 if none selected explicitly (fallback)
                    .map((monthData) => (
                      <div key={monthData.month} className="mb-12 p-6 border border-gray-100 rounded-lg">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-semibold text-gray-800">{monthData.monthDisplay}</h2>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Official Statement</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-1">Total Expenses</p>
                            <p className="text-lg font-semibold text-red-600">₹{monthData.totalExpenses.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-1">Balance</p>
                            <p className={`text-lg font-semibold ${monthData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{monthData.balance.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-1">Savings Rate</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {((monthData.balance / monthlySalary) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="mb-8">
                          <h3 className="text-lg font-medium mb-4 text-gray-800">Category Breakdown</h3>
                          <div className="w-full">
                            <div className="bg-blue-500 text-white font-medium p-2 text-sm rounded-t-lg">
                              <div className="grid grid-cols-2">
                                <span>Category</span>
                                <span className="text-right">Amount</span>
                              </div>
                            </div>
                            <div className="border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
                              {Object.entries(monthData.categoryBreakdown)
                                .sort(([, a], [, b]) => b - a)
                                .map(([category, amount], index) => (
                                  <div key={category} className={`grid grid-cols-2 p-2 text-sm border-b last:border-0 ${index % 2 === 0 ? '' : 'bg-gray-50'}`}>
                                    <span>{category}</span>
                                    <span className="text-right">₹{amount.toLocaleString()}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-4 text-gray-800">Transaction Details</h3>
                          <div className="w-full">
                            <div className="bg-blue-500 text-white font-medium p-2 text-sm rounded-t-lg">
                              <div className="grid grid-cols-12 gap-2">
                                <span className="col-span-3">Date</span>
                                <span className="col-span-3">Category</span>
                                <span className="col-span-4">Description</span>
                                <span className="col-span-2 text-right">Amount</span>
                              </div>
                            </div>
                            <div className="border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
                              {monthData.expenses.map((exp, index) => (
                                <div key={exp.id} className={`grid grid-cols-12 gap-2 p-2 text-sm border-b last:border-0 items-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                  <span className="col-span-3">{format(new Date(exp.date), "MMM dd, yyyy")}</span>
                                  <span className="col-span-3">{exp.category}</span>
                                  <span className="col-span-4 truncate" title={exp.description}>{exp.description || "-"}</span>
                                  <span className="col-span-2 text-right font-medium">₹{exp.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {selectedMonths.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      Please select months to view the report.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => generatePDF(selectedMonths)}
            disabled={selectedMonths.length === 0}
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyData.map((data) => (
            <div
              key={data.month}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <Checkbox
                checked={selectedMonths.includes(data.month)}
                onCheckedChange={() => toggleMonth(data.month)}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{data.monthDisplay}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generatePDF([data.month])}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Expenses</p>
                    <p className="font-semibold text-destructive">
                      ₹{data.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className={`font-semibold ${data.balance >= 0 ? "text-success" : "text-destructive"}`}>
                      ₹{data.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transactions</p>
                    <p className="font-semibold">{data.transactionCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Savings Rate</p>
                    <p className="font-semibold text-accent">
                      {((data.balance / monthlySalary) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Top Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.categoryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([category, amount]) => (
                        <span
                          key={category}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                        >
                          {category}: ₹{amount.toLocaleString()}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {monthlyData.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No expense data available. Start adding expenses to see monthly reports.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
