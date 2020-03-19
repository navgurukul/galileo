INSERT INTO user_roles (userId, roles)
SELECT id, 'admin'
FROM users
WHERE users.email='pralhad18@navgurukul.org'
