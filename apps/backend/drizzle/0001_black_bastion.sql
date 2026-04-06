CREATE TYPE "public"."MessageStatus" AS ENUM('sent', 'read');--> statement-breakpoint
CREATE TYPE "public"."MessageType" AS ENUM('text', 'image', 'file');--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"conversation_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_read_at" timestamp,
	CONSTRAINT "conversation_participants_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(255) NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"type" "MessageType" DEFAULT 'text' NOT NULL,
	"status" "MessageStatus" DEFAULT 'sent' NOT NULL,
	"attachment_url" varchar(1024),
	"attachment_name" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL
);
