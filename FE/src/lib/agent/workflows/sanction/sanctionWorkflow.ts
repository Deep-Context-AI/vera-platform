import { z } from 'zod';
import { tool } from '@openai/agents';
import { VerificationAPI } from '@/lib/api/verification';
import { analyzeSanctionCheckVerificationResult } from '../shared/analysis';
import { SanctionCheckVerificationDecision } from '../shared/types';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';

// Define workflow schema for Sanction Check verification
const SanctionCheckVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "sanction_check")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    dateOfBirth: z.string().nullable().describe('Date of birth in YYYY-MM-DD format'),
    npi: z.string().nullable().describe('National Provider Identifier'),
    licenseNumber: z.string().nullable().describe('Professional license number'),
    licenseState: z.string().nullable().describe('State where license was issued'),
    ssnLast4: z.string().nullable().describe('Last 4 digits of SSN'),
    city: z.string().nullable().describe('City'),
    state: z.string().nullable().describe('State'),
    zip: z.string().nullable().describe('ZIP code')
  }).describe('Practitioner information for sanction check verification'),
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
        license_numbers: z.array(z.string()).nullable(),
        application_id: z.string().nullable()
      })).nullable()
    }).nullable(),
    currentPage: z.string().nullable(),
    userId: z.string().nullable(),
    isAuthenticated: z.boolean().nullable()
  }).nullable().describe('Additional provider context from the agent runner')
});

