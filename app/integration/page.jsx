"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Puzzle, Bell, ShoppingBag, Package, Users, Link, RefreshCw, X, Mail, MessageSquare, CheckCircle, XCircle, AlertCircle, DollarSign, ExternalLink, Settings } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { supabase } from "@/utils/supabase"
import { GmailInbox } from "@/components/gmail-inbox"
import { GmailStats } from "@/components/gmail-stats"

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const [wooApiKey, setWooApiKey] = useState("")
  const [wooStoreUrl, setWooStoreUrl] = useState("")
  const [shopifyApiKey, setShopifyApiKey] = useState("")
  const [shopifyPassword, setShopifyPassword] = useState("")
  const [shopifyDomain, setShopifyDomain] = useState("")
  const [imapHost, setImapHost] = useState("")
  const [imapPort, setImapPort] = useState("")
  const [imapUsername, setImapUsername] = useState("")
  const [imapPassword, setImapPassword] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [shopifyData, setShopifyData] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)
  const [integrations, setIntegrations] = useState({
    woocommerce: { status: 'not_connected' },
    shopify: { status: 'not_connected' },
    gmail: { status: 'not_connected' },
    outlook: { status: 'not_connected' },
    imap: { status: 'not_connected' }
  })

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle URL parameters for success/error messages
  useEffect(() => {
    if (!mounted) return

    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      switch (success) {
        case 'shopify_connected':
          setStatusMessage({
            type: 'success',
            title: 'Shopify Connected!',
            description: 'Your Shopify store has been successfully connected. You can now manage orders and customer inquiries.'
          })
          break
        default:
          setStatusMessage({
            type: 'success',
            title: 'Integration Successful!',
            description: 'Your integration has been set up successfully.'
          })
      }
    } else if (error) {
      switch (error) {
        case 'missing_parameters':
          setStatusMessage({
            type: 'error',
            title: 'Connection Failed',
            description: 'Missing required parameters. Please try connecting again.'
          })
          break
        case 'invalid_credentials':
          setStatusMessage({
            type: 'error',
            title: 'Invalid Credentials',
            description: 'The API credentials provided are invalid. Please check your API key and password.'
          })
          break
        case 'store_not_found':
          setStatusMessage({
            type: 'error',
            title: 'Store Not Found',
            description: 'The specified store domain could not be found. Please verify your store URL.'
          })
          break
        default:
          setStatusMessage({
            type: 'error',
            title: 'Integration Failed',
            description: 'An unexpected error occurred. Please try again.'
          })
      }
    }

    // Clear URL parameters after showing message
    if (success || error) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/integration')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [searchParams, mounted])

  // Fetch Shopify data if connected
  useEffect(() => {
    if (integrations?.shopify?.status === 'connected') {
      fetchShopifyData()
    }
  }, [integrations])

  const fetchShopifyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/shopify/data?userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setShopifyData(data)
      }
    } catch (error) {
      console.error('Error fetching Shopify data:', error)
    }
  }

  // Shopify connection handler using Private App credentials
  const handleShopifyConnect = async () => {
    try {
      setIsConnecting(true)
      setError("")
      
      if (!shopifyDomain || !shopifyApiKey || !shopifyPassword) {
        setError("Please fill in all Shopify credentials")
        return
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Please login to connect Shopify")
        return
      }

      // Validate domain format
      let domain = shopifyDomain.trim()
      if (!domain.endsWith('.myshopify.com')) {
        domain = `${domain}.myshopify.com`
      }

      // Test Shopify connection
      const response = await fetch('/api/shopify/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopDomain: domain,
          apiKey: shopifyApiKey,
          password: shopifyPassword,
          userId: session.user.id,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Shopify')
      }

      // Store credentials if connection successful
      const { error: integrationError } = await supabase
        .from('integrations')
        .upsert({
          user_id: session.user.id,
          platform: 'shopify',
          credentials: {
            shop_domain: domain,
            api_key: shopifyApiKey,
            password: shopifyPassword, // In production, encrypt this
            shop_info: data.shop_info
          },
          status: 'connected',
          connected_at: new Date().toISOString()
        })

      if (integrationError) throw integrationError

      // Clear form
      setShopifyDomain("")
      setShopifyApiKey("")
      setShopifyPassword("")
      
      // Refresh integration status
      await refreshIntegrationStatus()
      setStatusMessage({
        type: 'success',
        title: 'Shopify Connected!',
        description: 'Your Shopify store has been successfully connected.'
      })

    } catch (error) {
      console.error('Shopify connection error:', error)
      setError(error.message || "Failed to connect to Shopify")
    } finally {
      setIsConnecting(false)
    }
  }

  // Update the handleGmailConnect function
  const handleGmailConnect = async () => {
    try {
      setIsConnecting(true);
      setError("");

      console.log('Starting Gmail connection process...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, user needs to login first');
        setError("Please login to connect Gmail");
        return;
      }

      // Removed signOut to keep user logged in during OAuth flow

      // Then sign in with Google OAuth
      console.log('Initiating Google OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/integration`,
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true'
          }
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

    } catch (err) {
      console.error('Gmail connection error:', err);
      setError(err.message || "Failed to connect Gmail");
    } finally {
      setIsConnecting(false);
    }
  };

  // Add this function to check and update Gmail status
  const checkAndUpdateGmailStatus = async () => {
    try {
      console.log('Checking Gmail status...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session) {
        console.log('No session found');
        return;
      }

      console.log('Found session, checking Gmail integration...', {
        provider: session.user.app_metadata?.provider,
        hasProviderToken: !!session.provider_token,
        hasRefreshToken: !!session.refresh_token
      });
      
      // Only store integration if we have OAuth tokens and it's a Google provider
      if (session.user.app_metadata?.provider === 'google' && session.provider_token) {
        console.log('Google OAuth session detected with tokens');
        
        // Store or update the Gmail integration with proper tokens
        const integrationData = {
          user_id: session.user.id,
          platform: 'gmail',
          credentials: {
            email: session.user.email,
            provider: 'google',
            access_token: session.provider_token,
            refresh_token: session.refresh_token,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            avatar_url: session.user.user_metadata?.avatar_url,
            full_name: session.user.user_metadata?.full_name,
            scopes: [
              'https://www.googleapis.com/auth/gmail.readonly',
              'https://www.googleapis.com/auth/gmail.send',
              'https://www.googleapis.com/auth/gmail.modify',
              'https://www.googleapis.com/auth/gmail.labels'
            ]
          },
          status: 'connected',
          connected_at: new Date().toISOString()
        };

        console.log('Storing Gmail integration with tokens...', {
          user_id: integrationData.user_id,
          email: integrationData.credentials.email,
          hasAccessToken: !!integrationData.credentials.access_token,
          hasRefreshToken: !!integrationData.credentials.refresh_token
        });

        // First, delete any existing Gmail integrations for this user
        const { error: deleteError } = await supabase
          .from('integrations')
          .delete()
          .eq('user_id', session.user.id)
          .eq('platform', 'gmail');

        if (deleteError) {
          console.error('Error deleting existing integration:', deleteError);
        }

        // Then insert the new integration
        const { data: result, error: insertError } = await supabase
          .from('integrations')
          .insert(integrationData)
          .select();

        if (insertError) {
          console.error('Error storing integration:', insertError);
          throw insertError;
        }

        console.log('Integration stored successfully:', result);
      }

      // Fetch the current integration
      const { data: integrations, error: fetchError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('platform', 'gmail')
        .order('connected_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching integration:', fetchError);
        throw fetchError;
      }

      console.log('Found integrations:', integrations?.length || 0);

      if (integrations && integrations.length > 0) {
        const integration = integrations[0];
        console.log('Updating integrations state...', {
          hasAccessToken: !!integration.credentials?.access_token,
          email: integration.credentials?.email
        });
        setIntegrations(prev => ({
          ...prev,
          gmail: {
            status: 'connected',
            credentials: integration.credentials
          }
        }));
        console.log('Gmail status updated successfully');
      } else {
        console.log('No Gmail integration found in database');
      }
    } catch (error) {
      console.error('Error in checkAndUpdateGmailStatus:', error);
      setError(error.message);
    }
  };

  const handleImapConnect = async () => {
    try {
      setIsConnecting(true)
      setError("")

      // Validate inputs
      if (!imapHost || !imapPort || !imapUsername || !imapPassword) {
        setError("Please fill in all IMAP fields")
        return
      }

      // Validate port number
      const portNum = parseInt(imapPort)
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        setError("Please enter a valid port number (1-65535)")
        return
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Please login to connect IMAP")
        return
      }

      // Test IMAP connection
      const response = await fetch('/api/test-imap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: imapHost,
          port: portNum,
          username: imapUsername,
          password: imapPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to IMAP server')
      }

      // Store IMAP credentials
      const { error: integrationError } = await supabase
        .from('integrations')
        .upsert({
          user_id: session.user.id,
          platform: 'imap',
          credentials: {
            host: imapHost,
            port: portNum,
            username: imapUsername,
            password: imapPassword, // Note: In production, encrypt this before storing
          },
          status: 'connected',
          connected_at: new Date().toISOString()
        })

      if (integrationError) throw integrationError

      // Clear form
      setImapHost("")
      setImapPort("")
      setImapUsername("")
      setImapPassword("")

      // Refresh page to show updated status
      window.location.reload()

    } catch (err) {
      console.error('IMAP connection error:', err)
      setError(err.message || "Failed to connect to IMAP server")
    } finally {
      setIsConnecting(false)
    }
  }

  // Update the refresh function
  const refreshIntegrationStatus = async () => {
    try {
      console.log('Forcing integration status refresh...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session) {
        console.log('No session found during refresh');
        return;
      }

      console.log('Session found:', {
        email: session.user.email,
        userId: session.user.id
      });

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching integrations:', error);
        throw error;
      }

      console.log('Fetched integrations:', data.length);

      const newIntegrationStatus = {
        woocommerce: { status: 'not_connected' },
        shopify: { status: 'not_connected' },
        gmail: { status: 'not_connected' },
        outlook: { status: 'not_connected' },
        imap: { status: 'not_connected' }
      };

      data.forEach(integration => {
        console.log(`Found integration: ${integration.platform} (${integration.status})`);
        newIntegrationStatus[integration.platform] = {
          status: integration.status,
          credentials: integration.credentials
        };
      });

      console.log('Setting integration status:', {
        shopify: newIntegrationStatus.shopify.status,
        gmail: newIntegrationStatus.gmail.status,
        hasGmailCredentials: !!newIntegrationStatus.gmail.credentials
      });
      
      setIntegrations(newIntegrationStatus);
    } catch (err) {
      console.error('Error in refreshIntegrationStatus:', err);
      setError(err.message);
    }
  };

  // Update the auth state change handler
  useEffect(() => {
    if (!mounted) return;

    const handleAuthChange = async (event, session) => {
      console.log('Auth state changed:', event, 'Session data:', {
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        hasProviderToken: !!session?.provider_token,
        userId: session?.user?.id
      });

      if (event === 'SIGNED_IN' && session?.provider_token) {
        console.log('OAuth sign-in detected with token');
        try {
          // Store the integration data
          const integrationData = {
            user_id: session.user.id,
            platform: 'gmail',
            credentials: {
              email: session.user.email,
              provider: 'google',
              access_token: session.provider_token,
              refresh_token: session.refresh_token,
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
              avatar_url: session.user.user_metadata?.avatar_url,
              full_name: session.user.user_metadata?.full_name,
              scopes: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.modify',
                'https://www.googleapis.com/auth/gmail.labels'
              ]
            },
            status: 'connected',
            connected_at: new Date().toISOString()
          };

          console.log('Storing integration data...', {
            user_id: integrationData.user_id,
            email: integrationData.credentials.email,
            scopes: integrationData.credentials.scopes
          });

          // First, delete any existing Gmail integrations for this user
          const { error: deleteError } = await supabase
            .from('integrations')
            .delete()
            .eq('user_id', session.user.id)
            .eq('platform', 'gmail');

          if (deleteError) {
            console.error('Error deleting existing integration:', deleteError);
            throw deleteError;
          }

          // Then insert the new integration
          const { data: result, error: insertError } = await supabase
            .from('integrations')
            .insert(integrationData)
            .select();

          if (insertError) {
            console.error('Error storing integration:', insertError);
            throw insertError;
          }

          console.log('Integration stored successfully:', result);
          await refreshIntegrationStatus();
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          setError(error.message);
        }
      }
    };

    // Initial load - check for existing integrations and OAuth session
    console.log('Initial mount, checking for existing integrations and OAuth session...');
    checkAndUpdateGmailStatus().then(() => {
      refreshIntegrationStatus();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      console.log('Cleaning up auth state listener');
      subscription?.unsubscribe();
    };
  }, [mounted]);

  const handleWooCommerceConnect = async () => {
    try {
      setIsConnecting(true)
      setError("")

      if (!wooApiKey || !wooStoreUrl) {
        setError("Please provide both API key and store URL")
        return
      }

      // Validate store URL format
      try {
        new URL(wooStoreUrl)
      } catch (e) {
        setError("Please enter a valid store URL")
        return
      }

      // Store the WooCommerce credentials in Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Please login to connect your store")
        return
      }

      const { error: integrationError } = await supabase
        .from('integrations')
        .upsert({
          user_id: session.user.id,
          platform: 'woocommerce',
          credentials: {
            api_key: wooApiKey,
            store_url: wooStoreUrl
          },
          status: 'connected',
          connected_at: new Date().toISOString()
        })

      if (integrationError) throw integrationError

      // Clear the form
      setWooApiKey("")
      setWooStoreUrl("")
      
      // Refresh the page to show updated status
      window.location.reload()

    } catch (err) {
      console.error('WooCommerce connection error:', err)
      setError(err.message || "Failed to connect to WooCommerce")
    } finally {
      setIsConnecting(false)
    }
  }

  const syncedData = [
    { label: "Orders", value: "1,247", icon: ShoppingBag, color: "text-blue-600" },
    { label: "Products", value: "89", icon: Package, color: "text-purple-600" },
    { label: "Customers", value: "2,156", icon: Users, color: "text-orange-600" },
  ]

  // Status message component
  const StatusMessage = () => {
    if (!statusMessage) return null

    const Icon = statusMessage.type === 'success' ? CheckCircle : 
                 statusMessage.type === 'error' ? XCircle : AlertCircle
    
    const bgColor = statusMessage.type === 'success' ? 'bg-green-50 border-green-200' :
                    statusMessage.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
    
    const iconColor = statusMessage.type === 'success' ? 'text-green-600' :
                      statusMessage.type === 'error' ? 'text-red-600' :
                      'text-yellow-600'
    
    const textColor = statusMessage.type === 'success' ? 'text-green-800' :
                      statusMessage.type === 'error' ? 'text-red-800' :
                      'text-yellow-800'

    return (
      <div className={`border rounded-lg p-4 mb-6 ${bgColor}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
          <div>
            <h3 className={`font-medium ${textColor}`}>{statusMessage.title}</h3>
            <p className={`text-sm mt-1 ${textColor}`}>{statusMessage.description}</p>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className={`ml-auto text-sm ${textColor} hover:opacity-75`}
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  // Shopify Integration Component
  const ShopifyIntegration = () => (
    <Card className="mb-6">
      <CardContent className="pt-6 p-6 bg-white rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Shopify</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 ${integrations?.shopify?.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
              <span className={`text-sm ${integrations?.shopify?.status === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>
                {integrations?.shopify?.status === 'connected' ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {integrations?.shopify?.status === 'connected' ? (
          <div>
            <div className="flex gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) return

                    const { error } = await supabase
                      .from('integrations')
                      .delete()
                      .eq('user_id', session.user.id)
                      .eq('platform', 'shopify')
                    
                    if (error) throw error
                    await refreshIntegrationStatus()
                  } catch (err) {
                    console.error('Error disconnecting:', err)
                    setError('Failed to disconnect Shopify')
                  }
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                onClick={fetchShopifyData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-3">Connected Store</h5>
              <p className="text-sm text-gray-600 mb-6">
                {integrations?.shopify?.credentials?.shop_domain || 'Unknown Store'}
              </p>
              
              {shopifyData && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Store Statistics</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">Orders</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {shopifyData.stats?.orders?.total || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-600">Products</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {shopifyData.stats?.products?.total || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <Users className="w-6 h-6 text-orange-600" />
                      </div>
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {shopifyData.stats?.customers?.total || 0}
                      </p>
                    </div>
                  </div>

                  {shopifyData.stats?.orders?.totalValue > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Total Revenue: ${shopifyData.stats.orders.totalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h6 className="font-medium text-blue-800 mb-1">Private App Required</h6>
                  <p className="text-sm text-blue-700 mb-2">
                    To connect Shopify, you need to create a Private App in your Shopify admin panel.
                  </p>
                  <a 
                    href="https://help.shopify.com/en/manual/apps/private-apps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    Learn how to create a Private App
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Domain
                </label>
                <Input
                  className="bg-white placeholder-gray-700"
                  placeholder="your-shop-name.myshopify.com"
                  value={shopifyDomain}
                  onChange={(e) => setShopifyDomain(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <Input
                  className="bg-white placeholder-gray-700"
                  placeholder="Enter your Private App API Key"
                  value={shopifyApiKey}
                  onChange={(e) => setShopifyApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  className="bg-white placeholder-gray-700"
                  placeholder="Enter your Private App Password"
                  value={shopifyPassword}
                  onChange={(e) => setShopifyPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700 mb-4"
              onClick={handleShopifyConnect}
              disabled={isConnecting || !shopifyDomain || !shopifyApiKey || !shopifyPassword}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Shopify Store"}
            </Button>

            <div className="bg-green-50 p-4 rounded-lg">
              <h6 className="font-medium text-green-900 mb-2">What you'll get:</h6>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Automatic order notifications</li>
                <li>• Customer inquiry management</li>
                <li>• Product and inventory sync</li>
                <li>• AI-powered customer support</li>
                <li>• Real-time data integration</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Update the renderGmailSection function
  const renderGmailSection = () => {
    console.log('Rendering Gmail section with status:', integrations.gmail?.status || 'not_connected');
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 p-6 bg-white rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Gmail</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 ${integrations.gmail.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                <span className={`text-sm ${integrations.gmail.status === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>
                  {integrations.gmail.status === 'connected' ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          {integrations.gmail.status === 'connected' ? (
            <div>
              <div className="flex gap-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('integrations')
                        .delete()
                        .eq('platform', 'gmail');
                      
                      if (error) throw error;
                      await refreshIntegrationStatus();
                    } catch (err) {
                      console.error('Error disconnecting:', err);
                      setError('Failed to disconnect Gmail');
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                  onClick={handleGmailConnect}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-authenticate
                </Button>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-3">Connected Account</h5>
                <p className="text-sm text-gray-600 mb-6">{integrations.gmail.credentials?.email}</p>
                
                {/* Add Gmail Inbox */}
                <div className="mt-6 border-t pt-6">
                  <GmailStats />
                </div>
              </div>
            </div>
          ) : (
            <Button 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleGmailConnect}
              disabled={isConnecting}
            >
              <Mail className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect with OAuth"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header/>

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Manage your platform connections</h2>
          <p className="text-gray-600">
            Connect your e-commerce platforms and email providers to sync data and automate workflows
          </p>
        </div>

        {/* Status Messages */}
        <StatusMessage />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* E-commerce Platforms */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">E-commerce Platforms</h3>

            {/* Shopify Integration */}
            <ShopifyIntegration />

            {/* WooCommerce Integration */}
            <Card>
            <CardContent className="pt-6 p-6 bg-white rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">WooCommerce</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 ${integrations.woocommerce.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                            <span className={`text-sm ${integrations.woocommerce.status === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>
                              {integrations.woocommerce.status === 'connected' ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                    </div>
                </div>

                {integrations.woocommerce.status === 'connected' ? (
                  <div>
                    <div className="flex gap-2 mb-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('integrations')
                              .delete()
                              .eq('platform', 'woocommerce')
                            
                            if (error) throw error
                            window.location.reload()
                          } catch (err) {
                            console.error('Error disconnecting:', err)
                            setError('Failed to disconnect WooCommerce')
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                        onClick={handleWooCommerceConnect}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-authenticate
                      </Button>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Connected Store</h5>
                      <p className="text-sm text-gray-600 mb-6">{integrations.woocommerce.credentials?.store_url}</p>
                      
                      <h5 className="font-medium text-gray-900 mb-3">Synced Data</h5>
                      <div className="grid grid-cols-3 gap-4">
                        {syncedData.map((item) => (
                          <div key={item.label} className="text-center">
                            <div className="flex justify-center mb-2">
                              <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <p className="text-sm text-gray-600">{item.label}</p>
                            <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <Input
                          className="bg-white placeholder-gray-700"
                          placeholder="Enter your WooCommerce API key"
                          value={wooApiKey}
                          onChange={(e) => setWooApiKey(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store URL</label>
                        <Input
                          className="bg-white placeholder-gray-700"
                          placeholder="https://yourstore.com"
                          value={wooStoreUrl}
                          onChange={(e) => setWooStoreUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
                      onClick={handleWooCommerceConnect}
                      disabled={isConnecting}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      {isConnecting ? "Connecting..." : "Connect WooCommerce"}
                    </Button>

                    {error && (
                      <div className="text-red-600 text-sm mb-4">
                        {error}
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h6 className="font-medium text-blue-900 mb-2">Webhook Setup</h6>
                      <p className="text-sm text-blue-700">
                        After connecting, configure webhooks in your WooCommerce settings for real-time data sync.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email & Communication */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Email & Communication</h3>

            {renderGmailSection()}

            {/* Outlook Integration */}
            <Card className="mb-6">
            <CardContent className="pt-6 p-6 bg-white rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Outlook</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-600">Not Connected</span>
                        </div>
                    </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Connect with Microsoft
                </Button>
              </CardContent>
            </Card>

            {/* Custom IMAP */}
            <Card className="mb-8">
              <CardContent className="pt-6 p-6 bg-white rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Custom IMAP</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 ${integrations.imap.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                            <span className={`text-sm ${integrations.imap.status === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>
                              {integrations.imap.status === 'connected' ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                    </div>
                </div>

                {integrations.imap.status === 'connected' ? (
                  <div>
                    <div className="flex gap-2 mb-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('integrations')
                              .delete()
                              .eq('platform', 'imap')
                            
                            if (error) throw error
                            window.location.reload()
                          } catch (err) {
                            console.error('Error disconnecting:', err)
                            setError('Failed to disconnect IMAP')
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                        onClick={() => {
                          setImapHost(integrations.imap.credentials?.host || '')
                          setImapPort(integrations.imap.credentials?.port || '')
                          setImapUsername(integrations.imap.credentials?.username || '')
                          handleImapConnect()
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-authenticate
                      </Button>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Connected Account</h5>
                      <p className="text-sm text-gray-600">{integrations.imap.credentials?.username}</p>
                      <p className="text-sm text-gray-600">{integrations.imap.credentials?.host}:{integrations.imap.credentials?.port}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                          <Input
                            placeholder="imap.example.com"
                            value={imapHost}
                            onChange={(e) => setImapHost(e.target.value)}
                            className="bg-white placeholder-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                          <Input 
                            placeholder="993" 
                            value={imapPort} 
                            onChange={(e) => setImapPort(e.target.value)} 
                            className="bg-white placeholder-gray-700" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <Input
                          placeholder="your@email.com"
                          value={imapUsername}
                          onChange={(e) => setImapUsername(e.target.value)}
                          className="bg-white placeholder-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={imapPassword}
                          onChange={(e) => setImapPassword(e.target.value)}
                          className="bg-white placeholder-gray-700"
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gray-700 hover:bg-gray-800"
                      onClick={handleImapConnect}
                      disabled={isConnecting}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      {isConnecting ? "Connecting..." : "Connect IMAP"}
                    </Button>

                    {error && (
                      <div className="text-red-600 text-sm mt-4">
                        {error}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notification Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Services</h3>

              {/* Slack */}
              <Card className="mb-4">
              <CardContent className="pt-6 p-4 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Slack</h4>
                        <p className="text-sm text-gray-600">Get notified when AI replies</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Coming Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Discord */}
              <Card>
              <CardContent className="pt-6 p-4 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Discord</h4>
                        <p className="text-sm text-gray-600">Get notified when AI replies</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Coming Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer/>
    </div>
  )
}