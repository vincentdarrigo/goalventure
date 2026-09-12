CREATE TABLE `meal_plan_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`meal_slot_id` integer NOT NULL,
	`ingredient_id` integer,
	`meal_preset_id` integer,
	`meal_stack_id` integer,
	`quantity` real DEFAULT 1 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`logged_food_log_id` integer,
	FOREIGN KEY (`meal_slot_id`) REFERENCES `meal_slot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meal_preset_id`) REFERENCES `meal_preset`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meal_stack_id`) REFERENCES `meal_stack`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`logged_food_log_id`) REFERENCES `food_log`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meal_slot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`archived_at` text
);
