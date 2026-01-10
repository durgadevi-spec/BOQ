import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button"; // uppercase B

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Lock, User, Hammer, Building2 } from "lucide-react";
import { useData, Role } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: localLogin } = useData();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("user");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // use server auth to get token + user
      login(email, 'password123', role).catch(() => {});
      // also set local app user for UI state
      localLogin({
        id: "1",
        name: email.split("@")[0] || "User",
        email: email,
        role: role,
        shopId: role === 'supplier' ? '1' : undefined
      });
      setIsLoading(false);
      setLocation("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-background to-primary/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <Card className="border-2 border-border shadow-2xl">
          <CardHeader className="space-y-2 pb-6 border-b">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Hammer className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-heading">BuildEstimate Pro</CardTitle>
            <CardDescription className="text-center">Construction & Interior Estimator</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User / Client</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="purchase_team">Purchase Team</SelectItem>
                    <SelectItem value="software_team">Software Team</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Email
                </Label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Password
                </Label>
                <Input type="password" placeholder="••••••••" defaultValue="password123" />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t pt-6 bg-muted/20">
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Mockup Mode: Any email/password works
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
