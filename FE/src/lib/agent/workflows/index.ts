// Import all workflow tools
import { identityVerificationWorkflowTool } from './identity/identityWorkflow';
import { npiVerificationWorkflowTool } from './npi/npiWorkflow';
import { caLicenseVerificationWorkflowTool } from './ca-license/caLicenseWorkflow';
import { abmsVerificationWorkflowTool } from './abms/abmsWorkflow';

// Re-export individual tools
export { identityVerificationWorkflowTool };
export { npiVerificationWorkflowTool };
export { caLicenseVerificationWorkflowTool };
export { abmsVerificationWorkflowTool };

// Export all workflow tools as array for easy registration
export const allWorkflowTools = [
  identityVerificationWorkflowTool,
  npiVerificationWorkflowTool,
  caLicenseVerificationWorkflowTool,
  abmsVerificationWorkflowTool,
];