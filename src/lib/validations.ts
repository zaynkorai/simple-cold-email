import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  tag: z.string().min(1, "Tag is required").max(50).default("General"),
});

export const batchContactSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        email: z.string().email("Please enter a valid email address"),
        tag: z.string().max(50).optional().default("Lead"),
      })
    )
    .min(1, "At least one contact is required")
    .max(500, "Maximum 500 contacts per batch import"),
});

export const sendEmailSchema = z.object({
  target: z.enum(["all", "tag", "custom"]),
  targetTag: z.string().optional(),
  customEmail: z.string().email("Invalid recipient email").optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Email body cannot be empty"),
  from: z.string().email().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
