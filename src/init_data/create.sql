CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16) NOT NULL,
    email VARCHAR(40) NOT NUll,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    img TEXT,
    flower_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS Flowers ( 
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
);

ALTER TABLE posts
ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES users (id);
ADD CONSTRAINT flower_id FOREIGN KEY (flower_id) REFERENCES flowers (id);