CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_time` text NOT NULL,
	`type` text NOT NULL,
	`duration_minutes` integer,
	`notes` text,
	`distance` real
);
--> statement-breakpoint
CREATE TABLE `app_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `daily_log_snapshot` (
	`date` text PRIMARY KEY NOT NULL,
	`resolved_day_type_id` integer NOT NULL,
	`day_type_name` text NOT NULL,
	`eating_window_start` text,
	`eating_window_end` text,
	`is_fast_day` integer NOT NULL,
	`calorie_target` integer NOT NULL,
	`protein_target` integer NOT NULL,
	`source_override_id` integer,
	`captured_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`resolved_day_type_id`) REFERENCES `day_type`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_override_id`) REFERENCES `date_override`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `date_override` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`override_day_type_id` integer NOT NULL,
	`reason` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`override_day_type_id`) REFERENCES `day_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `date_override_date_unique` ON `date_override` (`date`);--> statement-breakpoint
CREATE TABLE `day_type` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`eating_window_start` text,
	`eating_window_end` text,
	`is_fast_day` integer DEFAULT false NOT NULL,
	`calorie_target` integer NOT NULL,
	`protein_target` integer NOT NULL,
	`notes` text,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `food_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_time` text NOT NULL,
	`source_preset_id` integer,
	`description` text NOT NULL,
	`calories` integer NOT NULL,
	`protein_g` real NOT NULL,
	`meal_slot` text,
	`logged_outside_window` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`source_preset_id`) REFERENCES `meal_preset`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `food_log_date_time_idx` ON `food_log` (`date_time`);--> statement-breakpoint
CREATE TABLE `hydration_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_time` text NOT NULL,
	`ounces` real NOT NULL,
	`source_label` text
);
--> statement-breakpoint
CREATE INDEX `hydration_log_date_time_idx` ON `hydration_log` (`date_time`);--> statement-breakpoint
CREATE TABLE `meal_preset` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`calories` integer NOT NULL,
	`protein_g` real NOT NULL,
	`serving_description` text,
	`tags` text DEFAULT '[]',
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `meal_stack` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_stack_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_stack_id` integer NOT NULL,
	`meal_preset_id` integer NOT NULL,
	`order` integer NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	FOREIGN KEY (`meal_stack_id`) REFERENCES `meal_stack`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_preset_id`) REFERENCES `meal_preset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routine_completion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`routine_step_id` integer NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`routine_step_id`) REFERENCES `routine_step`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_completion_date_step_unique` ON `routine_completion` (`date`,`routine_step_id`);--> statement-breakpoint
CREATE TABLE `routine_step` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_type_id` integer NOT NULL,
	`label` text NOT NULL,
	`scheduled_time` text,
	`order` integer NOT NULL,
	`category` text,
	`default_hydration_oz` real,
	FOREIGN KEY (`day_type_id`) REFERENCES `day_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timezone` text NOT NULL,
	`current_weight` real,
	`target_weight` real,
	`hydration_goal_oz` real DEFAULT 100 NOT NULL,
	`alcohol_rule` text,
	`units` text DEFAULT 'imperial' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weekly_schedule` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`day_type_id` integer NOT NULL,
	FOREIGN KEY (`day_type_id`) REFERENCES `day_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weight_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`weight` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weight_log_date_unique` ON `weight_log` (`date`);