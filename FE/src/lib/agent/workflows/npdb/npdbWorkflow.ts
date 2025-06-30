import { z } from 'zod';
import { tool } from '@openai/agents';
import { VerificationAPI } from '@/lib/api/verification';
import { analyzeNPDBVerificationResult } from '../shared/analysis';
import { NPDBVerificationDecision } from '../shared/types';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';

// Define workflow schema for NPDB verification
const NPDBVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "npdb_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    dateOfBirth: z.string().nullable().describe('Date of birth (YYYY-MM-DD format)'),
    ssnLast4: z.string().nullable().describe('Last 4 digits of SSN'),
    npi: z.string().nullable().describe('NPI number (10 digits)'),
    licenseNumber: z.string().nullable().describe('License number'),
    licenseState: z.string().nullable().describe('State of license (2-letter abbreviation)'),
    address: z.object({
      line1: z.string().nullable(),
      line2: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      zip: z.string().nullable()
    }).nullable().describe('Address information'),
    upin: z.string().nullable().describe('UPIN number if available'),
    deaNumber: z.string().nullable().describe('DEA number if available'),
    organizationName: z.string().nullable().describe('Organization name if available')
  }).nullable().describe('Practitioner data to use for NPDB verification'),
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

// NPDB verification workflow tool
export const npdbVerificationWorkflowTool = tool({
  name: 'npdb_verification_workflow',
  description: 'Execute the complete NPDB verification workflow: expand accordion, start verification, make API call to verify NPDB, analyze results, add any incidents found to the incident form, and prepare results. This workflow uses the NPDB verification API.',
  parameters: NPDBVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: npdb_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting NPDB verification workflow for ${stepId}`,
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
      
      // Step 2: Perform NPDB verification API call if practitioner data is provided
      let npdbVerificationResult = null;
      
      if (params.practitionerData) {
        store.addThought({
          message: `Performing NPDB verification API call...`,
          type: 'action',
        });
        
        try {
          // Prepare NPDB request
          const npdbRequest: any = {};
          
          if (params.practitionerData.firstName) {
            npdbRequest.first_name = params.practitionerData.firstName;
          }
          if (params.practitionerData.lastName) {
            npdbRequest.last_name = params.practitionerData.lastName;
          }
          if (params.practitionerData.dateOfBirth) {
            npdbRequest.date_of_birth = params.practitionerData.dateOfBirth;
          }
          if (params.practitionerData.ssnLast4) {
            npdbRequest.ssn_last4 = params.practitionerData.ssnLast4;
          }
          if (params.practitionerData.npi) {
            npdbRequest.npi_number = params.practitionerData.npi;
          }
          if (params.practitionerData.licenseNumber) {
            npdbRequest.license_number = params.practitionerData.licenseNumber;
          }
          if (params.practitionerData.licenseState) {
            npdbRequest.state_of_license = params.practitionerData.licenseState;
          }
          if (params.practitionerData.upin) {
            npdbRequest.upin = params.practitionerData.upin;
          }
          if (params.practitionerData.deaNumber) {
            npdbRequest.dea_number = params.practitionerData.deaNumber;
          }
          if (params.practitionerData.organizationName) {
            npdbRequest.organization_name = params.practitionerData.organizationName;
          }
          
          // Handle address
          if (params.practitionerData.address) {
            npdbRequest.address = {
              line1: params.practitionerData.address.line1 || '',
              line2: params.practitionerData.address.line2 || '',
              city: params.practitionerData.address.city || '',
              state: params.practitionerData.address.state || '',
              zip: params.practitionerData.address.zip || ''
            };
          }
          
          // Make the API call
          npdbVerificationResult = await VerificationAPI.verifyNPDB(npdbRequest);
          
          store.addThought({
            message: `NPDB verification API call completed successfully`,
            type: 'result',
          });
          
          console.log('✅ NPDB Verification Result:', npdbVerificationResult);
          
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
          console.error('❌ NPDB Verification API Error:', apiError);
          
          store.addThought({
            message: `NPDB verification API call failed: ${errorMessage}`,
            type: 'result',
          });
          
          // Continue workflow even if API fails - we can still complete the UI workflow
          npdbVerificationResult = {
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
      
      // Step 3: Analyze NPDB verification result using OpenAI
      let verificationDecision: NPDBVerificationDecision | null = null;
      
      if (npdbVerificationResult) {
        store.addThought({
          message: `Analyzing NPDB verification result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeNPDBVerificationResult(
            npdbVerificationResult,
            params.practitionerData,
            params.providerContext
          );
          
          store.addThought({
            message: `AI analysis completed. Decision: ${verificationDecision.decision}`,
            type: 'result',
          });
          
          console.log('🤖 OpenAI NPDB Verification Decision:', verificationDecision);
          
        } catch (analysisError) {
          const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown analysis error';
          console.error('❌ OpenAI NPDB Analysis Error:', analysisError);
          
          store.addThought({
            message: `AI analysis failed: ${errorMessage}. Using fallback decision.`,
            type: 'result',
          });
          
          // Fallback decision
          verificationDecision = {
            decision: 'requires_review',
            reasoning: `AI analysis failed: ${errorMessage}. Manual review required.`,
            incidents_found: [],
            summary: 'NPDB analysis could not be completed due to AI analysis failure.',
            issues_found: ['AI analysis unavailable'],
            recommendations: ['Perform manual NPDB verification review']
          };
        }
      } else {
        // No API result to analyze
        verificationDecision = {
          decision: 'requires_review',
          reasoning: 'No NPDB verification data available for analysis. Manual review required.',
          incidents_found: [],
          summary: 'No NPDB data available for analysis.',
          issues_found: ['No API data available'],
          recommendations: ['Perform manual NPDB verification']
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
      
      // Step 5: Add incidents to the incident form if found in AI analysis
      if (verificationDecision.incidents_found && verificationDecision.incidents_found.length > 0) {
        store.addThought({
          message: `Found ${verificationDecision.incidents_found.length} incidents from NPDB analysis. Adding to incident form...`,
          type: 'action',
        });
        
        for (const incident of verificationDecision.incidents_found) {
          try {
            const addIncidentSuccess = await uiPrimitives.addIncidentToForm({
              stepId: stepId,
              incidentData: {
                incidentType: incident.incident_type,
                date: incident.date || new Date().toISOString().split('T')[0], // Use current date if no date provided
                details: incident.details
              },
              description: 'NPDB incident'
            });
            
            if (addIncidentSuccess) {
              store.addThought({
                message: `Successfully added incident: ${incident.incident_type}`,
                type: 'result',
              });
            } else {
              store.addThought({
                message: `Warning: Could not add incident: ${incident.incident_type}`,
                type: 'result',
              });
            }
            
            // Wait between incident additions
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (incidentError) {
            const errorMessage = incidentError instanceof Error ? incidentError.message : 'Unknown incident error';
            store.addThought({
              message: `Failed to add incident ${incident.incident_type}: ${errorMessage}`,
              type: 'result',
            });
          }
        }
        
        // Wait additional time for all incidents to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        store.addThought({
          message: `No incidents found in NPDB analysis - skipping incident form addition`,
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
      const incidentCount = verificationDecision.incidents_found?.length || 0;
      workflowMessage = `NPDB verification workflow fully completed for ${stepId}. API call ${npdbVerificationResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", ${incidentCount} incidents added to form, reasoning notes filled, status set, saved, and accordion closed.`;
      
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
        apiResult: npdbVerificationResult,
        aiDecision: verificationDecision,
        incidentsAdded: incidentCount,
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
      console.error('❌ NPDB Verification Workflow Error:', error);
      
      store.addThought({
        message: `NPDB verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `NPDB verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
}); 