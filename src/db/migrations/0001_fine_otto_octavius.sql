CREATE TABLE `supplement` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`dosage_amount` real NOT NULL,
	`dosage_unit` text NOT NULL,
	`timing` text NOT NULL,
	`specific_time` text,
	`notes` text,
	`order` integer DEFAULT 0 NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `supplement_dose` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplement_id` integer NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`taken_at` text,
	`name_snapshot` text NOT NULL,
	`dosage_amount_snapshot` real NOT NULL,
	`dosage_unit_snapshot` text NOT NULL,
	FOREIGN KEY (`supplement_id`) REFERENCES `supplement`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supplement_dose_supplement_date_unique` ON `supplement_dose` (`supplement_id`,`date`);