// Create the sanction check verification workflow tool
export const sanctionCheckVerificationWorkflowTool = tool({
  name: 'sanction_check_verification_workflow',
  description: `Execute comprehensive sanction check verification workflow including OIG and GSA exclusion list checks.
  
  This workflow:
  1. Expands the verification step accordion and starts verification
  2. Makes API call to comprehensive sanctions check endpoint
  3. Uses AI to analyze results and identify any sanctions
  4. If sanctions are found, automatically adds them to the incidents form
  5. Fills reasoning notes, sets status, saves, and closes accordion
  
  Use this for stepId "sanction_check" verification steps.`,
  parameters: SanctionCheckVerificationWorkflowSchema,
  execute: async ({ stepId, practitionerData, providerContext }) => {
    console.log('🔧 Agent Tool: sanction_check_verification_workflow', { stepId, practitionerData, providerContext });
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting sanction check verification workflow for ${stepId}`,
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

      // Step 2: Validate required data
      if (!practitionerData?.firstName || !practitionerData?.lastName) {
        store.addThought({
          message: 'Missing required practitioner name information',
          type: 'result',
        });
        
        return {
          success: false,
          stepId,
          error: 'Missing required practitioner name information',
          decision: 'failed',
          reasoning: 'Cannot perform sanction check without practitioner name'
        };
      }

      if (!practitionerData.dateOfBirth || !practitionerData.npi || !practitionerData.licenseNumber || 
          !practitionerData.licenseState || !practitionerData.ssnLast4) {
        store.addThought({
          message: 'Missing required data for comprehensive sanction check (date of birth, NPI, license number, license state, or SSN last 4)',
          type: 'result',
        });
        
        return {
          success: false,
          stepId,
          error: 'Missing required data for comprehensive sanction check',
          decision: 'failed',
          reasoning: 'Comprehensive sanction check requires complete practitioner information'
        };
      }

      // Step 3: Perform sanctions check API call
      let sanctionCheckResult = null;
      
      store.addThought({
        message: `Performing comprehensive sanctions check API call for ${practitionerData.fullName || `${practitionerData.firstName} ${practitionerData.lastName}`}...`,
        type: 'action',
      });

      try {
        sanctionCheckResult = await VerificationAPI.comprehensiveSanctionsCheck({
          first_name: practitionerData.firstName,
          last_name: practitionerData.lastName,
          date_of_birth: practitionerData.dateOfBirth,
          npi: practitionerData.npi,
          license_number: practitionerData.licenseNumber,
          license_state: practitionerData.licenseState,
          ssn_last4: practitionerData.ssnLast4
        });

        store.addThought({
          message: `Sanctions check API call completed successfully`,
          type: 'result',
        });
        
        console.log('✅ Sanctions Check Result:', sanctionCheckResult);

      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
        console.error('❌ Sanctions Check API Error:', apiError);
        
        store.addThought({
          message: `Sanctions check API call failed: ${errorMessage}`,
          type: 'result',
        });
        
        // Continue workflow even if API fails - we can still complete the UI workflow
        sanctionCheckResult = {
          status: 'error',
          message: `API call failed: ${errorMessage}`,
          data: null
        };
      }

      // Step 4: Analyze sanctions check result using AI
      let verificationDecision: SanctionCheckVerificationDecision | null = null;
      
      if (sanctionCheckResult) {
        store.addThought({
          message: `Analyzing sanctions check result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeSanctionCheckVerificationResult(
            sanctionCheckResult,
            practitionerData,
            providerContext
          );
          
          store.addThought({
            message: `AI analysis completed. Decision: ${verificationDecision.decision}`,
            type: 'result',
          });
          
          console.log('🤖 AI Sanctions Verification Decision:', verificationDecision);
          
        } catch (analysisError) {
          const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown analysis error';
          console.error('❌ AI Sanctions Analysis Error:', analysisError);
          
          store.addThought({
            message: `AI analysis failed: ${errorMessage}. Using fallback decision.`,
            type: 'result',
          });
          
          // Fallback decision
          verificationDecision = {
            decision: 'requires_review',
            reasoning: `AI analysis failed: ${errorMessage}. Manual review required.`,
            sanctions_found: [],
            summary: 'Sanctions analysis could not be completed due to AI analysis failure.',
            issues_found: ['AI analysis unavailable'],
            recommendations: ['Perform manual sanctions verification review']
          };
        }
      } else {
        // No API result to analyze
        verificationDecision = {
          decision: 'requires_review',
          reasoning: 'No sanctions verification data available for analysis. Manual review required.',
          sanctions_found: [],
          summary: 'No sanctions data available for analysis.',
          issues_found: ['No API data available'],
          recommendations: ['Perform manual sanctions verification']
        };
      }

      // Step 5: Fill out reasoning notes based on AI decision
      store.addThought({
        message: `Filling out verification notes...`,
        type: 'action',
      });
      
      const reasoningNotes = verificationDecision?.reasoning || 'No reasoning available';

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

      // Step 6: Add sanctions to the incident form if found in AI analysis
      if (verificationDecision.sanctions_found && verificationDecision.sanctions_found.length > 0) {
        store.addThought({
          message: `Found ${verificationDecision.sanctions_found.length} sanction(s) from AI analysis. Adding to incident form...`,
          type: 'action',
        });
        
        for (const sanction of verificationDecision.sanctions_found) {
          try {
            const addIncidentSuccess = await uiPrimitives.addIncidentToForm({
              stepId: stepId,
              incidentData: {
                incidentType: sanction.sanction_type || 'Sanctions',
                date: sanction.date || new Date().toISOString().split('T')[0],
                details: `${sanction.details || 'Sanction found during verification'}${sanction.source ? ` (Source: ${sanction.source})` : ''}`
              },
              description: 'sanctions incident'
            });
            
            if (addIncidentSuccess) {
              store.addThought({
                message: `Successfully added sanction: ${sanction.sanction_type || 'Unknown'}`,
                type: 'result',
              });
            } else {
              store.addThought({
                message: `Warning: Could not add sanction: ${sanction.sanction_type || 'Unknown'}`,
                type: 'result',
              });
            }
            
            // Wait between incident additions
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (incidentError) {
            const errorMessage = incidentError instanceof Error ? incidentError.message : 'Unknown incident error';
            store.addThought({
              message: `Failed to add sanction ${sanction.sanction_type || 'Unknown'}: ${errorMessage}`,
              type: 'result',
            });
          }
        }
        
        // Wait additional time for all incidents to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        store.addThought({
          message: `No sanctions found in AI analysis - skipping incident form addition`,
          type: 'result',
        });
      }

      // Step 7: Set verification status based on AI decision
      store.addThought({
        message: `Setting verification status to "${verificationDecision.decision}" for ${stepId}...`,
        type: 'action',
      });
      
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

      // Step 8: Close the accordion after saving
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

      // Step 9: Report workflow completion
      const sanctionCount = verificationDecision.sanctions_found?.length || 0;
      workflowMessage = `Sanction check verification workflow fully completed for ${stepId}. API call ${sanctionCheckResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", ${sanctionCount} sanctions added to form, reasoning notes filled, status set, saved, and accordion closed.`;
      
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
        apiResult: sanctionCheckResult,
        aiDecision: verificationDecision,
        sanctionsAdded: sanctionCount,
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
      console.error('❌ Sanction Check Verification Workflow Error:', error);
      
      store.addThought({
        message: `Sanction check verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `Sanction check verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
}); 