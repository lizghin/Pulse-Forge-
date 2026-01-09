# Simple Analytics Router - MVP Dashboard Backend

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import io
import csv
import logging

logger = logging.getLogger(__name__)

simple_analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

# API Keys
INGESTION_KEY = os.environ.get('ANALYTICS_INGESTION_KEY', 'pulse-forge-ingest-2024')
DASHBOARD_KEY = os.environ.get('ANALYTICS_DASHBOARD_KEY', 'pulse-forge-dashboard-2024')

# Global DB reference (set on startup)
_db: Optional[AsyncIOMotorDatabase] = None

def set_db(db: AsyncIOMotorDatabase):
    global _db
    _db = db

def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

def verify_ingestion_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != INGESTION_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

def verify_dashboard_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != DASHBOARD_KEY:
        raise HTTPException(status_code=401, detail="Invalid dashboard key")
    return x_api_key


# ==================== MODELS ====================

class RunEndEvent(BaseModel):
    type: str = "run_end"
    score: int
    duration: int
    segment_reached: int
    death_cause: Optional[str] = None
    perfect_count: int = 0
    near_miss_count: int = 0
    blueprints_earned_total: int = 0

class UpgradeSelectedEvent(BaseModel):
    type: str = "upgrade_selected"
    upgrade_id: str
    rarity: str
    category: str

class BlueprintSpentEvent(BaseModel):
    type: str = "blueprint_spent"
    item_type: str
    item_id: str
    cost: int

class QueuedEvent(BaseModel):
    event: Dict[str, Any]
    player_id: str
    session_id: str
    run_id: Optional[str] = None
    ts: str
    app_version: str
    platform: str

class EventBatch(BaseModel):
    events: List[QueuedEvent]


# ==================== INGESTION ====================

@simple_analytics_router.post("/events/batch")
async def ingest_events(
    batch: EventBatch,
    api_key: str = Depends(verify_ingestion_key)
):
    """Ingest a batch of analytics events"""
    db = get_db()
    
    runs_to_insert = []
    upgrades_to_insert = []
    economy_to_insert = []
    
    for item in batch.events:
        event = item.event
        event_type = event.get('type')
        base_data = {
            'player_id': item.player_id,
            'session_id': item.session_id,
            'run_id': item.run_id,
            'ts': datetime.fromisoformat(item.ts.replace('Z', '+00:00')),
            'app_version': item.app_version,
            'platform': item.platform,
        }
        
        if event_type == 'run_end':
            runs_to_insert.append({
                **base_data,
                'score': event.get('score', 0),
                'duration': event.get('duration', 0),
                'segment_reached': event.get('segment_reached', 1),
                'death_cause': event.get('death_cause'),
                'perfect_count': event.get('perfect_count', 0),
                'near_miss_count': event.get('near_miss_count', 0),
                'blueprints_earned_total': event.get('blueprints_earned_total', 0),
            })
        
        elif event_type == 'upgrade_selected':
            upgrades_to_insert.append({
                **base_data,
                'upgrade_id': event.get('upgrade_id'),
                'rarity': event.get('rarity'),
                'category': event.get('category'),
            })
        
        elif event_type == 'blueprint_spent':
            economy_to_insert.append({
                **base_data,
                'item_type': event.get('item_type'),
                'item_id': event.get('item_id'),
                'cost': event.get('cost', 0),
            })
    
    # Bulk insert
    if runs_to_insert:
        await db.analytics_runs.insert_many(runs_to_insert)
    if upgrades_to_insert:
        await db.analytics_upgrade_picks.insert_many(upgrades_to_insert)
    if economy_to_insert:
        await db.analytics_economy_events.insert_many(economy_to_insert)
    
    logger.info(f"Ingested {len(runs_to_insert)} runs, {len(upgrades_to_insert)} upgrades, {len(economy_to_insert)} economy events")
    
    return {
        'success': True,
        'ingested': {
            'runs': len(runs_to_insert),
            'upgrades': len(upgrades_to_insert),
            'economy': len(economy_to_insert),
        }
    }


# ==================== DASHBOARD ENDPOINTS ====================

