CREATE TABLE `meal_preset_ingredient` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_preset_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`meal_preset_id`) REFERENCES `meal_preset`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `food_log` ADD `source_ingredient_id` integer REFERENCES ingredient(id);--> statement-breakpoint
ALTER TABLE `food_log` ADD `source_stack_id` integer REFERENCES meal_stack(id);--> statement-breakpoint
ALTER TABLE `meal_preset` ADD `is_composed` integer DEFAULT false NOT NULL;