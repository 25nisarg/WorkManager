export const EXPENSE_CATEGORIES = [
  "Software",
  "Subscription",
  "Freelancer/External Cost",
  "Advertising",
  "Hosting",
  "Tools",
  "Communication",
  "Travel",
  "Miscellaneous",
] as const;

export const PAYMENT_ACCOUNT_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "upi", label: "UPI" },
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
  { value: "cash", label: "Cash" },
  { value: "wallet", label: "Wallet" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_ACCOUNT_TYPE_VALUES = PAYMENT_ACCOUNT_TYPES.map(
  (type) => type.value
);
