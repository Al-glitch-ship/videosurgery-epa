
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  login_method VARCHAR(100),
  last_signed_in DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100) NOT NULL,
  procedure_code VARCHAR(100) NOT NULL,
  procedure_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_list_id INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  domain_order INT DEFAULT 0,
  item TEXT NOT NULL,
  item_order INT DEFAULT 0,
  milestone VARCHAR(50),
  description TEXT,
  FOREIGN KEY (topic_list_id) REFERENCES topic_lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100) NOT NULL,
  procedure_code VARCHAR(100) NOT NULL,
  topic_list_id INT,
  cover_color VARCHAR(50),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (topic_list_id) REFERENCES topic_lists(id)
);

CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  local_path TEXT,
  s3_url TEXT,
  s3_key VARCHAR(500),
  thumbnail_url TEXT,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  duration_seconds INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS folder_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  invited_by INT NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  invitee_user_id INT,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  message TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  expires_at DATETIME,
  accepted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS folder_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  user_id INT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_access (folder_id, user_id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id INT NOT NULL,
  folder_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  criteria_scores JSON,
  total_score INT DEFAULT 0,
  max_possible_score INT DEFAULT 0,
  entrustment_level INT,
  feedback TEXT,
  strengths TEXT,
  improvements TEXT,
  action_plan TEXT,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50),
  related_id INT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
