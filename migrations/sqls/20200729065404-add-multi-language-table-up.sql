/* Replace with your SQL commands */

CREATE TABLE language_preference (
    id INT GENERATED ALWAYS AS IDENTITY,
    user_id INT,
    selected_language VARCHAR(60) NULL,
    PRIMARY KEY(id),
    CONSTRAINT user_id FOREIGN KEY(user_id) REFERENCES users(id)
);