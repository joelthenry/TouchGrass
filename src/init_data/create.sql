CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16) NOT NULL,
    email VARCHAR(40) NOT NUll,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS flowers ( 
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    img TEXT,
    flower_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE posts
ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE posts
ADD CONSTRAINT fk_flower_id FOREIGN KEY (flower_id) REFERENCES flowers (id);