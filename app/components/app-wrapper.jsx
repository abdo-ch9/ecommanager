"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"
import { Navbar } from "./navbar"

export default function AppWrapper({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setIsAuthenticated(!!session)
                setUser(session?.user)

                // Listen for auth changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    (_event, session) => {
                        setIsAuthenticated(!!session)
                        setUser(session?.user)
                    }
                )

                return () => {
                    if (subscription) subscription.unsubscribe()
                }
            } catch (error) {
                console.error("Auth check error:", error)
            }
        }

        checkAuth()
    }, [])

    return (
        <div className="min-h-screen">
            {isAuthenticated && <Navbar user={user} />}
            {children}
        </div>
    )
}
