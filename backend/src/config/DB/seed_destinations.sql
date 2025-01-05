-- Seed data for Destinations table
USE TripBookingSystem;
GO

-- Clear existing data
DELETE FROM Distances;
DELETE FROM Destinations;
DBCC CHECKIDENT ('Destinations', RESEED, 0);
GO

-- Insert destinations
INSERT INTO Destinations (name, province, region, description)
VALUES
-- Major cities
('Colombo', 'Western', 'Western Coast', 'The commercial capital and largest city of Sri Lanka, featuring a mix of colonial architecture, modern skyscrapers, and vibrant street life.'),
('Kandy', 'Central', 'Hill Country', 'The cultural capital of Sri Lanka, home to the Temple of the Sacred Tooth Relic and surrounded by beautiful hills and tea plantations.'),
('Galle', 'Southern', 'Southern Coast', 'A historic city with a well-preserved Dutch fort, colonial architecture, and beautiful beaches nearby.'),
('Anuradhapura', 'North Central', 'Cultural Triangle', 'An ancient city with well-preserved ruins of an ancient Sinhalese civilization, including dagobas, temples, and palaces.'),
('Jaffna', 'Northern', 'Northern Peninsula', 'The cultural capital of Sri Lankan Tamils, featuring unique culture, cuisine, and historic sites.'),
('Trincomalee', 'Eastern', 'Eastern Coast', 'A port city with beautiful beaches, natural harbors, and historical sites.'),
('Nuwara Eliya', 'Central', 'Hill Country', 'A city in the tea country hills with a cool climate, known as "Little England" for its colonial architecture.'),
('Polonnaruwa', 'North Central', 'Cultural Triangle', 'The second most ancient kingdom of Sri Lanka, featuring well-preserved ruins and archaeological sites.'),
('Batticaloa', 'Eastern', 'Eastern Coast', 'A city known for its lagoons, beaches, and cultural heritage.'),
('Negombo', 'Western', 'Western Coast', 'A beach town close to the international airport, known for its fishing industry and resorts.'),

-- Beach destinations
('Mirissa', 'Southern', 'Southern Coast', 'A beach town known for whale watching, surfing, and relaxed atmosphere.'),
('Arugam Bay', 'Eastern', 'Eastern Coast', 'One of the best surfing spots in Sri Lanka with a laid-back vibe.'),
('Unawatuna', 'Southern', 'Southern Coast', 'A beach resort town with golden sand, coral reefs, and palm trees.'),
('Pasikuda', 'Eastern', 'Eastern Coast', 'A beach destination known for its shallow coastline and crystal-clear waters.'),
('Bentota', 'Western', 'Western Coast', 'A resort town known for its beaches, water sports, and ayurvedic spas.'),

-- Wildlife and nature
('Yala National Park', 'Southern', 'Southern Wildlife', 'The most visited national park in Sri Lanka, known for leopards, elephants, and diverse wildlife.'),
('Udawalawe National Park', 'Sabaragamuwa', 'Southern Wildlife', 'A national park known for its large elephant population and bird species.'),
('Sinharaja Forest Reserve', 'Sabaragamuwa', 'Rainforest', 'A UNESCO World Heritage Site and biodiversity hotspot with endemic species.'),
('Horton Plains National Park', 'Central', 'Hill Country', 'A protected area with montane grassland and cloud forest, featuring Worlds End viewpoint.'),
('Wilpattu National Park', 'North Western', 'Northern Wildlife', 'The largest national park in Sri Lanka, known for leopards and sloth bears.'),

-- Hill country and tea plantations
('Ella', 'Uva', 'Hill Country', 'A small town in the hills with stunning views, hiking trails, and tea plantations.'),
('Haputale', 'Uva', 'Hill Country', 'A town in the misty mountains with panoramic views and tea estates.'),
('Adams Peak', 'Sabaragamuwa', 'Hill Country', 'A sacred mountain pilgrimage site with a stunning sunrise view.'),
('Dambulla', 'Central', 'Cultural Triangle', 'Home to the famous Dambulla Cave Temple, a UNESCO World Heritage Site.'),
('Sigiriya', 'Central', 'Cultural Triangle', 'An ancient rock fortress with frescoes and landscaped gardens, a UNESCO World Heritage Site.');
GO

-- Insert distances between destinations (in km and hours)
-- Note: These are approximate distances and durations

-- Colombo connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(1, 2, 115, 3.5),  -- Colombo to Kandy
(1, 3, 125, 2.5),  -- Colombo to Galle
(1, 7, 180, 5.5),  -- Colombo to Nuwara Eliya
(1, 10, 35, 1.0),  -- Colombo to Negombo
(1, 15, 80, 2.0),  -- Colombo to Bentota
(1, 21, 230, 6.0), -- Colombo to Ella
(1, 25, 170, 4.5); -- Colombo to Sigiriya

-- Kandy connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(2, 1, 115, 3.5),  -- Kandy to Colombo
(2, 7, 80, 2.5),   -- Kandy to Nuwara Eliya
(2, 21, 140, 4.0), -- Kandy to Ella
(2, 24, 72, 2.0),  -- Kandy to Dambulla
(2, 25, 90, 2.5);  -- Kandy to Sigiriya

-- Galle connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(3, 1, 125, 2.5),  -- Galle to Colombo
(3, 11, 50, 1.5),  -- Galle to Mirissa
(3, 13, 18, 0.5),  -- Galle to Unawatuna
(3, 16, 150, 3.5); -- Galle to Yala National Park

-- Anuradhapura connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(4, 8, 105, 2.5),  -- Anuradhapura to Polonnaruwa
(4, 24, 65, 1.5),  -- Anuradhapura to Dambulla
(4, 25, 80, 2.0);  -- Anuradhapura to Sigiriya

-- Jaffna connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(5, 6, 235, 5.0);  -- Jaffna to Trincomalee

-- Trincomalee connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(6, 5, 235, 5.0),  -- Trincomalee to Jaffna
(6, 9, 125, 3.0),  -- Trincomalee to Batticaloa
(6, 14, 130, 3.0); -- Trincomalee to Pasikuda

-- Nuwara Eliya connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(7, 1, 180, 5.5),  -- Nuwara Eliya to Colombo
(7, 2, 80, 2.5),   -- Nuwara Eliya to Kandy
(7, 19, 35, 1.0),  -- Nuwara Eliya to Horton Plains
(7, 21, 60, 2.0),  -- Nuwara Eliya to Ella
(7, 22, 70, 2.5);  -- Nuwara Eliya to Haputale

-- Polonnaruwa connections
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
VALUES
(8, 4, 105, 2.5),  -- Polonnaruwa to Anuradhapura
(8, 24, 70, 1.5),  -- Polonnaruwa to Dambulla
(8, 25, 55, 1.5);  -- Polonnaruwa to Sigiriya

-- Add more distances as needed for complete connectivity
-- Note: For a complete graph, we would need n(n-1)/2 connections for n destinations
-- This is a subset for demonstration purposes

-- Make sure distances are symmetric (if A to B is x km, B to A is also x km)
INSERT INTO Distances (from_id, to_id, distance_km, duration_hours)
SELECT to_id, from_id, distance_km, duration_hours
FROM Distances d1
WHERE NOT EXISTS (
    SELECT 1 FROM Distances d2
    WHERE d2.from_id = d1.to_id AND d2.to_id = d1.from_id
);
GO

-- Add image URLs to destinations
UPDATE Destinations
SET description = CONVERT(VARCHAR(MAX), description) + ' Image URL';
GO

-- Print confirmation
SELECT 'Destinations and distances seeded successfully.' AS Status;
GO
