import { z } from 'zod';
import { tool } from '@openai/agents';
import { useAgentStore } from '@/stores/agentStore';
import { VerificationAPI } from '@/lib/api/verification';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';
import { CALicenseVerificationDecision } from '@/lib/agent/workflows/shared/types';
import { analyzeCALicenseVerificationResult } from '@/lib/agent/workflows/shared/analysis';

// Define workflow schema for CA license verification
const CALicenseVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "ca_license_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    licenseNumber: z.string().nullable().describe('CA license number'),
    licenseState: z.string().nullable().describe('License state (should be CA)'),
    licenseType: z.string().nullable().describe('Type of license if known')
  }).nullable().describe('Practitioner data to use for CA license verification'),
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


// CA license verification workflow tool
export const caLicenseVerificationWorkflowTool = tool({
  name: 'ca_license_verification_workflow',
  description: 'Execute the complete CA license verification workflow: expand accordion, start verification, make API call to verify CA license via DCA, and prepare results. This workflow uses the DCA verification API.',
  parameters: CALicenseVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: ca_license_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting CA license verification workflow for ${stepId}`,
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
      
      // Step 2: Perform CA license verification API call if practitioner data is provided
      let caLicenseVerificationResult = null;
      
      if (params.practitionerData) {
        store.addThought({
          message: `Performing CA license verification API call...`,
          type: 'action',
        });
        
        try {
          // Prepare DCA request
          const dcaRequest: any = {};
          
          if (params.practitionerData.firstName) {
            dcaRequest.first_name = params.practitionerData.firstName;
          }
          if (params.practitionerData.lastName) {
            dcaRequest.last_name = params.practitionerData.lastName;
          }
          if (params.practitionerData.licenseNumber) {
            dcaRequest.license_number = params.practitionerData.licenseNumber;
          }
          
          // Make the API call
          caLicenseVerificationResult = await VerificationAPI.verifyDCALicense(dcaRequest);
          
          store.addThought({
            message: `CA license verification API call completed successfully`,
            type: 'result',
          });
          
          console.log('✅ CA License Verification Result:', caLicenseVerificationResult);
          
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
          console.error('❌ CA License Verification API Error:', apiError);
          
          store.addThought({
            message: `CA license verification API call failed: ${errorMessage}`,
            type: 'result',
          });
          
          // Continue workflow even if API fails - we can still complete the UI workflow
          caLicenseVerificationResult = {
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
      
      // Step 3: Analyze CA license verification result using OpenAI
      let verificationDecision: CALicenseVerificationDecision | null = null;
      
      if (caLicenseVerificationResult) {
        store.addThought({
          message: `Analyzing CA license verification result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeCALicenseVerificationResult(
            caLicenseVerificationResult,
            params.practitionerData,
            params.providerContext
          );
          
          store.addThought({
            message: `AI analysis completed. Decision: ${verificationDecision.decision}`,
            type: 'result',
          });
          
          console.log('🤖 OpenAI CA License Verification Decision:', verificationDecision);
          
        } catch (analysisError) {
          const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown analysis error';
          console.error('❌ OpenAI CA License Analysis Error:', analysisError);
          
          store.addThought({
            message: `AI analysis failed: ${errorMessage}. Using fallback decision.`,
            type: 'result',
          });
          
          // Fallback decision
          verificationDecision = {
            decision: 'requires_review',
            reasoning: `AI analysis failed: ${errorMessage}. Manual review required.`,
            issues_found: ['AI analysis unavailable'],
            recommendations: ['Perform manual license verification review']
          };
        }
      } else {
        // No API result to analyze
        verificationDecision = {
          decision: 'requires_review',
          reasoning: 'No CA license verification data available for analysis. Manual review required.',
          issues_found: ['No API data available'],
          recommendations: ['Perform manual CA license verification']
        };
      }
      
      // Step 4: Fill out reasoning notes based on AI decision
      store.addThought({
        message: `Filling out verification notes...`,
        type: 'action',
      });
      
      // Use only the reasoning field from the parsed OpenAI response
      const reasoningNotes = verificationDecision?.reasoning || 'No reasoning available';

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
      
      // Step 5: Add license to the license form if available from AI analysis
      

      
      if (verificationDecision.license_details && 
          verificationDecision.license_details.number && 
          verificationDecision.license_details.issued_date && 
          verificationDecision.license_details.expiration_date) {
        
        store.addThought({
          message: `Adding verified license to license form...`,
          type: 'action',
        });
        
        const licenseDetails = verificationDecision.license_details;
        
        // Use the new addLicenseToForm method to handle the complete license form workflow
        const addLicenseSuccess = await uiPrimitives.addLicenseToForm({
          stepId: stepId,
          licenseData: {
            number: licenseDetails.number!,
            state: licenseDetails.state || 'CA',
            issued: licenseDetails.issued_date!,
            expiration: licenseDetails.expiration_date!,
            status: licenseDetails.status || undefined
          },
          description: 'CA license verification'
        });
        
        if (addLicenseSuccess) {
          store.addThought({
            message: `Successfully added license ${licenseDetails.number} to the form for ${stepId}`,
            type: 'result',
          });
          
          // Wait additional time for the license form to be fully processed and UI to update
          store.addThought({
            message: `Waiting for license form to be fully processed...`,
            type: 'action',
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } else {
          store.addThought({
            message: `Warning: Could not add license to form for ${stepId}`,
            type: 'result',
          });
          
          // If license addition failed, we should still continue but with a warning
          store.addThought({
            message: `Continuing workflow despite license form issue...`,
            type: 'action',
          });
        }
      } else {
        store.addThought({
          message: `Insufficient license details from verification - skipping license form addition. Missing: ${!verificationDecision.license_details ? 'license_details object' : !verificationDecision.license_details.number ? 'license number' : !verificationDecision.license_details.issued_date ? 'issued_date' : !verificationDecision.license_details.expiration_date ? 'expiration_date' : 'unknown'}`,
          type: 'result',
        });
      }
      
      // Step 6: Set verification status based on AI decision
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
      
      // Step 7: Close the accordion after saving
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
      
      // Step 8: Report workflow completion
      workflowMessage = `CA license verification workflow fully completed for ${stepId}. API call ${caLicenseVerificationResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", reasoning notes filled, license added to form, status set, saved, and accordion closed.`;
      
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
        apiResult: caLicenseVerificationResult,
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
      console.error('❌ CA License Verification Workflow Error:', error);
      
      store.addThought({
        message: `CA license verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `CA license verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
});