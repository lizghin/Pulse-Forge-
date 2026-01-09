# Analytics Database - MongoDB Collections

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

# Collection names
COLLECTIONS = {
    'players': 'analytics_players',
    'sessions': 'analytics_sessions',
    'runs': 'analytics_runs',
    'events': 'analytics_events',
}


class AnalyticsDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.players = db[COLLECTIONS['players']]
        self.sessions = db[COLLECTIONS['sessions']]
        self.runs = db[COLLECTIONS['runs']]
        self.events = db[COLLECTIONS['events']]
    
    async def ensure_indexes(self):
        """Create indexes for better query performance"""
        try:
            # Players indexes
            await self.players.create_index('player_id', unique=True)
            await self.players.create_index('last_seen')
            
            # Sessions indexes
            await self.sessions.create_index('session_id', unique=True)
            await self.sessions.create_index('player_id')
            await self.sessions.create_index('started_at')
            
            # Runs indexes
            await self.runs.create_index('run_id', unique=True)
            await self.runs.create_index('player_id')
            await self.runs.create_index('session_id')
            await self.runs.create_index('started_at')
            
            # Events indexes
            await self.events.create_index([('timestamp', -1)])
            await self.events.create_index('event_type')
            await self.events.create_index('player_id')
            await self.events.create_index('session_id')
            await self.events.create_index('run_id')
            await self.events.create_index([('event_type', 1), ('timestamp', -1)])
            
            logger.info("Analytics indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    # ==================== WRITE OPERATIONS ====================
    
    async def upsert_player(self, player_id: str, data: Dict[str, Any]):
        """Create or update player record"""
        await self.players.update_one(
            {'player_id': player_id},
            {
                '$set': {
                    'player_id': player_id,
                    'last_seen': datetime.utcnow(),
                    **data
                },
                '$setOnInsert': {
                    'first_seen': datetime.utcnow()
                },
                '$inc': {'total_sessions': 0}
            },
            upsert=True
        )
    
    async def create_session(self, session_data: Dict[str, Any]):
        """Create a new session record"""
        session_data['started_at'] = datetime.utcnow()
        await self.sessions.insert_one(session_data)
        await self.players.update_one(
            {'player_id': session_data['player_id']},
            {'$inc': {'total_sessions': 1}}
        )
    
    async def end_session(self, session_id: str):
        """Mark session as ended"""
        session = await self.sessions.find_one({'session_id': session_id})
        if session:
            ended_at = datetime.utcnow()
            duration = int((ended_at - session['started_at']).total_seconds())
            await self.sessions.update_one(
                {'session_id': session_id},
                {'$set': {'ended_at': ended_at, 'duration_seconds': duration}}
            )
    
    async def create_run(self, run_data: Dict[str, Any]):
        """Create a new run record"""
        run_data['started_at'] = datetime.utcnow()
        await self.runs.insert_one(run_data)
        await self.players.update_one(
            {'player_id': run_data['player_id']},
            {'$inc': {'total_runs': 1}}
        )
        await self.sessions.update_one(
            {'session_id': run_data['session_id']},
            {'$inc': {'runs_count': 1}}
        )
    
    async def end_run(self, run_id: str, run_data: Dict[str, Any]):
        """Update run with final data"""
        run = await self.runs.find_one({'run_id': run_id})
        if run:
            ended_at = datetime.utcnow()
            duration = int((ended_at - run['started_at']).total_seconds())
            await self.runs.update_one(
                {'run_id': run_id},
                {'$set': {
                    'ended_at': ended_at,
                    'duration_seconds': duration,
                    **run_data
                }}
            )
    
    async def insert_events(self, events: List[Dict[str, Any]]):
        """Bulk insert events"""
        if events:
            await self.events.insert_many(events)
    
    # ==================== READ OPERATIONS (Dashboard) ====================
    
    async def get_live_stats(self, minutes: int = 15) -> Dict[str, Any]:
        """Get stats for the last N minutes"""
        since = datetime.utcnow() - timedelta(minutes=minutes)
        
        # Active sessions (started but not ended in timeframe)
        active_sessions = await self.sessions.count_documents({
            'started_at': {'$gte': since},
            'ended_at': None
        })
        
        # Runs in timeframe
        runs_count = await self.runs.count_documents({
            'started_at': {'$gte': since}
        })
        runs_per_minute = runs_count / minutes if minutes > 0 else 0
        
        # Error rate
        total_events = await self.events.count_documents({'timestamp': {'$gte': since}})
        error_events = await self.events.count_documents({
            'timestamp': {'$gte': since},
            'event_type': 'error'
        })
        crash_rate = (error_events / total_events * 100) if total_events > 0 else 0
        
        # FPS samples
        fps_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'fps_sample'}},
            {'$group': {'_id': None, 'avg_fps': {'$avg': '$properties.fps'}}}
        ]
        fps_result = await self.events.aggregate(fps_pipeline).to_list(1)
        avg_fps = fps_result[0]['avg_fps'] if fps_result else 60.0
        
        # Deaths by cause
        death_pipeline = [
            {'$match': {'started_at': {'$gte': since}, 'death_cause': {'$ne': None}}},
            {'$group': {'_id': '$death_cause', 'count': {'$sum': 1}}}
        ]
        deaths = await self.runs.aggregate(death_pipeline).to_list(100)
        deaths_by_cause = {d['_id']: d['count'] for d in deaths}
        
        # Recent events
        recent = await self.events.find(
            {'timestamp': {'$gte': since}}
        ).sort('timestamp', -1).limit(20).to_list(20)
        
        return {
            'active_sessions': active_sessions,
            'runs_per_minute': round(runs_per_minute, 2),
            'crash_rate': round(crash_rate, 2),
            'avg_fps': round(avg_fps, 1),
            'deaths_by_cause': deaths_by_cause,
            'recent_events': recent
        }
    
    async def get_engagement_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get engagement and retention metrics"""
        since = datetime.utcnow() - timedelta(days=days)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Sessions per user
        session_pipeline = [
            {'$match': {'started_at': {'$gte': since}}},
            {'$group': {'_id': '$player_id', 'sessions': {'$sum': 1}}},
            {'$group': {'_id': None, 'avg_sessions': {'$avg': '$sessions'}}}
        ]
        session_result = await self.sessions.aggregate(session_pipeline).to_list(1)
        sessions_per_user = session_result[0]['avg_sessions'] if session_result else 0
        
        # Avg session duration
        duration_pipeline = [
            {'$match': {'started_at': {'$gte': since}, 'duration_seconds': {'$ne': None}}},
            {'$group': {'_id': None, 'avg_duration': {'$avg': '$duration_seconds'}}}
        ]
        duration_result = await self.sessions.aggregate(duration_pipeline).to_list(1)
        avg_duration = duration_result[0]['avg_duration'] if duration_result else 0
        
        # Funnel: app_open -> run_start -> run_end
        app_opens = await self.events.count_documents({
            'timestamp': {'$gte': since},
            'event_type': 'app_open'
        })
        run_starts = await self.events.count_documents({
            'timestamp': {'$gte': since},
            'event_type': 'run_start'
        })
        run_ends = await self.events.count_documents({
            'timestamp': {'$gte': since},
            'event_type': 'run_end'
        })
        
        funnel = {
            'app_open': app_opens,
            'run_start': run_starts,
            'run_end': run_ends
        }
        
        # Retention cohorts
        async def get_retention(cohort_days_ago: int, return_days: int) -> float:
            cohort_start = today - timedelta(days=cohort_days_ago)
            cohort_end = cohort_start + timedelta(days=1)
            return_start = cohort_start + timedelta(days=return_days)
            return_end = return_start + timedelta(days=1)
            
            # Players who started on cohort day
            cohort_pipeline = [
                {'$match': {'first_seen': {'$gte': cohort_start, '$lt': cohort_end}}},
                {'$project': {'player_id': 1}}
            ]
            cohort_players = await self.players.aggregate(cohort_pipeline).to_list(10000)
            cohort_ids = [p['player_id'] for p in cohort_players]
            
            if not cohort_ids:
                return 0.0
            
            # Check who returned
            returned = await self.sessions.count_documents({
                'player_id': {'$in': cohort_ids},
                'started_at': {'$gte': return_start, '$lt': return_end}
            })
            
            return round((returned / len(cohort_ids)) * 100, 1)
        
        # DAU
        dau = await self.sessions.distinct('player_id', {'started_at': {'$gte': today}})
        
        return {
            'sessions_per_user': round(sessions_per_user, 2),
            'avg_session_duration': round(avg_duration, 0),
            'funnel': funnel,
            'retention_d1': await get_retention(1, 1),
            'retention_d3': await get_retention(3, 3),
            'retention_d7': await get_retention(7, 7),
            'daily_active_users': len(dau)
        }
    
    async def get_gameplay_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get gameplay balance metrics"""
        since = datetime.utcnow() - timedelta(days=days)
        
        # Score distribution (buckets of 500)
        score_pipeline = [
            {'$match': {'started_at': {'$gte': since}, 'score': {'$gt': 0}}},
            {'$bucket': {
                'groupBy': '$score',
                'boundaries': [0, 500, 1000, 2000, 3000, 5000, 10000, 50000],
                'default': 'other',
                'output': {'count': {'$sum': 1}}
            }}
        ]
        score_dist = await self.runs.aggregate(score_pipeline).to_list(100)
        
        # Segment reached distribution
        segment_pipeline = [
            {'$match': {'started_at': {'$gte': since}}},
            {'$group': {'_id': '$segment_reached', 'count': {'$sum': 1}}}
        ]
        segment_dist = await self.runs.aggregate(segment_pipeline).to_list(100)
        
        # Death causes
        death_pipeline = [
            {'$match': {'started_at': {'$gte': since}, 'death_cause': {'$ne': None}}},
            {'$group': {'_id': '$death_cause', 'count': {'$sum': 1}}}
        ]
        deaths = await self.runs.aggregate(death_pipeline).to_list(100)
        
        # Perfect pulse / near miss rates
        totals_pipeline = [
            {'$match': {'started_at': {'$gte': since}}},
            {'$group': {
                '_id': None,
                'total_runs': {'$sum': 1},
                'total_perfect': {'$sum': '$perfect_pulses'},
                'total_near_miss': {'$sum': '$near_misses'}
            }}
        ]
        totals = await self.runs.aggregate(totals_pipeline).to_list(1)
        
        perfect_rate = 0
        near_miss_rate = 0
        if totals and totals[0]['total_runs'] > 0:
            perfect_rate = totals[0]['total_perfect'] / totals[0]['total_runs']
            near_miss_rate = totals[0]['total_near_miss'] / totals[0]['total_runs']
        
        return {
            'score_distribution': score_dist,
            'segment_distribution': {s['_id']: s['count'] for s in segment_dist if s['_id']},
            'death_causes': {d['_id']: d['count'] for d in deaths},
            'perfect_pulse_rate': round(perfect_rate, 2),
            'near_miss_rate': round(near_miss_rate, 2)
        }
    
    async def get_economy_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get economy balance metrics"""
        since = datetime.utcnow() - timedelta(days=days)
        
        # Total blueprints earned
        earned_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'blueprints_earned'}},
            {'$group': {'_id': None, 'total': {'$sum': '$properties.amount'}}}
        ]
        earned = await self.events.aggregate(earned_pipeline).to_list(1)
        total_earned = earned[0]['total'] if earned else 0
        
        # Total blueprints spent
        spent_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'blueprints_spent'}},
            {'$group': {'_id': None, 'total': {'$sum': '$properties.amount'}}}
        ]
        spent = await self.events.aggregate(spent_pipeline).to_list(1)
        total_spent = spent[0]['total'] if spent else 0
        
        # Avg per run
        runs_count = await self.runs.count_documents({'started_at': {'$gte': since}})
        avg_per_run = total_earned / runs_count if runs_count > 0 else 0
        
        # Purchases by type
        purchases_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'blueprints_spent'}},
            {'$group': {'_id': '$properties.item_type', 'count': {'$sum': 1}}}
        ]
        purchases = await self.events.aggregate(purchases_pipeline).to_list(100)
        
        # Inflation indicator (earned/spent ratio)
        inflation = (total_earned / total_spent) if total_spent > 0 else float('inf')
        
        return {
            'blueprints_earned_total': total_earned,
            'blueprints_spent_total': total_spent,
            'avg_blueprints_per_run': round(avg_per_run, 1),
            'purchases_by_type': {p['_id']: p['count'] for p in purchases if p['_id']},
            'inflation_indicator': round(inflation, 2) if inflation != float('inf') else -1
        }
    
    async def get_upgrade_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get upgrade balance metrics"""
        since = datetime.utcnow() - timedelta(days=days)
        
        # Shown vs picked
        shown_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'upgrade_shown'}},
            {'$group': {'_id': '$properties.upgrade_id', 'shown': {'$sum': 1}}}
        ]
        shown = await self.events.aggregate(shown_pipeline).to_list(100)
        shown_map = {s['_id']: s['shown'] for s in shown if s['_id']}
        
        picked_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'upgrade_selected'}},
            {'$group': {'_id': '$properties.upgrade_id', 'picked': {'$sum': 1}}}
        ]
        picked = await self.events.aggregate(picked_pipeline).to_list(100)
        picked_map = {p['_id']: p['picked'] for p in picked if p['_id']}
        
        # Combine into shown_vs_picked
        all_upgrades = set(shown_map.keys()) | set(picked_map.keys())
        shown_vs_picked = []
        pick_rates = {}
        
        for upgrade in all_upgrades:
            s = shown_map.get(upgrade, 0)
            p = picked_map.get(upgrade, 0)
            rate = (p / s * 100) if s > 0 else 0
            shown_vs_picked.append({
                'upgrade_id': upgrade,
                'shown': s,
                'picked': p,
                'pick_rate': round(rate, 1)
            })
            pick_rates[upgrade] = round(rate, 1)
        
        # Score impact (avg score when upgrade was selected)
        impact_pipeline = [
            {'$match': {'started_at': {'$gte': since}}},
            {'$unwind': '$upgrades_selected'},
            {'$group': {
                '_id': '$upgrades_selected',
                'avg_score': {'$avg': '$score'}
            }}
        ]
        impact = await self.runs.aggregate(impact_pipeline).to_list(100)
        score_impact = {i['_id']: round(i['avg_score'], 0) for i in impact if i['_id']}
        
        return {
            'shown_vs_picked': sorted(shown_vs_picked, key=lambda x: x['picked'], reverse=True),
            'pick_rates': pick_rates,
            'score_impact': score_impact,
            'synergy_frequency': {}  # TODO: Implement synergy tracking
        }
    
    async def get_performance_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get performance and QA metrics"""
        since = datetime.utcnow() - timedelta(days=days)
        
        # FPS by device
        fps_device_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'fps_sample'}},
            {'$group': {'_id': '$device', 'avg_fps': {'$avg': '$properties.fps'}}}
        ]
        fps_device = await self.events.aggregate(fps_device_pipeline).to_list(100)
        
        # FPS by platform
        fps_platform_pipeline = [
            {'$match': {'timestamp': {'$gte': since}, 'event_type': 'fps_sample'}},
            {'$group': {'_id': '$platform', 'avg_fps': {'$avg': '$properties.fps'}}}
        ]
        fps_platform = await self.events.aggregate(fps_platform_pipeline).to_list(100)
        
        # Error list
        errors = await self.events.find(
            {'timestamp': {'$gte': since}, 'event_type': 'error'}
        ).sort('timestamp', -1).limit(50).to_list(50)
        
        # Version comparisons
        version_pipeline = [
            {'$match': {'started_at': {'$gte': since}}},
            {'$group': {
                '_id': '$app_version',
                'runs': {'$sum': 1},
                'avg_score': {'$avg': '$score'},
                'crash_count': {'$sum': {'$cond': [{'$ne': ['$death_cause', None]}, 1, 0]}}
            }}
        ]
        # Actually this should be from sessions
        version_session_pipeline = [
            {'$match': {'started_at': {'$gte': since}}},
            {'$group': {
                '_id': '$app_version',
                'sessions': {'$sum': 1},
                'avg_duration': {'$avg': '$duration_seconds'}
            }}
        ]
        versions = await self.sessions.aggregate(version_session_pipeline).to_list(100)
        
        return {
            'fps_by_device': {f['_id'] or 'unknown': round(f['avg_fps'], 1) for f in fps_device},
            'fps_by_platform': {f['_id'] or 'unknown': round(f['avg_fps'], 1) for f in fps_platform},
            'error_list': errors,
            'version_comparisons': {v['_id']: {'sessions': v['sessions'], 'avg_duration': round(v.get('avg_duration') or 0, 0)} for v in versions}
        }
    
    async def get_daily_summary(self, date: datetime = None) -> Dict[str, Any]:
        """Get daily summary with anomaly detection"""
        if date is None:
            date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        day_start = date
        day_end = date + timedelta(days=1)
        prev_day_start = date - timedelta(days=1)
        
        # Today's stats
        sessions_today = await self.sessions.count_documents({
            'started_at': {'$gte': day_start, '$lt': day_end}
        })
        runs_today = await self.runs.count_documents({
            'started_at': {'$gte': day_start, '$lt': day_end}
        })
        players_today = len(await self.sessions.distinct('player_id', {
            'started_at': {'$gte': day_start, '$lt': day_end}
        }))
        
        # Avg score
        score_pipeline = [
            {'$match': {'started_at': {'$gte': day_start, '$lt': day_end}}},
            {'$group': {'_id': None, 'avg': {'$avg': '$score'}}}
        ]
        scores = await self.runs.aggregate(score_pipeline).to_list(1)
        avg_score = scores[0]['avg'] if scores else 0
        
        # Blueprints
        bp_pipeline = [
            {'$match': {'started_at': {'$gte': day_start, '$lt': day_end}}},
            {'$group': {'_id': None, 'total': {'$sum': '$blueprints_earned'}}}
        ]
        bp = await self.runs.aggregate(bp_pipeline).to_list(1)
        blueprints = bp[0]['total'] if bp else 0
        
        # Top death cause
        death_pipeline = [
            {'$match': {'started_at': {'$gte': day_start, '$lt': day_end}, 'death_cause': {'$ne': None}}},
            {'$group': {'_id': '$death_cause', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 1}
        ]
        deaths = await self.runs.aggregate(death_pipeline).to_list(1)
        top_death = deaths[0]['_id'] if deaths else 'none'
        
        # Yesterday's stats for comparison (anomaly detection)
        sessions_yesterday = await self.sessions.count_documents({
            'started_at': {'$gte': prev_day_start, '$lt': day_start}
        })
        
        anomalies = []
        if sessions_yesterday > 0:
            change = ((sessions_today - sessions_yesterday) / sessions_yesterday) * 100
            if abs(change) > 30:
                anomalies.append({
                    'type': 'sessions',
                    'change': round(change, 1),
                    'message': f"Sessions {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))}%"
                })
        
        return {
            'date': date.strftime('%Y-%m-%d'),
            'total_sessions': sessions_today,
            'total_runs': runs_today,
            'unique_players': players_today,
            'avg_score': round(avg_score, 0),
            'blueprints_earned': blueprints,
            'top_death_cause': top_death,
            'anomalies': anomalies
        }
    
    async def get_filtered_data(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get data with applied filters"""
        match_query = {}
        
        if 'date_from' in filters and filters['date_from']:
            match_query['timestamp'] = {'$gte': filters['date_from']}
        if 'date_to' in filters and filters['date_to']:
            match_query.setdefault('timestamp', {})['$lte'] = filters['date_to']
        if 'app_version' in filters and filters['app_version']:
            match_query['app_version'] = filters['app_version']
        if 'platform' in filters and filters['platform']:
            match_query['platform'] = filters['platform']
        if 'device' in filters and filters['device']:
            match_query['device'] = filters['device']
        
        return match_query
