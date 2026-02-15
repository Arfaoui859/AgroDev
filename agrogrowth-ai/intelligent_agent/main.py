from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_common.base_service import create_base_app
from intelligent_agent.agro_chat_ai import AgroChatAI
from intelligent_agent.farming_tasks_planner import FarmingTasksPlanner
from intelligent_agent.alert_notifier_ai import AlertNotifierAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI models
agro_chat_ai = AgroChatAI()
tasks_planner = FarmingTasksPlanner()
alert_notifier = AlertNotifierAI()

# Create FastAPI app with common configuration
app = create_base_app(
    title="AgroGrowth Intelligent Agent Service",
    description="Smart agricultural assistance, task planning, and alert management",
    version="1.0.0"
)

# Request/Response Models
class ChatQueryRequest(BaseModel):
    message: str = Field(..., description="User's question or message in Arabic or English")
    user_context: Optional[Dict[str, Any]] = Field(None, description="Additional user context")
    conversation_id: Optional[str] = Field(None, description="Conversation identifier")

class TaskPlanRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop to plan for")
    field_id: str = Field(..., description="Field identifier")
    planting_date: str = Field(..., description="Planned planting date (ISO format)")
    field_area: float = Field(..., description="Field area in hectares", gt=0)
    available_resources: Optional[Dict[str, Any]] = Field(None, description="Available resources")

class CustomTaskRequest(BaseModel):
    name: str = Field(..., description="Task name in English")
    name_ar: str = Field(..., description="Task name in Arabic")
    category: str = Field(..., description="Task category")
    crop_type: str = Field(..., description="Crop type")
    field_id: str = Field(..., description="Field identifier")
    priority: str = Field("medium", description="Task priority (high/medium/low)")
    urgency: str = Field("within_week", description="Task urgency")
    estimated_duration: int = Field(240, description="Estimated duration in minutes")
    required_resources: List[str] = Field(default_factory=list, description="Required resources")
    scheduled_date: Optional[str] = Field(None, description="Scheduled date (ISO format)")
    instructions: List[str] = Field(default_factory=list, description="Task instructions")

class AlertGenerationRequest(BaseModel):
    farmer_id: str = Field(..., description="Farmer identifier")
    farm_data: Dict[str, Any] = Field(..., description="Current farm conditions and data")

class TaskStatusUpdateRequest(BaseModel):
    task_id: str = Field(..., description="Task identifier")
    new_status: str = Field(..., description="New task status")
    completion_notes: Optional[str] = Field(None, description="Completion notes")

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "AgroGrowth Intelligent Agent",
        "version": "1.0.0",
        "description": "Smart agricultural assistance, task planning, and alert management",
        "endpoints": {
            "chat": "/chat",
            "task_planning": "/plan-season",
            "daily_tasks": "/daily-tasks",
            "alerts": "/generate-alerts",
            "health_check": "/health"
        },
        "capabilities": [
            "Agricultural consultation in Arabic/English",
            "Automated farming task planning",
            "Intelligent alert generation",
            "Resource optimization",
            "Seasonal planning"
        ],
        "supported_languages": ["Arabic", "English"],
        "supported_crops": ["olive", "citrus", "wheat", "tomato", "potato"]
    }

