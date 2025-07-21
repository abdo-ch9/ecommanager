"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import { checkEmailExists } from "@/utils/auth"
import { useRouter } from "next/navigation"

import { useEffect } from "react"

export default function AuthPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("signup")
    const [agreed, setAgreed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: ""
    })
    const [user, setUser] = useState(null)

    useEffect(() => {
        const session = supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            listener?.subscription.unsubscribe()
        }
    }, [])

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData(prev => ({
            ...prev,
            [id]: value
        }))
    }

    const handleSignUp = async () => {
        if (!agreed) {
            setError("Please agree to the Terms of Service and Privacy Policy")
            return
        }

        try {
            setError(null)
            setLoading(true)

            // Check if email already exists before signup
            const emailExists = await checkEmailExists(formData.email)
            if (emailExists) {
                setError("the email already exist")
                setLoading(false)
                return
            }

            // First check if the email exists
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstname,
                        last_name: formData.lastname,
                    }
                }
            })

            // Check specifically for email already registered
            if (error) {
                console.log('Signup error message:', error.message)
                const msg = error.message.toLowerCase()
                if (msg.includes('user already registered') || msg.includes('email already exists') || msg.includes('duplicate') || msg.includes('already registered')) {
                    setError("the email already exist")
                    setLoading(false)
                    return
                }
                
                // Handle other errors
                console.error('Signup error:', error)
                setError(error.message)
                setLoading(false)
                return
            }

            // Save user data if signup was successful
            if (data?.user) {
                localStorage.setItem('user_session', JSON.stringify({
                    email: data.user.email,
                    id: data.user.id,
                    created_at: data.user.created_at,
                    user_metadata: {
                        ...data.user.user_metadata,
                        first_name: formData.firstname,
                        last_name: formData.lastname
                    },
                    timestamp: Date.now()
                }))

                if (data.user.confirmed_at) {
                    router.push("/dashboard")
                } else {
                    setError("An account with this email already exists. Please check your email for a confirmation link or try logging in.")
                }
            }

        } catch (error) {
            console.error('Signup error:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e) => {
        console.log('Login attempt with:', { email: formData.email })

        try {
            setError(null)
            setLoading(true)

            // Sign in with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })

            console.log('Supabase login response:', { authData, authError })

            if (authError) throw authError

            // Save user credentials to localStorage for persistence
            if (authData?.user) {
                localStorage.setItem('user_session', JSON.stringify({
                    email: authData.user.email,
                    id: authData.user.id,
                    created_at: authData.user.created_at,
                    user_metadata: authData.user.user_metadata,
                    timestamp: Date.now()
                }))
            }

            // If successful, redirect to dashboard
            router.push("/dashboard")
        } catch (error) {
            console.error('Login error:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (activeTab === "signup") {
            await handleSignUp()
        } else {
            await handleLogin()
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold text-gray-900">Welcome</h1>
                        <p className="text-gray-600">Create your account or sign in to continue</p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Toggle Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-red-500">
                        <button
                            type="button"
                            onClick={() => {
                                console.log("Switching to Sign Up tab");
                                setActiveTab("signup")
                                setError(null)
                                setFormData({ firstname: "", lastname: "", email: "", password: "" })
                                setAgreed(false)
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "signup" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Sign Up
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                console.log("Switching to Log In tab");
                                setActiveTab("login")
                                setError(null)
                                setFormData({ firstname: "", lastname: "", email: "", password: "" })
                                setAgreed(false)
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Log In
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {activeTab === "signup" && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 text-gray-900">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstname" className="text-sm font-medium text-gray-700">
                                                First name
                                            </Label>
                                            <Input
                                                id="firstname"
                                                type="text"
                                                required
                                                placeholder="Enter your first name"
                                                className="h-12 border-gray-300 hover:border-gray-400 focus:border-gray-500 focus:ring-gray-400 bg-white"
                                                value={formData.firstname}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastname" className="text-sm font-medium text-gray-700 text-gray-900">
                                                Last name
                                            </Label>
                                            <Input
                                                id="lastname"
                                                type="text"
                                                required
                                                placeholder="Enter your last name"
                                                className="h-12 border-gray-300 hover:border-gray-400 focus:border-gray-500 focus:ring-gray-400 text-gray-900 bg-white"
                                                value={formData.lastname}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700 text-gray-900">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                className="h-12 border-gray-300 hover:border-gray-400 focus:border-gray-500 focus:ring-gray-400 text-gray-900 bg-white"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder={activeTab === "signup" ? "Create a password" : "Enter your password"}
                                    className="h-12 border-gray-300 hover:border-gray-400 focus:border-gray-500 focus:ring-gray-400 text-gray-900 bg-white"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        {activeTab === "signup" && (
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={agreed}
                                    onCheckedChange={(checked) => setAgreed(!!checked)}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                                    I agree to the{" "}
                                    <Link href="#" className="text-indigo-600 hover:text-indigo-500">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="#" className="text-indigo-600 hover:text-indigo-500">
                                        Privacy Policy
                                    </Link>
                                </Label>
                            </div>
                        )}

                        {/* Sign Up Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
                            disabled={loading || (activeTab === "signup" && !agreed)}
                        >
                            {loading ? "Loading..." : activeTab === "signup" ? "Sign Up" : "Log In"}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center pointer-events-none" >
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {user ? (
                        <div className="flex justify-center">
                            <Button
                                className="w-full max-w-md"
                                onClick={async () => {
                                    await supabase.auth.signOut()
                                    setUser(null)
                                    router.push("/auth")
                                }}
                            >
                                Log Out
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Google Sign In Button */}
                            <Button 
                                variant="outline" 
                                className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent text-gray-900" 
                                onClick={async () => {
                                    try {
                                        console.log('Starting Google sign-in...');
                                        const { data, error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: `${window.location.origin}/integration`,
                                                scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels',
                                                queryParams: {
                                                    access_type: 'offline',
                                                    prompt: 'consent'
                                                }
                                            }
                                        });
                                        
                                        if (error) {
                                            console.error('Google sign-in error:', error);
                                            throw error;
                                        }
                                    } catch (error) {
                                        console.error('Google sign-in error:', error);
                                        setError('Failed to sign in with Google: ' + error.message);
                                    }
                                }}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </Button>

                            <Button variant="outline" className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent text-gray-900" onClick={async () => {
                                try {
                                    const { data, error } = await supabase.auth.signInWithOAuth({
                                        provider: 'apple',
                                    })
                                    if (error) throw error
                                } catch (error) {
                                    console.error('Apple sign-in error:', error)
                                    setError('Failed to sign in with Apple')
                                }
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16.365 1.43c0 1.14-.43 2.18-1.14 2.96-.77.9-2.02 1.6-3.22 1.43-.07-1.2.43-2.3 1.14-3.1.77-.9 2.02-1.6 3.22-1.43zM12 5.5c-3.3 0-6 2.7-6 6 0 3.3 2.7 6 6 6 3.3 0 6-2.7 6-6 0-3.3-2.7-6-6-6zM12 20c-3.3 0-6-2.7-6-6 0-3.3 2.7-6 6-6 3.3 0 6 2.7 6 6 0 3.3-2.7 6-6 6z"/>
                                </svg>
                                Apple
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
