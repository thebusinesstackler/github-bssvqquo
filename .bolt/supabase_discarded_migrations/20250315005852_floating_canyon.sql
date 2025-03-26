/*
  # Add Payment Method Storage

  1. New Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `last4` (text)
      - `brand` (text)
      - `exp_month` (integer)
      - `exp_year` (integer)
      - `name` (text)
      - `is_default` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `payment_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (text)
      - `payment_method_id` (uuid, references payment_methods)
      - `description` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for secure access
    - Only allow users to access their own payment data

  3. Changes
    - Add payment method management
    - Add payment history tracking
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  last4 text NOT NULL,
  brand text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_expiry CHECK (
    exp_month >= 1 AND exp_month <= 12 AND
    exp_year >= EXTRACT(year FROM CURRENT_DATE)
  )
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text NOT NULL,
  payment_method_id uuid REFERENCES payment_methods(id),
  description text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('succeeded', 'pending', 'failed'))
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for payment_history
CREATE POLICY "Users can view their own payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment history"
  ON payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle default payment method
CREATE OR REPLACE FUNCTION manage_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for default payment method management
CREATE TRIGGER manage_default_payment_method_trigger
  BEFORE INSERT OR UPDATE OF is_default ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION manage_default_payment_method();

-- Create indexes
CREATE INDEX payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX payment_history_user_id_idx ON payment_history(user_id);
CREATE INDEX payment_history_created_at_idx ON payment_history(created_at);