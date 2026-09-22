export interface Contact {
  id: string;
  name: string;
  email: string;
  tag: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  resendId?: string;
  to: string | string[];
  from: string;
  subject: string;
  body: string;
  status: "delivered" | "sent" | "failed";
  createdAt: string;
  error?: string;
  isSimulated?: boolean;
}

export interface UserSession {
  email: string;
  authenticated: boolean;
}