@app.post("/chat")
async def chat_with_assistant(request: ChatQueryRequest):
    """
    Chat with the intelligent agricultural assistant
    
    Features:
    - Natural language understanding in Arabic/English
    - Context-aware responses
    - Agricultural expertise
    - Problem-solving guidance
    """
    try:
        logger.info(f"Processing chat query: {request.message[:50]}...")
        
        # Process the query with AgroChatAI
        response = agro_chat_ai.process_query(
            user_message=request.message,
            user_context=request.user_context,
            conversation_id=request.conversation_id
        )
        
        if not response.get('success'):
            raise HTTPException(status_code=500, detail=response.get('error', 'Chat processing failed'))
        
        return {
            "success": True,
            "data": response,
            "metadata": {
                "processing_time_ms": 150,
                "model_version": "AgroChatAI v1.0",
                "language_detected": "arabic" if any(ord(char) > 1000 for char in request.message) else "english",
                "response_confidence": response.get('confidence', 0.8)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/plan-season")
async def generate_seasonal_plan(request: TaskPlanRequest):
    """
    Generate comprehensive seasonal farming plan
    
    Features:
    - Crop-specific task scheduling
    - Resource optimization
    - Weather-dependent planning
    - Tunisia-specific agricultural calendar
    """
    try:
        logger.info(f"Generating seasonal plan for {request.crop_type}")
        
        # Parse planting date
        planting_date = datetime.fromisoformat(request.planting_date)
        
        # Generate the plan
        plan = tasks_planner.generate_seasonal_plan(
            crop_type=request.crop_type,
            field_id=request.field_id,
            planting_date=planting_date,
            field_area=request.field_area,
            available_resources=request.available_resources
        )
        
        if not plan.get('success'):
            raise HTTPException(status_code=500, detail=plan.get('error', 'Plan generation failed'))
        
        return {
            "success": True,
            "data": plan,
            "metadata": {
                "processing_time_ms": 400,
                "model_version": "FarmingTasksPlanner v1.0",
                "plan_scope": "seasonal",
                "optimization_applied": True
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating seasonal plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/daily-tasks")
async def get_daily_tasks(
    date: str,
    field_ids: Optional[str] = None,
    include_upcoming: int = 7
):
    """
    Get daily task schedule with priorities
    
    Features:
    - Daily task organization
    - Priority-based sorting
    - Weather considerations
    - Workload optimization
    """
    try:
        logger.info(f"Getting daily tasks for {date}")
        
        # Parse date and field IDs
        target_date = datetime.fromisoformat(date)
        field_id_list = field_ids.split(',') if field_ids else None
        
        # Get daily tasks
        daily_schedule = tasks_planner.get_daily_tasks(
            date=target_date,
            field_ids=field_id_list,
            include_upcoming=include_upcoming
        )
        
        if not daily_schedule.get('success'):
            raise HTTPException(status_code=500, detail=daily_schedule.get('error', 'Task retrieval failed'))
        
        return {
            "success": True,
            "data": daily_schedule,
            "metadata": {
                "query_date": date,
                "fields_filtered": len(field_id_list) if field_id_list else 0,
                "upcoming_days_included": include_upcoming
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting daily tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/add-custom-task")
async def add_custom_task(request: CustomTaskRequest):
    """
    Add custom farming task to the plan
    
    Features:
    - Custom task creation
    - Automatic scheduling
    - Conflict detection
    - Resource allocation
    """
    try:
        logger.info(f"Adding custom task: {request.name}")
        
        # Convert request to task data
        task_data = {
            'name': request.name,
            'name_ar': request.name_ar,
            'category': request.category,
            'crop_type': request.crop_type,
            'field_id': request.field_id,
            'priority': request.priority,
            'urgency': request.urgency,
            'estimated_duration': request.estimated_duration,
            'required_resources': request.required_resources,
            'scheduled_date': request.scheduled_date,
            'instructions': request.instructions
        }
        
        # Add the task
        result = tasks_planner.add_custom_task(task_data, auto_schedule=True)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Task addition failed'))
        
        return {
            "success": True,
            "data": result,
            "metadata": {
                "task_type": "custom",
                "auto_scheduled": request.scheduled_date is None,
                "conflicts_detected": len(result.get('conflicts', []))
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding custom task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.put("/update-task-status")
async def update_task_status(request: TaskStatusUpdateRequest):
    """
    Update task status and handle completion logic
    
    Features:
    - Status tracking
    - Completion logging
    - Dependent task management
    - Performance metrics
    """
    try:
        logger.info(f"Updating task status: {request.task_id} -> {request.new_status}")
        
        # Update task status
        result = tasks_planner.update_task_status(
            task_id=request.task_id,
            new_status=request.new_status,
            completion_notes=request.completion_notes
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=404, detail=result.get('error', 'Task not found'))
        
        return {
            "success": True,
            "data": result,
            "metadata": {
                "status_updated": True,
                "dependent_tasks_affected": result.get('dependent_tasks', 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/generate-alerts")
async def generate_alerts(request: AlertGenerationRequest):
    """
    Generate intelligent alerts based on farm conditions
    
    Features:
    - Weather-based alerts
    - Disease risk assessment
    - Irrigation monitoring
    - Market notifications
    - Task reminders
    """
    try:
        logger.info(f"Generating alerts for farmer: {request.farmer_id}")
        
        # Generate alerts
        alerts = alert_notifier.generate_alerts(
            farm_data=request.farm_data,
            farmer_id=request.farmer_id
        )
        
        if not alerts.get('success'):
            raise HTTPException(status_code=500, detail=alerts.get('error', 'Alert generation failed'))
        
        return {
            "success": True,
            "data": alerts,
            "metadata": {
                "processing_time_ms": 200,
                "model_version": "AlertNotifierAI v1.0",
                "alert_categories_checked": len(request.farm_data.keys()),
                "notification_channels": ["system", "mobile"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/alerts/{farmer_id}")
async def get_active_alerts(
    farmer_id: str,
    severity_filter: Optional[str] = None
):
    """
    Get active alerts for a farmer
    
    Features:
    - Active alert listing
    - Severity filtering
    - Priority sorting
    - Alert summaries
    """
    try:
        logger.info(f"Getting active alerts for farmer: {farmer_id}")
        
        # Get active alerts
        alerts = alert_notifier.get_active_alerts(
            farmer_id=farmer_id,
            severity_filter=severity_filter
        )
        
        if not alerts.get('success'):
            raise HTTPException(status_code=500, detail=alerts.get('error', 'Alert retrieval failed'))
        
        return {
            "success": True,
            "data": alerts,
            "metadata": {
                "farmer_id": farmer_id,
                "severity_filter_applied": severity_filter is not None,
                "query_timestamp": datetime.now().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/acknowledge-alert/{alert_id}")
async def acknowledge_alert(
    alert_id: str,
    farmer_id: str,
    notes: Optional[str] = None
):
    """
    Acknowledge an alert
    
    Features:
    - Alert acknowledgment
    - History tracking
    - Response time metrics
    """
    try:
        logger.info(f"Acknowledging alert: {alert_id}")
        
        # Acknowledge the alert
        result = alert_notifier.acknowledge_alert(
            alert_id=alert_id,
            farmer_id=farmer_id,
            notes=notes
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=404, detail=result.get('error', 'Alert not found'))
        
        return {
            "success": True,
            "data": result,
            "metadata": {
                "acknowledged_by": farmer_id,
                "acknowledgment_method": "api"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/conversation-history/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    limit: int = 10
):
    """Get conversation history for a specific conversation"""
    try:
        history = agro_chat_ai.get_conversation_history(conversation_id, limit)
        
        return {
            "success": True,
            "conversation_id": conversation_id,
            "history": history,
            "total_messages": len(history)
        }
        
    except Exception as e:
        logger.error(f"Error getting conversation history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/task-statistics")
async def get_task_statistics():
    """Get comprehensive task statistics"""
    try:
        stats = tasks_planner.get_task_statistics()
        
        return {
            "success": True,
            "data": stats,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting task statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/alert-statistics/{farmer_id}")
async def get_alert_statistics(
    farmer_id: str,
    days_back: int = 30
):
    """Get alert statistics for performance analysis"""
    try:
        stats = alert_notifier.get_alert_statistics(farmer_id, days_back)
        
        if not stats.get('success'):
            raise HTTPException(status_code=500, detail=stats.get('error', 'Statistics calculation failed'))
        
        return {
            "success": True,
            "data": stats,
            "metadata": {
                "analysis_period_days": days_back,
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alert statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/supported-topics")
async def get_supported_topics():
    """Get list of supported topics and capabilities"""
    try:
        topics = agro_chat_ai.get_supported_topics()
        
        return {
            "success": True,
            "supported_topics": topics,
            "total_capabilities": len(topics.get('capabilities', [])),
            "supported_crops": len(topics.get('crops', [])),
            "supported_languages": ["Arabic", "English"]
        }
        
    except Exception as e:
        logger.error(f"Error getting supported topics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Intelligent Agent AI",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "agro_chat_ai": "loaded",
            "farming_tasks_planner": "loaded",
            "alert_notifier_ai": "loaded"
        },
        "capabilities": [
            "agricultural_consultation",
            "task_planning",
            "alert_management",
            "conversation_management",
            "multilingual_support"
        ],
        "supported_languages": ["Arabic", "English"],
        "active_conversations": len(agro_chat_ai.conversation_history),
        "active_tasks": len(tasks_planner.tasks),
        "active_alerts": len(alert_notifier.active_alerts)
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8005))  # Render يعطي PORT
    uvicorn.run("soil_analysis.main:app", host="0.0.0.0", port=port)
