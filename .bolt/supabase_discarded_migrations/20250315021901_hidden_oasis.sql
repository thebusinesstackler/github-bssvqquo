/*
  # Add protocol fields to screener forms

  1. New Fields
    - protocol_text: Stores the uploaded protocol content
    - protocol_file_name: Original file name
    - protocol_file_type: File type (PDF, DOC, etc.)
    - ai_generated: Flag for AI-generated forms
    - ai_generated_at: Timestamp when AI generated the form
    - ai_model_version: Version of AI model used
    - ai_confidence_score: Confidence score of AI generation
    - ai_suggestions: Array of AI suggestions for form improvement

  2. Security
    - Enable RLS on screener_forms table
    - Add policies for protocol-related fields
    - Ensure only authorized users can access AI features
*/

-- Add new columns to screener_forms table
ALTER TABLE screener_forms 
ADD COLUMN IF NOT EXISTS protocol_text text,
ADD COLUMN IF NOT EXISTS protocol_file_name text,
ADD COLUMN IF NOT EXISTS protocol_file_type text,
ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz,
ADD COLUMN IF NOT EXISTS ai_model_version text,
ADD COLUMN IF NOT EXISTS ai_confidence_score numeric CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN IF NOT EXISTS ai_suggestions jsonb DEFAULT '[]'::jsonb;

-- Add index for AI-generated forms
CREATE INDEX IF NOT EXISTS idx_screener_forms_ai_generated ON screener_forms(ai_generated);

-- Add index for confidence score to help with filtering/sorting
CREATE INDEX IF NOT EXISTS idx_screener_forms_confidence ON screener_forms(ai_confidence_score);

-- Update RLS policies
ALTER TABLE screener_forms ENABLE ROW LEVEL SECURITY;

-- Policy for reading AI-generated forms
CREATE POLICY "Users can read their own AI-generated forms"
ON screener_forms
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  id IN (
    SELECT form_id 
    FROM form_assignments 
    WHERE user_id = auth.uid()
  )
);

-- Policy for updating protocol fields
CREATE POLICY "Users can update protocol fields on their forms"
ON screener_forms
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (
  created_by = auth.uid() AND
  (
    protocol_text IS NOT NULL OR
    protocol_file_name IS NOT NULL OR
    protocol_file_type IS NOT NULL
  )
);