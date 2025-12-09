import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AddIncomeDialogProps {
    currentSalary: number;
    salaryRenewalDate: number;
    onUpdateSalary: (salary: number, renewalDate: number) => void;
    onAddIncome: (income: {
        amount: number;
        description: string;
        date: string;
    }) => void;
}

export const AddIncomeDialog = ({
    currentSalary,
    salaryRenewalDate,
    onUpdateSalary,
    onAddIncome,
}: AddIncomeDialogProps) => {
    const [open, setOpen] = useState(false);

    // Salary State
    const [newSalary, setNewSalary] = useState(currentSalary.toString());
    const [newRenewalDate, setNewRenewalDate] = useState(salaryRenewalDate.toString());

    // Random Income State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const handleSalarySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const salary = parseFloat(newSalary);
        const date = parseInt(newRenewalDate);

        if (salary > 0 && date >= 1 && date <= 31) {
            onUpdateSalary(salary, date);
            setOpen(false);
            toast.success("Monthly salary updated!");
        } else {
            toast.error("Invalid input");
        }
    };

    const handleIncomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Enter valid amount");
            return;
        }
        onAddIncome({
            amount: parseFloat(amount),
            description,
            date
        });
        setOpen(false);
        resetIncomeForm();
    };

    const resetIncomeForm = () => {
        setAmount("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (v) {
                setNewSalary(currentSalary.toString());
                setNewRenewalDate(salaryRenewalDate.toString());
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Income
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Income</DialogTitle>
                    <DialogDescription>
                        Update your monthly salary or add a one-off income source.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="random" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="monthly">Monthly Salary</TabsTrigger>
                        <TabsTrigger value="random">Random Income</TabsTrigger>
                    </TabsList>

                    <TabsContent value="monthly">
                        <form onSubmit={handleSalarySubmit} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="salary">Monthly Base Salary (₹)</Label>
                                <Input
                                    id="salary"
                                    type="number"
                                    value={newSalary}
                                    onChange={(e) => setNewSalary(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="renewal">Renewal Day (1-31)</Label>
                                <Input
                                    id="renewal"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={newRenewalDate}
                                    onChange={(e) => setNewRenewalDate(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Budget resets on this day.</p>
                            </div>
                            <Button type="submit" className="w-full">Update Salary</Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="random">
                        <form onSubmit={handleIncomeSubmit} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="inc-amount">Amount (₹)</Label>
                                <Input
                                    id="inc-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="inc-desc">Description</Label>
                                <Input
                                    id="inc-desc"
                                    placeholder="Source (e.g., Freelance, Gift)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="inc-date">Date</Label>
                                <Input
                                    id="inc-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full">Add Income</Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
