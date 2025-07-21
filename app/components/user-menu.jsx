"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/utils/supabase"
import { useRouter } from "next/navigation"

export function UserMenu() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/auth")
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 rounded-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </Button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                        <button
                            onClick={handleSignOut}
                            className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
