"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PendingSubmitButtonProps = {
  children: ReactNode;
  pendingText: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
};

export function PendingSubmitButton({
  children,
  pendingText,
  className,
  variant = "default",
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={pending}
      type="submit"
      variant={variant}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
