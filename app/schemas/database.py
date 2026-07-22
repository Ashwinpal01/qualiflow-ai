from pydantic import BaseModel, Field
from typing import Optional, List, Any


class DBConnectionStringRequest(BaseModel):
    provider: str
    connection_string: str
    db_name: Optional[str] = None


class DBHostPortRequest(BaseModel):
    provider: str
    host: str
    port: int = 5432
    database_name: str
    username: str
    password: str
    ssl_mode: Optional[str] = "prefer"
    db_name: Optional[str] = None


class DBApiKeyRequest(BaseModel):
    provider: str
    api_key: str
    endpoint_url: Optional[str] = None
    db_name: Optional[str] = None


class DBWebhookRequest(BaseModel):
    provider: str
    webhook_url: str
    auth_token: Optional[str] = None
    db_name: Optional[str] = None


class DBTestConnectionRequest(BaseModel):
    connection_type: str  # connection_string, host_port, api_key, webhook
    provider: str
    connection_string: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    api_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    webhook_url: Optional[str] = None


class DBTestConnectionResponse(BaseModel):
    success: bool
    status_message: str
    latency_ms: float
    provider: str
    database_version: Optional[str] = "v14.2 (Verified)"
    details: Optional[dict] = None


class ConnectedDatabaseItem(BaseModel):
    id: int
    name: str
    provider: str
    connection_type: str
    status: str
    last_sync: str
    records_count: int
