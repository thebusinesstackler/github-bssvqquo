import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Only for development, use server-side in production
});

interface ScreenerField {
  id: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'date';
  label: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  category: 'demographics' | 'medical' | 'eligibility' | 'contact';
}

export async function generateScreenerFromProtocol(protocolText: string): Promise<ScreenerField[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert in clinical trial protocols and patient screening. 
          Your task is to analyze the protocol text and generate a screening form that captures all necessary eligibility criteria.
          The form should be structured as a JSON array of fields with specific types and validation rules.
          Each field should have a clear category (demographics, medical, eligibility, or contact).
          
          Focus on:
          1. Key inclusion/exclusion criteria
          2. Required demographic information
          3. Medical history requirements
          4. Current medications and conditions
          5. Laboratory values and vital signs
          
          For each criterion, create appropriate form fields with validation rules.`
        },
        {
          role: "user",
          content: `Please analyze this protocol text and generate a screening form:
          
          ${protocolText}
          
          Return only a JSON array of fields with the following structure for each field:
          {
            id: string,
            type: "text" | "number" | "select" | "radio" | "checkbox" | "date",
            label: string,
            required: boolean,
            options?: string[],
            validation?: {
              min?: number,
              max?: number,
              pattern?: string,
              message?: string
            },
            category: "demographics" | "medical" | "eligibility" | "contact"
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const fields = JSON.parse(jsonMatch[0]) as ScreenerField[];

    // Add default contact fields at the beginning
    const defaultFields: ScreenerField[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        category: 'contact'
      },
      {
        id: 'email',
        type: 'text',
        label: 'Email Address',
        required: true,
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          message: 'Please enter a valid email address'
        },
        category: 'contact'
      },
      {
        id: 'phone',
        type: 'text',
        label: 'Phone Number',
        required: true,
        validation: {
          pattern: '^\\+?[1-9]\\d{1,14}$',
          message: 'Please enter a valid phone number'
        },
        category: 'contact'
      }
    ];

    return [...defaultFields, ...fields];
  } catch (error) {
    console.error('Error generating screener form:', error);
    throw error;
  }
}