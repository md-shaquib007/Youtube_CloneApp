import { z } from "zod";

/**
 * Validation schema for User Registration
 */
export const registerUserSchema = z.object({
    body: z.object({
        username: z
            .string({ required_error: "Username is required" })
            .trim()
            .min(3, "Username must be at least 3 characters")
            .lowercase(),
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .email("Invalid email format")
            .lowercase(),
        fullName: z
            .string({ required_error: "Full name is required" })
            .trim()
            .min(1, "Full name cannot be empty"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
    }),
});

/**
 * Validation schema for User Login
 */
export const loginUserSchema = z.object({
    body: z
        .object({
            username: z.string().trim().lowercase().optional(),
            email: z
                .string()
                .trim()
                .email("Invalid email format")
                .lowercase()
                .optional(),
            password: z
                .string({ required_error: "Password is required" })
                .min(1, "Password cannot be empty"),
        })
        .refine((data) => data.username || data.email, {
            message: "Either username or email is required to login",
            path: ["username"], // Attach error message to the username field by default
        }),
});

/**
 * Validation schema for Change Current Password
 */
export const changeCurrentPasswordSchema = z.object({
    body: z.object({
        oldPassword: z
            .string({ required_error: "Old password is required" })
            .min(1, "Old password cannot be empty"),
        newPassword: z
            .string({ required_error: "New password is required" })
            .min(6, "New password must be at least 6 characters"),
    }),
});

/**
 * Validation schema for Update Account Details
 */
export const updateAccountDetailsSchema = z.object({
    body: z.object({
        fullName: z
            .string({ required_error: "Full name is required" })
            .trim()
            .min(1, "Full name cannot be empty"),
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .email("Invalid email format")
            .lowercase(),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .email("Invalid email format")
            .lowercase(),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z
            .string({ required_error: "New password is required" })
            .min(6, "Password must be at least 6 characters"),
    }),
});
