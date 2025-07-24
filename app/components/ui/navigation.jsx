"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import { supabase } from '@/utils/supabase'
import { User, Settings, Sun, Moon, CreditCard, LogOut } from 'lucide-react'

export function Navigation() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userCredits, setUserCredits] = useState(100)
  const [username, setUsername] = useState('User')

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        fetchUserProfile(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.id) {
        fetchUserProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data?.email) {
        // Use the part before @ as username
        const username = data.email.split('@')[0]
        setUsername(username)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error.message)
      // Set a default username if profile fetch fails
      setUsername('User')
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error.message)
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
                <span className="text-white font-bold text-lg">▶</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 font-poppins">ClipAI</span>
            </Link>
            <nav className="hidden md:flex space-x-1">
              <Link href="/featues" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150">
                Features
              </Link>
              <Link href="/Pricing" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150">
                Pricing
              </Link>
              <Link href="/help" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150">
                Help
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors duration-150"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-white">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {username}
                      </p>
                      <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span>{userCredits} credits</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link href="/dashboard">
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <CreditCard className="w-4 h-4 mr-3" />
                          Dashboard
                        </button>
                      </Link>
                      <Link href="/settings">
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </button>
                      </Link>
                      <button 
                        onClick={toggleTheme}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                      >
                        {isDarkMode ? (
                          <Sun className="w-4 h-4 mr-3" />
                        ) : (
                          <Moon className="w-4 h-4 mr-3" />
                        )}
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 