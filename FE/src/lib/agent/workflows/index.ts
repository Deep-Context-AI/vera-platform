// Import all workflow tools
import { npiVerificationWorkflowTool } from './npi/npiWorkflow';
import { caLicenseVerificationWorkflowTool } from './ca-license/caLicenseWorkflow';
import { abmsVerificationWorkflowTool } from './abms/abmsWorkflow';
import { deaVerificationWorkflowTool } from './dea/deaWorkflow';
import { medicareVerificationWorkflowTool } from './medicare/medicareWorkflow';
import { medicalVerificationWorkflowTool } from './medical/medicalWorkflow';
import { npdbVerificationWorkflowTool } from './npdb/npdbWorkflow';
import { sanctionCheckVerificationWorkflowTool } from './sanction/sanctionWorkflow';

// Re-export individual tools
export { npiVerificationWorkflowTool };
export { caLicenseVerificationWorkflowTool };
export { abmsVerificationWorkflowTool };
export { deaVerificationWorkflowTool };
export { medicareVerificationWorkflowTool };
export { medicalVerificationWorkflowTool };
export { npdbVerificationWorkflowTool };
export { sanctionCheckVerificationWorkflowTool };

// Export all workflow tools as array for easy registration
export const allWorkflowTools = [
  npiVerificationWorkflowTool,
  caLicenseVerificationWorkflowTool,
  abmsVerificationWorkflowTool,
  deaVerificationWorkflowTool,
  medicareVerificationWorkflowTool,
  medicalVerificationWorkflowTool,
  npdbVerificationWorkflowTool,
  sanctionCheckVerificationWorkflowTool,
];