CREATE TABLE IF NOT EXISTS projects (
    project_id UUID,          -- Unique project identifier
    api_key String,           -- API key for authentication
    project_name String,      -- Friendly name for the project
    project_url String,       -- URL of the project
    created_at DateTime       -- Timestamp for project creation
)
ENGINE = MergeTree()
ORDER BY (project_id);

-- Add project_url column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_url String DEFAULT '';

-- Modify projects table to add DEFAULT now() to created_at
ALTER TABLE projects MODIFY COLUMN created_at DateTime DEFAULT now();

CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID,          -- Unique session identifier
    project_id UUID,          -- Link to project
    timestamp_start DateTime, -- When the session started
    page_url String,          -- URL of the session
    viewport_width UInt16,    -- Browser width
    viewport_height UInt16    -- Browser height
)
ENGINE = MergeTree()
ORDER BY (project_id, session_id);


CREATE TABLE IF NOT EXISTS events (
    event_id UUID,                -- Unique event identifier
    session_id UUID,              -- Link to session
    project_id UUID,              -- Link to project
    timestamp DateTime,           -- Event timestamp
    event_type Enum8('click' = 1, 'scroll' = 2, 'mousemove' = 3, 'dom_load' = 4, 'dom_unload' = 5), -- Event type
    element_id Nullable(String),  -- DOM element ID
    css_selector Nullable(String),-- Full CSS selector
    x_position Nullable(Float32), -- X-coordinate of the event
    y_position Nullable(Float32), -- Y-coordinate of the event
    metadata Nullable(String)     -- Additional data (e.g., JSON string)
)
ENGINE = MergeTree()
ORDER BY (project_id, session_id, timestamp);

CREATE TABLE IF NOT EXISTS recording_sessions (
    session_id UUID,          -- Unique session identifier
    project_id UUID,          -- Link to project
    start_timestamp DateTime, -- When the recording started
    end_timestamp Nullable(DateTime),  -- When the recording ended (if known)
    page_url String,          -- URL of the recorded page
    viewport_width UInt16,    -- Browser width
    viewport_height UInt16,   -- Browser height
    user_agent Nullable(String),
    referrer Nullable(String)
)
ENGINE = MergeTree()
ORDER BY (project_id, session_id);


CREATE TABLE IF NOT EXISTS recording_events (
    event_id UUID,                     -- Unique event identifier
    session_id UUID,                   -- Link to session
    project_id UUID,                   -- Link to project
    timestamp DateTime,                -- Event timestamp
    event_type Enum8('dom_snapshot' = 1, 'mutation' = 2, 'interaction' = 3),
    rrweb_data String                  -- Raw rrweb event data (JSON string)
)
ENGINE = MergeTree()
ORDER BY (project_id, session_id, timestamp);

CREATE TABLE IF NOT EXISTS users (
    user_id String,           -- Clerk user ID
    email String,            -- User's email
    created_at DateTime DEFAULT now(),     -- When the user was created
    name String             -- User's full name
)
ENGINE = MergeTree()
ORDER BY user_id;

-- Add user_id to projects table to link projects with users
CREATE TABLE IF NOT EXISTS user_projects (
    user_id String,          -- Clerk user ID
    project_id UUID,         -- Link to project
    role Enum8('owner' = 1, 'member' = 2),  -- User's role in the project
    created_at DateTime DEFAULT now()        -- When the user was added to the project
)
ENGINE = MergeTree()
ORDER BY (user_id, project_id);

-- Modify user_projects table to add DEFAULT now() to created_at
ALTER TABLE user_projects MODIFY COLUMN created_at DateTime DEFAULT now(); 


CREATE TABLE observability_sessions (
  session_id String,
  project_id String,
  start_timestamp DateTime,
  user_agent String,
  referrer String
)
ENGINE = MergeTree()
ORDER BY session_id;

CREATE TABLE observability_events (
  event_id String,
  session_id String,
  project_id String,
  event_type String,
  method String,
  url String,
  status UInt16,
  headers String,
  body String,
  payload String,
  timestamp DateTime
)
ENGINE = MergeTree()
ORDER BY timestamp;

CREATE TABLE IF NOT EXISTS chat_conversations (
    conversation_id UUID,
    user_id String,           -- Clerk user ID
    project_id UUID,          -- Link to project
    title String,             -- Title of the conversation
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now(),
    is_deleted UInt8 DEFAULT 0
)
ENGINE = MergeTree()
ORDER BY (user_id, conversation_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id UUID,
    conversation_id UUID,
    role Enum8('user' = 1, 'assistant' = 2, 'system' = 3),
    content String,
    timestamp DateTime DEFAULT now(),
    tool_invocations String DEFAULT '[]'  -- JSON array of tool invocations
)
ENGINE = MergeTree()
ORDER BY (conversation_id, timestamp);

CREATE TABLE IF NOT EXISTS project_invitations (
    invitation_id UUID,         -- Unique invitation identifier
    project_id UUID,           -- Link to project
    email String,              -- Invitee's email
    role Enum8('member' = 2),  -- Role they'll have when accepting
    status Enum8('pending' = 1, 'accepted' = 2, 'rejected' = 3),  -- Invitation status
    invited_by String,         -- Clerk user ID of inviter
    created_at DateTime DEFAULT now(),
    expires_at DateTime        -- When the invitation expires
)
ENGINE = MergeTree()
ORDER BY (project_id, email);

