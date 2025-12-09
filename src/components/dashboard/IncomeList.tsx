import { Income } from "@/types/expense";
import { format } from "date-fns";
import { Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface IncomeListProps {
    incomes: Income[];
    onDelete: (id: string) => void;
}

export const IncomeList = ({ incomes, onDelete }: IncomeListProps) => {
    return (
        <Card className="border shadow-sm mb-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            This Month's Random Income
                        </CardTitle>
                        <CardDescription>
                            Track additional income sources.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {incomes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No extra income added this month.
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incomes.map((income) => (
                                    <TableRow key={income.id}>
                                        <TableCell>
                                            {format(new Date(income.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {income.description}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-semibold">
                                            +₹{income.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => {
                                                    if (confirm("Delete this income entry?")) {
                                                        onDelete(income.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
