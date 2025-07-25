-- Create oauth_states table for secure OAuth flow
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  shop_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create shopify_orders table for storing order data
CREATE TABLE IF NOT EXISTS shopify_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  order_id BIGINT NOT NULL,
  order_number TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  total_price DECIMAL(10,2),
  currency TEXT,
  order_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_domain, order_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_user_id ON shopify_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_shop_domain ON shopify_orders(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_customer_email ON shopify_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created_at ON shopify_orders(created_at);

-- Add RLS policies
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

-- OAuth states policies
CREATE POLICY "Users can manage their own OAuth states" ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

-- Shopify orders policies
CREATE POLICY "Users can view their own Shopify orders" ON shopify_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert Shopify orders" ON shopify_orders
  FOR INSERT WITH CHECK (true);

-- Clean up expired OAuth states function
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired states (if pg_cron is available)
-- SELECT cron.schedule('cleanup-oauth-states', '*/10 * * * *', 'SELECT cleanup_expired_oauth_states();');