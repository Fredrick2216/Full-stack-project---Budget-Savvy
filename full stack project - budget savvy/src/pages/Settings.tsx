
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSupabase } from "@/components/SupabaseProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { user, updateProfile } = useSupabase();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await updateProfile({ fullName });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (value: string) => {
    setTheme(value as "light" | "dark" | "system");
    toast({
      title: "Theme updated",
      description: `Theme set to ${value} mode.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="glassmorphism text-white">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription className="text-gray-400">Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-white/5 border-white/10 text-gray-400"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-space-purple hover:bg-space-pink text-white"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="glassmorphism text-white mt-6">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription className="text-gray-400">Update your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <Button className="bg-space-purple hover:bg-space-pink text-white">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glassmorphism text-white">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription className="text-gray-400">Customize your interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Theme</h3>
                  <RadioGroup 
                    defaultValue={theme} 
                    onValueChange={handleThemeChange}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem id="light" value="light" className="border-space-purple text-space-purple" />
                      <Label htmlFor="light" className="cursor-pointer">Light</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem id="dark" value="dark" className="border-space-purple text-space-purple" />
                      <Label htmlFor="dark" className="cursor-pointer">Dark</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem id="system" value="system" className="border-space-purple text-space-purple" />
                      <Label htmlFor="system" className="cursor-pointer">System</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism text-white">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription className="text-gray-400">Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Coming soon</p>
                <Button disabled className="w-full bg-gray-600">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism bg-red-900/20 text-white">
            <CardHeader>
              <CardTitle className="text-red-300">Danger Zone</CardTitle>
              <CardDescription className="text-red-200/70">
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full bg-red-800 hover:bg-red-700 text-white"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
