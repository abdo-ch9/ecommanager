"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Settings, 
  DollarSign, 
  FileText, 
  Users, 
  MessageSquare, 
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  CreditCard
} from "lucide-react"
import { supabase } from '../utils/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('profile')
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('English')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // First check for saved session in localStorage
      const savedSession = localStorage.getItem('user_session')
      if (savedSession) {
        const sessionData = JSON.parse(savedSession)
        // Check if session is not too old (24 hours)
        const isSessionValid = Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000
        
        if (isSessionValid) {
          setUser(sessionData)
          setLoading(false)
          return
        } else {
          // Remove expired session
          localStorage.removeItem('user_session')
        }
      }

      // If no valid saved session, check Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Save to localStorage for future visits
        localStorage.setItem('user_session', JSON.stringify({
          email: user.email,
          id: user.id,
          created_at: user.created_at,
          user_metadata: user.user_metadata,
          timestamp: Date.now()
        }))
      } else {
        router.push('/auth')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear saved session from localStorage
      localStorage.removeItem('user_session')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Clear saved session even if Supabase signout fails
      localStorage.removeItem('user_session')
      router.push('/')
    }
  }

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'documentation', label: 'Documentation', icon: FileText },
    { id: 'community', label: 'Community Forum', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ]

  const themeOptions = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 text-white flex flex-col">
        {/* User Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Credit Balance */}
        <div className="p-6 border-t border-gray-700">
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-1">Credit Balance</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Monthly credits</span>
              <span className="text-blue-400 font-bold">3.92</span>
            </div>
          </div>
          
          <div className="bg-blue-600 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-100 mb-2">
              Upgrade your plan to buy more credits.
            </p>
            <Button 
              variant="link" 
              className="text-blue-100 underline p-0 h-auto text-sm hover:text-white"
              onClick={() => setActiveSection('pricing')}
            >
              Upgrade plan
            </Button>
          </div>

          {/* Preferences */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-3">Preferences</p>
            
            {/* Theme */}
            <div className="mb-3">
              <p className="text-sm mb-2">Theme</p>
              <div className="flex items-center space-x-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`p-2 rounded ${
                        theme === option.value
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Language */}
            <div className="mb-4">
              <p className="text-sm mb-2">Language</p>
              <div className="relative">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white appearance-none cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {activeSection === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Manage your account details and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{user?.email || 'user@example.com'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <p className="text-gray-900">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Statistics</CardTitle>
                    <CardDescription>Your current usage and limits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">3.92</p>
                        <p className="text-sm text-gray-600">Credits Remaining</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">47</p>
                        <p className="text-sm text-gray-600">Emails Processed</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">12</p>
                        <p className="text-sm text-gray-600">Active Templates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>Configure your AutoSupport preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Email Automation</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm">Auto-reply to customer emails</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm">Send order tracking updates</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm">Require human approval for responses</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm">Email notifications</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm">SMS notifications</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Pricing & Billing</h1>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You are currently on the Free Trial plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Free Trial</p>
                        <p className="text-sm text-gray-600">50 emails/month • Basic templates</p>
                      </div>
                      <Badge variant="outline">Current Plan</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upgrade Options</CardTitle>
                    <CardDescription>Choose a plan that fits your business needs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Basic Plan</h3>
                          <span className="text-lg font-bold">$29/month</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">300 emails/month • All templates • Order tracking</p>
                        <Button className="w-full">Upgrade to Basic</Button>
                      </div>
                      <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Pro Plan</h3>
                          <span className="text-lg font-bold">$79/month</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">2,000 emails/month • Advanced AI • Priority support</p>
                        <Button className="w-full">Upgrade to Pro</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'documentation' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Documentation</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Learn how to use AutoSupport effectively</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium mb-1">Quick Start Guide</h3>
                      <p className="text-sm text-gray-600">Get up and running in 5 minutes</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-medium mb-1">API Documentation</h3>
                      <p className="text-sm text-gray-600">Integrate AutoSupport with your existing systems</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-medium mb-1">Best Practices</h3>
                      <p className="text-sm text-gray-600">Tips for maximizing your automation efficiency</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'community' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Community Forum</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Join the Discussion</CardTitle>
                  <CardDescription>Connect with other AutoSupport users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                    <p className="text-gray-600">Our community forum is launching soon. Stay tuned!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'feedback' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Feedback</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Share Your Thoughts</CardTitle>
                  <CardDescription>Help us improve AutoSupport</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What would you like to see improved?
                      </label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        rows={4}
                        placeholder="Share your feedback..."
                      />
                    </div>
                    <Button>Submit Feedback</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
