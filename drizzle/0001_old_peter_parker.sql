CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`video_id` int NOT NULL,
	`folder_id` int NOT NULL,
	`evaluator_id` int NOT NULL,
	`criteria_scores` json NOT NULL,
	`total_score` int NOT NULL DEFAULT 0,
	`max_possible_score` int NOT NULL DEFAULT 0,
	`entrustment_level` int,
	`feedback` text,
	`strengths` text,
	`improvements` text,
	`action_plan` text,
	`is_draft` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folder_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folder_id` int NOT NULL,
	`user_id` int NOT NULL,
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `folder_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folder_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folder_id` int NOT NULL,
	`invited_by` int NOT NULL,
	`invitee_email` varchar(320),
	`invitee_user_id` int,
	`token` varchar(128) NOT NULL,
	`status` enum('pending','accepted','declined','revoked') NOT NULL DEFAULT 'pending',
	`message` text,
	`email_sent` boolean NOT NULL DEFAULT false,
	`accepted_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `folder_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `folder_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`area` varchar(64) NOT NULL,
	`procedure_col` varchar(128) NOT NULL,
	`topic_list_id` int,
	`cover_color` varchar(32),
	`is_archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`type` varchar(64),
	`related_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic_list_id` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`domain_order` int NOT NULL DEFAULT 0,
	`item` varchar(512) NOT NULL,
	`item_order` int NOT NULL DEFAULT 0,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topic_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`area` varchar(64) NOT NULL,
	`procedure_col` varchar(128) NOT NULL,
	`procedure_name` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topic_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folder_id` int NOT NULL,
	`uploaded_by` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`s3_key` varchar(1024),
	`s3_url` text,
	`local_path` text,
	`mime_type` varchar(128),
	`size_bytes` int,
	`duration_seconds` int,
	`thumbnail_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
