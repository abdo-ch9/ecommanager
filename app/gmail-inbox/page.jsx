"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Edit2, X, CheckCircle, Edit, XCircle } from "lucide-react";
import { supabase } from "@/utils/supabase";

// Add custom styles for email content
const emailStyles = `
  .email-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    width: 100%;
  }
  
  .email-content * {
    color: inherit !important;
  }
  
  .email-content p,
  .email-content div,
  .email-content span,
  .email-content td,
  .email-content th {
    color: #333 !important;
  }
  
  .email-content a {
    color: #2563eb !important;
  }
  
  .email-content h1,
  .email-content h2,
  .email-content h3,
  .email-content h4,
  .email-content h5,
  .email-content h6 {
    color: #1f2937 !important;
  }
  
  .email-content img {
    max-width: 100% !important;
    height: auto !important;
    width: auto !important;
  }
  
  .email-content h1, .email-content h2, .email-content h3 {
    color: #1f2937;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  
  .email-content h1 {
    font-size: 1.875rem;
    font-weight: 700;
    text-align: center;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .email-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .email-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .email-content p {
    margin-bottom: 1rem;
    color: #374151;
  }
  
  .email-content strong, .email-content b {
    font-weight: 600;
    color: #1f2937;
  }
  
  .email-content ul, .email-content ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  .email-content li {
    margin-bottom: 0.5rem;
  }
  
  .email-content a {
    color: #2563eb;
    text-decoration: underline;
  }
  
  .email-content blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #6b7280;
  }
  
  .line-clamp-12 {
    display: -webkit-box;
    -webkit-line-clamp: 12;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-height: 400px;
  }
  
  .email-content.expanded {
    max-height: none;
  }
  
  .email-content.collapsed {
    max-height: 100vh;
    overflow: hidden;
  }
`;

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
  const [emailBody, setEmailBody] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contentHeight, setContentHeight] = useState(300);
  const resizableRef = useRef(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const [replyTone, setReplyTone] = useState("professional");
  const [autoApprove, setAutoApprove] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailsPerPage] = useState(50);
  const [totalEmails, setTotalEmails] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [replyDraft, setReplyDraft] = useState("");

  // Fetch list of emails
  const fetchEmails = async (type = "inbox", page = 1) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;
      if (!session) throw new Error("Please sign in to view your emails");

      console.log('Fetching emails for type:', type, 'page:', page);
      const res = await fetch(`/api/gmail/inbox?type=${type}&page=${page}&limit=${emailsPerPage}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-refresh-token': session.refresh_token,
        },
      });

      console.log('Inbox response status:', res.status);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Inbox API error:', errData);
        console.error('Full error response:', {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          errorData: errData
        });
        throw new Error(errData.error || errData.details || `Failed to fetch emails (${res.status})`);
      }

      const data = await res.json();
      console.log('Emails fetched:', data.messages?.length || 0);
      setEmails(data.messages || []);
      setFilteredEmails(data.messages || []);
      setTotalEmails(data.total || 0);
      setHasMore(data.hasMore || false);

      // Prefetch first email body in parallel
      if (data.messages && data.messages.length > 0) {
        const firstEmail = data.messages[0];
        fetchEmailBody(firstEmail.id);
        setSelectedEmail(firstEmail);
      } else {
        setSelectedEmail(null);
        setEmailBody("");
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Skeleton UI components for loading state
  const EmailListSkeleton = () => (
    <div className="flex flex-col justify-center items-center p-6 gap-2">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-blue-600 font-semibold">Loading emails...</p>
    </div>
  );

  const EmailBodySkeleton = () => (
    <div className="flex flex-col justify-center items-center p-6 min-h-[200px] gap-2">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-blue-600 font-semibold">Loading email content...</p>
    </div>
  );

  // Modify render logic to show skeletons when loading

  // Fetch full email body
  const fetchEmailBody = async (id) => {
    setBodyLoading(true);
    setEmailBody("");
    try {
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;
      if (!session) throw new Error("Please sign in");

      console.log('Fetching email body for ID:', id);
      const res = await fetch(`/api/gmail/message?id=${id}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-refresh-token': session.refresh_token,
        },
      });

      console.log('Response status:', res.status);
      const text = await res.text();
      console.log('Response text length:', text.length);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error('Invalid JSON:', text);
        throw new Error('Server returned invalid JSON');
      }

      if (!res.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || data.details || `Failed to load email content (${res.status})`);
      }

      setEmailBody(data.body || 'No content');
    } catch (err) {
      console.error('Error fetching email body:', err);
      setEmailBody(`Error loading email content: ${err.message}`);
    } finally {
      setBodyLoading(false);
    }
  };

  // Resizable handlers
  const onMouseDown = (e) => {
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = contentHeight;
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!isResizingRef.current) return;
    const dy = e.clientY - startYRef.current;
    const newHeight = Math.max(100, startHeightRef.current + dy);
    setContentHeight(newHeight);
  };

  const onMouseUp = () => {
    isResizingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Select email and load its body
  const selectEmail = (email) => {
    setSelectedEmail(email);
    if (email?.id) fetchEmailBody(email.id);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (filteredEmails.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredEmails.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredEmails.length) {
        selectEmail(filteredEmails[focusedIndex]);
      }
    }
  };

  // Reset focusedIndex when filteredEmails or selectedEmail changes
  useEffect(() => {
    if (selectedEmail) {
      const idx = filteredEmails.findIndex(e => e.id === selectedEmail.id);
      setFocusedIndex(idx);
    } else {
      setFocusedIndex(-1);
    }
  }, [filteredEmails, selectedEmail]);

  // Initial and filter-based fetch
  useEffect(() => {
    const mapTypes = { all: 'inbox', unread: 'unread', important: 'important', sent: 'sent' };
    fetchEmails(mapTypes[filter], currentPage);
  }, [filter, currentPage]);

  // Search filter (client-side for current page only)
  useEffect(() => {
    const filtered = searchQuery
      ? emails.filter(e =>
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : emails;
    setFilteredEmails(filtered);
    if (!filtered.includes(selectedEmail) && filtered.length) selectEmail(filtered[0]);
  }, [searchQuery, emails]);

  // Date helper
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const mins = Math.floor((new Date() - date) / 60000);
    return mins < 60
      ? `${mins} min${mins !== 1 ? 's' : ''} ago`
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Pagination logic
  const totalPages = Math.ceil(totalEmails / emailsPerPage);
  const startIndex = (currentPage - 1) * emailsPerPage;
  const endIndex = startIndex + filteredEmails.length;
  const currentEmails = filteredEmails; // Server-side pagination, so all emails are current

  // Debug pagination
  console.log('Pagination Debug:', {
    filteredEmailsLength: filteredEmails.length,
    emailsPerPage,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    currentEmailsLength: currentEmails.length
  });

  const goToPage = (page) => {
    setCurrentPage(page);
    setFocusedIndex(-1);
    setSearchQuery(''); // Clear search when changing pages
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // AI Reply handlers
  const onSend = () => {
    console.log('Sending reply:', replyDraft);
    // TODO: Implement send functionality
  };

  const onEdit = () => {
    console.log('Editing reply');
    // TODO: Implement edit functionality
  };

  const onReject = () => {
    console.log('Rejecting reply');
    // TODO: Implement reject functionality
  };

  if (loading) return <EmailListSkeleton />;
  if (error) return (
    <div className="text-red-600 p-4 text-center">
      <div className="mb-4">Error: {error}</div>
      <div className="space-y-2">
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/test-env');
              const data = await res.json();
              console.log('Environment check:', data);

              let message = `Environment Variables Status:\n\n`;
              message += `✅ Present (${data.presentCount}):\n`;
              data.present.forEach(key => message += `  - ${key}\n`);
              message += `\n❌ Missing (${data.missingCount}):\n`;
              data.missing.forEach(key => message += `  - ${key}\n`);

              if (data.missing.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID')) {
                message += `\n💡 To get GOOGLE_CLIENT_ID:\n`;
                message += `1. Go to Google Cloud Console\n`;
                message += `2. Create/select a project\n`;
                message += `3. Enable Gmail API\n`;
                message += `4. Create OAuth 2.0 credentials\n`;
              }

              if (data.missing.includes('GOOGLE_CLIENT_SECRET')) {
                message += `\n💡 To get GOOGLE_CLIENT_SECRET:\n`;
                message += `1. Same as above - it's the secret from OAuth 2.0\n`;
              }

              if (data.missing.includes('NEXT_PUBLIC_SUPABASE_URL')) {
                message += `\n💡 To get SUPABASE_URL:\n`;
                message += `1. Go to Supabase dashboard\n`;
                message += `2. Select your project\n`;
                message += `3. Go to Settings > API\n`;
              }

              alert(message);
            } catch (err) {
              console.error('Test failed:', err);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Check Environment Variables
        </button>

        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/test-supabase');
              const data = await res.json();
              console.log('Supabase test:', data);

              let message = `Supabase Connection Test:\n\n`;
              message += `Status: ${data.status}\n`;
              if (data.user) {
                message += `User: ${data.user.email}\n`;
                message += `User ID: ${data.user.id}\n`;
              }
              message += `Integrations: ${data.integrationCount || 0}\n`;

              if (data.error) {
                message += `\nError: ${data.error}\n`;
              }

              alert(message);
            } catch (err) {
              console.error('Supabase test failed:', err);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Supabase Connection
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: emailStyles }} suppressHydrationWarning />
      <div suppressHydrationWarning className="flex h-[calc(100vh-4rem)] gap-6 p-6 bg-white rounded-lg shadow text-black overflow-hidden">
        <aside className="w-1/3 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-black">Email Inbox</h2>
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`px-4 py-1 rounded-full text-sm font-semibold ${filter === f.key ? 'bg-blue-100 text-blue-700' : 'text-black hover:bg-gray-100'}`}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
            {filter !== 'all' && (
              <button
                className="ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                onClick={() => setFilter('all')}
                aria-label="Clear filter"
                title="Clear filter"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search emails..."
              className="w-full p-2 border border-gray-300 rounded text-sm pr-10 text-black"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear search"
              >
                &#x2715;
              </button>
            )}
          </div>
          <div
            className="overflow-y-auto flex-1 border border-gray-200 rounded"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="listbox"
            aria-activedescendant={focusedIndex >= 0 ? `email-item-${currentEmails[focusedIndex]?.id}` : undefined}
          >
            {currentEmails.length === 0
              ? <div className="p-4 text-center text-black">No emails</div>
              : currentEmails.map((email, index) => (
                <div
                  key={email.id}
                  id={`email-item-${email.id}`}
                  role="option"
                  aria-selected={selectedEmail?.id === email.id}
                  tabIndex={-1}
                  className={`p-3 cursor-pointer border-b border-gray-100 flex flex-col ${selectedEmail?.id === email.id ? 'bg-blue-50' : (focusedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50')
                    }`}
                  onClick={() => selectEmail(email)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-black truncate">{email.from}</p>
                      <p className="text-sm text-black truncate">{email.subject}</p>
                    </div>
                    <div className="text-xs text-black">{formatDate(email.date)}</div>
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination Controls */}
          {filteredEmails.length > 0 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(endIndex, filteredEmails.length)} sur {totalEmails}
                {isLoadingMore && (
                  <span className="ml-2 text-blue-600">
                    <Loader2 className="w-3 h-3 inline animate-spin" />
                    Chargement...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1 || isLoadingMore}
                  className={`text-gray-600 hover:text-gray-800 ${currentPage === 1 || isLoadingMore ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={goToNextPage}
                  disabled={!hasMore || isLoadingMore}
                  className={`text-gray-600 hover:text-gray-800 ${!hasMore || isLoadingMore ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </aside>
        <section className="w-2/3 flex flex-col text-black overflow-y-auto pt-10"
        style={{ height: 'calc(100vh - 12 rem)' }} >
          {selectedEmail
            ? <>
              <h3 className="text-lg font-semibold mb-2 text-black">{selectedEmail.subject}</h3>
              <p className="text-sm text-black mb-4">From: {selectedEmail.from} • {formatDate(selectedEmail.date)}</p>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2">
                    <button
                      className="p-2 bg-gray-200 rounded hover:bg-gray-300 text-sm flex items-center justify-center"
                      onClick={() => {
                        navigator.clipboard.writeText(emailBody);
                      }}
                      title="Copy content"
                      aria-label="Copy content"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2zM8 8h.01M12 8h.01M16 8h.01" />
                      </svg>
                    </button>
                    <button
                      className="p-2 bg-gray-200 rounded hover:bg-gray-300 text-sm flex items-center justify-center"
                      onClick={() => window.print()}
                      title="Print email"
                      aria-label="Print email"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9v6h12V9M6 9V7a2 2 0 012-2h8a2 2 0 012 2v2M6 15v2a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>
                    <button
                      className="p-2 bg-gray-200 rounded hover:bg-gray-300 text-sm flex items-center justify-center"
                      onClick={() => {
                        const newWindow = window.open();
                        if (newWindow) {
                          newWindow.document.body.innerHTML = emailBody;
                        }
                      }}
                      title="Open in new tab"
                      aria-label="Open in new tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7m0 0L10 21l-7-7 11-11z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow border border-gray-200 max-h-[500px] overflow-auto relative text-black transition-all duration-300 ease-in-out">
                  {bodyLoading ? <EmailBodySkeleton /> : (
                    <div className="email-content">
                      {/* Email Header */}
                      <div className="mb-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {selectedEmail.from.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{selectedEmail.from}</h4>
                              <p className="text-sm text-gray-600">{formatDate(selectedEmail.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">View in browser</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          You no longer wish to receive information? <a href="#" className="text-blue-600 underline">Unsubscribe</a>
                        </p>
                      </div>

                      {/* Email Body */}
                      <div className="prose prose-sm max-w-none">
                        <div
                          className={`${isExpanded ? '' : 'line-clamp-12'} leading-relaxed overflow-hidden`}
                          dangerouslySetInnerHTML={{
                            __html: emailBody

                          }}
                        />
                      </div>

                      {/* Expand/Collapse Button */}
                      {!bodyLoading && emailBody.length > 500 && (
                        <button
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors duration-300 flex items-center space-x-2"
                          onClick={() => setIsExpanded(!isExpanded)}
                        >
                          <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
                          <svg
                            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <h4 className="font-semibold mb-4 text-black text-lg">AI-Generated Reply</h4>
              <div className="flex justify-between items-center mb-4">
                <select
                  className="border border-gray-300 rounded p-2 text-sm"
                  value={replyTone}
                  onChange={e => setReplyTone(e.target.value)}
                >{TONES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
              </div>
              <textarea
                className="w-full h-80 px-4 py-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-800 p"
                value={`Hi ${selectedEmail.from.split(" ")[0] || "there"},\n\nThank you for your message about '${selectedEmail.subject}'. We'll get back to you shortly.\n\nBest,\nSupport Team`}
                onChange={e => setReplyDraft(e.target.value)}                                                                                                                                                               
                style={{ minHeight: '500px' }}
              />

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button onClick={onSend} className="bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Send
                  </Button>
                  <Button variant="outline" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={onReject}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={e => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Auto-approve similar emails</span>
                </label>
              </div>
            </>
            :div}
        </section>
      </div>
    </>
  );
}
