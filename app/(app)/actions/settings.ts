"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { users } from "@/app/lib/db/schema";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/app/lib/auth/password";
import { clearSession } from "@/app/lib/auth/session";

const updateProfileSchema = z.object({
  username: z.string().trim().min(1, "Display name is required").max(50, "Keep it under 50 characters"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().trim().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileState =
  | { ok?: boolean; username?: string; fieldErrors?: { username?: string[] } }
  | undefined;

export type ChangePasswordState =
  | {
      ok?: boolean;
      fieldErrors?: {
        currentPassword?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
      };
    }
  | undefined;

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const parsed = updateProfileSchema.safeParse({ username: formData.get("username") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.update(users).set({ username: parsed.data.username }).where(eq(users.id, user.id));

  // The name also shows in the navbar's avatar menu, which lives in the layout.
  revalidatePath("/", "layout");
  return { ok: true, username: parsed.data.username };
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  // Google-only accounts have no password to change; the page hides the form
  // for them, this just guards the action itself.
  if (!row?.passwordHash || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect"] } };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, user.id));

  return { ok: true };
}

export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  await db.delete(users).where(eq(users.id, user.id));
  await clearSession();
  redirect("/");
}