"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Edit2, X } from "lucide-react";
import { supabase } from "@/utils/supabase";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "important", label: "Important" },
  { key: "sent", label: "Sent" },
];

const TONES = [
  { key: "professional", label: "Professional" },
  { key: "casual", label: "Casual" },
  { key: "friendly", label: "Friendly" },
];

export default function GmailInbox() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyTone, setReplyTone] = useState("professional");
  const [autoApprove, setAutoApprove] = useState(false);

  const fetchEmails = async (type = "inbox") => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in to view your emails");

      const response = await fetch(`/api/gmail/inbox?type=${type}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-refresh-token': session.refresh_token,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to fetch emails (${response.status})`);
      }

      const data = await response.json();
      setEmails(data);
      setSelectedEmail(data[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const typeMap = { all: "inbox", unread: "unread", important: "important", sent: "sent" };
    fetchEmails(typeMap[filter]);
  }, [filter]);

  useEffect(() => {
    const filtered = searchQuery
      ? emails.filter(e => e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             e.from.toLowerCase().includes(searchQuery.toLowerCase()))
      : emails;
    setFilteredEmails(filtered);
    if (!filtered.includes(selectedEmail)) {
      setSelectedEmail(filtered[0] || null);
    }
  }, [emails, searchQuery, selectedEmail]);

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const mins = Math.floor((now - date) / 60000);
    if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4 text-center">Error: {error}</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 p-6 bg-white rounded-lg shadow">
      <aside className="w-1/3 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Email Inbox</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`px-4 py-1 rounded-full text-sm font-semibold ${
                filter === f.key ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search emails..."
          className="mb-4 p-2 border border-gray-300 rounded text-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="overflow-y-auto flex-1 border border-gray-200 rounded">
          {filteredEmails.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No emails</div>
          ) : (
            filteredEmails.map(email => (
              <div
                key={email.id}
                className={`p-3 cursor-pointer border-b border-gray-100 flex flex-col ${
                  selectedEmail?.id === email.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 truncate">{email.from}</p>
                    <p className="text-sm text-gray-700 truncate">{email.subject}</p>
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(email.date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
      <section className="w-2/3">
        {selectedEmail ? (
          <>
            <h3 className="text-lg font-semibold mb-2">{selectedEmail.subject}</h3>
            <p className="text-sm text-gray-600 mb-4">
              From: {selectedEmail.from} • {formatDate(selectedEmail.date)}
            </p>
            <div className="p-4 bg-gray-50 rounded mb-6 whitespace-pre-wrap">
              {selectedEmail.snippet}
            </div>
            <h4 className="font-semibold mb-2">AI-Generated Reply</h4>
            <div className="flex justify-between items-center mb-2">
              <select
                className="border border-gray-300 rounded p-1 text-sm"
                value={replyTone}
                onChange={e => setReplyTone(e.target.value)}
              >
                {TONES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <textarea
              className="w-full p-3 border border-gray-300 rounded mb-4 resize-none"
              rows={6}
              readOnly
              value={`Hi ${selectedEmail.from.split(" ")[0] || "there"},\n\nThank you for your message about '${selectedEmail.subject}'. We’ll get back to you shortly.\n\nBest,\nSupport Team`}
            />
            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                <Check className="w-4 h-4" /> Approve & Send
              </Button>
              <Button className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
              <Button className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500 flex items-center gap-2">
                <X className="w-4 h-4" /> Reject
              </Button>
              <label className="ml-auto inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={autoApprove}
                  onChange={() => setAutoApprove(!autoApprove)}
                /> Auto-approve future similar emails
              </label>
            </div>
          </>
        ) : (
          <div className="text-gray-500 flex items-center justify-center h-full">Select an email to view</div>
        )}
      </section>
    </div>
  );
}
