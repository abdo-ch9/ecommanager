"use client"

import { Navbar } from "@/components/navbar"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session)
      })
    }
    
    checkAuth()
  }, [])

  return (
    <>
      {isAuthenticated && <Navbar />}
      {children}
    </>
  )
}
