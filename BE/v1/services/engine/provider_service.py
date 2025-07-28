import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from supabase import Client

from v1.services.database import DatabaseService
from v1.api.models.provider_models import (
    ProviderProfileResponse, VerificationStepsResponse, StepDetailsResponse,
    ActivityResponse, DocumentsResponse, Provider, Application, VerificationProgress,
    VerificationStepSummary, ExecutionDetails, StepResult, ActivityLogEntry,
    ActivityEntry, Actor, Document, ProviderEducation, ProviderAddress,
    ProviderDemographics, MalpracticeInsurance, WorkHistoryEntry, ECFMGInfo
)

logger = logging.getLogger(__name__)

class ProviderService:
    """
    Service layer for provider-related operations and data aggregation.
    Extends the base DatabaseService with provider-specific functionality.
    """
    
    def __init__(self, client: Optional[Client] = None):
        """Initialize the provider service with database client"""
        self.db = DatabaseService(client)
    
    async def get_provider_profile(self, application_id: int) -> ProviderProfileResponse:
        """
        Get complete provider profile with application data and verification progress.
        
        Args:
            application_id: Application ID to fetch
            
        Returns:
            Dict containing provider profile data
        """
        try:
            # Get application data
            app_response = self.db.supabase.schema('vera').table('applications') \
                .select('*') \
                .eq('id', application_id) \
                .execute()
            
            if not app_response.data:
                raise Exception(f"Application {application_id} not found")
                
            app_data = app_response.data[0]
            
            # Get practitioner data
            practitioner_response = self.db.supabase.schema('vera').table('practitioners') \
                .select('*') \
                .eq('id', app_data['provider_id']) \
                .execute()
            
            if not practitioner_response.data:
                raise Exception(f"Practitioner {app_data['provider_id']} not found")
                
            practitioner_data = practitioner_response.data[0]
            
            # Get verification progress
            progress = await self._get_verification_progress(application_id)
            
            # Format provider profile response
            provider = Provider(
                id=app_data["provider_id"],
                name=self._format_full_name(practitioner_data),
                first_name=practitioner_data["first_name"],
                last_name=practitioner_data["last_name"],
                middle_name=practitioner_data["middle_name"],
                suffix=practitioner_data["suffix"],
                npi=app_data["npi_number"],
                license_number=app_data["license_number"],
                dea_number=app_data["dea_number"],
                education=ProviderEducation(**practitioner_data["education"]) if practitioner_data["education"] else None,
                demographics=ProviderDemographics(**practitioner_data["demographics"]) if practitioner_data["demographics"] else None,
                home_address=ProviderAddress(**practitioner_data["home_address"]) if practitioner_data["home_address"] else None,
                mailing_address=ProviderAddress(**practitioner_data["mailing_address"]) if practitioner_data["mailing_address"] else None,
                languages=practitioner_data["languages"],
                ssn=practitioner_data["ssn"]
            )
            
            # Parse work history
            work_history = None
            if app_data["work_history"]:
                work_history = [WorkHistoryEntry(**entry) for entry in app_data["work_history"]]
            
            application = Application(
                status=app_data["status"],
                created_at=datetime.fromisoformat(app_data["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(app_data["updated_at"].replace('Z', '+00:00')) if app_data["updated_at"] else None,
                work_history=work_history,
                malpractice_insurance=MalpracticeInsurance(**app_data["malpractice_insurance"]) if app_data["malpractice_insurance"] else None,
                ecfmg=ECFMGInfo(**app_data["ecfmg"]) if app_data["ecfmg"] else None,
                previous_approval_date=datetime.fromisoformat(app_data["previous_approval_date"].replace('Z', '+00:00')) if app_data["previous_approval_date"] else None,
                notes=app_data["notes"]
            )
            
            return ProviderProfileResponse(
                application_id=application_id,
                provider=provider,
                application=application,
                verification_progress=progress
            )
            
        except Exception as e:
            logger.error(f"Error getting provider profile: {e}")
            raise e
    
    async def _get_verification_progress(self, application_id: int) -> VerificationProgress:
        """Calculate verification progress metrics"""
        try:
            # Get step states
            step_response = self.db.supabase.schema('vera').table('step_state') \
                .select('step_key, decision') \
                .eq('application_id', application_id) \
                .execute()
            
            step_states = {row['step_key']: row['decision'] for row in step_response.data}
            
            # Import here to avoid circular imports
            from v1.services.engine.registry import get_all_verification_steps
            available_steps = get_all_verification_steps()
            
            completed_steps = len([s for s in step_states.values() if s in ['approved', 'requires_review']])
            total_steps = len(available_steps)
            percentage = (completed_steps / total_steps * 100) if total_steps > 0 else 0
            
            return VerificationProgress(
                completed_steps=completed_steps,
                total_steps=total_steps,
                percentage=round(percentage, 1)
            )
            
        except Exception as e:
            logger.error(f"Error calculating verification progress: {e}")
            return VerificationProgress(completed_steps=0, total_steps=0, percentage=0)
    
    async def get_verification_steps_summary(self, application_id: int) -> VerificationStepsResponse:
        """
        Get summary of all verification steps with status and basic info.
        
        Args:
            application_id: Application ID
            
        Returns:
            Dict containing steps summary
        """
        try:
            # Get step states
            step_response = self.db.supabase.schema('vera').table('step_state') \
                .select('*') \
                .eq('application_id', application_id) \
                .execute()
            
            # Get invocations for confidence and reasoning
            invocation_response = self.db.supabase.schema('vera').table('invocations') \
                .select('*') \
                .eq('application_id', application_id) \
                .execute()
            
            # Get activity counts from audit trail
            activity_response = self.db.supabase.schema('vera').table('audit_trail_v2') \
                .select('action') \
                .eq('application_id', application_id) \
                .execute()
            
            # Create lookups
            step_states = {row['step_key']: row for row in step_response.data}
            invocations = {row['step_key']: row for row in invocation_response.data}
            
            # Import available steps
            from v1.services.engine.registry import get_all_verification_steps
            available_steps = get_all_verification_steps()
            
            steps = []
            for step_key, step_info in available_steps.items():
                step_state = step_states.get(step_key)
                invocation = invocations.get(step_key)
                
                # Add reasoning if available
                decision_reasoning = None
                if invocation:
                    llm_analysis = invocation.get('response_json', {}).get('llm_analysis', {})
                    decision_reasoning = llm_analysis.get('reasoning')
                
                step_summary = VerificationStepSummary(
                    step_key=step_key,
                    step_name=self._format_step_name(step_key),
                    status=step_state['decision'] if step_state else 'pending',
                    decided_by=step_state['decided_by'] if step_state else None,
                    decided_at=datetime.fromisoformat(step_state['decided_at'].replace('Z', '+00:00')) if step_state and step_state['decided_at'] else None,
                    has_documents=bool(invocation and invocation.get('response_json', {}).get('document_url')),
                    activity_count=len([a for a in activity_response.data if step_key.upper() in a.get('action', '')]),
                    decision_reasoning=decision_reasoning
                )
                
                steps.append(step_summary)
            
            return VerificationStepsResponse(steps=steps)
            
        except Exception as e:
            logger.error(f"Error getting verification steps summary: {e}")
            raise e
    
    async def get_step_details(self, application_id: int, step_key: str) -> StepDetailsResponse:
        """
        Get detailed information for a specific verification step.
        
        Args:
            application_id: Application ID
            step_key: Verification step key
            
        Returns:
            Dict containing step details
        """
        try:
            # Get step state
            step_response = self.db.supabase.schema('vera').table('step_state') \
                .select('*') \
                .eq('application_id', application_id) \
                .eq('step_key', step_key) \
                .execute()
            
            # Get invocation details
            invocation_response = self.db.supabase.schema('vera').table('invocations') \
                .select('*') \
                .eq('application_id', application_id) \
                .eq('step_key', step_key) \
                .execute()
            
            # Get step-specific activity log
            activity_response = self.db.supabase.schema('vera').table('audit_trail_v2') \
                .select('*') \
                .eq('application_id', application_id) \
                .like('action', f'%{step_key.upper()}%') \
                .order('created_at', desc=True) \
                .execute()
            
            step_state = step_response.data[0] if step_response.data else None
            invocation = invocation_response.data[0] if invocation_response.data else None
            
            # Build execution details
            execution_details = None
            step_result = None
            
            if invocation:
                # Extract document URL if available
                document_url = None
                response_json = invocation.get("response_json", {})
                for key in ["document_url", "npi_response", "dea_response", "education_response"]:
                    if key in response_json and isinstance(response_json[key], dict):
                        doc_url = response_json[key].get("document_url")
                        if doc_url:
                            document_url = doc_url
                            break
                
                execution_details = ExecutionDetails(
                    invocation_type=invocation["invocation_type"],
                    request_data=invocation["request_json"],
                    response_data=invocation["response_json"],
                    metadata=invocation["metadata"],
                    created_by=invocation["created_by"],
                    created_at=datetime.fromisoformat(invocation["created_at"].replace('Z', '+00:00')),
                    document_url=document_url
                )
                
                # Add LLM analysis as "result"
                llm_analysis = response_json.get("llm_analysis", {})
                if llm_analysis:
                    step_result = StepResult(
                        decision=llm_analysis.get("decision"),
                        reasoning=llm_analysis.get("reasoning")
                    )
            
            # Get user information for activity log
            actor_ids = list(set(activity['actor_id'] for activity in activity_response.data if activity['actor_id']))
            users = {}
            if actor_ids:
                user_response = self.db.supabase.schema('vera').table('users') \
                    .select('*') \
                    .in_('id', actor_ids) \
                    .execute()
                users = {user['id']: user for user in user_response.data}
            
            # Build activity log
            activity_log = []
            for activity in activity_response.data:
                user = users.get(activity['actor_id'])
                activity_log.append(ActivityLogEntry(
                    id=activity["id"],
                    action=activity["action"],
                    actor_id=activity["actor_id"],
                    actor_name=user.get("name") if user else None,
                    actor_email=user.get("email") if user else None,
                    timestamp=datetime.fromisoformat(activity["created_at"].replace('Z', '+00:00')),
                    source=activity["source"],
                    notes=activity["notes"]
                ))
            
            return StepDetailsResponse(
                step_key=step_key,
                step_name=self._format_step_name(step_key),
                status=step_state['decision'] if step_state else 'pending',
                execution_details=execution_details,
                result=step_result,
                activity_log=activity_log
            )
            
        except Exception as e:
            logger.error(f"Error getting step details: {e}")
            raise e
    
    async def get_provider_activity(self, application_id: int) -> ActivityResponse:
        """
        Get complete activity timeline for a provider.
        
        Args:
            application_id: Application ID
            
        Returns:
            Dict containing activity history
        """
        try:
            # Get all audit trail entries with user information
            activity_response = self.db.supabase.schema('vera').table('audit_trail_v2') \
                .select('*') \
                .eq('application_id', application_id) \
                .order('created_at', desc=True) \
                .execute()
            
            # Get user information for actors
            actor_ids = list(set(activity['actor_id'] for activity in activity_response.data if activity['actor_id']))
            users = {}
            if actor_ids:
                user_response = self.db.supabase.schema('vera').table('users') \
                    .select('*') \
                    .in_('id', actor_ids) \
                    .execute()
                users = {user['id']: user for user in user_response.data}
            
            activities = []
            for activity in activity_response.data:
                user = users.get(activity['actor_id'])
                actor = None
                if activity["actor_id"]:
                    actor = Actor(
                        id=activity["actor_id"],
                        name=user.get("name") if user else "System",
                        email=user.get("email") if user else None
                    )
                
                activities.append(ActivityEntry(
                    id=activity["id"],
                    action=activity["action"],
                    actor=actor,
                    timestamp=datetime.fromisoformat(activity["created_at"].replace('Z', '+00:00')),
                    source=activity["source"],
                    notes=activity["notes"]
                ))
            
            return ActivityResponse(activities=activities)
            
        except Exception as e:
            logger.error(f"Error getting provider activity: {e}")
            raise e
    
    async def get_provider_documents(self, application_id: int, step_key: Optional[str] = None) -> DocumentsResponse:
        """
        Get all documents for a provider, optionally filtered by step.
        
        Args:
            application_id: Application ID
            step_key: Optional step key to filter by
            
        Returns:
            Dict containing documents list
        """
        try:
            # Build query
            query = self.db.supabase.schema('vera').table('invocations') \
                .select('*') \
                .eq('application_id', application_id)
            
            if step_key:
                query = query.eq('step_key', step_key)
            
            invocation_response = query.execute()
            
            documents = []
            for invocation in invocation_response.data:
                response_json = invocation.get("response_json", {})
                document_url = None
                
                # Extract document URL from various response formats
                for key in ["document_url", "npi_response", "dea_response", "education_response"]:
                    if key in response_json:
                        if isinstance(response_json[key], dict):
                            document_url = response_json[key].get("document_url")
                        elif isinstance(response_json[key], str) and key == "document_url":
                            document_url = response_json[key]
                        if document_url:
                            break
                
                if document_url:
                    documents.append(Document(
                        id=f"{invocation['step_key']}_{invocation['id']}",
                        name=f"{self._format_step_name(invocation['step_key'])} Report",
                        type="verification_report",
                        category="vera-pulled",
                        step_key=invocation["step_key"],
                        url=document_url,
                        generated_at=datetime.fromisoformat(invocation["created_at"].replace('Z', '+00:00')),
                        size_estimate="2.4MB",  # Default estimate
                        format="PDF"
                    ))
            
            return DocumentsResponse(documents=documents)
            
        except Exception as e:
            logger.error(f"Error getting provider documents: {e}")
            raise e
    
    def _format_full_name(self, data: Dict[str, Any]) -> str:
        """Format full name from name components"""
        name_parts = [data["first_name"]]
        if data.get("middle_name"):
            name_parts.append(data["middle_name"])
        if data.get("last_name"):
            name_parts.append(data["last_name"])
        if data.get("suffix"):
            name_parts.append(data["suffix"])
        return " ".join(name_parts)
    
    def _format_step_name(self, step_key: str) -> str:
        """Format step key into human readable name"""
        step_names = {
            "npi": "NPI Verification",
            "dea": "DEA Verification", 
            "dca": "DCA License Verification",
            "abms": "ABMS Board Certification",
            "ladmf": "LADMF Verification",
            "medicare": "Medicare Verification",
            "medical": "Medical License Verification",
            "npdb": "NPDB Check",
            "sanctions": "Sanctions Check",
            "education": "Education Verification",
            "hospital": "Hospital Privileges"
        }
        return step_names.get(step_key, step_key.upper()) 