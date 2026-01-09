# Analytics API Router

from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timedelta
import os
import io
import csv
import logging

from .models import (
    EventBatch, AnalyticsEvent, 
    LiveOverview, EngagementMetrics, GameplayMetrics,
    EconomyMetrics, UpgradeMetrics, PerformanceMetrics, DailySummary
)
from .database import AnalyticsDB

logger = logging.getLogger(__name__)

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

# API Keys (in production, use secure storage)
INGESTION_KEY = os.environ.get('ANALYTICS_INGESTION_KEY', 'pulse-forge-ingest-key-2024')
ADMIN_KEY = os.environ.get('ANALYTICS_ADMIN_KEY', 'pulse-forge-admin-key-2024')

# Rate limiting config
RATE_LIMIT_EVENTS_PER_MINUTE = 1000

# Global DB instance (will be set on startup)
_analytics_db: Optional[AnalyticsDB] = None


def get_analytics_db() -> AnalyticsDB:
    if _analytics_db is None:
        raise HTTPException(status_code=500, detail="Analytics DB not initialized")
    return _analytics_db


def set_analytics_db(db: AnalyticsDB):
    global _analytics_db
    _analytics_db = db


def verify_ingestion_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != INGESTION_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


def verify_admin_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Invalid admin API key")
    return x_api_key


# ==================== INGESTION ENDPOINTS ====================

