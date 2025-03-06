CREATE DATABASE carbsimple;

CREATE TABLE foodcarbs (
    food VARCHAR(225) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    gramsPerCarb FLOAT NOT NULL,
    CONSTRAINT enforce_uppercase_food CHECK (CAST(food AS BINARY)  = UPPER(food)) );

