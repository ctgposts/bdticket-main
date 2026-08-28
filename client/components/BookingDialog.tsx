import React, { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import validation, { ValidationResult } from "../lib/validation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  CalendarDays,
  Phone,
  Mail,
  User,
  CreditCard,
  Plane,
} from "lucide-react";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: any;
  onSubmit: (bookingData: any) => void;
}

export function BookingDialog({
  isOpen,
  onClose,
  ticket,
  onSubmit,
}: BookingDialogProps) {
  const [formData, setFormData] = useState({
    // Agent Information
    agentName: "",
    agentPhone: "",
    agentEmail: "",

    // Passenger Information
    passengerName: "",
    passportNo: "",
    passengerPhone: "",
    passengerEmail: "",

    // Payment Information
    sellingPrice: ticket?.selling_price || 0,
    paymentType: "full",
    partialAmount: 0,
    paymentMethod: "cash",
    paymentDetails: "",

    // Additional Information
    comments: "",
    emergencyContact: "",
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when ticket changes
  useEffect(() => {
    if (ticket) {
      setFormData((prev) => ({
        ...prev,
        sellingPrice: ticket.selling_price || 0,
      }));
    }
  }, [ticket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        ticketId: ticket?.id,
        agentInfo: {
          name: formData.agentName,
          phone: formData.agentPhone,
          email: formData.agentEmail,
        },
        passengerInfo: {
          name: formData.passengerName,
          passportNo: formData.passportNo,
          phone: formData.passengerPhone,
          email: formData.passengerEmail,
          paxCount: 1, // Always 1 passenger per ticket
        },
        sellingPrice: formData.sellingPrice,
        paymentType: formData.paymentType,
        partialAmount: formData.partialAmount,
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentDetails,
        comments: `${formData.comments} | Emergency: ${formData.emergencyContact} | Special: ${formData.specialRequests}`,
      });
    } catch (error) {
      console.error("Booking submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Create New Booking
          </DialogTitle>
          <DialogDescription>
            Fill in the details to create a new booking for this flight ticket.
          </DialogDescription>
        </DialogHeader>

        {ticket && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Flight</Label>
                <p className="font-medium">{ticket.flight_number}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Route</Label>
                <p className="font-medium">{ticket.batch?.country_code}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Date</Label>
                <p className="font-medium">
                  {new Date(ticket.batch?.flight_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Base Price</Label>
                <p className="font-medium">
                  ৳{ticket.selling_price?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Agent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agentName">Agency/Agent Name *</Label>
                <Input
                  id="agentName"
                  value={formData.agentName}
                  onChange={(e) => updateFormData("agentName", e.target.value)}
                  placeholder="Enter agency or agent name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="agentPhone">Phone Number</Label>
                <Input
                  id="agentPhone"
                  value={formData.agentPhone}
                  onChange={(e) => updateFormData("agentPhone", e.target.value)}
                  placeholder="+880-XXX-XXXXXX"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="agentEmail">Email Address</Label>
                <Input
                  id="agentEmail"
                  type="email"
                  value={formData.agentEmail}
                  onChange={(e) => updateFormData("agentEmail", e.target.value)}
                  placeholder="agent@example.com"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Passenger Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Passenger Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passengerName">Passenger Name *</Label>
                <Input
                  id="passengerName"
                  value={formData.passengerName}
                  onChange={(e) =>
                    updateFormData("passengerName", e.target.value)
                  }
                  placeholder="Full name as in passport"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passportNo">Passport Number *</Label>
                <Input
                  id="passportNo"
                  value={formData.passportNo}
                  onChange={(e) => updateFormData("passportNo", e.target.value)}
                  placeholder="Passport number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passengerPhone">Phone Number *</Label>
                <Input
                  id="passengerPhone"
                  value={formData.passengerPhone}
                  onChange={(e) =>
                    updateFormData("passengerPhone", e.target.value)
                  }
                  placeholder="+880-XXX-XXXXXX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passengerEmail">Email Address</Label>
                <Input
                  id="passengerEmail"
                  type="email"
                  value={formData.passengerEmail}
                  onChange={(e) =>
                    updateFormData("passengerEmail", e.target.value)
                  }
                  placeholder="passenger@example.com"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    updateFormData("emergencyContact", e.target.value)
                  }
                  placeholder="Emergency contact number"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sellingPrice">Selling Price (৳) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    updateFormData("sellingPrice", parseFloat(e.target.value))
                  }
                  required
                  className={
                    ticket?.batch?.buying_price &&
                    formData.sellingPrice < ticket.batch.buying_price
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                />
                {ticket?.batch?.buying_price && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Buying Price:</span>
                      <span className="font-medium">
                        ৳{ticket.batch.buying_price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profit:</span>
                      <span
                        className={`font-medium ${
                          formData.sellingPrice - ticket.batch.buying_price >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ৳
                        {(
                          formData.sellingPrice - ticket.batch.buying_price
                        ).toLocaleString()}
                      </span>
                    </div>
                    {formData.sellingPrice > 0 &&
                      ticket.batch.buying_price > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Profit Margin:</span>
                          <span
                            className={`font-medium ${
                              ((formData.sellingPrice -
                                ticket.batch.buying_price) /
                                formData.sellingPrice) *
                                100 >=
                              0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(
                              ((formData.sellingPrice -
                                ticket.batch.buying_price) /
                                formData.sellingPrice) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    {formData.sellingPrice < ticket.batch.buying_price && (
                      <p className="text-red-600 text-xs mt-1">
                        ⚠️ Warning: Selling price is below buying price (Loss!)
                      </p>
                    )}
                    {formData.sellingPrice < ticket.batch.buying_price * 1.05 &&
                      formData.sellingPrice >= ticket.batch.buying_price && (
                        <p className="text-yellow-600 text-xs mt-1">
                          ⚠️ Low profit margin (less than 5%)
                        </p>
                      )}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) =>
                    updateFormData("paymentType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Payment</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentType === "partial" && (
                <div>
                  <Label htmlFor="partialAmount">Advance Amount (৳)</Label>
                  <Input
                    id="partialAmount"
                    type="number"
                    min="0"
                    max={formData.sellingPrice}
                    value={formData.partialAmount}
                    onChange={(e) =>
                      updateFormData(
                        "partialAmount",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    updateFormData("paymentMethod", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_banking">
                      Mobile Banking
                    </SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="paymentDetails">Payment Details</Label>
                <Input
                  id="paymentDetails"
                  value={formData.paymentDetails}
                  onChange={(e) =>
                    updateFormData("paymentDetails", e.target.value)
                  }
                  placeholder="Transaction ID, check number, etc."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) =>
                    updateFormData("specialRequests", e.target.value)
                  }
                  placeholder="Meal preferences, wheelchair assistance, etc."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="comments">Comments & Notes</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => updateFormData("comments", e.target.value)}
                  placeholder="Additional notes about this booking"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Booking..." : "Create Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
