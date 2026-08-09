export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "paypal", label: "PayPal" },
  { value: "payoneer", label: "Payoneer" },
  { value: "wise", label: "Wise" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map(
  (method) => method.value
);
