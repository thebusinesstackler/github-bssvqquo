/*
  # Add Protocol Analysis Tables

  1. New Tables
    - `protocol_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `file_name` (text)
      - `content` (text)
      - `analysis_status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `protocol_criteria`
      - `id` (uuid, primary key)
      - `protocol_id` (uuid, references protocol_documents)
      - `type` (text) - 'inclusion' or 'exclusion'
      - `criteria` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own protocols
    - Add policies for authenticated users to read criteria

  3. Changes
    - Add function to update updated_at timestamp
*/

-- Create protocol_documents table
CREATE TABLE IF NOT EXISTS protocol_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  content text NOT NULL,
  analysis_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create protocol_criteria table
CREATE TABLE IF NOT EXISTS protocol_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES protocol_documents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('inclusion', 'exclusion')),
  criteria text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE protocol_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_criteria ENABLE ROW LEVEL SECURITY;

-- Create policies for protocol_documents
CREATE POLICY "Users can create their own protocol documents"
  ON protocol_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own protocol documents"
  ON protocol_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own protocol documents"
  ON protocol_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own protocol documents"
  ON protocol_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for protocol_criteria
CREATE POLICY "Users can create criteria for their protocols"
  ON protocol_criteria
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM protocol_documents
    WHERE id = protocol_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can read criteria for their protocols"
  ON protocol_criteria
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocol_documents
    WHERE id = protocol_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update criteria for their protocols"
  ON protocol_criteria
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocol_documents
    WHERE id = protocol_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM protocol_documents
    WHERE id = protocol_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete criteria for their protocols"
  ON protocol_criteria
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocol_documents
    WHERE id = protocol_id AND user_id = auth.uid()
  ));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_protocol_documents_updated_at
  BEFORE UPDATE ON protocol_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocol_criteria_updated_at
  BEFORE UPDATE ON protocol_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();