import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense, MonthlySaving } from "@/types/expense";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, getYear, isBefore, isSameMonth, subYears, startOfYear, endOfYear, setYear, parseISO, parse } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, PiggyBank, Download, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

import { Trash2 } from "lucide-react"; // Make sure to import Trash2

interface SavingsHistoryProps {
    expenses: Expense[];
    monthlySalary: number;
    userCreatedAt: string | null;
    monthlyHistory: MonthlySaving[];
    onDelete: (id: string) => void;
}

export const SavingsHistory = ({ expenses, monthlySalary, userCreatedAt, monthlyHistory, onDelete }: SavingsHistoryProps) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const currentDetails = {
        now: new Date(),
        year: new Date().getFullYear(),
    };


    // Also include useState in imports if not present
    // It seems useState is not imported in the original file provided in view_file output? 
    // Wait, the file snippet doesn't show React imports. Assuming they are there or I need to add them.
    // Checking line 1... "import { Card..." 
    // I need to add React import.
    // We want to show data for the CURRENT YEAR only
    const displayData = monthlyHistory
        .filter(record => record.year === currentDetails.year)
        .sort((a, b) => b.month.localeCompare(a.month)); // Newest first

    // Format for display
    const savingsData = displayData.map(record => {
        // record.month is "YYYY-MM"
        const date = parse(record.month, 'yyyy-MM', new Date());

        return {
            id: record.id,
            monthLabel: format(date, "MMMM yyyy"),
            saved: record.saved,
            spent: record.expenses,
            isPositive: record.saved >= 0
        };
    });

    // -- ANNUAL REPORT DATA CALCULATION --
    const annualReportData = (() => {
        const previousYear = currentDetails.year - 1;
        const startPrevYear = startOfYear(setYear(new Date(), previousYear));
        const endPrevYear = endOfYear(setYear(new Date(), previousYear));

        const lastYearExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= startPrevYear && date <= endPrevYear;
        });

        if (lastYearExpenses.length === 0) return null;

        const monthsLastYear = eachMonthOfInterval({ start: startPrevYear, end: endPrevYear });

        return monthsLastYear.map(month => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const mExpenses = lastYearExpenses.filter(e => {
                const d = new Date(e.date);
                return d >= mStart && d <= mEnd;
            });
            const total = mExpenses.reduce((sum, e) => sum + e.amount, 0);
            const saved = monthlySalary - total;
            return {
                month: format(month, "MMMM"),
                income: monthlySalary,
                expenses: total,
                saved: saved
            };
        });
    })();

    const downloadPreviousYearReport = () => {
        if (!annualReportData) {
            alert("No data found for the previous year.");
            return;
        }

        const previousYear = currentDetails.year - 1;
        const doc = new jsPDF();

        // -- HEADER --
        doc.setFontSize(24);
        doc.setTextColor(33, 33, 33);
        doc.text(`Financial Report: ${previousYear}`, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${format(new Date(), "PPP")}`, 14, 28);
        doc.text("Annual Summary", 14, 33);

        doc.setDrawColor(230, 230, 230);
        doc.line(14, 38, 196, 38);

        // -- SUMMARY CARDS --
        const totalIncome = annualReportData.reduce((acc, curr) => acc + curr.income, 0);
        const totalExpenses = annualReportData.reduce((acc, curr) => acc + curr.expenses, 0);
        const totalSaved = annualReportData.reduce((acc, curr) => acc + curr.saved, 0);

        let yPos = 48;
        const cardWidth = 58;
        const cardHeight = 25;
        const gap = 6;
        let xPos = 14;

        // Card 1: Total Income
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text("Total Income", xPos + 5, yPos + 8);
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text(`Rs. ${totalIncome.toLocaleString()}`, xPos + 5, yPos + 18);

        xPos += cardWidth + gap;

        // Card 2: Total Expenses
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text("Total Expenses", xPos + 5, yPos + 8);
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38); // red
        doc.setFont("helvetica", "bold");
        doc.text(`Rs. ${totalExpenses.toLocaleString()}`, xPos + 5, yPos + 18);

        xPos += cardWidth + gap;

        // Card 3: Net Savings
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text("Net Savings", xPos + 5, yPos + 8);
        doc.setFontSize(12);
        const savedColor = totalSaved >= 0 ? [22, 163, 74] : [220, 38, 38];
        doc.setTextColor(savedColor[0], savedColor[1], savedColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`Rs. ${totalSaved.toLocaleString()}`, xPos + 5, yPos + 18);

        yPos += 35;

        // -- MONTHLY BREAKDOWN --
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(33, 33, 33);
        doc.text("Monthly Breakdown", 14, yPos);
        yPos += 5;

        const tableData = annualReportData.map(row => [
            row.month,
            `Rs. ${row.income.toLocaleString()}`,
            `Rs. ${row.expenses.toLocaleString()}`,
            `Rs. ${row.saved.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Month', 'Income', 'Expenses', 'Net Savings']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], fontSize: 10, halign: 'left' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 }
        });

        doc.save(`Financial_Report_${previousYear}.pdf`);
    };

    return (
        <Card className="mt-4 sm:mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    Monthly Savings ({currentDetails.year})
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                {savingsData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <p>No completed months for {currentDetails.year} yet.</p>
                        <p className="text-xs mt-1">Savings will appear next month.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                            {savingsData.map((data, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-muted/50 transition-colors group">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium text-sm sm:text-base">{data.monthLabel}</span>
                                        <span className="text-xs text-muted-foreground">
                                            Spent: ₹{data.spent.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`flex items-center justify-end gap-1.5 font-bold ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {data.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                <span>₹{Math.abs(data.saved).toLocaleString()}</span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                                {data.isPositive ? 'Saved' : 'Deficit'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                            onClick={() => onDelete(data.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {/* Footer for Reports */}
                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto gap-2 text-xs"
                        onClick={downloadPreviousYearReport}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download {currentDetails.year - 1} Report
                    </Button>
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto gap-2 text-xs"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Quick View {currentDetails.year - 1}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Annual Report Preview: {currentDetails.year - 1}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-full pr-4">
                                <div className="bg-white text-black p-8 min-h-[800px] shadow-sm font-sans">
                                    {annualReportData ? (
                                        <>
                                            {/* Header */}
                                            <div className="mb-8 border-b pb-6">
                                                <h1 className="text-3xl font-bold text-gray-900">Financial Report: {currentDetails.year - 1}</h1>
                                                <p className="mt-2 text-gray-600">Generated on: {format(new Date(), "PP")}</p>
                                            </div>

                                            {/* Summary Cards */}
                                            <div className="bg-gray-50 p-6 rounded-lg mb-8">
                                                <h3 className="text-lg font-semibold mb-4 text-gray-800">Annual Summary</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Total Income</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            Rs. {annualReportData.reduce((acc, curr) => acc + curr.income, 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Total Expenses</p>
                                                        <p className="text-2xl font-bold text-red-600">
                                                            Rs. {annualReportData.reduce((acc, curr) => acc + curr.expenses, 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Net Savings</p>
                                                        <p className={`text-2xl font-bold ${annualReportData.reduce((acc, curr) => acc + curr.saved, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            Rs. {annualReportData.reduce((acc, curr) => acc + curr.saved, 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Table */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Breakdown</h3>
                                                <div className="w-full border rounded-lg overflow-hidden">
                                                    <div className="bg-blue-500 text-white font-medium p-3 text-sm grid grid-cols-4">
                                                        <span>Month</span>
                                                        <span className="text-right">Income</span>
                                                        <span className="text-right">Expenses</span>
                                                        <span className="text-right">Net Savings</span>
                                                    </div>
                                                    <div className="divide-y divide-gray-200">
                                                        {annualReportData.map((row, i) => (
                                                            <div key={i} className={`grid grid-cols-4 p-3 text-sm ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                                                                <span className="font-medium">{row.month}</span>
                                                                <span className="text-right text-gray-600">Rs. {row.income.toLocaleString()}</span>
                                                                <span className="text-right text-red-500">Rs. {row.expenses.toLocaleString()}</span>
                                                                <span className="text-right font-semibold">
                                                                    <span className={row.saved >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                        Rs. {row.saved.toLocaleString()}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20 text-gray-500">
                                            No data found for {currentDetails.year - 1} to generate a report.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}
