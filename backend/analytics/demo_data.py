# Demo Data Generator for Analytics Dashboard

import asyncio
import random
from datetime import datetime, timedelta
from typing import List
import uuid

from .database import AnalyticsDB

# Game constants
UPGRADES = [
    'pulse_range', 'pulse_power', 'charge_speed', 'phase_duration', 'phase_cooldown',
    'magnet_range', 'shield', 'double_jump', 'slow_motion', 'overdrive',
    'regeneration', 'extra_life', 'score_multiplier', 'shard_magnet', 'heat_sink'
]

DEATH_CAUSES = ['wall', 'drone', 'laser', 'timeout', 'overheat']

DEVICES = ['iPhone 14', 'iPhone 15 Pro', 'Pixel 7', 'Samsung S23', 'iPad Pro', 'Chrome Desktop', 'Safari Desktop']

PLATFORMS = ['ios', 'android', 'web']

VERSIONS = ['1.0.0', '1.0.1', '1.1.0']

LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'pt']


async def generate_demo_data(db: AnalyticsDB, days: int = 14, players: int = 100):
    """Generate realistic demo data for testing the dashboard"""
    print(f"Generating demo data: {days} days, {players} players")
    
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # Generate players
    player_ids = [str(uuid.uuid4()) for _ in range(players)]
    
    all_events = []
    all_sessions = []
    all_runs = []
    
    for day_offset in range(days):
        day_start = start_date + timedelta(days=day_offset)
        
        # Daily variation (weekends have more players)
        day_of_week = day_start.weekday()
        daily_multiplier = 1.3 if day_of_week >= 5 else 1.0
        
        # Active players for this day (70-100% of total)
        active_count = int(len(player_ids) * random.uniform(0.7, 1.0) * daily_multiplier)
        active_players = random.sample(player_ids, min(active_count, len(player_ids)))
        
        for player_id in active_players:
            # Each player has 1-3 sessions per day
            sessions_count = random.choices([1, 2, 3], weights=[0.5, 0.35, 0.15])[0]
            
            for session_num in range(sessions_count):
                session_id = str(uuid.uuid4())
                session_start = day_start + timedelta(
                    hours=random.randint(6, 23),
                    minutes=random.randint(0, 59)
                )
                
                platform = random.choice(PLATFORMS)
                device = random.choice([d for d in DEVICES if 
                    (platform == 'ios' and 'iPhone' in d or 'iPad' in d) or
                    (platform == 'android' and ('Pixel' in d or 'Samsung' in d)) or
                    (platform == 'web' and 'Desktop' in d)
                ] or DEVICES)
                app_version = random.choice(VERSIONS)
                locale = random.choice(LOCALES)
                
                # Session start event
                all_events.append({
                    'event_type': 'session_start',
                    'timestamp': session_start,
                    'player_id': player_id,
                    'session_id': session_id,
                    'app_version': app_version,
                    'platform': platform,
                    'device': device,
                    'locale': locale,
                    'properties': {}
                })
                
                # App open event
                all_events.append({
                    'event_type': 'app_open',
                    'timestamp': session_start,
                    'player_id': player_id,
                    'session_id': session_id,
                    'app_version': app_version,
                    'platform': platform,
                    'device': device,
                    'locale': locale,
                    'properties': {}
                })
                
                # Session duration (5-45 minutes)
                session_duration = random.randint(300, 2700)
                session_end = session_start + timedelta(seconds=session_duration)
                
                # 1-5 runs per session
                runs_in_session = random.randint(1, 5)
                run_start_time = session_start + timedelta(seconds=30)
                
                for run_num in range(runs_in_session):
                    if run_start_time >= session_end:
                        break
                    
                    run_id = str(uuid.uuid4())
                    
                    # Run start
                    all_events.append({
                        'event_type': 'run_start',
                        'timestamp': run_start_time,
                        'player_id': player_id,
                        'session_id': session_id,
                        'run_id': run_id,
                        'app_version': app_version,
                        'platform': platform,
                        'device': device,
                        'locale': locale,
                        'properties': {}
                    })
                    
                    # Run duration (30-90 seconds)
                    run_duration = random.randint(30, 90)
                    
                    # Skill level affects metrics
                    skill = random.uniform(0.3, 1.0)
                    
                    # Score based on skill and duration
                    base_score = int(run_duration * 50 * skill)
                    score = base_score + random.randint(-200, 500)
                    score = max(100, score)
                    
                    # Perfect pulses (skill based)
                    perfect_pulses = int(random.uniform(0, 15) * skill)
                    
                    # Near misses
                    near_misses = random.randint(0, 10)
                    
                    # Phase throughs
                    phase_throughs = random.randint(0, 5)
                    
                    # Damage taken (inverse of skill)
                    damage_taken = random.randint(0, int(5 * (1 - skill) + 1))
                    
                    # Death cause
                    death_cause = random.choices(
                        DEATH_CAUSES,
                        weights=[0.35, 0.25, 0.2, 0.1, 0.1]
                    )[0]
                    
                    # Segment reached (1-6 based on duration)
                    segment_reached = min(6, 1 + run_duration // 15)
                    
                    # Upgrades selected
                    upgrade_count = min(6, run_duration // 15)
                    upgrades_selected = random.sample(UPGRADES, upgrade_count)
                    
                    # Blueprints earned
                    blueprints = int(score / 100) + random.randint(0, 10)
                    
                    # Generate in-run events
                    run_time = run_start_time
                    
                    # Perfect pulse events
                    for _ in range(perfect_pulses):
                        run_time += timedelta(seconds=random.randint(2, 8))
                        if run_time < run_start_time + timedelta(seconds=run_duration):
                            all_events.append({
                                'event_type': 'perfect_pulse',
                                'timestamp': run_time,
                                'player_id': player_id,
                                'session_id': session_id,
                                'run_id': run_id,
                                'app_version': app_version,
                                'platform': platform,
                                'device': device,
                                'locale': locale,
                                'properties': {'count': 1}
                            })
                    
                    # Upgrade shown/selected events
                    for i, upgrade in enumerate(upgrades_selected):
                        upgrade_time = run_start_time + timedelta(seconds=15 * (i + 1))
                        if upgrade_time < run_start_time + timedelta(seconds=run_duration):
                            # Shown (3 options)
                            shown_options = [upgrade] + random.sample(
                                [u for u in UPGRADES if u != upgrade], 2
                            )
                            for shown in shown_options:
                                all_events.append({
                                    'event_type': 'upgrade_shown',
                                    'timestamp': upgrade_time,
                                    'player_id': player_id,
                                    'session_id': session_id,
                                    'run_id': run_id,
                                    'app_version': app_version,
                                    'platform': platform,
                                    'device': device,
                                    'locale': locale,
                                    'properties': {'upgrade_id': shown}
                                })
                            
                            # Selected
                            all_events.append({
                                'event_type': 'upgrade_selected',
                                'timestamp': upgrade_time + timedelta(seconds=2),
                                'player_id': player_id,
                                'session_id': session_id,
                                'run_id': run_id,
                                'app_version': app_version,
                                'platform': platform,
                                'device': device,
                                'locale': locale,
                                'properties': {'upgrade_id': upgrade}
                            })
                    
                    # FPS samples (every 10 seconds)
                    for sec in range(0, run_duration, 10):
                        fps = random.gauss(55, 8)  # Mean 55, std 8
                        fps = max(20, min(60, fps))
                        all_events.append({
                            'event_type': 'fps_sample',
                            'timestamp': run_start_time + timedelta(seconds=sec),
                            'player_id': player_id,
                            'session_id': session_id,
                            'run_id': run_id,
                            'app_version': app_version,
                            'platform': platform,
                            'device': device,
                            'locale': locale,
                            'properties': {'fps': round(fps, 1)}
                        })
                    
                    # Run end
                    run_end_time = run_start_time + timedelta(seconds=run_duration)
                    all_events.append({
                        'event_type': 'run_end',
                        'timestamp': run_end_time,
                        'player_id': player_id,
                        'session_id': session_id,
                        'run_id': run_id,
                        'app_version': app_version,
                        'platform': platform,
                        'device': device,
                        'locale': locale,
                        'properties': {
                            'score': score,
                            'blueprints_earned': blueprints,
                            'perfect_pulses': perfect_pulses,
                            'near_misses': near_misses,
                            'phase_throughs': phase_throughs,
                            'damage_taken': damage_taken,
                            'death_cause': death_cause,
                            'segment_reached': segment_reached,
                            'upgrades_selected': upgrades_selected
                        }
                    })
                    
                    # Blueprints earned event
                    all_events.append({
                        'event_type': 'blueprints_earned',
                        'timestamp': run_end_time,
                        'player_id': player_id,
                        'session_id': session_id,
                        'run_id': run_id,
                        'app_version': app_version,
                        'platform': platform,
                        'device': device,
                        'locale': locale,
                        'properties': {'amount': blueprints}
                    })
                    
                    # Store run data
                    all_runs.append({
                        'run_id': run_id,
                        'player_id': player_id,
                        'session_id': session_id,
                        'started_at': run_start_time,
                        'ended_at': run_end_time,
                        'duration_seconds': run_duration,
                        'score': score,
                        'blueprints_earned': blueprints,
                        'perfect_pulses': perfect_pulses,
                        'near_misses': near_misses,
                        'phase_throughs': phase_throughs,
                        'damage_taken': damage_taken,
                        'death_cause': death_cause,
                        'segment_reached': segment_reached,
                        'upgrades_selected': upgrades_selected,
                        'app_version': app_version
                    })
                    
                    # Next run starts after a short break
                    run_start_time = run_end_time + timedelta(seconds=random.randint(10, 60))
                
                # Occasionally spend blueprints
                if random.random() < 0.2:
                    item_types = ['upgrade', 'cosmetic', 'theme']
                    all_events.append({
                        'event_type': 'blueprints_spent',
                        'timestamp': session_end - timedelta(seconds=30),
                        'player_id': player_id,
                        'session_id': session_id,
                        'app_version': app_version,
                        'platform': platform,
                        'device': device,
                        'locale': locale,
                        'properties': {
                            'amount': random.choice([50, 100, 200, 500]),
                            'item_type': random.choice(item_types)
                        }
                    })
                
                # Session end event
                all_events.append({
                    'event_type': 'session_end',
                    'timestamp': session_end,
                    'player_id': player_id,
                    'session_id': session_id,
                    'app_version': app_version,
                    'platform': platform,
                    'device': device,
                    'locale': locale,
                    'properties': {}
                })
                
                # Store session data
                all_sessions.append({
                    'session_id': session_id,
                    'player_id': player_id,
                    'started_at': session_start,
                    'ended_at': session_end,
                    'duration_seconds': session_duration,
                    'app_version': app_version,
                    'platform': platform,
                    'device': device,
                    'runs_count': len([r for r in all_runs if r['session_id'] == session_id])
                })
                
                # Random errors (0.5% chance per session)
                if random.random() < 0.005:
                    all_events.append({
                        'event_type': 'error',
                        'timestamp': session_start + timedelta(seconds=random.randint(60, session_duration)),
                        'player_id': player_id,
                        'session_id': session_id,
                        'app_version': app_version,
                        'platform': platform,
                        'device': device,
                        'locale': locale,
                        'properties': {
                            'error_type': random.choice(['render_error', 'network_error', 'state_error']),
                            'message': 'Simulated error for demo'
                        }
                    })
    
    # Insert all data
    print(f"Inserting {len(all_events)} events...")
    if all_events:
        # Batch insert in chunks
        chunk_size = 1000
        for i in range(0, len(all_events), chunk_size):
            chunk = all_events[i:i + chunk_size]
            await db.events.insert_many(chunk)
    
    print(f"Inserting {len(all_sessions)} sessions...")
    if all_sessions:
        await db.sessions.insert_many(all_sessions)
    
    print(f"Inserting {len(all_runs)} runs...")
    if all_runs:
        await db.runs.insert_many(all_runs)
    
    # Upsert players
    print(f"Upserting {len(player_ids)} players...")
    for player_id in player_ids:
        player_sessions = [s for s in all_sessions if s['player_id'] == player_id]
        player_runs = [r for r in all_runs if r['player_id'] == player_id]
        
        if player_sessions:
            first_session = min(player_sessions, key=lambda s: s['started_at'])
            last_session = max(player_sessions, key=lambda s: s['started_at'])
            
            await db.players.update_one(
                {'player_id': player_id},
                {
                    '$set': {
                        'player_id': player_id,
                        'first_seen': first_session['started_at'],
                        'last_seen': last_session['ended_at'],
                        'total_sessions': len(player_sessions),
                        'total_runs': len(player_runs),
                        'platform': first_session['platform'],
                        'device': first_session['device'],
                        'app_version': first_session['app_version']
                    }
                },
                upsert=True
            )
    
    print("Demo data generation complete!")
    return {
        'events': len(all_events),
        'sessions': len(all_sessions),
        'runs': len(all_runs),
        'players': len(player_ids)
    }


async def clear_demo_data(db: AnalyticsDB):
    """Clear all analytics data"""
    await db.events.delete_many({})
    await db.sessions.delete_many({})
    await db.runs.delete_many({})
    await db.players.delete_many({})
    print("All demo data cleared!")
