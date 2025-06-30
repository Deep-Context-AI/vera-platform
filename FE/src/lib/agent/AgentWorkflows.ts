import { z } from 'zod';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from './UIInteractionPrimitives';
import { tool } from '@openai/agents';
import { VerificationAPI } from '@/lib/api/verification';
import OpenAI from 'openai';

// OpenAI client for NPI verification analysis
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

// Interface for OpenAI decision response
interface NPIVerificationDecision {
  decision: 'completed' | 'in_progress' | 'failed' | 'requires_review';
  reasoning: string;
  confidence: number;
  issues_found?: string[];
  recommendations?: string[];
}

// Function to analyze NPI verification result using OpenAI
async function analyzeNPIVerificationResult(
  apiResult: any,
  practitionerData: any,
  providerContext?: any
): Promise<NPIVerificationDecision> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `You are a healthcare verification specialist analyzing NPI (National Provider Identifier) verification results. 

Your task is to analyze the API response and make a verification decision based on the data quality and match accuracy.

DECISION CRITERIA:
- "completed": NPI data matches practitioner information well, no significant discrepancies
- "in_progress": Some discrepancies found that need manual review or additional verification  
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
  "decision": "completed|in_progress|failed|requires_review",
  "reasoning": "Clear explanation of the decision",
  "issues_found": ["list of any issues"],
  "recommendations": ["list of recommendations if any"]
}

Be thorough but concise in your analysis. Focus on data accuracy and verification confidence.`;

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
      confidence: 0.0,
      issues_found: ['OpenAI analysis unavailable'],
      recommendations: ['Perform manual verification review']
    };
  }
}

// Define workflow schema for identity verification
const IdentityVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "identity_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    ssn: z.string().nullable().describe('Social Security Number'),
    dateOfBirth: z.string().nullable().describe('Date of birth'),
    address: z.string().nullable().describe('Address information')
  }).nullable().describe('Practitioner data to use for form filling')
});

