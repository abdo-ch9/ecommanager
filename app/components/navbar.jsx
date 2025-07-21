"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/utils/supabase"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bell } from "lucide-react"

export function Navbar({ user }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/auth")
    }

    return (
        <nav className=" bg-white">
           
                    {/* User Menu */}
                    
                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                <div className="px-4 py-3">
                                    <p className="text-sm">Signed in as</p>
                                    <p className="truncate text-sm font-medium text-gray-900">{user?.email}</p>
                                </div>
                                <div className="border-t border-gray-100">
                                    <button
                                        onClick={handleSignOut}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                   
                
        </nav>
    )
}
