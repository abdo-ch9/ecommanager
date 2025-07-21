"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { supabase } from "@/utils/supabase"
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            try {
                // Check for saved session in localStorage
                const savedSession = localStorage.getItem('user_session')
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession)
                    // Check if session is not too old (24 hours)
                    const isSessionValid = Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000
                    if (isSessionValid) {
                        setUser(sessionData)
                        setIsLoading(false)
                        return
                    } else {
                        localStorage.removeItem('user_session')
                    }
                }

                // Get initial session from Supabase
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setUser(session.user)
                    localStorage.setItem('user_session', JSON.stringify({
                        ...session.user,
                        timestamp: Date.now()
                    }))
                }
                setIsLoading(false)
            } catch (error) {
                console.error('Error checking auth:', error)
                setIsLoading(false)
            }
        }

        checkAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user)
                localStorage.setItem('user_session', JSON.stringify({
                    ...session.user,
                    timestamp: Date.now()
                }))
            } else {
                setUser(null)
                localStorage.removeItem('user_session')
            }
            setIsLoading(false)
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    const handleSignOut = async () => {
        try {
            setIsLoading(true)
            await supabase.auth.signOut()
            localStorage.removeItem('user_session')
            setUser(null)
            router.push('/')
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <header className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">AutoSupport</span>
                    </div>
                    <div className="flex items-center space-x-8">
                        <nav className="hidden md:flex space-x-8">
                            <a href="#features" className="text-gray-500 hover:text-gray-900 text-sm">Features</a>
                            <a href="#pricing" className="text-gray-500 hover:text-gray-900 text-sm">Pricing</a>
                            <a href="#faq" className="text-gray-500 hover:text-gray-900 text-sm">FAQ</a>
                        </nav>
                        {!isLoading && (
                            <>
                                {user ? (
                                    <div className="relative z-50">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="relative flex items-center space-x-2"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" alt="User" />
                                                <AvatarFallback>
                                                    <span className="flex h-full w-full items-center justify-center rounded-full bg-black text-white">
                                                        {user.email ? user.email[0].toUpperCase() : 'U'}
                                                    </span>
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>

                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                                <div className="px-4 py-3">
                                                    <p className="text-sm">Signed in as</p>
                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-100">
                                                    <Link href="/dashboard">
                                                        <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                                            Dashboard
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Sign out
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <Link href="/auth">
                                            <Button variant="ghost" className="text-gray-500 hover:text-gray-900 text-sm">
                                                Login
                                            </Button>
                                        </Link>
                                        <Link href="/auth">
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg">
                                                Sign Up
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
} 