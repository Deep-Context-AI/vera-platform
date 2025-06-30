import OpenAI from 'openai';
import { NPIVerificationDecision, CALicenseVerificationDecision, ABMSVerificationDecision } from './types';

// OpenAI client for verification analysis
const getOpenAIClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};

// Function to analyze NPI verification result using OpenAI
export async function analyzeNPIVerificationResult(
  apiResult: any,
  practitionerData: any,
  providerContext?: any
): Promise<NPIVerificationDecision> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `You are a healthcare verification specialist analyzing NPI (National Provider Identifier) verification results. 

Your task is to analyze the API response and make a verification decision based on the data quality and match accuracy.

DECISION CRITERIA:
- "completed": NPI data matches practitioner information well, no significant discrepancies
- "failed": Major discrepancies, invalid NPI, or verification API call failed
- "requires_review": Complex case that needs human review due to ambiguous results

ANALYSIS FACTORS:
1. Name matching (first name, last name)
2. NPI validity and status
3. Address/location matching (Mismatches are not a problem)
4. Organization/practice information
5. License status and credentials
6. Any red flags or inconsistencies

RESPONSE FORMAT:
Return a JSON object with:
{
  "decision": "completed|failed|requires_review",
  "reasoning": "Clear explanation of the decision",
  "issues_found": ["list of any issues"],
  "recommendations": ["list of recommendations if any"]
}

Be thorough but concise in your analysis.`;

  const userPrompt = `Please analyze this NPI verification result:

PRACTITIONER DATA:
${JSON.stringify(practitionerData, null, 2)}

NPI VERIFICATION API RESULT:
${JSON.stringify(apiResult, null, 2)}

PROVIDER CONTEXT (if available):
${providerContext ? JSON.stringify(providerContext, null, 2) : 'No additional context provided'}

Analyze the verification result and provide your decision in the specified JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const decision = JSON.parse(content) as NPIVerificationDecision;
    
    // Validate the decision structure
    if (!decision.decision || !decision.reasoning) {
      throw new Error('Invalid decision format from OpenAI');
    }

    // Ensure decision is one of the valid options
    if (!['completed', 'in_progress', 'failed', 'requires_review'].includes(decision.decision)) {
      throw new Error(`Invalid decision value: ${decision.decision}`);
    }

    return decision;
  } catch (error) {
    console.error('❌ OpenAI Analysis Error:', error);
    
    // Fallback decision if OpenAI fails
    return {
      decision: 'requires_review',
      reasoning: `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
      issues_found: ['OpenAI analysis unavailable'],
      recommendations: ['Perform manual verification review']
    };
  }
}

