-- Kích hoạt extension cho UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at NULL

);



-- Index để tìm kiếm user nhanh hơn khi kết bạn hoặc đăng nhập
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    title VARCHAR(100),
    phone VARCHAR(20),
    location TEXT,
    website TEXT,
    bio TEXT,
    short_description TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    hobbies JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    privacy VARCHAR(20) DEFAULT 'public',
    theme VARCHAR(32) DEFAULT 'light',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TYPE chat_type AS ENUM ('DM', 'GROUP');
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type chat_type NOT NULL DEFAULT 'DM',
    name VARCHAR(255), -- Có thể NULL nếu là DM
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TYPE participant_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TABLE participants (
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role participant_role DEFAULT 'MEMBER',
    
    -- Lưu ID tin nhắn cuối cùng đã đọc để tính Unread Count
    -- Message_id thường là UUID từ NoSQL (Cassandra/ScyllaDB)
    last_read_message_id UUID, 
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Khóa chính trên cả 2 cột
    PRIMARY KEY (conversation_id, user_id)
);

-- Index hỗ trợ query: "Lấy tất cả các phòng chat của User A"
CREATE INDEX idx_participants_user_id ON participants(user_id);

-- Enum type for friendship status
CREATE TYPE friendship_status AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- Friendships table
CREATE TABLE friendships (
    friendship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    addressee_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status        friendship_status NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT friendships_requester_addressee_check
        CHECK (requester_id <> addressee_id),
    CONSTRAINT friendships_requester_addressee_key
        UNIQUE (requester_id, addressee_id)
);

-- Indexes for fast lookup
CREATE INDEX idx_friendships_requester_id
    ON friendships (requester_id);

CREATE INDEX idx_friendships_addressee_id
    ON friendships (addressee_id);



