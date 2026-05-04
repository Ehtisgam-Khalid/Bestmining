export interface UserProfile {
  uid: string;
  email: string;
  balance: number;
  totalDeposits: number;
  gameCount: number;
  isAdmin: boolean;
  createdAt: string;
}

export interface Deposit {
  id?: string;
  userId: string;
  email: string;
  amount: number;
  screenshotUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Withdrawal {
  id?: string;
  userId: string;
  email: string;
  amount: number;
  accountNumber: string;
  accountName: string;
  provider: string;
  status: "pending" | "paid" | "rejected";
  createdAt: string;
}
