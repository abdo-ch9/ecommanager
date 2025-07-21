import { supabase } from './supabase'

export async function checkEmailExists(email) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
            throw error
        }

        return !!data

    } catch (error) {
        console.log('Email check error:', error)
        return false
    }
}
