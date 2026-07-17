CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"username" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
