"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Users,
  TrendingUp,
  Mail,
  AlertTriangle,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Check,
  X,
  Activity,
  Bot,
  Flag,
} from "lucide-react"

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState("User Management")
  const [testPrompt, setTestPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")

  const sidebarItems = [
    { name: "User Management", icon: Users, active: true },
    { name: "Activity Logs", icon: Activity },
    { name: "AI Testing", icon: Bot },
    { name: "Feature Flags", icon: Flag },
    { name: "Email Logs", icon: Mail },
  ]

  const statsCards = [
    { title: "Total Users", value: "2,847", icon: Users, color: "bg-blue-500" },
    { title: "Active Today", value: "1,234", icon: TrendingUp, color: "bg-green-500" },
    { title: "Emails Sent", value: "8,567", icon: Mail, color: "bg-purple-500" },
    { title: "System Errors", value: "12", icon: AlertTriangle, color: "bg-red-500" },
  ]

  const users = [
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      plan: "Pro",
      lastActive: "2 hours ago",
      status: "Active",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      name: "Mike Chen",
      email: "mike.chen@email.com",
      plan: "Basic",
      lastActive: "1 day ago",
      status: "Pending",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  const featureFlags = [
    {
      name: "Advanced AI Model",
      description: "GPT-4 integration for premium users",
      enabled: true,
    },
    {
      name: "Email Notifications",
      description: "Real-time email alerts",
      enabled: false,
    },
    {
      name: "Beta Dashboard",
      description: "New dashboard interface",
      enabled: true,
    },
  ]

  const emailLogs = [
    {
      type: "Welcome Email",
      email: "sarah.johnson@email.com",
      status: "success",
      time: "2m ago",
    },
    {
      type: "Password Reset",
      email: "invalid@email.com",
      status: "error",
      time: "5m ago",
    },
    {
      type: "Weekly Report",
      email: "mike.chen@email.com",
      status: "success",
      time: "1h ago",
    },
  ]

  const handleTestAI = () => {
    if (testPrompt.trim()) {
      setAiResponse(
        "This is a sample AI response based on your input prompt. The AI model has processed your request and generated this response.",
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">Admin User</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => setActiveSection(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
                      activeSection === item.name
                        ? "bg-blue-100 text-blue-800 shadow-inner"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Management Section */}
          {activeSection === "User Management" && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input placeholder="Search users..." className="pl-10 w-64" />
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Last Active</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-gray-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">{user.email}</td>
                          <td className="py-4 px-4">
                            <Badge variant={user.plan === "Pro" ? "default" : "secondary"}>{user.plan}</Badge>
                          </td>
                          <td className="py-4 px-4 text-gray-600">{user.lastActive}</td>
                          <td className="py-4 px-4">
                            <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Testing Panel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Testing Panel</CardTitle>
              <CardDescription>Test AI responses and monitor performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input Prompt</label>
                  <Textarea
                    placeholder="Enter your test prompt here..."
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Response Preview</label>
                  <div className="min-h-32 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <p className="text-gray-600">{aiResponse || "AI response will appear here..."}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <Button onClick={handleTestAI} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="w-4 h-4 mr-2" />
                  Test AI Response
                </Button>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>Response Time: 1.2s</span>
                  <span>Tokens Used: 150</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable/disable beta features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {featureFlags.map((flag, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="mr-4">
                      <h4 className="font-semibold text-gray-900">{flag.name}</h4>
                      <p className="text-sm text-gray-600">{flag.description}</p>
                    </div>
                    <Switch checked={flag.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Email Delivery Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Email Delivery Logs</CardTitle>
                <CardDescription>Recent email activity and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailLogs.map((log, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`p-1 rounded-full ${log.status === "success" ? "bg-green-100" : "bg-red-100"}`}>
                        {log.status === "success" ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{log.type}</p>
                        <p className="text-sm text-gray-600">{log.email}</p>
                      </div>
                      <span className="text-sm text-gray-500">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
