CREATE TABLE `profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`chosen_specialisation_id` integer,
	FOREIGN KEY (`chosen_specialisation_id`) REFERENCES `specialisations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `specialisations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `specialisations_name_unique` ON `specialisations` (`name`);--> statement-breakpoint
ALTER TABLE `courses` ADD `specialisation_id` integer REFERENCES specialisations(id);