// Function to analyze CA License verification result using OpenAI
export async function analyzeCALicenseVerificationResult(
  apiResult: any,
  practitionerData: any,
  providerContext?: any
): Promise<CALicenseVerificationDecision> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `You are a healthcare verification specialist analyzing CA DCA (Department of Consumer Affairs) license verification results.

Your task is to analyze the API response and make a verification decision based on the license data quality and match accuracy.

DECISION CRITERIA:
- "completed": License data matches practitioner information well, license is active and valid
- "failed": Major discrepancies, invalid license, expired license, or verification API call failed
- "requires_review": Complex case that needs human review due to ambiguous results, or if the license is not active or expired, or if the license has any disciplinary actions or restrictions, or if the license is not in the state of California.

ANALYSIS FACTORS:
1. Name matching (first name, last name)
2. License number validity and status
3. License expiration date (expired licenses should be flagged)
4. License state (should be CA for DCA verification)
5. License type and category
6. Any disciplinary actions or restrictions
7. License issue date consistency

RESPONSE FORMAT:
Return a JSON object with:
{
  "decision": "completed|failed|requires_review",
  "reasoning": "Clear explanation of the decision",
  "license_details": {
    "number": "extracted license number",
    "state": "CA",
    "issued_date": "YYYY-MM-DD format if available",
    "expiration_date": "YYYY-MM-DD format if available",
    "status": "active|expired|suspended|etc"
  },
  "issues_found": ["list of any issues"],
  "recommendations": ["list of recommendations if any"]
}

Be thorough but concise in your analysis. Pay special attention to license expiration dates and status.`;

  const userPrompt = `Please analyze this CA DCA license verification result:

PRACTITIONER DATA:
${JSON.stringify(practitionerData, null, 2)}

DCA LICENSE VERIFICATION API RESULT:
${JSON.stringify(apiResult, null, 2)}

PROVIDER CONTEXT (if available):
${providerContext ? JSON.stringify(providerContext, null, 2) : 'No additional context provided'}

Analyze the verification result and provide your decision in the specified JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const decision = JSON.parse(content) as CALicenseVerificationDecision;
    
    // Validate the decision structure
    if (!decision.decision || !decision.reasoning) {
      throw new Error('Invalid decision format from OpenAI');
    }

    // Ensure decision is one of the valid options
    if (!['completed', 'in_progress', 'failed', 'requires_review'].includes(decision.decision)) {
      throw new Error(`Invalid decision value: ${decision.decision}`);
    }

    return decision;
  } catch (error) {
    console.error('❌ OpenAI CA License Analysis Error:', error);
    
    // Fallback decision if OpenAI fails
    return {
      decision: 'requires_review',
      reasoning: `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
      issues_found: ['OpenAI analysis unavailable'],
      recommendations: ['Perform manual license verification review']
    };
  }
}

// Function to analyze ABMS verification result using OpenAI
export async function analyzeABMSVerificationResult(
  apiResult: any,
  practitionerData: any,
  providerContext?: any
): Promise<ABMSVerificationDecision> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `You are a healthcare verification specialist analyzing ABMS (American Board of Medical Specialties) certification verification results.

Your task is to analyze the API response and make a verification decision based on the certification data quality and match accuracy.

DECISION CRITERIA:
- "completed": ABMS certification data matches practitioner information well, certification is active and valid
- "failed": Major discrepancies, invalid certification, expired certification, or verification API call failed
- "requires_review": Complex case that needs human review due to ambiguous results, or if certification has issues

ANALYSIS FACTORS:
1. Name matching (first name, last name, middle name if available)
2. Board certification status and validity
3. Specialty certification matching
4. NPI number matching
5. State medical license consistency
6. Certification expiration dates
7. Any disciplinary actions or certification issues

RESPONSE FORMAT:
Return a JSON object with:
{
  "decision": "completed|failed|requires_review",
  "reasoning": "Clear explanation of the decision",
  "issues_found": ["list of any issues"],
  "recommendations": ["list of recommendations if any"]
}

Be thorough but concise in your analysis. Pay special attention to certification status and expiration dates.`;

  const userPrompt = `Please analyze this ABMS certification verification result:

PRACTITIONER DATA:
${JSON.stringify(practitionerData, null, 2)}

ABMS CERTIFICATION API RESULT:
${JSON.stringify(apiResult, null, 2)}

PROVIDER CONTEXT (if available):
${providerContext ? JSON.stringify(providerContext, null, 2) : 'No additional context provided'}

Analyze the verification result and provide your decision in the specified JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const decision = JSON.parse(content) as ABMSVerificationDecision;
    
    // Validate the decision structure
    if (!decision.decision || !decision.reasoning) {
      throw new Error('Invalid decision format from OpenAI');
    }

    // Ensure decision is one of the valid options
    if (!['completed', 'in_progress', 'failed', 'requires_review'].includes(decision.decision)) {
      throw new Error(`Invalid decision value: ${decision.decision}`);
    }

    return decision;
  } catch (error) {
    console.error('❌ OpenAI ABMS Analysis Error:', error);
    
    // Fallback decision if OpenAI fails
    return {
      decision: 'requires_review',
      reasoning: `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
      issues_found: ['OpenAI analysis unavailable'],
      recommendations: ['Perform manual ABMS certification review']
    };
  }
}
