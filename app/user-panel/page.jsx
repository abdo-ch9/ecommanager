"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Mail,
  Store,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  Plus,
  Play,
  FileText,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function UserPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [stats, setStats] = useState({
    emailsToday: 0,
    emailsThisWeek: 0,
    timeSavedToday: 0,
    timeSavedThisWeek: 0,
    responseAccuracy: 0,
    userEditedPercentage: 0
  });
  const [systemStatus, setSystemStatus] = useState({
    aiEngine: 'online',
    emailMonitor: 'active',
    autoReply: 'enabled'
  });
  const [notifications, setNotifications] = useState([]);

  // Fetch performance statistics
  const fetchStats = async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch email statistics
      const { data: emailStats } = await supabase
        .from("email_activity")
        .select("created_at, time_saved, user_edited")
        .eq("user_id", userId)
        .gte("created_at", weekAgo);

      const todayEmails = emailStats?.filter(email => 
        email.created_at.startsWith(today)
      ).length || 0;

      const weekEmails = emailStats?.length || 0;

      const todayTimeSaved = emailStats?.filter(email => 
        email.created_at.startsWith(today)
      ).reduce((sum, email) => sum + (email.time_saved || 0), 0) || 0;

      const weekTimeSaved = emailStats?.reduce((sum, email) => 
        sum + (email.time_saved || 0), 0) || 0;

      const userEditedCount = emailStats?.filter(email => email.user_edited).length || 0;
      const accuracy = weekEmails > 0 ? ((weekEmails - userEditedCount) / weekEmails * 100) : 0;

      setStats({
        emailsToday: todayEmails,
        emailsThisWeek: weekEmails,
        timeSavedToday: Math.round(todayTimeSaved * 10) / 10,
        timeSavedThisWeek: Math.round(weekTimeSaved * 10) / 10,
        responseAccuracy: Math.round(accuracy),
        userEditedPercentage: Math.round((userEditedCount / weekEmails * 100) || 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async (userId) => {
    try {
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      
      setNotifications(notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Check system status
  const checkSystemStatus = async () => {
    try {
      // Simulate API calls to check system status
      const aiEngineStatus = Math.random() > 0.1 ? 'online' : 'offline';
      const emailMonitorStatus = Math.random() > 0.05 ? 'active' : 'inactive';
      const autoReplyStatus = Math.random() > 0.02 ? 'enabled' : 'disabled';

      setSystemStatus({
        aiEngine: aiEngineStatus,
        emailMonitor: emailMonitorStatus,
        autoReply: autoReplyStatus
      });
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setUser({
        ...session.user,
        ...profile,
      });
      
      // Fetch connected stores
      const { data: integrations } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", session.user.id);
      setStores(integrations || []);
      
      // Fetch recent activity
      const { data: recent } = await supabase
        .from("email_activity")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setActivity(recent || []);
      
      // Fetch additional dynamic data
      await fetchStats(session.user.id);
      await fetchNotifications(session.user.id);
      await checkSystemStatus();
      
      setLoading(false);
    }
    
    fetchUserData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (user?.id) {
        fetchStats(user.id);
        fetchNotifications(user.id);
        checkSystemStatus();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Sidebar navigation
  const nav = [
    { label: "Dashboard", icon: Home, active: true, onClick: () => router.push("/user-panel") },
    { label: "Email Management", icon: Mail, onClick: () => router.push("/email-management") },
    { label: "Store Connections", icon: Store, onClick: () => router.push("/store-connections") },
    { label: "Analytics", icon: BarChart3, onClick: () => router.push("/analytics") },
    { label: "Settings", icon: Settings, onClick: () => router.push("/settings") },
  ];

  // Enhanced button handlers
  const handleManageStore = async (store) => {
    setActionMsg(`Managing ${store.platform} store...`);
    try {
      router.push(`/stores/${store.platform}`);
    } catch (error) {
      setActionMsg(`Error managing ${store.platform}: ${error.message}`);
    }
  };

  const handleDisconnectStore = async (store) => {
    setActionMsg(`Disconnecting ${store.platform}...`);
    try {
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", store.id);
      
      if (error) throw error;
      
      setStores((prev) => prev.filter((s) => s.id !== store.id));
      setActionMsg(`${store.platform} disconnected successfully.`);
      
      // Refresh stats after disconnection
      if (user?.id) {
        await fetchStats(user.id);
      }
    } catch (error) {
      setActionMsg(`Error disconnecting ${store.platform}: ${error.message}`);
    }
  };

  const handleApproveEmail = async (item) => {
    setActionMsg(`Approving email from ${item.customer_name || "Unknown"}...`);
    try {
      const { error } = await supabase
        .from("email_activity")
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq("id", item.id);
      
      if (error) throw error;
      
      setActionMsg(`Email approved successfully.`);
      
      // Refresh activity list
      const { data: recent } = await supabase
        .from("email_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setActivity(recent || []);
    } catch (error) {
      setActionMsg(`Error approving email: ${error.message}`);
    }
  };

  const handleEditEmail = (item) => {
    setActionMsg(`Opening editor for email from ${item.customer_name || "Unknown"}...`);
    router.push(`/email/${item.id}/edit`);
  };

  const handleConnectStore = () => {
    setActionMsg("Redirecting to store connection page...");
    router.push("/integration");
  };

  const handleEnableAutoReply = async () => {
    setActionMsg("Updating auto-reply settings...");
    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({ 
          user_id: user.id, 
          auto_reply_enabled: true,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setActionMsg("Auto-Reply enabled successfully!");
      setSystemStatus(prev => ({ ...prev, autoReply: 'enabled' }));
    } catch (error) {
      setActionMsg(`Error enabling auto-reply: ${error.message}`);
    }
  };

  const handleViewLogs = () => {
    setActionMsg("Opening system logs...");
    router.push("/logs");
  };

  const handleNotificationClick = () => {
    setActionMsg("Opening notifications...");
    router.push("/notifications");
  };

  // Get status color and text
  const getStatusDisplay = (status) => {
    const statusMap = {
      online: { color: 'bg-green-500', text: 'text-green-600', label: 'Online' },
      offline: { color: 'bg-red-500', text: 'text-red-600', label: 'Offline' },
      active: { color: 'bg-green-500', text: 'text-green-600', label: 'Active' },
      inactive: { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Inactive' },
      enabled: { color: 'bg-green-500', text: 'text-green-600', label: 'Enabled' },
      disabled: { color: 'bg-red-500', text: 'text-red-600', label: 'Disabled' }
    };
    return statusMap[status] || statusMap.offline;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">AutoReply AI</span>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {nav.map((item) => (
              <li key={item.label}>
                <button
                  onClick={item.onClick}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    item.active
                      ? "text-blue-600 bg-blue-50 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {user ? `Welcome back, ${user.full_name || user.email}` : "Welcome"}
              </h1>
              <p className="text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleNotificationClick}
                className="relative"
              >
                <Bell className="w-6 h-6 text-gray-400" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                  <AvatarFallback>{user?.full_name ? user.full_name[0] : "U"}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900">{user?.full_name || user?.email || "User"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Action Message */}
          {actionMsg && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">{actionMsg}</p>
            </div>
          )}

          {/* Connected Stores */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Stores</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {stores.length === 0 && (
                <div className="text-gray-500">No stores connected.</div>
              )}
              {stores.map((store) => (
                <Card key={store.id} className="pt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${store.platform === "shopify" ? "bg-green-100" : "bg-blue-100"}`}>
                          <div className={`w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold ${store.platform === "shopify" ? "bg-green-600" : "bg-blue-600"}`}>
                            {store.platform[0].toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{store.platform.charAt(0).toUpperCase() + store.platform.slice(1)}</h3>
                          <div className="flex items-center space-x-1">
                            {store.status === "connected" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className={`text-sm ${store.status === "connected" ? "text-green-600" : "text-yellow-600"}`}>
                              {store.status === "connected" ? "Connected" : "Needs Action"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageStore(store)}
                        >
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                          onClick={() => handleDisconnectStore(store)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Performance Overview - Now Dynamic */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
              {loading && <div className="text-sm text-gray-500">Updating...</div>}
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="pt-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Emails Auto-Answered</h3>
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-gray-900">{stats.emailsToday}</div>
                    <div className="text-sm text-gray-500">today</div>
                    <div className="text-sm text-gray-500">{stats.emailsThisWeek} this week</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="pt-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Time Saved</h3>
                    <Clock className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-gray-900">{stats.timeSavedToday}</div>
                    <div className="text-sm text-gray-500">hours today</div>
                    <div className="text-sm text-gray-500">{stats.timeSavedThisWeek} hours this week</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="pt-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Response Accuracy</h3>
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-gray-900">{stats.responseAccuracy}%</div>
                    <div className="text-sm text-gray-500">{stats.userEditedPercentage}% user-edited</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Email Activity */}
            <div className="lg:col-span-2">
              <Card className="pt-4">
                <CardHeader>
                  <CardTitle>Recent Email Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 border-b">
                      <div>Customer</div>
                      <div>Subject</div>
                      <div>Intent</div>
                      <div className="col-span-2">AI Reply Preview</div>
                      <div>Actions</div>
                    </div>
                    {/* Email Rows */}
                    {activity.length === 0 && (
                      <div className="text-gray-500 py-4">No recent activity.</div>
                    )}
                    {activity.map((item) => (
                      <div key={item.id} className="grid grid-cols-6 gap-4 items-center py-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{item.customer_name ? item.customer_name.split(" ").map(n => n[0]).join("") : "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{item.customer_name || "Unknown"}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-900">{item.subject}</div>
                        <div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {item.intent || "General"}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">{item.ai_reply_preview || "-"}</div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveEmail(item)}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditEmail(item)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Quick Actions & System Status */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="pt-4">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    size="lg"
                    onClick={handleConnectStore}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Store
                  </Button>
                  <Button 
                    className="w-full justify-start bg-green-600 hover:bg-green-700" 
                    size="lg"
                    onClick={handleEnableAutoReply}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Enable Auto-Reply
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gray-600 hover:bg-gray-700" 
                    size="lg"
                    onClick={handleViewLogs}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Logs
                  </Button>
                </CardContent>
              </Card>
              {/* System Status - Now Dynamic */}
              <Card className="pt-4">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI Engine</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusDisplay(systemStatus.aiEngine).color}`}></div>
                      <span className={`text-sm ${getStatusDisplay(systemStatus.aiEngine).text}`}>
                        {getStatusDisplay(systemStatus.aiEngine).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Monitor</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusDisplay(systemStatus.emailMonitor).color}`}></div>
                      <span className={`text-sm ${getStatusDisplay(systemStatus.emailMonitor).text}`}>
                        {getStatusDisplay(systemStatus.emailMonitor).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-Reply</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusDisplay(systemStatus.autoReply).color}`}></div>
                      <span className={`text-sm ${getStatusDisplay(systemStatus.autoReply).text}`}>
                        {getStatusDisplay(systemStatus.autoReply).label}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}