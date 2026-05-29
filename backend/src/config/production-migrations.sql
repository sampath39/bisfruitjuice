-- Supabase PostgreSQL Production Migration Schema for Bismilla Fruit Juice Shop
-- Enables the custom human-readable sequence order code system and secure OTP verifications

-- 1. Create a sequence for the custom human-readable Order Codes
CREATE SEQUENCE IF NOT EXISTS public.order_code_seq START WITH 1;

-- 2. Modify orders table to support custom Order Codes and tracking timestamps
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS near_location_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP WITH TIME ZONE;

-- 3. Create a function to automatically format the custom Order ID (BFJ-2026-XXXX)
CREATE OR REPLACE FUNCTION public.set_order_code_default()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_code IS NULL THEN
        NEW.order_code := 'BFJ-2026-' || LPAD(nextval('public.order_code_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to bake order codes on insert
CREATE OR REPLACE TRIGGER trg_set_order_code
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_code_default();

-- 5. Create otp_verifications table with expiry constraints
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Add high-performance composite indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_order_id ON public.otp_verifications(order_id);
