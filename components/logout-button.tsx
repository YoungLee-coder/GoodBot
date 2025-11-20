"use client";

import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <Button
      onClick={() => logout()}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      登出
    </Button>
  );
}
