/*
  # Add Partner Notifications System

  1. New Tables
    - `partner_notifications`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, references partners)
      - `title` (text)
      - `message` (text)
      - `type` (text)
      - `read` (boolean)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS on `partner_notifications` table
    - Add policies for:
      - Partners can read their own notifications
      - Admins can create and read all notifications

  3. Changes
    - Add welcome message template function
    - Add trigger for new partner notifications
*/

-- Create partner_notifications table
CREATE TABLE IF NOT EXISTS partner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  CONSTRAINT valid_notification_type CHECK (type IN ('welcome', 'system', 'admin'))
);

-- Enable RLS
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for partner_notifications
CREATE POLICY "Partners can read own notifications"
  ON partner_notifications
  FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'theranovex@gmail.com'
    )
  );

CREATE POLICY "Admins can create notifications"
  ON partner_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'theranovex@gmail.com'
    )
  );

-- Function to create welcome notification
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO partner_notifications (
    partner_id,
    title,
    message,
    type,
    created_by
  ) VALUES (
    NEW.id,
    'Welcome to the Patient Referral Portal!',
    'Thank you for joining our network of research sites. To get started, please complete your site profile and review our quick start guide. Our team is here to help you succeed!',
    'welcome',
    (SELECT id FROM users WHERE email = 'theranovex@gmail.com' LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for welcome notification
CREATE TRIGGER welcome_notification_trigger
  AFTER INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();