@analytics_router.post("/events/batch")
async def ingest_events(
    batch: EventBatch,
    api_key: str = Depends(verify_ingestion_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Ingest a batch of analytics events"""
    try:
        events_to_insert = []
        
        for event in batch.events:
            event_dict = event.dict()
            event_dict['batch_id'] = batch.batch_id
            
            # Handle special events
            if event.event_type == 'session_start':
                await db.upsert_player(event.player_id, {
                    'platform': event.platform,
                    'device': event.device,
                    'locale': event.locale,
                    'app_version': event.app_version
                })
                await db.create_session({
                    'session_id': event.session_id,
                    'player_id': event.player_id,
                    'app_version': event.app_version,
                    'platform': event.platform,
                    'device': event.device
                })
            
            elif event.event_type == 'session_end':
                await db.end_session(event.session_id)
            
            elif event.event_type == 'run_start':
                await db.create_run({
                    'run_id': event.run_id,
                    'player_id': event.player_id,
                    'session_id': event.session_id,
                    'seed': event.seed
                })
            
            elif event.event_type == 'run_end':
                await db.end_run(event.run_id, {
                    'score': event.properties.get('score', 0),
                    'blueprints_earned': event.properties.get('blueprints_earned', 0),
                    'perfect_pulses': event.properties.get('perfect_pulses', 0),
                    'near_misses': event.properties.get('near_misses', 0),
                    'phase_throughs': event.properties.get('phase_throughs', 0),
                    'damage_taken': event.properties.get('damage_taken', 0),
                    'death_cause': event.properties.get('death_cause'),
                    'segment_reached': event.properties.get('segment_reached', 1),
                    'upgrades_selected': event.properties.get('upgrades_selected', [])
                })
            
            events_to_insert.append(event_dict)
        
        # Bulk insert events
        await db.insert_events(events_to_insert)
        
        return {
            'success': True,
            'events_received': len(batch.events),
            'batch_id': batch.batch_id
        }
    
    except Exception as e:
        logger.error(f"Error ingesting events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.post("/events/single")
async def ingest_single_event(
    event: AnalyticsEvent,
    api_key: str = Depends(verify_ingestion_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Ingest a single event (for testing)"""
    batch = EventBatch(events=[event])
    return await ingest_events(batch, api_key, db)


# ==================== DASHBOARD ENDPOINTS ====================

@analytics_router.get("/dashboard/live", response_model=LiveOverview)
async def get_live_overview(
    minutes: int = Query(15, ge=1, le=60),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get live overview stats for the last N minutes"""
    data = await db.get_live_stats(minutes)
    return LiveOverview(**data)


@analytics_router.get("/dashboard/engagement", response_model=EngagementMetrics)
async def get_engagement(
    days: int = Query(7, ge=1, le=90),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get engagement and retention metrics"""
    data = await db.get_engagement_metrics(days)
    return EngagementMetrics(**data)


@analytics_router.get("/dashboard/gameplay", response_model=GameplayMetrics)
async def get_gameplay(
    days: int = Query(7, ge=1, le=90),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get gameplay balance metrics"""
    data = await db.get_gameplay_metrics(days)
    return GameplayMetrics(**data)


@analytics_router.get("/dashboard/economy", response_model=EconomyMetrics)
async def get_economy(
    days: int = Query(7, ge=1, le=90),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get economy balance metrics"""
    data = await db.get_economy_metrics(days)
    return EconomyMetrics(**data)


@analytics_router.get("/dashboard/upgrades", response_model=UpgradeMetrics)
async def get_upgrades(
    days: int = Query(7, ge=1, le=90),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get upgrade balance metrics"""
    data = await db.get_upgrade_metrics(days)
    return UpgradeMetrics(**data)


@analytics_router.get("/dashboard/performance", response_model=PerformanceMetrics)
async def get_performance(
    days: int = Query(7, ge=1, le=90),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get performance and QA metrics"""
    data = await db.get_performance_metrics(days)
    return PerformanceMetrics(**data)


@analytics_router.get("/dashboard/daily-summary", response_model=DailySummary)
async def get_daily_summary(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get daily summary with anomaly detection"""
    date_obj = None
    if date:
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    data = await db.get_daily_summary(date_obj)
    return DailySummary(**data)


# ==================== EXPORT ENDPOINTS ====================

@analytics_router.get("/export/events")
async def export_events(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    format: str = Query("csv", enum=["csv", "json"]),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Export events as CSV or JSON"""
    query = {}
    
    if date_from:
        query['timestamp'] = {'$gte': datetime.strptime(date_from, '%Y-%m-%d')}
    if date_to:
        query.setdefault('timestamp', {})['$lte'] = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
    if event_type:
        query['event_type'] = event_type
    
    events = await db.events.find(query).limit(10000).to_list(10000)
    
    if format == "json":
        # Convert ObjectId to string
        for e in events:
            e['_id'] = str(e['_id'])
            if 'timestamp' in e:
                e['timestamp'] = e['timestamp'].isoformat()
        return events
    
    # CSV format
    if not events:
        return StreamingResponse(
            io.StringIO("No data"),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=events.csv"}
        )
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(events[0].keys()))
    writer.writeheader()
    
    for event in events:
        event['_id'] = str(event['_id'])
        if 'timestamp' in event:
            event['timestamp'] = event['timestamp'].isoformat()
        if 'properties' in event:
            event['properties'] = str(event['properties'])
        writer.writerow(event)
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events.csv"}
    )


@analytics_router.get("/export/runs")
async def export_runs(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Export runs data as CSV"""
    query = {}
    
    if date_from:
        query['started_at'] = {'$gte': datetime.strptime(date_from, '%Y-%m-%d')}
    if date_to:
        query.setdefault('started_at', {})['$lte'] = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
    
    runs = await db.runs.find(query).limit(10000).to_list(10000)
    
    if not runs:
        return StreamingResponse(
            io.StringIO("No data"),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=runs.csv"}
        )
    
    output = io.StringIO()
    fieldnames = ['run_id', 'player_id', 'session_id', 'started_at', 'ended_at', 
                  'duration_seconds', 'score', 'blueprints_earned', 'perfect_pulses',
                  'near_misses', 'phase_throughs', 'damage_taken', 'death_cause', 'segment_reached']
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for run in runs:
        run['_id'] = str(run.get('_id', ''))
        if 'started_at' in run and run['started_at']:
            run['started_at'] = run['started_at'].isoformat()
        if 'ended_at' in run and run['ended_at']:
            run['ended_at'] = run['ended_at'].isoformat()
        writer.writerow(run)
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=runs.csv"}
    )


# ==================== ADMIN ENDPOINTS ====================

@analytics_router.get("/admin/stats")
async def get_admin_stats(
    api_key: str = Depends(verify_admin_key),
    db: AnalyticsDB = Depends(get_analytics_db)
):
    """Get overall admin statistics"""
    total_players = await db.players.count_documents({})
    total_sessions = await db.sessions.count_documents({})
    total_runs = await db.runs.count_documents({})
    total_events = await db.events.count_documents({})
    
    return {
        'total_players': total_players,
        'total_sessions': total_sessions,
        'total_runs': total_runs,
        'total_events': total_events
    }


@analytics_router.get("/health")
async def health_check():
    """Health check endpoint (no auth required)"""
    return {'status': 'healthy', 'service': 'analytics'}
