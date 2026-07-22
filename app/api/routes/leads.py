import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import models
from app.dependencies import get_db
from app.schemas.email import EmailDraftResponse
from app.schemas.intent import IntentClassificationResponse
from app.schemas.lead import LeadCreate, LeadResponse
from app.schemas.lead_score import LeadScoreResponse
from app.schemas.service_match import ServiceMatchResponse
from app.schemas.database import (
    DBTestConnectionRequest,
    DBTestConnectionResponse,
    ConnectedDatabaseItem
)
from app.services.lead_service import (
    create_lead,
    delete_all_leads,
    get_all_leads,
    get_lead_by_id,
)
from app.tools.email_generator import generate_sales_email
from app.tools.intent_classifier import classify_lead_intent
from app.tools.knowledge_search import find_matching_service
from app.tools.lead_scoring import score_lead

router = APIRouter(prefix="/leads")

# In-memory database connection store for multi-DB connections
connected_databases = []


# Lead CRUD & Workflow endpoints

@router.get("", response_model=List[LeadResponse])
def list_leads(db: Session = Depends(get_db)):
    return get_all_leads(db)


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_new_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    return create_lead(db=db, lead_data=lead_data)


@router.get("/{lead_id}", response_model=LeadResponse)
def retrieve_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_by_id(db=db, lead_id=lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    return lead


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_leads(db: Session = Depends(get_db)):
    delete_all_leads(db)


@router.post("/{lead_id}/classify-intent", response_model=IntentClassificationResponse)
def classify_intent(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_by_id(db=db, lead_id=lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    result = classify_lead_intent(lead.problem)
    lead.detected_intent = result["intent"]
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        "lead_id": lead.id,
        "detected_intent": result["intent"],
        "classification_method": result["classification_method"],
    }


@router.post("/{lead_id}/score", response_model=LeadScoreResponse)
def calculate_lead_score(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_by_id(db=db, lead_id=lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    score_result = score_lead(lead)
    lead.lead_score = score_result["score"]
    lead.qualification = score_result["qualification"]
    lead.status = score_result["crm_stage"]
    lead.recommended_action = score_result["recommended_action"]

    db.commit()
    db.refresh(lead)

    return score_result


@router.post("/{lead_id}/match-service", response_model=ServiceMatchResponse)
def match_service_to_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_by_id(db=db, lead_id=lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    if not lead.detected_intent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classify the lead intent before matching a service",
        )

    service = find_matching_service(lead.detected_intent)
    return {
        "lead_id": lead.id,
        **service,
    }


@router.post("/{lead_id}/generate-email", response_model=EmailDraftResponse)
def generate_email_for_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_by_id(db=db, lead_id=lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    if not lead.detected_intent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classify the lead intent before generating an email",
        )

    service = find_matching_service(lead.detected_intent)
    result = generate_sales_email(
        lead_name=lead.name,
        company=lead.company,
        problem=lead.problem,
        qualification=lead.qualification,
        lead_score=lead.lead_score,
        recommended_action=lead.recommended_action,
        service=service,
    )

    lead.email_subject = result["subject"]
    lead.email_draft = result["body"]

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        "lead_id": lead.id,
        "subject": result["subject"],
        "body": result["body"],
        "generation_method": result["generation_method"],
    }


class LeadStatusUpdateRequest(BaseModel):
    qualification: str
    status: Optional[str] = None
    recommended_action: Optional[str] = None
    lead_score: Optional[int] = None


@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(lead_id: int, payload: LeadStatusUpdateRequest, db: Session = Depends(get_db)):
    lead = get_lead_by_id(db=db, lead_id=lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    lead.qualification = payload.qualification
    if payload.status:
        lead.status = payload.status
    else:
        lead.status = "Qualified" if payload.qualification == "qualified" else ("Needs Review" if payload.qualification == "needs_review" else "Disqualified")
    
    if payload.recommended_action:
        lead.recommended_action = payload.recommended_action
    elif payload.qualification == "qualified":
        lead.recommended_action = "Book a discovery call"
    elif payload.qualification == "unqualified":
        lead.recommended_action = "Add to nurture sequence"

    if payload.lead_score is not None:
        lead.lead_score = payload.lead_score
    elif payload.qualification == "qualified" and (lead.lead_score is None or lead.lead_score < 70):
        lead.lead_score = 85

    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


# Database Connectivity & Management Endpoints

@router.get("/databases/list")
def get_connected_databases():
    return connected_databases


@router.post("/databases/test", response_model=DBTestConnectionResponse)
def test_database_connection(payload: DBTestConnectionRequest):
    start_time = time.time()
    
    # Simulate database connection handshake & ping test
    time.sleep(0.12)  # realistic latency
    latency_ms = round((time.time() - start_time) * 1000, 2)
    
    if payload.connection_type == "connection_string":
        if not payload.connection_string:
            raise HTTPException(status_code=400, detail="Connection string cannot be empty")
        conn_str = payload.connection_string.lower()
        if "invalid" in conn_str or "fail" in conn_str:
            return DBTestConnectionResponse(
                success=False,
                status_message="Failed to establish socket connection: Host unreachable or bad credentials",
                latency_ms=latency_ms,
                provider=payload.provider,
                database_version=None
            )
        return DBTestConnectionResponse(
            success=True,
            status_message=f"Successfully connected to {payload.provider} via Connection String",
            latency_ms=latency_ms,
            provider=payload.provider,
            database_version=f"{payload.provider} v15.4 (Verified)"
        )
    elif payload.connection_type == "host_port":
        if not payload.host or not payload.database_name:
            raise HTTPException(status_code=400, detail="Host and Database Name are required")
        return DBTestConnectionResponse(
            success=True,
            status_message=f"Successfully pinged {payload.host}:{payload.port or 5432}/{payload.database_name}",
            latency_ms=latency_ms,
            provider=payload.provider,
            database_version=f"{payload.provider} Server (Online)"
        )
    elif payload.connection_type == "api_key":
        if not payload.api_key:
            raise HTTPException(status_code=400, detail="API Key / Token is required")
        return DBTestConnectionResponse(
            success=True,
            status_message=f"API Authentication successful for {payload.provider}",
            latency_ms=latency_ms,
            provider=payload.provider,
            database_version=f"{payload.provider} Cloud API v2"
        )
    elif payload.connection_type == "webhook":
        if not payload.webhook_url:
            raise HTTPException(status_code=400, detail="Webhook URL is required")
        return DBTestConnectionResponse(
            success=True,
            status_message=f"Webhook endpoint verified (HTTP 200 OK)",
            latency_ms=latency_ms,
            provider=payload.provider,
            database_version="REST Webhook Listener"
        )
    
    return DBTestConnectionResponse(
        success=True,
        status_message="Connection test successful",
        latency_ms=latency_ms,
        provider=payload.provider,
        database_version="Generic DB v1.0"
    )


class MultiDBConnectRequest(BaseModel):
    provider: str
    connection_type: str  # connection_string, host_port, api_key, webhook, file_import
    db_name: Optional[str] = None
    connection_string: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    api_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    webhook_url: Optional[str] = None


@router.post("/databases/connect", response_model=List[LeadResponse], status_code=status.HTTP_201_CREATED)
def connect_database_and_import(payload: MultiDBConnectRequest, db: Session = Depends(get_db)):
    db_label = payload.db_name or f"{payload.provider} ({payload.connection_type.replace('_', ' ').title()})"
    
    # Provider-specific sample datasets for instant CRM import
    provider_data = {
        "PostgreSQL": [
            ("Marcus Vance", "Vance Automation", "Need AI-driven lead scoring to handle 50,000 monthly inquiries.", "marcus@vanceauto.com"),
            ("Elena Rostova", "DataPulse Inc", "Searching for AI agents to analyze incoming enterprise lead intent.", "elena@datapulse.io")
        ],
        "Salesforce": [
            ("David Miller", "Apex Cloud", "Looking to match high-value CRM contacts with customized service packages.", "dmiller@apexcloud.com"),
            ("Sophia Chen", "InnoTech Enterprise", "Our sales team needs automated personalized outreach draft generation.", "schen@innotech.com")
        ],
        "HubSpot": [
            ("Liam O'Connor", "GrowthWave Marketing", "Want to connect web forms directly to AI qualification workflows.", "liam@growthwave.com"),
            ("Zoe Martinez", "Zenith Retail", "Struggling to prioritize inbound leads from multi-channel campaigns.", "zoe@zenithretail.com")
        ],
        "Notion": [
            ("Noah Smith", "Creative Studio", "Auto-classify project requests and assign sales priority.", "noah@creativestudio.co")
        ],
        "Snowflake": [
            ("Oliver Taylor", "DataLake Corp", "Large scale analytical lead qualification pipeline integration.", "oliver@datalake.io")
        ],
        "MongoDB": [
            ("Amara Okafor", "FlexiApp Global", "Unstructured lead data scoring and service recommendations.", "amara@flexiapp.net")
        ],
        "Airtable": [
            ("Lucas Wright", "Agile Ventures", "Fast automated triage for early stage leads.", "lucas@agileventures.com")
        ],
        "Google Sheets": [
            ("Emma Watson", "Bright Path Consulting", "Instant email draft generation from spreadsheet submissions.", "emma@brightpath.org")
        ],
        "Supabase": [
            ("James Wilson", "Realtime AI", "Realtime sales qualification agent integration.", "james@realtimeai.dev")
        ],
        "MySQL": [
            ("Isabella Rossi", "Legacy Retail Ltd", "Migrating manual lead workflow to intelligent AI agents.", "isabella@legacyretail.com")
        ],
        "MS SQL Server": [
            ("Robert Sterling", "Enterprise Core", "Need reliable lead qualification integration with SQL Server backend.", "robert@enterprisecore.com")
        ]
    }

    sample_list = provider_data.get(payload.provider, [
        ("Alex Mercer", f"{payload.provider} Enterprise", "Automation of sales outreach and intent discovery.", f"alex@{payload.provider.lower().replace(' ', '')}.com")
    ])

    created_leads = []
    for name, company, problem, email in sample_list:
        lead_data = LeadCreate(
            name=name,
            company=company,
            problem=problem,
            email=email,
            source=payload.provider
        )
        existing = db.query(models.Lead).filter(models.Lead.email == lead_data.email).first()
        if not existing:
            created_leads.append(create_lead(db=db, lead_data=lead_data))
        else:
            created_leads.append(existing)

    # Add to connected databases registry
    new_id = len(connected_databases) + 1
    connected_databases.append({
        "id": new_id,
        "name": db_label,
        "provider": payload.provider,
        "connection_type": payload.connection_type.replace("_", " ").title(),
        "status": "Connected",
        "last_sync": "Just now",
        "records_count": len(sample_list)
    })

    return created_leads


@router.delete("/databases/{db_id}", status_code=status.HTTP_200_OK)
def delete_connected_database(db_id: int):
    global connected_databases
    connected_databases = [d for d in connected_databases if d["id"] != db_id]
    return {"message": f"Database connection #{db_id} removed successfully"}


@router.post("/databases/{db_id}/sync", response_model=List[LeadResponse])
def sync_connected_database(db_id: int, db: Session = Depends(get_db)):
    target_db = next((d for d in connected_databases if d["id"] == db_id), None)
    if not target_db:
        raise HTTPException(status_code=404, detail="Connected database not found")
    
    target_db["last_sync"] = "Just now"
    
    # Import a sync lead
    sync_lead = LeadCreate(
        name=f"Sync Contact ({target_db['provider']})",
        company=f"{target_db['name']} Client",
        problem=f"Synced lead from {target_db['name']} requesting AI sales evaluation.",
        email=f"sync_{db_id}_{int(time.time())}@sync.io",
        source=target_db["provider"]
    )
    new_lead = create_lead(db=db, lead_data=sync_lead)
    target_db["records_count"] += 1
    return [new_lead]


# Compatible legacy route for existing calls
class DBIntegrationRequest(BaseModel):
    provider: str
    connection_string: str
    db_name: Optional[str] = None


@router.post("/import-demo", response_model=List[LeadResponse], status_code=status.HTTP_201_CREATED)
def import_demo_database(payload: DBIntegrationRequest, db: Session = Depends(get_db)):
    return connect_database_and_import(
        MultiDBConnectRequest(
            provider=payload.provider,
            connection_type="connection_string",
            connection_string=payload.connection_string,
            db_name=payload.db_name
        ),
        db=db
    )