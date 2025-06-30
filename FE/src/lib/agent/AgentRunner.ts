// Phase 2: This will integrate with OpenAI Agents SDK
// For now, this is a placeholder that provides the structure

import { Agent, run, setDefaultOpenAIClient } from '@openai/agents';
import { useAgentStore } from '@/stores/agentStore';
import OpenAI from 'openai';
import { identityVerificationWorkflowTool, npiVerificationWorkflowTool, caLicenseVerificationWorkflowTool } from './AgentWorkflows';


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
      instructions: `You are an AI assistant specialized in executing healthcare verification workflows. You have access to three deterministic workflow tools:

Available Tools:
1. identity_verification_workflow - Handles identity verification process
2. npi_verification_workflow - Handles NPI verification with API integration
3. ca_license_verification_workflow - Handles CA license verification with DCA API integration

WORKFLOW STRATEGY:
Each workflow tool handles the entire sequence automatically:
1. INSPECT: Check current state of the verification step
2. EXPAND: Open accordion if collapsed
3. START: Begin verification if not already started
4. PROCESS: Execute verification logic (API calls for NPI/DCA, status setting for identity)
5. COMPLETE: Finalize the verification step

STEP IDs:
- For identity verification: use stepId="identity_verification"
- For NPI verification: use stepId="npi_verification"
- For CA license verification: use stepId="ca_license_verification"

EXECUTION APPROACH:
- If asked to execute identity verification, call identity_verification_workflow with stepId="identity_verification"
- If asked to execute NPI verification, call npi_verification_workflow with stepId="npi_verification"
- If asked to execute CA license verification, call ca_license_verification_workflow with stepId="ca_license_verification"
- If asked to execute "all verifications", call all three workflows in sequence
- Each workflow is self-contained and handles all UI interactions and business logic automatically

PRACTITIONER DATA HANDLING:
- When practitioner data is provided in the task description, extract it and pass it to the workflow tools
- Look for practitioner information in the task text including: name, NPI, date of birth, address, organization, city, state, postal code, license numbers
- Format the data as a practitionerData object with appropriate fields:
  - For identity verification: firstName, lastName, fullName, ssn, dateOfBirth, address
  - For NPI verification: firstName, lastName, fullName, npi, organizationName, city, state, postalCode
  - For CA license verification: firstName, lastName, fullName, licenseNumber, licenseState, licenseType
- Always pass the practitionerData parameter to workflow tools when available
- If no practitioner data is provided, pass null for the practitionerData parameter

PROVIDER CONTEXT HANDLING:
- For NPI verification workflow, also extract and pass the PROVIDER CONTEXT section from the task
- For CA license verification workflow, also extract and pass the PROVIDER CONTEXT section from the task
- This context contains additional information about the provider that will be used for AI analysis
- Pass this as the providerContext parameter to both npi_verification_workflow and ca_license_verification_workflow tools
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
        identityVerificationWorkflowTool,
        npiVerificationWorkflowTool,
        caLicenseVerificationWorkflowTool
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
      store.addThought({
        message: 'Starting complete verification workflow execution',
        type: 'thinking'
      });

      // Extract and organize practitioner data from context if available
      let identityData = null;
      let npiData = null;
      let caLicenseData = null;
      
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
          
          // Extract address information - handle both home_address and mailing_address
          let addressString = null;
          let city = null;
          let state = null;
          let postalCode = null;
          
          if (practitioner.home_address && typeof practitioner.home_address === 'object') {
            const addr = practitioner.home_address;
            addressString = `${addr.line1 || ''} ${addr.line2 || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip_code || ''}`.trim();
            city = addr.city || null;
            state = addr.state || null;
            postalCode = addr.zip_code || addr.postal_code || null;
          } else if (practitioner.mailing_address && typeof practitioner.mailing_address === 'object') {
            const addr = practitioner.mailing_address;
            addressString = `${addr.line1 || ''} ${addr.line2 || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip_code || ''}`.trim();
            city = addr.city || null;
            state = addr.state || null;
            postalCode = addr.zip_code || addr.postal_code || null;
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
          
          // Identity verification data
          identityData = {
            firstName,
            lastName,
            fullName,
            ssn: practitioner.ssn || null,
            dateOfBirth: practitioner.date_of_birth || (practitioner.demographics?.birth_date) || null,
            address: addressString
          };
          
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
          
          console.log('🔍 Agent Runner: Extracted workflow-specific data:', {
            identity: identityData,
            npi: npiData,
            caLicense: caLicenseData
          });
          
          const dataDescription = [];
          if (identityData) dataDescription.push(`Identity: ${fullName}`);
          if (npiData) dataDescription.push(`NPI: ${npiNumber}`);
          if (caLicenseData) dataDescription.push(`CA License: ${caLicenseNumber}`);
          
          store.addThought({
            message: `Extracted verification data - ${dataDescription.join(', ')}`,
            type: 'thinking'
          });
        }
      }

      // Build task with workflow-specific practitioner data if available
      let task = 'Execute all verification workflows in sequence: first run identity verification workflow, then run NPI verification workflow, then run CA license verification workflow. Complete all workflows fully including setting status to completed and saving progress.';
      
      if (identityData || npiData || caLicenseData) {
        task += `\n\nUse the following workflow-specific data:`;
        
        if (identityData) {
          task += `\n\nFor IDENTITY VERIFICATION (stepId="identity_verification"):
- Name: ${identityData.fullName}
- First Name: ${identityData.firstName}
- Last Name: ${identityData.lastName}
- Date of Birth: ${identityData.dateOfBirth}
- Address: ${identityData.address}
- SSN: ${identityData.ssn}`;
        }
        
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
      return finalResult || 'Task completed successfully';
      
    } catch (error) {
      console.error('❌ Agent Loop: Stream error', error);
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
      case 'identity_verification_workflow':
        return `Executing identity verification workflow for ${args.stepId || 'identity_verification'}`;
      case 'npi_verification_workflow':
        return `Executing NPI verification workflow for ${args.stepId || 'npi_verification'}`;
      case 'ca_license_verification_workflow':
        return `Executing CA license verification workflow for ${args.stepId || 'ca_license_verification'}`;
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