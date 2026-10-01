"""
Rawbank Sentient Fraud Intelligence Platform - FastAPI Server
File: backend/main.py
Powers:
- Use Case 01: Sentient Command Centre (DuckDB analytical telemetry)
- Use Case 02: Sentient Fraud Investigation Copilot (Dual retrieval + Groq LLM reasoning)
"""

import sys
import traceback

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from database import db
from copilot import copilot

app = FastAPI(
    title="Rawbank SentraAI Fraud Intelligence Platform API",
    version="2.0.0",
    description="Enterprise BFSI Command Centre & AI Fraud Investigation Copilot for Rawbank DRC."
)

# Enable CORS for Next.js frontend (default port 3000, 3001, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CopilotChatRequest(BaseModel):
    transaction_id: str
    query: Optional[str] = ""


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "Rawbank SentraAI Fraud Intelligence Platform",
        "version": "2.0.0",
        "use_cases": [
            "Use Case 01: SentraAI Command Centre",
            "Use Case 02: SentraAI Fraud Investigation Copilot"
        ]
    }

# =============================================================================
# USE CASE 01: SENTRAAI COMMAND CENTRE ENDPOINTS
# =============================================================================

@app.get("/api/kpis")
def get_kpis():
    """
    Returns executive command center KPIs:
    Total transactions, volume USD/CDF, alerts, alert rate, severity breakdown, exposure, and open cases.
    """
    try:
        return db.get_kpis()
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to compute KPIs: {str(e)}")

@app.get("/api/analytics")
def get_analytics():
    """
    Returns rich analytics:
    - Daily alert & transaction volume trends
    - Omnichannel risk breakdown
    - Geographic distribution (DRC hubs & international)
    - Top risky entities (customers, mule beneficiaries, flagged shared devices)
    """
    try:
        return db.get_analytics()
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")

@app.get("/api/alerts")
def get_alerts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Page size"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, ALL"),
    channel: Optional[str] = Query(None, description="Filter by channel: ILLICOCASH, RAWBANK_ONLINE, CARD, etc."),
    queue: Optional[str] = Query(None, description="Filter by analyst queue: DIGITAL_FRAUD, CARD_FRAUD, etc."),
    status: Optional[str] = Query(None, description="Filter by case status: NEW, IN_REVIEW, ESCALATED, CLOSED, ALL"),
    search: Optional[str] = Query(None, description="Search transaction_id, customer_id, customer_name, narration")
):
    """
    Searchable and paginated alert feed with multi-criteria operational filtering.
    """
    try:
        return db.get_alerts(
            page=page,
            page_size=page_size,
            severity=severity,
            channel=channel,
            queue=queue,
            status=status,
            search=search
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve alerts: {str(e)}")

@app.get("/api/transaction/{transaction_id}")
def get_transaction_drilldown(transaction_id: str):
    """
    360-degree forensic drill-down for a selected transaction:
    Customer profile & 90d baseline, device footprint, auth telemetry, triggered rules FR-01 to FR-20,
    counter-evidence analysis, case assignment, and Copilot reasoning placeholder.
    """
    try:
        result = db.get_transaction_drilldown(transaction_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found in canonical KB.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve transaction: {str(e)}")

# =============================================================================
# USE CASE 02: SENTIENT FRAUD INVESTIGATION COPILOT ENDPOINTS
# =============================================================================

@app.post("/api/copilot/chat")
def copilot_chat(req: CopilotChatRequest):
    """
    Executes an AI-assisted fraud investigation interrogation turn for a transaction.
    Combines deterministic ground truth telemetry with FAISS semantic similarity and
    generates a structured 7-part investigation report under Section 12 requirements.
    """
    try:
        return copilot.investigate(req.transaction_id, req.query or "")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Copilot investigation failed: {str(e)}")

@app.get("/api/copilot/suggestions/{transaction_id}")
def get_copilot_suggestions(transaction_id: str):
    """
    Returns context-aware 1-click prompt chips tailored to the transaction alert pattern.
    """
    try:
        return {"suggestions": copilot.get_suggestions(transaction_id)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
