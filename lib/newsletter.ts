export const BUTTONDOWN_API_BASE = "https://api.buttondown.com/v1";

export type SubscriberType = "regular" | "unactivated" | "removed";

export interface ButtondownSubscriber {
  id: string;
  email: string;
  creation_date: string;
  subscriber_type: SubscriberType;
  metadata: Record<string, unknown>;
  tags: string[];
  notes: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

export type EmailStatus = "draft" | "about_to_send" | "sent" | "imported";

export interface ButtondownEmail {
  id: string;
  subject: string;
  body: string;
  creation_date: string;
  modification_date: string;
  publish_date: string | null;
  status: EmailStatus;
  metadata: Record<string, unknown>;
  email_type: "public" | "premium" | "private";
  slug: string;
  external_url: string;
}

export interface ButtondownListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SubscribeRequest {
  email: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  notes?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface CreateEmailRequest {
  subject: string;
  body: string;
  status?: EmailStatus;
  email_type?: "public" | "premium" | "private";
  metadata?: Record<string, unknown>;
}
