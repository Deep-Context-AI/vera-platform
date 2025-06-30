import OpenAI from 'openai';
import { NPIVerificationDecision, CALicenseVerificationDecision, ABMSVerificationDecision, DEAVerificationDecision, MedicareVerificationDecision } from './types';

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

// Function to analyze DEA verification result using OpenAI
export async function analyzeDEAVerificationResult(
  apiResult: any,
  practitionerData: any,
  providerContext?: any
): Promise<DEAVerificationDecision> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `You are a healthcare verification specialist analyzing DEA (Drug Enforcement Administration) registration verification results.

Your task is to analyze the API response and make a verification decision based on the DEA registration data quality and match accuracy.

DECISION CRITERIA:
- "completed": DEA registration data matches practitioner information well, registration is active and valid
- "failed": Major discrepancies, invalid DEA number, expired registration, or verification API call failed
- "requires_review": Complex case that needs human review due to ambiguous results, or if registration has issues

ANALYSIS FACTORS:
1. Name matching (first name, last name, registrant name)
2. DEA number validity and format
3. Registration status (active, expired, suspended, etc.)
4. Registration expiration date
5. Business activity codes and drug schedules
6. Any disciplinary actions or restrictions
7. Registration type consistency

RESPONSE FORMAT:
Return a JSON object with:
{
  "decision": "completed|failed|requires_review",
  "reasoning": "Clear explanation of the decision",
  "dea_details": {
    "number": "extracted DEA number",
    "status": "active|expired|suspended|etc",
    "expiration_date": "YYYY-MM-DD format if available",
    "registrant_name": "name on registration",
    "business_activity": "business activity description"
  },
  "issues_found": ["list of any issues"],
  "recommendations": ["list of recommendations if any"]
}

Be thorough but concise in your analysis. Pay special attention to registration status and expiration dates.`;

  const userPrompt = `Please analyze this DEA verification result:

PRACTITIONER DATA:
${JSON.stringify(practitionerData, null, 2)}

DEA VERIFICATION API RESULT:
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

    const decision = JSON.parse(content) as DEAVerificationDecision;
    
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
    console.error('❌ OpenAI DEA Analysis Error:', error);
    
    // Fallback decision if OpenAI fails
    return {
      decision: 'requires_review',
      reasoning: `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
      issues_found: ['OpenAI analysis unavailable'],
      recommendations: ['Perform manual DEA verification review']
    };
  }
}

// Function to analyze Medicare verification result using OpenAI
export async function analyzeMedicareVerificationResult(
  apiResult: any,
  practitionerData: any,
  providerContext?: any
): Promise<MedicareVerificationDecision> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `You are a healthcare verification specialist analyzing Medicare enrollment verification results.

Your task is to analyze the API response and make a verification decision based on the Medicare enrollment data quality and match accuracy.

DECISION CRITERIA:
- "completed": Medicare enrollment data matches practitioner information well, enrollment is active and valid, OR provider is confirmed not enrolled in Medicare (404/not found)
- "failed": Major discrepancies, invalid enrollment, or verification API call failed with non-404 error
- "requires_review": Complex case that needs human review due to ambiguous results, or if enrollment has issues

ANALYSIS FACTORS:
1. Name matching (first name, last name)
2. NPI number validity and consistency
3. Medicare enrollment status (active, inactive, terminated, not_enrolled, etc.)
4. Enrollment effective dates and termination dates
5. Provider type and specialty matching
6. Reassignment eligibility status
7. Fee-for-service vs. ordering/referring provider enrollment
8. Any enrollment restrictions or limitations
9. Provider not found (404) should be treated as completed verification with "not enrolled in Medicare" status

RESPONSE FORMAT:
Return a JSON object with:
{
  "decision": "completed|failed|requires_review",
  "reasoning": "Clear explanation of the decision",
  "medicare_details": {
    "npi": "NPI number from enrollment",
    "enrollment_status": "active|inactive|terminated|etc",
    "enrollment_date": "YYYY-MM-DD format if available",
    "provider_type": "individual|organization|etc",
    "specialty": "provider specialty",
    "reassignment_eligible": true/false
  },
  "issues_found": ["list of any issues"],
  "recommendations": ["list of recommendations if any"]
}

Be thorough but concise in your analysis. Pay special attention to enrollment status and effective dates.`;

  const userPrompt = `Please analyze this Medicare verification result:

PRACTITIONER DATA:
${JSON.stringify(practitionerData, null, 2)}

MEDICARE VERIFICATION API RESULT:
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

    const decision = JSON.parse(content) as MedicareVerificationDecision;
    
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
    console.error('❌ OpenAI Medicare Analysis Error:', error);
    
    // Fallback decision if OpenAI fails
    return {
      decision: 'requires_review',
      reasoning: `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
      issues_found: ['OpenAI analysis unavailable'],
      recommendations: ['Perform manual Medicare verification review']
    };
  }
}
