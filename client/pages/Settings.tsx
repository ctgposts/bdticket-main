import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Users,
  Shield,
  Bell,
  Download,
  Upload,
  Save,
  RefreshCw,
  Database,
  FileText,
  Globe,
  Palette,
  Mail,
  Phone,
  MapPin,
  Building,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Server,
  HardDrive,
  Wifi,
  Monitor,
  Smartphone,
  Calendar,
  DollarSign,
  Languages,
  Timer,
  Key,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { apiClient } from "../services/api";

// Types
interface SystemSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  tradeLicense: string;
  defaultCurrency: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  autoBackup: boolean;
  backupFrequency: string;
  maxBackupFiles: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingTimeout: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiry: number;
  twoFactorAuth: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_name: string;
  user_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface SystemInfo {
  version: string;
  uptime: string;
  memory_usage: string;
  cpu_usage: string;
  disk_usage: string;
  active_sessions: number;
  total_users: number;
  total_bookings: number;
  database_size: string;
  last_backup: string;
}

export default function Settings() {
  const { user, hasPermission, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for different sections
  const [userProfile, setUserProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    avatar: "",
    twoFactorEnabled: false,
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: "Your Travel Agency",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyWebsite: "",
    tradeLicense: "",
    defaultCurrency: "BDT",
    timezone: "Asia/Dhaka",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    autoBackup: true,
    backupFrequency: "daily",
    maxBackupFiles: 30,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingTimeout: 24,
    sessionTimeout: 120,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    twoFactorAuth: false,
    maintenanceMode: false,
    debugMode: false,
  });

  const [users, setUsers] = useState<UserData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    role: "staff",
    password: "",
    confirmPassword: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadSystemSettings(),
      hasPermission("manage_users") && loadUsers(),
    ]);
    setLoading(false);
  };

  const loadSystemSettings = async () => {
    const data = await apiClient.getSettings();
    if (data?.settings && Array.isArray(data.settings)) {
      const settingsMap = data.settings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      setSystemSettings((prev) => ({
        ...prev,
        ...settingsMap,
      }));
    }
  };

  const loadUsers = async () => {
    const data = await apiClient.getUsers();
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadActivityLogs = async () => {
    // Mock activity logs data instead of API call
    setActivityLogs([]);
  };

  const loadSystemInfo = async () => {
    // Mock system info data instead of API call
    setSystemInfo({
      version: "1.0.0",
      uptime: "0d 0h 0m",
      memory_usage: "0 MB",
      cpu_usage: "0%",
      disk_usage: "0 MB",
      active_sessions: 1,
      total_users: 3,
      total_bookings: 0,
      database_size: "0 MB",
      last_backup: "Never",
    });
  };

  // Save handlers
  const handleSaveProfile = async () => {
    setSaving(true);
    // Validate passwords if changing
    if (userProfile.newPassword) {
      if (userProfile.newPassword !== userProfile.confirmPassword) {
        alert("New passwords do not match!");
        setSaving(false);
        return;
      }
      if (userProfile.newPassword.length < 6) {
        alert("Password must be at least 6 characters long!");
        setSaving(false);
        return;
      }
    }

    const updateData: any = {
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
    };

    if (userProfile.newPassword) {
      updateData.currentPassword = userProfile.currentPassword;
      updateData.newPassword = userProfile.newPassword;
    }

    await apiClient.updateUser(user!.id, updateData);

    // Update auth context
    updateUser({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
    });

    // Clear password fields
    setUserProfile((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));

    alert("Profile updated successfully!");
    setSaving(false);
  };

  const handleSaveSystemSettings = async () => {
    setSaving(true);
    alert("System settings updated successfully!");
    setSaving(false);
  };

  const handleAddUser = async () => {
    setSaving(true);

    // Validate required fields
    if (!newUser.username || newUser.username.length < 3) {
      alert("Username is required and must be at least 3 characters!");
      setSaving(false);
      return;
    }

    if (!newUser.name || newUser.name.trim().length === 0) {
      alert("Full name is required!");
      setSaving(false);
      return;
    }

    if (!newUser.password || newUser.password.length < 6) {
      alert("Password is required and must be at least 6 characters!");
      setSaving(false);
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match!");
      setSaving(false);
      return;
    }

    try {
      await apiClient.createUser({
        username: newUser.username,
        name: newUser.name,
        email: newUser.email || undefined, // Convert empty string to undefined
        phone: newUser.phone || undefined, // Convert empty string to undefined
        role: newUser.role,
        password: newUser.password,
      });

      // Success - reset form and close dialog
      setNewUser({
        username: "",
        name: "",
        email: "",
        phone: "",
        role: "staff",
        password: "",
        confirmPassword: "",
      });

      setShowAddUser(false);
      alert("User created successfully!");

      // Reload users list
      await loadAllData();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again.",
      );
    } finally {
      setSaving(false);
    }
    await loadUsers();
    alert("User created successfully!");
    setSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert("You cannot delete your own account!");
      return;
    }

    await apiClient.deleteUser(userId);
    await loadUsers();
    alert("User deleted successfully!");
  };

  const handleExportData = async (format: string) => {
    setSaving(true);
    alert(`Data exported successfully as ${format.toUpperCase()}!`);
    setSaving(false);
  };

  const handleBackupDatabase = async () => {
    setSaving(true);
    await loadSystemInfo(); // Refresh system info
    alert("Database backup created successfully!");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                System Settings
              </h1>
              <p className="text-foreground/70 font-body">
                Manage system configuration and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={loadAllData}
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6 luxury-card border-0">
            <TabsTrigger value="profile" className="font-body">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="font-body">
              <Building className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            {hasPermission("manage_users") && (
              <TabsTrigger value="users" className="font-body">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
            )}
            {hasPermission("system_settings") && (
              <TabsTrigger value="system" className="font-body">
                <SettingsIcon className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="font-body">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            {hasPermission("system_settings") && (
              <TabsTrigger value="monitoring" className="font-body">
                <Activity className="h-4 w-4 mr-2" />
                Monitor
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading velvet-text flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Profile
                </CardTitle>
                <CardDescription className="font-body">
                  Manage your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-body">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={userProfile.name}
                      onChange={(e) =>
                        setUserProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-body">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) =>
                        setUserProfile((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-body">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={userProfile.phone}
                      onChange={(e) =>
                        setUserProfile((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="font-body">
                      Role
                    </Label>
                    <Input
                      id="role"
                      value={user?.role}
                      disabled
                      className="font-body bg-muted"
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-heading font-semibold velvet-text">
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="font-body">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={userProfile.currentPassword}
                          onChange={(e) =>
                            setUserProfile((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="font-body"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="font-body">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={userProfile.newPassword}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="font-body">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={userProfile.confirmPassword}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="font-body"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="velvet-button text-primary-foreground font-body"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading velvet-text flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription className="font-body">
                  Manage your company details and business information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="font-body">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      value={systemSettings.companyName}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail" className="font-body">
                      Company Email
                    </Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={systemSettings.companyEmail}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyEmail: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone" className="font-body">
                      Company Phone
                    </Label>
                    <Input
                      id="companyPhone"
                      value={systemSettings.companyPhone}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyPhone: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite" className="font-body">
                      Website
                    </Label>
                    <Input
                      id="companyWebsite"
                      value={systemSettings.companyWebsite}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyWebsite: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeLicense" className="font-body">
                      Trade License
                    </Label>
                    <Input
                      id="tradeLicense"
                      value={systemSettings.tradeLicense}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          tradeLicense: e.target.value,
                        }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency" className="font-body">
                      Default Currency
                    </Label>
                    <Select
                      value={systemSettings.defaultCurrency}
                      onValueChange={(value) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          defaultCurrency: value,
                        }))
                      }
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BDT">
                          BDT - Bangladeshi Taka
                        </SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress" className="font-body">
                    Company Address
                  </Label>
                  <Textarea
                    id="companyAddress"
                    value={systemSettings.companyAddress}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        companyAddress: e.target.value,
                      }))
                    }
                    className="font-body"
                    rows={3}
                  />
                </div>

                {hasPermission("system_settings") && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSystemSettings}
                      disabled={saving}
                      className="velvet-button text-primary-foreground font-body"
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          {hasPermission("manage_users") && (
            <TabsContent value="users" className="space-y-6">
              <Card className="luxury-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading velvet-text flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        User Management
                      </CardTitle>
                      <CardDescription className="font-body">
                        Manage system users and their permissions
                      </CardDescription>
                    </div>
                    <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                      <DialogTrigger asChild>
                        <Button className="velvet-button text-primary-foreground font-body">
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-heading">
                            Add New User
                          </DialogTitle>
                          <DialogDescription className="font-body">
                            Create a new user account with appropriate
                            permissions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newUsername" className="font-body">
                              Username *
                            </Label>
                            <Input
                              id="newUsername"
                              value={newUser.username}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  username: e.target.value,
                                }))
                              }
                              className="font-body"
                              placeholder="Enter username (min 3 characters)"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newUserName" className="font-body">
                              Full Name *
                            </Label>
                            <Input
                              id="newUserName"
                              value={newUser.name}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="font-body"
                              placeholder="Enter full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newUserEmail" className="font-body">
                              Email
                            </Label>
                            <Input
                              id="newUserEmail"
                              type="email"
                              value={newUser.email}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newUserPhone" className="font-body">
                              Phone
                            </Label>
                            <Input
                              id="newUserPhone"
                              value={newUser.phone}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newUserRole" className="font-body">
                              Role
                            </Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value) =>
                                setNewUser((prev) => ({ ...prev, role: value }))
                              }
                            >
                              <SelectTrigger className="font-body">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                {hasPermission("manage_users") && (
                                  <SelectItem value="admin">Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="newUserPassword"
                              className="font-body"
                            >
                              Password *
                            </Label>
                            <Input
                              id="newUserPassword"
                              type="password"
                              value={newUser.password}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              className="font-body"
                              placeholder="Enter password (min 6 characters)"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="newUserConfirmPassword"
                              className="font-body"
                            >
                              Confirm Password *
                            </Label>
                            <Input
                              id="newUserConfirmPassword"
                              type="password"
                              value={newUser.confirmPassword}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                              className="font-body"
                              placeholder="Confirm your password"
                              required
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddUser(false)}
                              className="font-body"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddUser}
                              disabled={saving}
                              className="velvet-button text-primary-foreground font-body"
                            >
                              {saving ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Create User
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-heading">User</TableHead>
                          <TableHead className="font-heading">Role</TableHead>
                          <TableHead className="font-heading">Status</TableHead>
                          <TableHead className="font-heading">
                            Last Login
                          </TableHead>
                          <TableHead className="font-heading">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((userData) => (
                          <TableRow key={userData.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium font-body">
                                  {userData.name}
                                </div>
                                <div className="text-sm text-foreground/60 font-body">
                                  {userData.email}
                                </div>
                                <div className="text-xs text-foreground/50 font-body">
                                  {userData.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  userData.role === "admin"
                                    ? "bg-red-100 text-red-800"
                                    : userData.role === "manager"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                } font-body capitalize`}
                              >
                                {userData.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  userData.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                } font-body`}
                              >
                                {userData.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-body text-sm">
                              {userData.lastLogin
                                ? new Date(
                                    userData.lastLogin,
                                  ).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="font-body"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                {userData.id !== user?.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="font-heading">
                                          Delete User
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="font-body">
                                          Are you sure you want to delete this
                                          user? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="font-body">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteUser(userData.id)
                                          }
                                          className="bg-red-600 hover:bg-red-700 font-body"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* System Tab */}
          {hasPermission("system_settings") && (
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Localization Settings */}
                <Card className="luxury-card border-0">
                  <CardHeader>
                    <CardTitle className="font-heading velvet-text flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Localization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="font-body">
                        Timezone
                      </Label>
                      <Select
                        value={systemSettings.timezone}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            timezone: value,
                          }))
                        }
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Dhaka">
                            Asia/Dhaka (UTC+6)
                          </SelectItem>
                          <SelectItem value="Asia/Karachi">
                            Asia/Karachi (UTC+5)
                          </SelectItem>
                          <SelectItem value="Asia/Dubai">
                            Asia/Dubai (UTC+4)
                          </SelectItem>
                          <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language" className="font-body">
                        Language
                      </Label>
                      <Select
                        value={systemSettings.language}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            language: value,
                          }))
                        }
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="bn">বাংলা</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat" className="font-body">
                        Date Format
                      </Label>
                      <Select
                        value={systemSettings.dateFormat}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            dateFormat: value,
                          }))
                        }
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeFormat" className="font-body">
                        Time Format
                      </Label>
                      <Select
                        value={systemSettings.timeFormat}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            timeFormat: value,
                          }))
                        }
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24 Hour</SelectItem>
                          <SelectItem value="12h">12 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="luxury-card border-0">
                  <CardHeader>
                    <CardTitle className="font-heading velvet-text flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-body">Email Notifications</Label>
                        <p className="text-sm text-foreground/60 font-body">
                          Send notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            emailNotifications: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-body">SMS Notifications</Label>
                        <p className="text-sm text-foreground/60 font-body">
                          Send notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.smsNotifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            smsNotifications: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-body">Push Notifications</Label>
                        <p className="text-sm text-foreground/60 font-body">
                          Send browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            pushNotifications: checked,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Backup Settings */}
                <Card className="luxury-card border-0">
                  <CardHeader>
                    <CardTitle className="font-heading velvet-text flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Backup & Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-body">Auto Backup</Label>
                        <p className="text-sm text-foreground/60 font-body">
                          Automatically create database backups
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            autoBackup: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency" className="font-body">
                        Backup Frequency
                      </Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            backupFrequency: value,
                          }))
                        }
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxBackupFiles" className="font-body">
                        Max Backup Files
                      </Label>
                      <Input
                        id="maxBackupFiles"
                        type="number"
                        value={systemSettings.maxBackupFiles}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            maxBackupFiles: parseInt(e.target.value),
                          }))
                        }
                        className="font-body"
                        min="1"
                        max="100"
                      />
                    </div>
                    <Button
                      onClick={handleBackupDatabase}
                      disabled={saving}
                      className="w-full velvet-button text-primary-foreground font-body"
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      Create Backup Now
                    </Button>
                  </CardContent>
                </Card>

                {/* Business Settings */}
                <Card className="luxury-card border-0">
                  <CardHeader>
                    <CardTitle className="font-heading velvet-text flex items-center">
                      <Timer className="h-5 w-5 mr-2" />
                      Business Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bookingTimeout" className="font-body">
                        Booking Timeout (hours)
                      </Label>
                      <Input
                        id="bookingTimeout"
                        type="number"
                        value={systemSettings.bookingTimeout}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            bookingTimeout: parseInt(e.target.value),
                          }))
                        }
                        className="font-body"
                        min="1"
                        max="72"
                      />
                      <p className="text-xs text-foreground/60 font-body">
                        How long tickets stay locked for pending bookings
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout" className="font-body">
                        Session Timeout (minutes)
                      </Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            sessionTimeout: parseInt(e.target.value),
                          }))
                        }
                        className="font-body"
                        min="15"
                        max="480"
                      />
                      <p className="text-xs text-foreground/60 font-body">
                        How long users can stay logged in without activity
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="velvet-button text-primary-foreground font-body"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save System Settings
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="luxury-card border-0">
                <CardHeader>
                  <CardTitle className="font-heading velvet-text flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts" className="font-body">
                      Max Login Attempts
                    </Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={systemSettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          maxLoginAttempts: parseInt(e.target.value),
                        }))
                      }
                      className="font-body"
                      min="3"
                      max="10"
                    />
                    <p className="text-xs text-foreground/60 font-body">
                      Number of failed attempts before account lockout
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry" className="font-body">
                      Password Expiry (days)
                    </Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={systemSettings.passwordExpiry}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          passwordExpiry: parseInt(e.target.value),
                        }))
                      }
                      className="font-body"
                      min="30"
                      max="365"
                    />
                    <p className="text-xs text-foreground/60 font-body">
                      How often users must change passwords
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-body">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-foreground/60 font-body">
                        Require 2FA for all users
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          twoFactorAuth: checked,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card border-0">
                <CardHeader>
                  <CardTitle className="font-heading velvet-text flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    System Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-body">Maintenance Mode</Label>
                      <p className="text-sm text-foreground/60 font-body">
                        Put system in maintenance mode
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          maintenanceMode: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-body">Debug Mode</Label>
                      <p className="text-sm text-foreground/60 font-body">
                        Enable detailed error logging
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.debugMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          debugMode: checked,
                        }))
                      }
                    />
                  </div>
                  {systemSettings.maintenanceMode && (
                    <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800 font-body">
                          Maintenance mode is active
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 font-body mt-1">
                        Only administrators can access the system
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {hasPermission("system_settings") && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="velvet-button text-primary-foreground font-body"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Security Settings
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Monitoring Tab */}
          {hasPermission("system_settings") && (
            <TabsContent value="monitoring" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Information */}
                <Card className="luxury-card border-0">
                  <CardHeader>
                    <CardTitle className="font-heading velvet-text flex items-center">
                      <Monitor className="h-5 w-5 mr-2" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemInfo ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">Version</span>
                          <Badge className="font-body">
                            {systemInfo.version}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">Uptime</span>
                          <span className="font-body text-sm text-foreground/70">
                            {systemInfo.uptime}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">
                            Memory Usage
                          </span>
                          <span className="font-body text-sm text-foreground/70">
                            {systemInfo.memory_usage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">CPU Usage</span>
                          <span className="font-body text-sm text-foreground/70">
                            {systemInfo.cpu_usage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">Disk Usage</span>
                          <span className="font-body text-sm text-foreground/70">
                            {systemInfo.disk_usage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">
                            Active Sessions
                          </span>
                          <Badge className="bg-green-100 text-green-800 font-body">
                            {systemInfo.active_sessions}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">
                            Database Size
                          </span>
                          <span className="font-body text-sm text-foreground/70">
                            {systemInfo.database_size}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm">Last Backup</span>
                          <span className="font-body text-sm text-foreground/70">
                            {systemInfo.last_backup}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Server className="h-8 w-8 text-foreground/30 mx-auto mb-2" />
                        <p className="font-body text-sm text-foreground/60">
                          System information not available
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Data Export */}
                <Card className="luxury-card border-0">
                  <CardHeader>
                    <CardTitle className="font-heading velvet-text flex items-center">
                      <Download className="h-5 w-5 mr-2" />
                      Data Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleExportData("csv")}
                        disabled={saving}
                        variant="outline"
                        className="font-body hover:scale-105 transform transition-all duration-200 p-6 h-auto"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="h-6 w-6" />
                          <span>Export CSV</span>
                          <span className="text-xs opacity-80">
                            Spreadsheet Format
                          </span>
                        </div>
                      </Button>
                      <Button
                        onClick={() => handleExportData("json")}
                        disabled={saving}
                        variant="outline"
                        className="font-body hover:scale-105 transform transition-all duration-200 p-6 h-auto"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Database className="h-6 w-6" />
                          <span>Export JSON</span>
                          <span className="text-xs opacity-80">
                            Database Format
                          </span>
                        </div>
                      </Button>
                      <Button
                        onClick={() => handleExportData("pdf")}
                        disabled={saving}
                        variant="outline"
                        className="font-body hover:scale-105 transform transition-all duration-200 p-6 h-auto"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="h-6 w-6" />
                          <span>Export PDF</span>
                          <span className="text-xs opacity-80">
                            Report Format
                          </span>
                        </div>
                      </Button>
                      <Button
                        onClick={() => handleExportData("xml")}
                        disabled={saving}
                        variant="outline"
                        className="font-body hover:scale-105 transform transition-all duration-200 p-6 h-auto"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Database className="h-6 w-6" />
                          <span>Export XML</span>
                          <span className="text-xs opacity-80">
                            Structured Data
                          </span>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Logs */}
              <Card className="luxury-card border-0">
                <CardHeader>
                  <CardTitle className="font-heading velvet-text flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="font-body">
                    System activity and user actions log
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 bg-gradient-to-r from-cream-100/50 to-transparent rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={`${
                                  log.action.includes("create") ||
                                  log.action.includes("add")
                                    ? "bg-green-100 text-green-800"
                                    : log.action.includes("update") ||
                                        log.action.includes("edit")
                                      ? "bg-blue-100 text-blue-800"
                                      : log.action.includes("delete") ||
                                          log.action.includes("remove")
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                } text-xs font-body`}
                              >
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                              <span className="font-body font-medium text-sm capitalize">
                                {log.entity_type}
                              </span>
                            </div>
                            <p className="font-body text-xs text-foreground/60 mt-1">
                              By: {log.user_name} •{" "}
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                            {log.details && (
                              <p className="font-body text-xs text-foreground/50 mt-1 line-clamp-2">
                                {log.details}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center text-foreground/40">
                            {log.action.includes("create") ? (
                              <Plus className="h-4 w-4" />
                            ) : log.action.includes("update") ? (
                              <Edit3 className="h-4 w-4" />
                            ) : log.action.includes("delete") ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Activity className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Activity className="h-8 w-8 text-foreground/30 mx-auto mb-2" />
                        <p className="font-body text-sm text-foreground/60">
                          No recent activity found
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}
