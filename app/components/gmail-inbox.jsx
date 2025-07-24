"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, ChevronRight } from "lucide-react";
import { supabase } from "@/utils/supabase";

export function GmailInbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching emails...');

      // First check if we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        throw new Error('Please sign in to view your emails');
      }

      // Check if Gmail is connected
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('platform', 'gmail')
        .single();

      if (integrationError || !integration) {
        throw new Error('Gmail integration not found. Please connect your Gmail account.');
      }

      // Fetch emails from the correct endpoint "/api/gmail/inbox"
      const response = await fetch('/api/gmail/inbox', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error response:', data);
        throw new Error(data.error || `Failed to fetch emails (${response.status})`);
      }

      const data = await response.json();
      console.log('Fetched emails:', data);
      setEmails(data);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 text-center">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Inbox</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEmails}
          className="text-gray-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {emails.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No emails found
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <Card key={email.id} className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {email.subject}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {email.from}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500 flex-shrink-0">
                        {formatDate(email.date)}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {email.snippet}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