// Identity verification workflow tool
export const identityVerificationWorkflowTool = tool({
  name: 'identity_verification_workflow',
  description: 'Execute the complete identity verification workflow: expand accordion, start verification if needed, and prepare for form filling. This is a deterministic workflow that handles the entire sequence.',
  parameters: IdentityVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: identity_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting identity verification workflow for ${stepId}`,
        type: 'action',
      });
      
      const prepareResult = await uiPrimitives.expandAndStartVerificationStep(stepId);
      if (!prepareResult.success) {
        return {
          success: false,
          message: prepareResult.message,
          step: prepareResult.step
        };
      }
      
      // Step 2: Complete the verification by setting status and saving
      store.addThought({
        message: `Completing identity verification for ${stepId}...`,
        type: 'action',
      });
      
      // Set status to completed
      const statusSuccess = await uiPrimitives.setVerificationStatus(stepId, 'completed');
      if (!statusSuccess) {
        return {
          success: false,
          message: `Failed to set status to completed for ${stepId}`,
          step: 'set_status'
        };
      }
      
      // Wait a moment before saving
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save the verification step
      const saveSuccess = await uiPrimitives.saveVerificationStep(stepId);
      if (!saveSuccess) {
        return {
          success: false,
          message: `Failed to save verification step ${stepId}`,
          step: 'save'
        };
      }
      
      // Step 3: Close the accordion after saving
      store.addThought({
        message: `Closing accordion for ${stepId}...`,
        type: 'action',
      });
      
      // Wait a moment before collapsing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const collapseSuccess = await uiPrimitives.collapseVerificationStep(stepId);
      if (!collapseSuccess) {
        return {
          success: false,
          message: `Failed to collapse accordion for ${stepId}`,
          step: 'collapse'
        };
      }
      
      // Step 4: Report workflow completion
      workflowMessage = `Identity verification workflow fully completed for ${stepId}. Status set to completed, saved, and accordion closed.`;
      
      store.addThought({
        message: workflowMessage,
        type: 'result',
      });
      
      // Final inspection to report current state
      const completionInspection = uiPrimitives.inspectVerificationStep(stepId);
      
      return {
        success: true,
        message: workflowMessage,
        step: 'completed',
        currentState: {
          status: completionInspection.currentStatus,
          availableActions: completionInspection.availableActions,
          availableFields: completionInspection.availableFields,
          hasStartButton: completionInspection.hasStartButton,
          hasSaveButton: completionInspection.hasSaveButton
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
      console.error('❌ Identity Verification Workflow Error:', error);
      
      store.addThought({
        message: `Workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `Identity verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
});

// Define workflow schema for NPI verification
const NPIVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "npi_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    npi: z.string().nullable().describe('NPI number (10 digits)'),
    organizationName: z.string().nullable().describe('Organization name if applicable'),
    city: z.string().nullable().describe('City'),
    state: z.string().nullable().describe('State (2-letter abbreviation)'),
    postalCode: z.string().nullable().describe('Postal/ZIP code')
  }).nullable().describe('Practitioner data to use for NPI verification'),
  providerContext: z.object({
    practitionerData: z.object({
      practitioner: z.object({
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        middle_name: z.string().nullable(),
        ssn: z.string().nullable(),
        date_of_birth: z.string().nullable(),
        home_address: z.object({
          line1: z.string().nullable(),
          line2: z.string().nullable(),
          city: z.string().nullable(),
          state: z.string().nullable(),
          zip_code: z.string().nullable()
        }).nullable(),
        mailing_address: z.object({
          line1: z.string().nullable(),
          line2: z.string().nullable(),
          city: z.string().nullable(),
          state: z.string().nullable(),
          zip_code: z.string().nullable()
        }).nullable()
      }).nullable(),
      applications: z.array(z.object({
        npi_number: z.string().nullable(),
        application_id: z.string().nullable()
      })).nullable()
    }).nullable(),
    currentPage: z.string().nullable(),
    userId: z.string().nullable(),
    isAuthenticated: z.boolean().nullable()
  }).nullable().describe('Additional provider context from the agent runner')
});

// NPI verification workflow tool
export const npiVerificationWorkflowTool = tool({
  name: 'npi_verification_workflow',
  description: 'Execute the complete NPI verification workflow: expand accordion, start verification, make API call to verify NPI, and prepare results. This workflow uses the NPI verification API.',
  parameters: NPIVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: npi_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting NPI verification workflow for ${stepId}`,
        type: 'action',
      });
      
      const prepareResult = await uiPrimitives.expandAndStartVerificationStep(stepId);
      if (!prepareResult.success) {
        return {
          success: false,
          message: prepareResult.message,
          step: prepareResult.step
        };
      }
      
      // Step 2: Perform NPI verification API call if practitioner data is provided
      let npiVerificationResult = null;
      
      if (params.practitionerData) {
        store.addThought({
          message: `Performing NPI verification API call...`,
          type: 'action',
        });
        
        try {
          // Prepare NPI search request
          const npiRequest: any = {};
          
          if (params.practitionerData.npi) {
            npiRequest.npi = params.practitionerData.npi;
          }
          if (params.practitionerData.firstName) {
            npiRequest.first_name = params.practitionerData.firstName;
          }
          if (params.practitionerData.lastName) {
            npiRequest.last_name = params.practitionerData.lastName;
          }
          if (params.practitionerData.organizationName) {
            npiRequest.organization_name = params.practitionerData.organizationName;
          }
          if (params.practitionerData.city) {
            npiRequest.city = params.practitionerData.city;
          }
          if (params.practitionerData.state) {
            npiRequest.state = params.practitionerData.state;
          }
          if (params.practitionerData.postalCode) {
            npiRequest.postal_code = params.practitionerData.postalCode;
          }
          
          // Make the API call
          npiVerificationResult = await VerificationAPI.searchNPI(npiRequest);
          
          store.addThought({
            message: `NPI verification API call completed successfully`,
            type: 'result',
          });
          
          console.log('✅ NPI Verification Result:', npiVerificationResult);
          
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
          console.error('❌ NPI Verification API Error:', apiError);
          
          store.addThought({
            message: `NPI verification API call failed: ${errorMessage}`,
            type: 'result',
          });
          
          // Continue workflow even if API fails - we can still complete the UI workflow
          npiVerificationResult = {
            status: 'error',
            message: `API call failed: ${errorMessage}`,
            data: null
          };
        }
      } else {
        store.addThought({
          message: `No practitioner data provided - skipping API call`,
          type: 'result',
        });
      }
      
      // Step 3: Analyze NPI verification result using OpenAI
      let verificationDecision: NPIVerificationDecision | null = null;
      
      if (npiVerificationResult) {
        store.addThought({
          message: `Analyzing NPI verification result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeNPIVerificationResult(
            npiVerificationResult,
            params.practitionerData,
            params.providerContext
          );
          
          store.addThought({
            message: `AI analysis completed. Decision: ${verificationDecision.decision} (confidence: ${Math.round(verificationDecision.confidence * 100)}%)`,
            type: 'result',
          });
          
          console.log('🤖 OpenAI Verification Decision:', verificationDecision);
          
        } catch (analysisError) {
          const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown analysis error';
          console.error('❌ OpenAI Analysis Error:', analysisError);
          
          store.addThought({
            message: `AI analysis failed: ${errorMessage}. Using fallback decision.`,
            type: 'result',
          });
          
          // Fallback decision
          verificationDecision = {
            decision: 'requires_review',
            reasoning: `AI analysis failed: ${errorMessage}. Manual review required.`,
            confidence: 0.0,
            issues_found: ['AI analysis unavailable'],
            recommendations: ['Perform manual verification review']
          };
        }
      } else {
        // No API result to analyze
        verificationDecision = {
          decision: 'requires_review',
          reasoning: 'No NPI verification data available for analysis. Manual review required.',
          confidence: 0.0,
          issues_found: ['No API data available'],
          recommendations: ['Perform manual NPI verification']
        };
      }
      
      // Step 4: Fill out reasoning notes based on AI decision
      store.addThought({
        message: `Filling out verification notes...`,
        type: 'action',
      });
      
      // Use only the reasoning field from the parsed OpenAI response
      const reasoningNotes = verificationDecision.reasoning;

      // Fill the reasoning notes field
      const notesSuccess = await uiPrimitives.fillInput({
        inputSelector: `[data-agent-field="reasoning-notes"][data-step-id="${stepId}"]`,
        text: reasoningNotes,
        description: 'verification reasoning notes',
        clearFirst: true
      });
      
      if (!notesSuccess) {
        store.addThought({
          message: `Warning: Could not fill reasoning notes field for ${stepId}`,
          type: 'result',
        });
      } else {
        store.addThought({
          message: `Successfully filled reasoning notes for ${stepId}`,
          type: 'result',
        });
      }
      
      // Step 5: Set verification status based on AI decision
      store.addThought({
        message: `Setting verification status to "${verificationDecision.decision}" for ${stepId}...`,
        type: 'action',
      });
      
      // Set status based on AI decision
      const statusSuccess = await uiPrimitives.setVerificationStatus(stepId, verificationDecision.decision);
      if (!statusSuccess) {
        return {
          success: false,
          message: `Failed to set status to ${verificationDecision.decision} for ${stepId}`,
          step: 'set_status'
        };
      }
      
      // Wait a moment before saving
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save the verification step
      const saveSuccess = await uiPrimitives.saveVerificationStep(stepId);
      if (!saveSuccess) {
        return {
          success: false,
          message: `Failed to save verification step ${stepId}`,
          step: 'save'
        };
      }
      
      // Step 6: Close the accordion after saving
      store.addThought({
        message: `Closing accordion for ${stepId}...`,
        type: 'action',
      });
      
      // Wait a moment before collapsing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const collapseSuccess = await uiPrimitives.collapseVerificationStep(stepId);
      if (!collapseSuccess) {
        return {
          success: false,
          message: `Failed to collapse accordion for ${stepId}`,
          step: 'collapse'
        };
      }
      
      // Step 7: Report workflow completion
      workflowMessage = `NPI verification workflow fully completed for ${stepId}. API call ${npiVerificationResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", notes filled, status set, saved, and accordion closed.`;
      
      store.addThought({
        message: workflowMessage,
        type: 'result',
      });
      
      // Final inspection to report current state
      const completionInspection = uiPrimitives.inspectVerificationStep(stepId);
      
      return {
        success: true,
        message: workflowMessage,
        step: 'completed',
        apiResult: npiVerificationResult,
        aiDecision: verificationDecision,
        currentState: {
          status: completionInspection.currentStatus,
          availableActions: completionInspection.availableActions,
          availableFields: completionInspection.availableFields,
          hasStartButton: completionInspection.hasStartButton,
          hasSaveButton: completionInspection.hasSaveButton
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
      console.error('❌ NPI Verification Workflow Error:', error);
      
      store.addThought({
        message: `NPI verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `NPI verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
});