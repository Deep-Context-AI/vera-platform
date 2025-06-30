// Import all workflow tools
import { identityVerificationWorkflowTool } from './identity/identityWorkflow';
import { npiVerificationWorkflowTool } from './npi/npiWorkflow';
import { caLicenseVerificationWorkflowTool } from './ca-license/caLicenseWorkflow';
import { abmsVerificationWorkflowTool } from './abms/abmsWorkflow';
import { deaVerificationWorkflowTool } from './dea/deaWorkflow';
import { medicareVerificationWorkflowTool } from './medicare/medicareWorkflow';
import { medicalVerificationWorkflowTool } from './medical/medicalWorkflow';
import { npdbVerificationWorkflowTool } from './npdb/npdbWorkflow';

// Re-export individual tools
export { identityVerificationWorkflowTool };
export { npiVerificationWorkflowTool };
export { caLicenseVerificationWorkflowTool };
export { abmsVerificationWorkflowTool };
export { deaVerificationWorkflowTool };
export { medicareVerificationWorkflowTool };
export { medicalVerificationWorkflowTool };
export { npdbVerificationWorkflowTool };

// Export all workflow tools as array for easy registration
export const allWorkflowTools = [
  identityVerificationWorkflowTool,
  npiVerificationWorkflowTool,
  caLicenseVerificationWorkflowTool,
  abmsVerificationWorkflowTool,
  deaVerificationWorkflowTool,
  medicareVerificationWorkflowTool,
  medicalVerificationWorkflowTool,
  npdbVerificationWorkflowTool,
];