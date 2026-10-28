CREATE TABLE "cashflow_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"finance_account_id" uuid,
	"name" text NOT NULL,
	"direction" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" date NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"priority" text DEFAULT 'required' NOT NULL,
	"autopay" boolean DEFAULT false NOT NULL,
	"notes" text,
	"partner_decision" text DEFAULT 'unreviewed' NOT NULL,
	"partner_note" text,
	"decided_by_account_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"current_balance_cents" integer DEFAULT 0 NOT NULL,
	"available_balance_cents" integer,
	"credit_limit_cents" integer,
	"apr_basis_points" integer,
	"minimum_payment_cents" integer,
	"due_day" integer,
	"autopay" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_settings" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"gambling_blocked" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cashflow_item" ADD CONSTRAINT "cashflow_item_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_item" ADD CONSTRAINT "cashflow_item_finance_account_id_finance_account_id_fk" FOREIGN KEY ("finance_account_id") REFERENCES "public"."finance_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_item" ADD CONSTRAINT "cashflow_item_decided_by_account_id_account_id_fk" FOREIGN KEY ("decided_by_account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_account" ADD CONSTRAINT "finance_account_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_settings" ADD CONSTRAINT "finance_settings_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;