INSERT INTO user_roles (userId, roles)
SELECT id, 'admin'
FROM users
WHERE users.email='amar17@navgurukul.org'
