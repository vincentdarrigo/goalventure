CREATE TABLE `ingredient` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`serving_size_amount` real NOT NULL,
	`serving_size_unit` text NOT NULL,
	`serving_description` text,
	`calories` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real,
	`fat_g` real,
	`fiber_g` real,
	`source_provider` text,
	`source_external_id` text,
	`archived_at` text
);
