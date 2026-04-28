INSERT INTO "Admin" (id, username, password, "updatedAt") 
VALUES ('admin_id', 'admin', '$2b$10$LcroFRQA5tadaRzdj50LMuHVf3.p6aCW5xQ062SSiAVnDGImJKULe', NOW()) 
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();
