# Analytics Data Models

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class EventType(str, Enum):
    APP_OPEN = "app_open"
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    RUN_START = "run_start"
    RUN_END = "run_end"
    UPGRADE_SHOWN = "upgrade_shown"
    UPGRADE_SELECTED = "upgrade_selected"
    DAMAGE_TAKEN = "damage_taken"
    PERFECT_PULSE = "perfect_pulse"
    NEAR_MISS = "near_miss"
    PHASE_THROUGH = "phase_through"
    BLUEPRINTS_EARNED = "blueprints_earned"
    BLUEPRINTS_SPENT = "blueprints_spent"
    MASTERY_XP = "mastery_xp"
    FPS_SAMPLE = "fps_sample"
    ERROR = "error"
    SKIN_CREATED = "skin_created"
    SKIN_EQUIPPED = "skin_equipped"


class Platform(str, Enum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"


class AnalyticsEvent(BaseModel):
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    player_id: str
    session_id: str
    run_id: Optional[str] = None
    app_version: str = "1.0.0"
    platform: str = "web"
    device: Optional[str] = None
    locale: str = "en"
    seed: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class EventBatch(BaseModel):
    events: List[AnalyticsEvent]
    batch_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sent_at: datetime = Field(default_factory=datetime.utcnow)


class PlayerInfo(BaseModel):
    player_id: str
    first_seen: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    total_sessions: int = 0
    total_runs: int = 0
    platform: Optional[str] = None
    device: Optional[str] = None
    locale: str = "en"
    app_version: str = "1.0.0"


class SessionInfo(BaseModel):
    session_id: str
    player_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    runs_count: int = 0
    app_version: str = "1.0.0"
    platform: str = "web"
    device: Optional[str] = None


class RunInfo(BaseModel):
    run_id: str
    player_id: str
    session_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    score: int = 0
    blueprints_earned: int = 0
    perfect_pulses: int = 0
    near_misses: int = 0
    phase_throughs: int = 0
    damage_taken: int = 0
    death_cause: Optional[str] = None
    segment_reached: int = 1
    upgrades_selected: List[str] = Field(default_factory=list)
    seed: Optional[str] = None


# Dashboard Response Models
class LiveOverview(BaseModel):
    active_sessions: int
    runs_per_minute: float
    crash_rate: float
    avg_fps: float
    deaths_by_cause: Dict[str, int]
    recent_events: List[Dict[str, Any]]


class EngagementMetrics(BaseModel):
    sessions_per_user: float
    avg_session_duration: float
    funnel: Dict[str, int]
    retention_d1: float
    retention_d3: float
    retention_d7: float
    daily_active_users: int


class GameplayMetrics(BaseModel):
    score_distribution: List[Dict[str, Any]]
    segment_distribution: Dict[int, int]
    death_causes: Dict[str, int]
    perfect_pulse_rate: float
    near_miss_rate: float


class EconomyMetrics(BaseModel):
    blueprints_earned_total: int
    blueprints_spent_total: int
    avg_blueprints_per_run: float
    purchases_by_type: Dict[str, int]
    inflation_indicator: float


class UpgradeMetrics(BaseModel):
    shown_vs_picked: List[Dict[str, Any]]
    pick_rates: Dict[str, float]
    score_impact: Dict[str, float]
    synergy_frequency: Dict[str, int]


class PerformanceMetrics(BaseModel):
    fps_by_device: Dict[str, float]
    fps_by_platform: Dict[str, float]
    error_list: List[Dict[str, Any]]
    version_comparisons: Dict[str, Dict[str, Any]]


class DailySummary(BaseModel):
    date: str
    total_sessions: int
    total_runs: int
    unique_players: int
    avg_score: float
    blueprints_earned: int
    top_death_cause: str
    anomalies: List[Dict[str, Any]]
