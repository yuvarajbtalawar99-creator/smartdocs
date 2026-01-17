import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Mail, Lock, Camera, Save, LogOut, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

import { useUser } from "@/integrations/supabase/hooks/useUser";
import { useSecurity } from "@/components/security/SecurityProvider";
import { Switch } from "@/components/ui/switch";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useUser();
  const { hasPin, setPin, isBiometricsEnabled, setBiometricsEnabled } = useSecurity();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "",
        email: user.email || "",
        avatar_url: user.user_metadata?.avatar_url || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
        },
      });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];

    // Validate file type (images only)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Profile picture must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: urlData.publicUrl,
        },
      });

      if (updateError) throw updateError;

      setProfileData({ ...profileData, avatar_url: urlData.publicUrl });
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setChangingPassword(false);
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  const handleSendVerificationCode = async () => {
    if (!user?.email) return;

    // Generate a 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'verification',
          email: user.email,
          name: profileData.full_name,
          code: code
        }
      });

      if (error) throw error;

      setIsVerifying(true);
      toast({
        title: "Verification Code Sent",
        description: `We've sent a 6-digit code to ${user.email}`,
      });
    } catch (err) {
      console.error("Error sending verification code:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send verification code. Please try again.",
      });
    }
  };

  const handleVerifyAndSave = async () => {
    if (!hasPin || verificationCode === generatedCode) {
      try {
        await setPin(newPin);
        setIsSettingPin(false);
        setIsVerifying(false);
        setNewPin("");
        setVerificationCode("");
        toast({
          title: "PIN Set Successfully",
          description: "Your digital vault is now secured and synced to the cloud.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save PIN. Please try again.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The verification code you entered is incorrect.",
      });
    }
  };

  if (userLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            👤 User Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                    <UserIcon className="h-12 w-12 text-primary" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors border-2 border-background">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={saving}
                  />
                </label>
              </div>
              <div>
                <p className="font-medium text-foreground">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or WEBP. Max size 2MB
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                <UserIcon className="h-4 w-4 inline mr-2" />
                Full Name
              </Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) =>
                  setProfileData({ ...profileData, full_name: e.target.value })
                }
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </Label>
              <Input
                id="email"
                value={profileData.email}
                disabled
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <Button onClick={handleProfileUpdate} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!changingPassword ? (
              <Button
                variant="outline"
                onClick={() => setChangingPassword(true)}
                className="w-full"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {saving ? "Updating..." : "Update Password"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vault Security */}
        <Card className="mb-6 border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Vault Security
            </CardTitle>
            <CardDescription>Secure your digital vault with a 6-digit PIN and biometrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">PIN Lock</Label>
                <p className="text-sm text-muted-foreground">
                  Ask for a 6-digit PIN when opening the app
                </p>
              </div>
              <Switch
                checked={hasPin}
                onCheckedChange={async (checked) => {
                  if (!checked) {
                    try {
                      await setPin("");
                      toast({
                        title: "PIN Disabled",
                        description: "Your digital vault is no longer protected by a PIN.",
                      });
                    } catch (err) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to disable PIN.",
                      });
                    }
                  } else {
                    setIsSettingPin(true);
                  }
                }}
              />
            </div>

            {hasPin && (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Biometric Unlock</Label>
                    <p className="text-sm text-muted-foreground">
                      Use fingerprint or face recognition to unlock
                    </p>
                  </div>
                  <Switch
                    checked={isBiometricsEnabled}
                    onCheckedChange={async (checked) => {
                      try {
                        await setBiometricsEnabled(checked);
                        toast({
                          title: checked ? "Biometrics Enabled" : "Biometrics Disabled",
                          description: checked
                            ? "You can now use biometrics to unlock your vault."
                            : "Biometrics has been disabled.",
                        });
                      } catch (err) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to update biometrics preference.",
                        });
                      }
                    }}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsSettingPin(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change 6-Digit PIN
                </Button>
              </>
            )}

            {isSettingPin && !isVerifying && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between">
                  <Label>Step 1: Set New 6-Digit PIN</Label>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsSettingPin(false);
                    setNewPin("");
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={newPin}
                    onChange={setNewPin}
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 md:w-12 bg-background" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full"
                  disabled={newPin.length !== 6}
                  onClick={hasPin ? handleSendVerificationCode : handleVerifyAndSave}
                >
                  {hasPin ? <Mail className="h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  {hasPin ? "Continue to Email Verification" : "Save PIN Now"}
                </Button>
              </div>
            )}

            {isVerifying && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between">
                  <Label>Step 2: Enter Verification Code</Label>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsVerifying(false);
                    setVerificationCode("");
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  We've sent a code to {user?.email}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 md:w-12 bg-background" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full"
                  disabled={verificationCode.length !== 6}
                  onClick={handleVerifyAndSave}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify & Save PIN
                </Button>
                <Button
                  variant="link"
                  className="w-full text-xs"
                  onClick={handleSendVerificationCode}
                >
                  Didn't receive a code? Resend
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout Securely
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
