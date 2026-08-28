import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed";
  date: string;
  reference?: string;
  notes?: string;
}

interface PaymentTrackerProps {
  bookingId: string;
  totalAmount: number;
  paidAmount: number;
  onPaymentUpdate: (payments: Payment[]) => void;
}

export function PaymentTracker({ 
  bookingId, 
  totalAmount, 
  paidAmount, 
  onPaymentUpdate 
}: PaymentTrackerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
  });

  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress = (paidAmount / totalAmount) * 100;

  useEffect(() => {
    // In a real app, fetch payments from API
    // For now, use mock data
    const mockPayments: Payment[] = [
      {
        id: "1",
        bookingId,
        amount: paidAmount,
        method: "cash",
        status: "completed",
        date: new Date().toISOString(),
        reference: "CASH-001",
        notes: "Initial payment",
      },
    ];
    setPayments(mockPayments);
  }, [bookingId, paidAmount]);

  const handleAddPayment = () => {
    const payment: Payment = {
      id: Date.now().toString(),
      bookingId,
      amount: newPayment.amount,
      method: newPayment.method,
      status: "completed",
      date: new Date().toISOString(),
      reference: newPayment.reference,
      notes: newPayment.notes,
    };

    const updatedPayments = [...payments, payment];
    setPayments(updatedPayments);
    onPaymentUpdate(updatedPayments);
    
    // Reset form
    setNewPayment({
      amount: 0,
      method: "cash",
      reference: "",
      notes: "",
    });
    setShowAddPayment(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">৳{totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">৳{paidAmount.toLocaleString()}</p>
              </div>
              {paidAmount > 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-red-600">৳{remainingAmount.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Progress</span>
            <span className="text-sm font-normal">{paymentProgress.toFixed(1)}% Complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-green-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${paymentProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>৳0</span>
            <span>৳{totalAmount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track all payments for this booking</CardDescription>
            </div>
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Payment</DialogTitle>
                  <DialogDescription>
                    Record a new payment for this booking.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Payment Amount (৳)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      max={remainingAmount}
                      value={newPayment.amount}
                      onChange={(e) => 
                        setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="Enter payment amount"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum: ৳{remainingAmount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="method">Payment Method</Label>
                    <Select 
                      value={newPayment.method} 
                      onValueChange={(value) => 
                        setNewPayment(prev => ({ ...prev, method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="reference">Reference/Transaction ID</Label>
                    <Input
                      id="reference"
                      value={newPayment.reference}
                      onChange={(e) => 
                        setNewPayment(prev => ({ ...prev, reference: e.target.value }))
                      }
                      placeholder="Enter reference number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={newPayment.notes}
                      onChange={(e) => 
                        setNewPayment(prev => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Additional notes"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddPayment(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPayment}>
                      Add Payment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ৳{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {payment.reference || "—"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {payment.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No payments recorded yet</p>
              <p className="text-sm">Add the first payment to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