@simple_analytics_router.get("/dashboard/stats")
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=90),
    app_version: Optional[str] = None,
    platform: Optional[str] = None,
    api_key: str = Depends(verify_dashboard_key)
):
    """Get all dashboard statistics"""
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)
    
    # Build match query
    match = {'ts': {'$gte': since}}
    if app_version:
        match['app_version'] = app_version
    if platform:
        match['platform'] = platform
    
    # Death causes breakdown
    death_pipeline = [
        {'$match': {**match, 'death_cause': {'$ne': None}}},
        {'$group': {'_id': '$death_cause', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    death_causes = await db.analytics_runs.aggregate(death_pipeline).to_list(100)
    
    # Segment reached distribution
    segment_pipeline = [
        {'$match': match},
        {'$group': {'_id': '$segment_reached', 'count': {'$sum': 1}}},
        {'$sort': {'_id': 1}}
    ]
    segments = await db.analytics_runs.aggregate(segment_pipeline).to_list(100)
    
    # Score distribution (buckets)
    score_pipeline = [
        {'$match': match},
        {'$bucket': {
            'groupBy': '$score',
            'boundaries': [0, 500, 1000, 2000, 3000, 5000, 10000, 50000],
            'default': 'other',
            'output': {'count': {'$sum': 1}}
        }}
    ]
    try:
        scores = await db.analytics_runs.aggregate(score_pipeline).to_list(100)
    except:
        scores = []
    
    # Upgrade pick rates
    upgrade_pipeline = [
        {'$match': match},
        {'$group': {
            '_id': {'upgrade_id': '$upgrade_id', 'rarity': '$rarity', 'category': '$category'},
            'picks': {'$sum': 1}
        }},
        {'$sort': {'picks': -1}},
        {'$limit': 20}
    ]
    upgrades = await db.analytics_upgrade_picks.aggregate(upgrade_pipeline).to_list(100)
    
    # Blueprints earned distribution
    bp_pipeline = [
        {'$match': match},
        {'$bucket': {
            'groupBy': '$blueprints_earned_total',
            'boundaries': [0, 10, 25, 50, 100, 200, 500],
            'default': 'other',
            'output': {'count': {'$sum': 1}}
        }}
    ]
    try:
        blueprints = await db.analytics_runs.aggregate(bp_pipeline).to_list(100)
    except:
        blueprints = []
    
    # Recent runs
    recent_runs = await db.analytics_runs.find(match).sort('ts', -1).limit(50).to_list(50)
    for run in recent_runs:
        run['_id'] = str(run['_id'])
        run['ts'] = run['ts'].isoformat() if run.get('ts') else None
    
    # Recent purchases
    recent_purchases = await db.analytics_economy_events.find(match).sort('ts', -1).limit(20).to_list(20)
    for p in recent_purchases:
        p['_id'] = str(p['_id'])
        p['ts'] = p['ts'].isoformat() if p.get('ts') else None
    
    # Summary stats
    total_runs = await db.analytics_runs.count_documents(match)
    avg_score_pipeline = [
        {'$match': match},
        {'$group': {'_id': None, 'avg': {'$avg': '$score'}, 'total_bp': {'$sum': '$blueprints_earned_total'}}}
    ]
    avg_result = await db.analytics_runs.aggregate(avg_score_pipeline).to_list(1)
    
    return {
        'summary': {
            'total_runs': total_runs,
            'avg_score': round(avg_result[0]['avg'], 0) if avg_result else 0,
            'total_blueprints': avg_result[0]['total_bp'] if avg_result else 0,
            'period_days': days,
        },
        'death_causes': [{'cause': d['_id'], 'count': d['count']} for d in death_causes],
        'segment_distribution': [{'segment': s['_id'], 'count': s['count']} for s in segments],
        'score_distribution': [{'bucket': str(s['_id']), 'count': s['count']} for s in scores],
        'upgrade_picks': [
            {
                'upgrade_id': u['_id']['upgrade_id'],
                'rarity': u['_id']['rarity'],
                'category': u['_id']['category'],
                'picks': u['picks']
            } for u in upgrades
        ],
        'blueprints_distribution': [{'bucket': str(b['_id']), 'count': b['count']} for b in blueprints],
        'recent_runs': recent_runs,
        'recent_purchases': recent_purchases,
    }


@simple_analytics_router.get("/dashboard/filters")
async def get_filter_options(api_key: str = Depends(verify_dashboard_key)):
    """Get available filter options"""
    db = get_db()
    
    versions = await db.analytics_runs.distinct('app_version')
    platforms = await db.analytics_runs.distinct('platform')
    
    return {
        'app_versions': versions,
        'platforms': platforms,
    }


@simple_analytics_router.get("/dashboard/export/runs")
async def export_runs_csv(
    days: int = Query(7, ge=1, le=90),
    app_version: Optional[str] = None,
    platform: Optional[str] = None,
    api_key: str = Depends(verify_dashboard_key)
):
    """Export runs as CSV"""
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)
    
    match = {'ts': {'$gte': since}}
    if app_version:
        match['app_version'] = app_version
    if platform:
        match['platform'] = platform
    
    runs = await db.analytics_runs.find(match).sort('ts', -1).limit(5000).to_list(5000)
    
    if not runs:
        return StreamingResponse(
            io.StringIO("No data"),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=runs.csv"}
        )
    
    output = io.StringIO()
    fieldnames = ['run_id', 'player_id', 'ts', 'app_version', 'platform', 'score', 
                  'duration', 'segment_reached', 'death_cause', 'perfect_count', 
                  'near_miss_count', 'blueprints_earned_total']
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for run in runs:
        run['_id'] = str(run.get('_id', ''))
        run['ts'] = run['ts'].isoformat() if run.get('ts') else ''
        writer.writerow(run)
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pulse_forge_runs.csv"}
    )


# ==================== DEMO DATA ====================

@simple_analytics_router.post("/demo/generate")
async def generate_demo_data(
    days: int = Query(7, ge=1, le=30),
    runs_per_day: int = Query(50, ge=10, le=200),
    api_key: str = Depends(verify_dashboard_key)
):
    """Generate demo data for testing"""
    import random
    import uuid
    
    db = get_db()
    
    DEATH_CAUSES = ['wall', 'drone', 'laser', 'timeout']
    PLATFORMS = ['ios', 'android', 'web']
    VERSIONS = ['1.0.0', '1.0.1', '1.1.0']
    UPGRADES = [
        ('pulse_range', 'common', 'offense'),
        ('pulse_power', 'common', 'offense'),
        ('charge_speed', 'common', 'utility'),
        ('phase_duration', 'rare', 'defense'),
        ('shield', 'rare', 'defense'),
        ('double_jump', 'rare', 'mobility'),
        ('overdrive', 'legendary', 'offense'),
        ('regeneration', 'legendary', 'defense'),
    ]
    ITEMS = [
        ('upgrade', 'pulse_range_unlock', 100),
        ('upgrade', 'shield_unlock', 200),
        ('cosmetic', 'theme_fire', 500),
    ]
    
    now = datetime.utcnow()
    runs = []
    upgrades_list = []
    economy_list = []
    
    for day_offset in range(days):
        day = now - timedelta(days=day_offset)
        
        for _ in range(runs_per_day):
            run_id = str(uuid.uuid4())
            player_id = str(uuid.uuid4())
            session_id = str(uuid.uuid4())
            platform = random.choice(PLATFORMS)
            version = random.choice(VERSIONS)
            
            # Simulate run
            duration = random.randint(20, 90)
            segment = min(6, 1 + duration // 15)
            score = duration * random.randint(30, 80) + random.randint(0, 500)
            death = random.choice(DEATH_CAUSES) if random.random() > 0.1 else None
            perfect = random.randint(0, 15)
            near_miss = random.randint(0, 10)
            bp_earned = score // 100 + random.randint(0, 20)
            
            ts = day + timedelta(
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            runs.append({
                'run_id': run_id,
                'player_id': player_id,
                'session_id': session_id,
                'ts': ts,
                'app_version': version,
                'platform': platform,
                'score': score,
                'duration': duration,
                'segment_reached': segment,
                'death_cause': death,
                'perfect_count': perfect,
                'near_miss_count': near_miss,
                'blueprints_earned_total': bp_earned,
            })
            
            # Simulate upgrades picked (3-6 per run)
            picked_upgrades = random.sample(UPGRADES, random.randint(3, min(6, len(UPGRADES))))
            for upg in picked_upgrades:
                upgrades_list.append({
                    'run_id': run_id,
                    'player_id': player_id,
                    'session_id': session_id,
                    'ts': ts,
                    'app_version': version,
                    'platform': platform,
                    'upgrade_id': upg[0],
                    'rarity': upg[1],
                    'category': upg[2],
                })
            
            # Simulate purchases (10% chance)
            if random.random() < 0.1:
                item = random.choice(ITEMS)
                economy_list.append({
                    'run_id': run_id,
                    'player_id': player_id,
                    'session_id': session_id,
                    'ts': ts,
                    'app_version': version,
                    'platform': platform,
                    'item_type': item[0],
                    'item_id': item[1],
                    'cost': item[2],
                })
    
    # Insert all
    if runs:
        await db.analytics_runs.insert_many(runs)
    if upgrades_list:
        await db.analytics_upgrade_picks.insert_many(upgrades_list)
    if economy_list:
        await db.analytics_economy_events.insert_many(economy_list)
    
    return {
        'success': True,
        'generated': {
            'runs': len(runs),
            'upgrade_picks': len(upgrades_list),
            'economy_events': len(economy_list),
        }
    }


@simple_analytics_router.delete("/demo/clear")
async def clear_demo_data(api_key: str = Depends(verify_dashboard_key)):
    """Clear all analytics data"""
    db = get_db()
    
    await db.analytics_runs.delete_many({})
    await db.analytics_upgrade_picks.delete_many({})
    await db.analytics_economy_events.delete_many({})
    
    return {'success': True, 'message': 'All analytics data cleared'}


@simple_analytics_router.get("/health")
async def health():
    return {'status': 'healthy', 'service': 'analytics-simple'}
