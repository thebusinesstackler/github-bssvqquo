/*
  # Add protocol fields to screener forms

  1. Changes
    - Add protocol_text column to store the uploaded protocol content
    - Add ai_generated boolean flag to track AI-generated forms
    - Add generated_at timestamp to track when AI generated the form
    - Add protocol_file_name to store original file name
    - Add protocol_file_type to store file type (PDF, DOC, etc.)

  2. Security
    - Enable RLS on screener_forms table
    - Add policies for protocol-related fields
*/

-- Add new columns to screener_forms table
ALTER TABLE screener_forms 
ADD COLUMN IF NOT EXISTS protocol_text text,
ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS generated_at timestamptz,
ADD COLUMN IF NOT EXISTS protocol_file_name text,
ADD COLUMN IF NOT EXISTS protocol_file_type text;

-- Update RLS policies
CREATE POLICY "Users can update protocol fields on their forms"
ON screener_forms
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
)
WITH CHECK (
  created_by = auth.uid() AND
  (
    protocol_text IS NOT NULL OR
    protocol_file_name IS NOT NULL OR
    protocol_file_type IS NOT NULL
  )
);