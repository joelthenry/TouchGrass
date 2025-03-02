-- Sample Users
-- Note: These are hashed passwords using bcrypt, 'password' is the plain text for all
INSERT INTO users (username, email, password) VALUES
    ('flora_lover', 'flora@example.com', '$2a$10$rTMSN5kySB.jQn0z0bcu0ux8QVQFPUSJ6vn2jQb.sUzCxYFKSDBSK'),
    ('plant_expert', 'expert@example.com', '$2a$10$GkDS3kRT3cbSMZGsO.GQRei3EoQMVB8pNMrD.ZINdnxl8MqAb5o3.'),
    ('garden_guru', 'guru@example.com', '$2a$10$O1y.Ep75GaHIdVU/C0EdC.0SsH34.xCHN07y0OctrW0GiKTKFBPVK'),
    ('test', 'test@test.com', '$2a$10$7VGziq2gpcz9JE5SAdPHLu8H5l7pfppe3bcP.ghFOTpZjf6h9m0pq');

-- Sample Flowers
INSERT INTO flowers (name) VALUES
    ('Rose'),
    ('Tulip'),
    ('Daisy'),
    ('Sunflower'),
    ('Lily'),
    ('Orchid'),
    ('Dandelion'),
    ('Carnation'),
    ('Marigold'),
    ('Daffodil');

-- Sample Posts 
-- Note: The paths reference images in /uploads directory
-- Latitude/longitude are mostly around common botanical gardens
INSERT INTO posts (img, flower_id, user_id, latitude, longitude, created_at) VALUES
    ('/uploads/rose_garden.jpg', 1, 1, 40.7829, -73.9654, NOW() - interval '7 days'),
    ('/uploads/pretty_tulips.jpg', 2, 1, 40.7641, -73.9743, NOW() - interval '6 days'),
    ('/uploads/daisy_field.jpg', 3, 2, 37.7749, -122.4194, NOW() - interval '5 days'),
    ('/uploads/sunflower_tall.jpg', 4, 2, 34.0522, -118.2437, NOW() - interval '4 days'),
    ('/uploads/lily_pond.jpg', 5, 3, 51.5074, -0.1278, NOW() - interval '3 days'),
    ('/uploads/rare_orchid.jpg', 6, 3, 48.8566, 2.3522, NOW() - interval '2 days'),
    ('/uploads/dandelion_wish.jpg', 7, 1, 35.6762, 139.6503, NOW() - interval '1 day'),
    ('/uploads/carnation_pink.jpg', 8, 4, 39.9042, 116.4074, NOW()),
    ('/uploads/yellow_marigold.jpg', 9, 4, 19.4326, -99.1332, NOW()),
    ('/uploads/daffodil_spring.jpg', 10, 2, 55.9533, -3.1883, NOW()),
    ('/uploads/wild_rose.jpg', 1, 3, 41.8781, -87.6298, NOW()),
    ('/uploads/tulip_garden.jpg', 2, 4, 52.3676, 4.9041, NOW()),
    ('/uploads/daisy_bouquet.jpg', 3, 1, 59.3293, 18.0686, NOW()),
    ('/uploads/sunflower_field.jpg', 4, 3, 35.6895, 139.6917, NOW()),
    ('/uploads/lily_white.jpg', 5, 2, 43.6532, -79.3832, NOW());

-- Add some local data (Colorado coordinates) for demo purposes
INSERT INTO posts (img, flower_id, user_id, latitude, longitude, created_at) VALUES
    ('/uploads/colorado_columbine.jpg', 1, 4, 39.7392, -104.9903, NOW() - interval '2 days'),
    ('/uploads/boulder_tulips.jpg', 2, 1, 40.0150, -105.2705, NOW() - interval '1 day'),
    ('/uploads/denver_daisies.jpg', 3, 2, 39.7392, -104.9903, NOW()),
    ('/uploads/fort_collins_sunflower.jpg', 4, 3, 40.5853, -105.0844, NOW()),
    ('/uploads/garden_of_gods_flowers.jpg', 5, 4, 38.8783, -104.8672, NOW());