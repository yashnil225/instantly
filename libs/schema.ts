import { z } from "zod";

import { AssessmentTypeEnum } from "./enums/assessment-type-enum";
import { validateDate } from "./date";

export const FormDataSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  assessmentType: z.nativeEnum(AssessmentTypeEnum, {
    message: "Assessment type is required"
  }),
  assessmentMeasures: z.object({
    chest: z
      .number()
      .optional(),
    triceps: z
      .number()
      .optional(),
    suprailiac: z
      .number()
      .optional(),
    thigh: z
      .number()
      .optional(),
    abdomen: z
      .number()
      .optional(),
    calf: z
      .number()
      .optional(),
    axilla: z
      .number()
      .optional(),
    subscapular: z
      .number()
      .optional(),
    weight: z.number({
      message: "Weight is required and must be a number",
    }),
    height: z.number({
      message: "Height is required and must be a number",
    }),
  }),
  bodyMeasurement: z.object({
    neck: z
      .number()
      .optional(),
    shoulder: z
      .number()
      .optional(),
    chest: z
      .number()
      .optional(),
    waist: z
      .number()
      .optional(),
    abdomen: z
      .number()
      .optional(),
    hip: z
      .number()
      .optional(),
    right: z.object({
      arm: z
        .number()
        .optional(),
      forearm: z
        .number()
        .optional(),
      thigh: z
        .number()
        .optional(),
      calf: z
        .number()
        .optional(),
    }),
    left: z.object({
      arm: z
        .number()
        .optional(),
      forearm: z
        .number()
        .optional(),
      thigh: z
        .number()
        .optional(),
      calf: z
        .number()
        .optional(),
    }),
  }),
  startDate: z
    .string()
    .regex(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      "Please use the format: DD/MM/YYYY"
    ),
  endDate: z
    .string()
    .regex(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      "Please use the format: DD/MM/YYYY"
    ),
});

export const SignInSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export const RequestResetPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email." }),
});

export const SignupSchema = z.object({
  name: z
    .string()
    .min(6, "Name must be at least 6 characters."),
  email: z
    .string()
    .email("Invalid email."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),
  birthDate: z
    .string()
    .refine((data) => validateDate(data), {
      message: "Invalid date format. Use DD/MM/YYYY.",
    }),
  phone: z
    .string()
    .min(10, "Phone must have at least 11 characters.")
    .optional(),
});
