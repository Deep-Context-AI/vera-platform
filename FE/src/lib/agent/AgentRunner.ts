import { Agent, run, setDefaultOpenAIClient } from '@openai/agents';
import { useAgentStore } from '@/stores/agentStore';
import OpenAI from 'openai';
import { 
  npiVerificationWorkflowTool, 
  caLicenseVerificationWorkflowTool,
  abmsVerificationWorkflowTool,
  deaVerificationWorkflowTool,
  medicareVerificationWorkflowTool,
  medicalVerificationWorkflowTool,
  npdbVerificationWorkflowTool,
  sanctionCheckVerificationWorkflowTool
} from './workflows';


// Context interface for our agent
interface VeraAgentContext {
  currentPage: string;
  userId?: string;
  isAuthenticated: boolean;
  store: ReturnType<typeof useAgentStore.getState>;
  practitionerData?: any;
}

export class AgentRunner {
  private agent: Agent<VeraAgentContext>;
  private static instance: AgentRunner;
  private isLoopRunning: boolean = false;

  private constructor() {
    console.log('🚀 Agent Runner: Initializing singleton instance');
    
    // Configure OpenAI client for browser environment
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      const openaiClient = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for browser environments
      });
      
      // Set the client for the Agents SDK to use
      setDefaultOpenAIClient(openaiClient);
      console.log('🔧 OpenAI Client: Configured for browser environment with dangerouslyAllowBrowser: true');
    } else {
      console.warn('OpenAI API key not found. Agent functionality may be limited.');
    }

    // Initialize the agent with the verification workflow tools
    this.agent = new Agent<VeraAgentContext>({
      name: 'Vera Healthcare Verification Assistant',
      instructions: `You are an AI assistant specialized in executing healthcare verification workflows. You have access to these deterministic workflow tools:

Available Tools:
1. npi_verification_workflow - Handles NPI verification with API integration
2. ca_license_verification_workflow - Handles CA license verification with DCA API integration
3. abms_verification_workflow - Handles ABMS certification verification with API integration
4. dea_verification_workflow - Handles DEA registration verification with API integration
5. medicare_verification_workflow - Handles Medicare enrollment verification with API integration
6. medical_verification_workflow - Handles Medi-Cal enrollment verification with API integration
7. npdb_verification_workflow - Handles NPDB verification with API integration and incident extraction
8. sanction_check_verification_workflow - Handles comprehensive sanction check verification including OIG and GSA exclusion lists with incident extraction

WORKFLOW STRATEGY:
Each workflow tool handles the entire sequence automatically:
1. INSPECT: Check current state of the verification step
2. EXPAND: Open accordion if collapsed
3. START: Begin verification if not already started
4. PROCESS: Execute verification logic (API calls for NPI/DCA/NPDB)
5. COMPLETE: Finalize the verification step

STEP IDs:
- For NPI verification: use stepId="npi_verification"
- For CA license verification: use stepId="ca_license_verification"
- For ABMS verification: use stepId="abms_verification"
- For DEA verification: use stepId="dea_verification"
- For Medicare verification: use stepId="medicare_verification"
- For Medi-Cal verification: use stepId="medical_verification"
- For NPDB verification: use stepId="npdb_verification"
- For Sanction Check verification: use stepId="sanction_check"

EXECUTION APPROACH:
- If asked to execute NPI verification, call npi_verification_workflow with stepId="npi_verification"
- If asked to execute CA license verification, call ca_license_verification_workflow with stepId="ca_license_verification"
- If asked to execute ABMS verification, call abms_verification_workflow with stepId="abms_verification"
- If asked to execute DEA verification, call dea_verification_workflow with stepId="dea_verification"
- If asked to execute Medicare verification, call medicare_verification_workflow with stepId="medicare_verification"
- If asked to execute Medi-Cal verification, call medical_verification_workflow with stepId="medical_verification"
- If asked to execute NPDB verification, call npdb_verification_workflow with stepId="npdb_verification"
- If asked to execute Sanction Check verification, call sanction_check_verification_workflow with stepId="sanction_check"
- If asked to execute "all verifications", call all nine workflows in sequence
- Each workflow is self-contained and handles all UI interactions and business logic automatically

PRACTITIONER DATA HANDLING:
- When practitioner data is provided in the task description, extract it and pass it to the workflow tools
- Look for practitioner information in the task text including: name, NPI, date of birth, address, organization, city, state, postal code, license numbers
- Format the data as a practitionerData object with appropriate fields:
  - For NPI verification: firstName, lastName, fullName, npi, organizationName, city, state, postalCode
  - For CA license verification: firstName, lastName, fullName, licenseNumber, licenseState, licenseType
  - For ABMS verification: firstName, lastName, middleName, fullName, npi, state, activeLicenseNumber, specialty
  - For DEA verification: firstName, lastName, fullName, deaNumber
  - For Medicare verification: firstName, lastName, fullName, npi, specialty
  - For Medi-Cal verification: firstName, lastName, fullName, npi, licenseType, taxonomyCode, providerType, city, state, zip
  - For NPDB verification: firstName, lastName, fullName, dateOfBirth, ssnLast4, npi, licenseNumber, licenseState, address, upin, deaNumber, organizationName
  - For Sanction Check verification: firstName, lastName, fullName, dateOfBirth, ssnLast4, npi, licenseNumber, licenseState, city, state, zip
- Always pass the practitionerData parameter to workflow tools when available
- If no practitioner data is provided, pass null for the practitionerData parameter

PROVIDER CONTEXT HANDLING:
- For NPI verification workflow, also extract and pass the PROVIDER CONTEXT section from the task
- For CA license verification workflow, also extract and pass the PROVIDER CONTEXT section from the task
- For NPDB verification workflow, also extract and pass the PROVIDER CONTEXT section from the task
- For Sanction Check verification workflow, also extract and pass the PROVIDER CONTEXT section from the task
- This context contains additional information about the provider that will be used for AI analysis
- Pass this as the providerContext parameter to these workflow tools
- The AI will use this context along with the API response to make verification decisions

DATA EXTRACTION RULES:
- Extract practitioner data from task instructions that contain "Use the following practitioner data"
- Parse each field (Name, First Name, Last Name, NPI, etc.) from the task text
- Convert field names to camelCase for the API (e.g., "First Name" -> "firstName")
- Handle null/undefined values gracefully

You must verbalize your actions in a succinct single sentence before every tool call.

If you run into an error, you must verbalize the error first before trying to fix it.
`,
      model: 'gpt-4.1',
      tools: [
        npiVerificationWorkflowTool,
        caLicenseVerificationWorkflowTool,
        abmsVerificationWorkflowTool,
        deaVerificationWorkflowTool,
        medicareVerificationWorkflowTool,
        medicalVerificationWorkflowTool,
        npdbVerificationWorkflowTool,
        sanctionCheckVerificationWorkflowTool
      ],
      modelSettings: {
        temperature: 0.1,
        maxTokens: 1000
      }
    });
  }

  static getInstance(): AgentRunner {
    if (!AgentRunner.instance) {
      AgentRunner.instance = new AgentRunner();
    }
    return AgentRunner.instance;
  }

  /**
   * Execute all verification workflows in sequence
   */
  async executeAllVerifications(context?: Partial<VeraAgentContext>): Promise<string> {
    const store = useAgentStore.getState();
    console.log('🚀 Agent Runner: Starting complete verification workflow execution');
    
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Build context
    const agentContext: VeraAgentContext = {
      currentPage: 'provider-verification',
      isAuthenticated: true,
      store,
      ...context
    };

    try {
      console.log('🧠 Agent Runner: Starting complete verification workflow');
      
      // Set the current task for tracking completion
      const taskName = 'Complete Verification Workflow';
      store.setCurrentTask(taskName);
      
      store.addThought({
        message: 'Starting complete verification workflow execution',
        type: 'action'
      });

      // Extract and organize practitioner data from context if available
      let npiData = null;
      let caLicenseData = null;
      let abmsData = null;
      let deaData = null;
      let medicareData = null;
      let medicalData = null;
      let npdbData = null;
      let sanctionData = null;
      
      if (context?.practitionerData) {
        const practitioner = context.practitionerData.practitioner;
        const applications = context.practitionerData.applications;
        
        if (practitioner) {
          // Extract common data
          const firstName = practitioner.first_name || null;
          const lastName = practitioner.last_name || null;
          const fullName = `${practitioner.first_name || ''} ${practitioner.middle_name || ''} ${practitioner.last_name || ''}`.trim() || null;
          
          // Extract NPI from applications if available
          const npiNumber = applications?.find((app: any) => app.npi_number)?.npi_number || null;
          
          // Extract CA license number from applications if available
          const caLicenseNumber = applications?.find((app: any) => app.license_number)?.license_number || null;
          
          // Extract DEA number from applications if available
          const deaNumber = applications?.find((app: any) => app.dea_number)?.dea_number || null;
          
          // Extract address information - handle both home_address and mailing_address
          let addressString = null;
          let city = null;
          let state = null;
          let postalCode = null;
          let addressObject = null;
          
          if (practitioner.home_address && typeof practitioner.home_address === 'object') {
            const addr = practitioner.home_address;
            addressString = `${addr.line1 || ''} ${addr.line2 || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip_code || ''}`.trim();
            city = addr.city || null;
            state = addr.state || null;
            postalCode = addr.zip_code || addr.postal_code || null;
            addressObject = {
              line1: addr.line1 || null,
              line2: addr.line2 || null,
              city: addr.city || null,
              state: addr.state || null,
              zip: addr.zip_code || addr.postal_code || null
            };
          } else if (practitioner.mailing_address && typeof practitioner.mailing_address === 'object') {
            const addr = practitioner.mailing_address;
            addressString = `${addr.line1 || ''} ${addr.line2 || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip_code || ''}`.trim();
            city = addr.city || null;
            state = addr.state || null;
            postalCode = addr.zip_code || addr.postal_code || null;
            addressObject = {
              line1: addr.line1 || null,
              line2: addr.line2 || null,
              city: addr.city || null,
              state: addr.state || null,
              zip: addr.zip_code || addr.postal_code || null
            };
          }
          
          // Extract SSN last 4 digits
          let ssnLast4 = null;
          if (practitioner.ssn && typeof practitioner.ssn === 'string') {
            // Remove any formatting and get last 4 digits
            const cleanSSN = practitioner.ssn.replace(/\D/g, '');
            if (cleanSSN.length >= 4) {
              ssnLast4 = cleanSSN.slice(-4);
            }
          }
          
          // Validate and normalize state to 2-letter abbreviation
          if (state && typeof state === 'string') {
            // If state is longer than 2 characters, try to convert common state names to abbreviations
            if (state.length > 2) {
              const stateAbbreviations: Record<string, string> = {
                'california': 'CA', 'texas': 'TX', 'florida': 'FL', 'new york': 'NY',
                'pennsylvania': 'PA', 'illinois': 'IL', 'ohio': 'OH', 'georgia': 'GA',
                'north carolina': 'NC', 'michigan': 'MI', 'new jersey': 'NJ', 'virginia': 'VA',
                'washington': 'WA', 'arizona': 'AZ', 'massachusetts': 'MA', 'tennessee': 'TN',
                'indiana': 'IN', 'missouri': 'MO', 'maryland': 'MD', 'wisconsin': 'WI',
                'colorado': 'CO', 'minnesota': 'MN', 'south carolina': 'SC', 'alabama': 'AL',
                'louisiana': 'LA', 'kentucky': 'KY', 'oregon': 'OR', 'oklahoma': 'OK',
                'connecticut': 'CT', 'utah': 'UT', 'iowa': 'IA', 'nevada': 'NV',
                'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS', 'new mexico': 'NM',
                'nebraska': 'NE', 'west virginia': 'WV', 'idaho': 'ID', 'hawaii': 'HI',
                'new hampshire': 'NH', 'maine': 'ME', 'montana': 'MT', 'rhode island': 'RI',
                'delaware': 'DE', 'south dakota': 'SD', 'north dakota': 'ND', 'alaska': 'AK',
                'vermont': 'VT', 'wyoming': 'WY'
              };
              
              const normalizedState = state.toLowerCase().trim();
              state = stateAbbreviations[normalizedState] || null;
            } else {
              // Ensure it's uppercase if it's already 2 characters
              state = state.toUpperCase();
            }
            
            // Final validation - must be exactly 2 letters
            if (!state || state.length !== 2 || !/^[A-Z]{2}$/.test(state)) {
              console.warn(`Invalid state format: ${state}, setting to null`);
              state = null;
            }
          } else {
            state = null;
          }
          
          // Create workflow-specific data objects
          
          // NPI verification data
          if (npiNumber) {
            npiData = {
              firstName,
              lastName,
              fullName,
              npi: npiNumber,
              organizationName: null, // This might need to be extracted from another source
              city,
              state,
              postalCode
            };
          }
          
          // CA License verification data
          if (caLicenseNumber) {
            caLicenseData = {
              firstName,
              lastName,
              fullName,
              licenseNumber: caLicenseNumber,
              licenseState: 'CA', // Assuming CA license for DCA verification
              licenseType: null // Could be extracted from application type if available
            };
          }
          
          // ABMS verification data
          if (npiNumber && state) {
            abmsData = {
              firstName,
              lastName,
              middleName: practitioner.middle_name || null,
              fullName,
              npi: npiNumber,
              state,
              activeLicenseNumber: caLicenseNumber || null, // Use CA license if available
              specialty: null // Could be extracted from application data if available
            };
          }
          
          // DEA verification data
          if (deaNumber) {
            deaData = {
              firstName,
              lastName,
              fullName,
              deaNumber
            };
          }
          
          // Medicare verification data
          if (npiNumber) {
            medicareData = {
              firstName,
              lastName,
              fullName,
              npi: npiNumber,
              specialty: null // Could be extracted from application data if available
            };
          }
          
          // Medi-Cal verification data
          if (npiNumber) {
            medicalData = {
              firstName,
              lastName,
              fullName,
              npi: npiNumber,
              licenseType: null, // Could be extracted from application data if available
              taxonomyCode: null, // Could be extracted from application data if available
              providerType: null, // Could be extracted from application data if available
              city,
              state,
              zip: postalCode
            };
          }
          
          // NPDB verification data
          if (firstName && lastName && practitioner.date_of_birth && ssnLast4 && npiNumber && caLicenseNumber && state && addressObject) {
            npdbData = {
              firstName,
              lastName,
              fullName,
              dateOfBirth: practitioner.date_of_birth,
              ssnLast4,
              npi: npiNumber,
              licenseNumber: caLicenseNumber,
              licenseState: state,
              address: addressObject,
              upin: null, // Could be extracted from application data if available
              deaNumber: deaNumber || null,
              organizationName: null // Could be extracted from application data if available
            };
          }

          // Sanction Check verification data
          if (firstName && lastName && practitioner.date_of_birth && ssnLast4 && npiNumber && caLicenseNumber && state) {
            sanctionData = {
              firstName,
              lastName,
              fullName,
              dateOfBirth: practitioner.date_of_birth,
              ssnLast4,
              npi: npiNumber,
              licenseNumber: caLicenseNumber,
              licenseState: state,
              city,
              state,
              zip: postalCode
            };
          }
          
          console.log('🔍 Agent Runner: Extracted workflow-specific data:', {
            npi: npiData,
            caLicense: caLicenseData,
            abms: abmsData,
            dea: deaData,
            medicare: medicareData,
            medical: medicalData,
            npdb: npdbData,
            sanction: sanctionData
          });
          
          const dataDescription = [];
          if (npiData) dataDescription.push(`NPI: ${npiNumber}`);
          if (caLicenseData) dataDescription.push(`CA License: ${caLicenseNumber}`);
          if (abmsData) dataDescription.push(`ABMS: ${npiNumber}`);
          if (deaData) dataDescription.push(`DEA: ${deaNumber}`);
          if (medicareData) dataDescription.push(`Medicare: ${npiNumber}`);
          if (medicalData) dataDescription.push(`Medi-Cal: ${npiNumber}`);
          if (npdbData) dataDescription.push(`NPDB: ${fullName}`);
          if (sanctionData) dataDescription.push(`Sanction Check: ${fullName}`);
          
          store.addThought({
            message: `Extracted verification data - ${dataDescription.join(', ')}`,
            type: 'thinking'
          });
        }
      }

      // Build task with workflow-specific practitioner data if available
      let task = 'Execute all verification workflows in sequence: first run NPI verification workflow, then run CA license verification workflow, then run ABMS verification workflow, then run DEA verification workflow, then run Medicare verification workflow, then run Medi-Cal verification workflow, then run NPDB verification workflow, then run Sanction Check verification workflow. Complete all workflows fully including setting status to completed and saving progress.';
      
      if (npiData || caLicenseData || abmsData || deaData || medicareData || medicalData || npdbData || sanctionData) {
        task += `\n\nUse the following workflow-specific data:`;
        
        
        if (npiData) {
          task += `\n\nFor NPI VERIFICATION (stepId="npi_verification"):
- Name: ${npiData.fullName}
- First Name: ${npiData.firstName}
- Last Name: ${npiData.lastName}
- NPI: ${npiData.npi}
- Organization: ${npiData.organizationName}
- City: ${npiData.city}
- State: ${npiData.state}
- Postal Code: ${npiData.postalCode}

Also pass the full provider context for AI analysis.`;
        }
        
        if (caLicenseData) {
          task += `\n\nFor CA LICENSE VERIFICATION (stepId="ca_license_verification"):
- Name: ${caLicenseData.fullName}
- First Name: ${caLicenseData.firstName}
- Last Name: ${caLicenseData.lastName}
- License Number: ${caLicenseData.licenseNumber}
- License State: ${caLicenseData.licenseState}
- License Type: ${caLicenseData.licenseType}

Also pass the full provider context for AI analysis.`;
        }
        
        if (abmsData) {
          task += `\n\nFor ABMS VERIFICATION (stepId="abms_verification"):
- Name: ${abmsData.fullName}
- First Name: ${abmsData.firstName}
- Last Name: ${abmsData.lastName}
- Middle Name: ${abmsData.middleName}
- NPI: ${abmsData.npi}
- State: ${abmsData.state}
- Active License Number: ${abmsData.activeLicenseNumber}
- Specialty: ${abmsData.specialty}

Also pass the full provider context for AI analysis.`;
        }
        
        if (deaData) {
          task += `\n\nFor DEA VERIFICATION (stepId="dea_verification"):
- Name: ${deaData.fullName}
- First Name: ${deaData.firstName}
- Last Name: ${deaData.lastName}
- DEA Number: ${deaData.deaNumber}

Also pass the full provider context for AI analysis.`;
        }
        
        if (medicareData) {
          task += `\n\nFor MEDICARE VERIFICATION (stepId="medicare_verification"):
- Name: ${medicareData.fullName}
- First Name: ${medicareData.firstName}
- Last Name: ${medicareData.lastName}
- NPI: ${medicareData.npi}
- Specialty: ${medicareData.specialty}

Also pass the full provider context for AI analysis.`;
        }
        
        if (medicalData) {
          task += `\n\nFor MEDI-CAL VERIFICATION (stepId="medical_verification"):
- Name: ${medicalData.fullName}
- First Name: ${medicalData.firstName}
- Last Name: ${medicalData.lastName}
- NPI: ${medicalData.npi}
- License Type: ${medicalData.licenseType}
- Taxonomy Code: ${medicalData.taxonomyCode}
- Provider Type: ${medicalData.providerType}
- City: ${medicalData.city}
- State: ${medicalData.state}
- ZIP: ${medicalData.zip}

Also pass the full provider context for AI analysis.`;
        }
        
        if (npdbData) {
          task += `\n\nFor NPDB VERIFICATION (stepId="npdb_verification"):
- Name: ${npdbData.fullName}
- First Name: ${npdbData.firstName}
- Last Name: ${npdbData.lastName}
- Date of Birth: ${npdbData.dateOfBirth}
- SSN Last 4: ${npdbData.ssnLast4}
- NPI: ${npdbData.npi}
- License Number: ${npdbData.licenseNumber}
- License State: ${npdbData.licenseState}
- Address: ${JSON.stringify(npdbData.address)}
- UPIN: ${npdbData.upin}
- DEA Number: ${npdbData.deaNumber}
- Organization: ${npdbData.organizationName}

Also pass the full provider context for AI analysis.`;
        }
        
        if (sanctionData) {
          task += `\n\nFor SANCTION CHECK VERIFICATION (stepId="sanction_check"):
- Name: ${sanctionData.fullName}
- First Name: ${sanctionData.firstName}
- Last Name: ${sanctionData.lastName}
- Date of Birth: ${sanctionData.dateOfBirth}
- SSN Last 4: ${sanctionData.ssnLast4}
- NPI: ${sanctionData.npi}
- License Number: ${sanctionData.licenseNumber}
- License State: ${sanctionData.licenseState}
- City: ${sanctionData.city}
- State: ${sanctionData.state}
- ZIP: ${sanctionData.zip}

Also pass the full provider context for AI analysis.`;
        }
        
        task += `\n\nPROVIDER CONTEXT FOR API VERIFICATIONS:
${JSON.stringify(context, null, 2)}`;
      } else {
        store.addThought({
          message: 'No practitioner data available - workflows will run without pre-populated data',
          type: 'thinking'
        });
      }
      
      return await this.runAgentLoop(task, agentContext);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Agent Runner: Complete verification workflow failed', error);
      
      store.addThought({
        message: `Complete verification workflow failed: ${errorMessage}`,
        type: 'result'
      });

      // Stop the agent and turn off overlay on error
      console.log('❌ Agent Runner: Workflow failed, stopping agent and turning off overlay');
      store.stopAgent();

      throw error;
    }
  }

  /**
   * Run the agent in a continuous loop with streaming events
   */
  private async runAgentLoop(task: string, context: VeraAgentContext): Promise<string> {
    const store = context.store;
    this.isLoopRunning = true;
    
    console.log('🔄 Agent Loop: Starting continuous execution');
    
    try {
      // Create a streaming run
      const streamResult = await run(this.agent, task, {
        context,
        stream: true
      });
      
      let finalResult = '';
      
      // Process stream events
      for await (const event of streamResult) {
        if (!this.isLoopRunning) {
          console.log('⏹️ Agent Loop: Stopping due to external request');
          break;
        }
        
        switch (event.type) {
          case 'raw_model_stream_event':
            // Skip raw model events as per Python example - we only handle structured events
            continue;
            
          case 'run_item_stream_event':
            // Handle run item events - completed items like tool calls, messages
            const runItemEvent = event as any;
            if (runItemEvent.item) {
              switch (runItemEvent.item.type) {
                case 'tool_call_item':
                  const toolCall = runItemEvent.item as any; // Type assertion for tool call
                  // Try multiple ways to extract tool name
                  const toolName = toolCall.tool_call?.function?.name || 
                                   toolCall.function?.name || 
                                   toolCall.name || 
                                   'unknown_tool';
                  const toolArgs = toolCall.tool_call?.function?.arguments || 
                                   toolCall.function?.arguments || 
                                   toolCall.arguments || 
                                   '{}';
                  
                  console.log('🔧 Tool Call Debug:', { 
                    toolName, 
                    toolArgs, 
                    fullItem: toolCall 
                  });
                  
                  store.addThought({
                    message: `Executing ${toolName}: ${this.formatToolCallFromArgs(toolName, toolArgs)}`,
                    type: 'action'
                  });
                  break;
                  
                case 'tool_call_output_item':
                  const toolOutput = runItemEvent.item as any; // Type assertion for tool output
                  const output = toolOutput.output;
                  let success = false;
                  let message = 'Tool completed';
                  
                  console.log('🔧 Tool Output Debug:', { output, fullItem: toolOutput });
                  
                  // Try to parse the output to determine success
                  if (typeof output === 'object' && output !== null) {
                    success = output.success === true;
                    message = output.message || message;
                  } else if (typeof output === 'string') {
                    message = output;
                    success = true;
                  }
                  
                  store.addThought({
                    message: message,
                    type: success ? 'result' : 'thinking'
                  });
                  break;
                  
                case 'message_output_item':
                  const messageOutput = runItemEvent.item as any; // Type assertion for message output
                  if (messageOutput.content) {
                    // Extract text from content array
                    let textContent = '';
                    if (Array.isArray(messageOutput.content)) {
                      textContent = messageOutput.content
                        .filter((c: any) => c.type === 'output_text')
                        .map((c: any) => c.text || '')
                        .join('');
                    } else if (typeof messageOutput.content === 'string') {
                      textContent = messageOutput.content;
                    }
                    
                    if (textContent) {
                      // Store the result but don't treat it as completion
                      // The agent might still have more tool calls to make
                      finalResult = textContent;
                      
                      store.addThought({
                        message: textContent,
                        type: 'thinking'
                      });
                    }
                  }
                  break;
                  
                default:
                  console.log('🔍 Agent Loop: Unhandled item type:', runItemEvent.item?.type, runItemEvent.item);
                  break;
              }
            }
            break;
            
          case 'agent_updated_stream_event':
            // Handle agent updates (handoffs)
            const agentEvent = event as any;
            if (agentEvent.agent) {
              store.addThought({
                message: `Agent updated: ${agentEvent.agent.name}`,
                type: 'thinking'
              });
            }
            break;
            
          default:
            // Handle any other event types
            console.log('🔍 Agent Loop: Unhandled event type:', (event as any).type, event);
            break;
        }

      }
      
      // Wait for the stream to complete
      await streamResult.completed;
      
      console.log('🏁 Agent Loop: Stream completed', { finalResult });
      
      // Task is complete - stop the agent and turn off overlay
      const completionMessage = finalResult || 'All verification workflows completed successfully';
      
      // Add final completion thought
      store.addThought({
        message: completionMessage,
        type: 'result'
      });
      
      // Mark task as complete
      if (store.currentTask) {
        store.markTaskComplete(store.currentTask);
      }
      
      // Stop the agent and turn off overlay
      console.log('✅ Agent Runner: Task completed, stopping agent and turning off overlay');
      store.stopAgent();
      
      return completionMessage;
      
    } catch (error) {
      console.error('❌ Agent Loop: Stream error', error);
      
      // On error, also stop the agent and turn off overlay
      store.addThought({
        message: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'result'
      });
      
      console.log('❌ Agent Runner: Task failed, stopping agent and turning off overlay');
      store.stopAgent();
      
      throw error;
    } finally {
      this.isLoopRunning = false;
      console.log('🔄 Agent Loop: Execution stopped');
    }
  }

  /**
   * Format tool call for display in thinking bubbles
   */
  private formatToolCall(toolName: string, args: any): string {
    switch (toolName) {
      case 'npi_verification_workflow':
        return `Executing NPI verification workflow for ${args.stepId || 'npi_verification'}`;
      case 'ca_license_verification_workflow':
        return `Executing CA license verification workflow for ${args.stepId || 'ca_license_verification'}`;
      case 'abms_verification_workflow':
        return `Executing ABMS verification workflow for ${args.stepId || 'abms_verification'}`;
      case 'dea_verification_workflow':
        return `Executing DEA verification workflow for ${args.stepId || 'dea_verification'}`;
      case 'medicare_verification_workflow':
        return `Executing Medicare verification workflow for ${args.stepId || 'medicare_verification'}`;
      case 'medical_verification_workflow':
        return `Executing Medi-Cal verification workflow for ${args.stepId || 'medical_verification'}`;
      case 'npdb_verification_workflow':
        return `Executing NPDB verification workflow for ${args.stepId || 'npdb_verification'}`;
      case 'sanction_check_verification_workflow':
        return `Executing Sanction Check verification workflow for ${args.stepId || 'sanction_check'}`;
      default:
        return `${toolName} with ${JSON.stringify(args)}`;
    }
  }

  /**
   * Format tool call from arguments string for display
   */
  private formatToolCallFromArgs(toolName: string, argsString: string): string {
    try {
      const args = JSON.parse(argsString);
      return this.formatToolCall(toolName, args);
    } catch {
      return `${toolName} with ${argsString}`;
    }
  }

  /**
   * Stop the current agent loop execution
   */
  stopExecution(): void {
    console.log('🛑 Agent Runner: Stopping execution');
    this.isLoopRunning = false;
    
    // Also stop the agent and turn off overlay when manually stopped
    const store = useAgentStore.getState();
    store.addThought({
      message: 'Agent execution manually stopped',
      type: 'result'
    });
    store.stopAgent();
  }

  /**
   * Check if the agent loop is currently running
   */
  isExecuting(): boolean {
    return this.isLoopRunning;
  }

  /**
   * Get the underlying agent instance (for advanced usage)
   */
  getAgent(): Agent<VeraAgentContext> {
    return this.agent;
  }
}

// Export singleton instance
export const agentRunner = AgentRunner.getInstance(); 