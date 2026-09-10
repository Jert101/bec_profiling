-- 0009: Role → page access control.
-- Each role lists the tabs/pages it may access. The admin manages these from the Dashboard.

CREATE TABLE IF NOT EXISTS role_pages (
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
    page TEXT NOT NULL CHECK (page IN ('dashboard', 'records', 'stats')),
    PRIMARY KEY (role, page)
);

ALTER TABLE role_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_pages_all_access ON role_pages;
CREATE POLICY role_pages_all_access ON role_pages FOR ALL USING (true);

INSERT INTO role_pages (role, page) VALUES
    ('admin', 'dashboard'), ('admin', 'records'), ('admin', 'stats'),
    ('moderator', 'dashboard'), ('moderator', 'records'), ('moderator', 'stats')
ON CONFLICT (role, page) DO NOTHING;