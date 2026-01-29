DO $$ BEGIN
 CREATE TYPE "achievement_type" AS ENUM('streak', 'mastery', 'quiz_score', 'exam_pass', 'lab_complete', 'flashcard_streak', 'group_leader');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "exam_status" AS ENUM('not_started', 'in_progress', 'completed', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "flashcard_rating" AS ENUM('again', 'hard', 'good', 'easy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "generated_by" AS ENUM('llm', 'human');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "lab_difficulty" AS ENUM('guided', 'standard', 'challenge');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "module" AS ENUM('ccna', 'netsec', 'ccnp', 'aws');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "question_type" AS ENUM('multiple_choice', 'multiple_select', 'drag_drop', 'fill_blank', 'hotspot', 'simulation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('student', 'faculty_reviewer', 'content_admin', 'super_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "status" AS ENUM('draft', 'approved', 'published', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "achievement_type" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenge_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"score" real,
	"completed_at" timestamp,
	"attempt_id" uuid,
	CONSTRAINT "challenge_participants_challenge_id_user_id_unique" UNIQUE("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cli_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"command_history" jsonb DEFAULT '[]'::jsonb,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"time_spent" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cli_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"title" text NOT NULL,
	"scenario" text NOT NULL,
	"device_type" text DEFAULT 'router' NOT NULL,
	"initial_prompt" text DEFAULT 'Router>' NOT NULL,
	"initial_config" text,
	"target_commands" jsonb NOT NULL,
	"validation_rules" jsonb NOT NULL,
	"hints" text[] DEFAULT ,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"estimated_minutes" integer DEFAULT 5 NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "error_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"endpoint" text,
	"request_id" text,
	"error_message" text NOT NULL,
	"stack_trace" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "exam_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"time_remaining" integer,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"flagged_questions" uuid[] DEFAULT ,
	"section_scores" jsonb DEFAULT '{}'::jsonb,
	"raw_score" integer,
	"scaled_score" integer,
	"passed" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration" integer DEFAULT 120 NOT NULL,
	"total_questions" integer DEFAULT 100 NOT NULL,
	"passing_score" integer DEFAULT 825 NOT NULL,
	"sections" jsonb NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"is_official" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"flashcard_id" uuid NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"correct_reviews" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flashcard_progress_user_id_flashcard_id_unique" UNIQUE("user_id","flashcard_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"flashcard_id" uuid NOT NULL,
	"rating" "flashcard_rating" NOT NULL,
	"response_time" integer,
	"previous_interval" integer,
	"new_interval" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"front_html" text,
	"back_html" text,
	"tags" text[] DEFAULT ,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"generated_by" "generated_by" DEFAULT 'llm' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topics" text[] NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'openai' NOT NULL,
	"model" text DEFAULT 'gpt-4-turbo' NOT NULL,
	"temperature" text DEFAULT '0.3' NOT NULL,
	"estimated_cost" text,
	"actual_cost" text,
	"total_nodes" integer DEFAULT 0 NOT NULL,
	"completed_nodes" integer DEFAULT 0 NOT NULL,
	"failed_nodes" integer DEFAULT 0 NOT NULL,
	"error_log" jsonb DEFAULT '[]'::jsonb,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_by" uuid NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"quiz_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"node_id" uuid,
	"title" text NOT NULL,
	"created_by" uuid NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp,
	CONSTRAINT "group_members_group_id_user_id_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discussion_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reply_to_id" uuid,
	"is_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"subtopic" text,
	"intent" text NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"prerequisites" text[] DEFAULT ,
	"core_explanation" text NOT NULL,
	"mental_model" text NOT NULL,
	"wire_logic" text NOT NULL,
	"cli_example" text,
	"common_mistakes" text[] DEFAULT ,
	"exam_note" text,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"generated_by" "generated_by" DEFAULT 'llm' NOT NULL,
	"reviewed_by" uuid,
	"review_notes" text,
	"estimated_minutes" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"data" jsonb NOT NULL,
	"changed_by" uuid,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lab_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent" integer,
	"objectives_completed" jsonb DEFAULT '[]'::jsonb,
	"final_configs" jsonb DEFAULT '{}'::jsonb,
	"command_history" jsonb DEFAULT '[]'::jsonb,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"score" real,
	"passed" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "labs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" "lab_difficulty" DEFAULT 'standard' NOT NULL,
	"estimated_minutes" integer DEFAULT 30 NOT NULL,
	"objectives" jsonb NOT NULL,
	"topology" jsonb NOT NULL,
	"topology_image" text,
	"initial_configs" jsonb DEFAULT '{}'::jsonb,
	"solution_configs" jsonb DEFAULT '{}'::jsonb,
	"hints" text[] DEFAULT ,
	"instructions" jsonb DEFAULT '[]'::jsonb,
	"prerequisites" text[] DEFAULT ,
	"packet_tracer_file" text,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"topics" jsonb NOT NULL,
	"estimated_hours" integer DEFAULT 40 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "node_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"viewed" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"understood" boolean,
	"bookmarked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"first_viewed_at" timestamp,
	"last_viewed_at" timestamp,
	CONSTRAINT "node_progress_user_id_node_id_unique" UNIQUE("user_id","node_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"type" "question_type" DEFAULT 'multiple_choice' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"question_text" text NOT NULL,
	"question_html" text,
	"options" jsonb NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"explanation" text NOT NULL,
	"wrong_answer_explanations" jsonb DEFAULT '{}'::jsonb,
	"hints" text[] DEFAULT ,
	"tags" text[] DEFAULT ,
	"time_limit" integer,
	"points" integer DEFAULT 1 NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"generated_by" "generated_by" DEFAULT 'llm' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"correct_rate" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent" integer,
	"score" real,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"passed" boolean,
	"answers" jsonb DEFAULT '[]'::jsonb,
	"question_order" uuid[] DEFAULT 
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "quiz_questions_quiz_id_question_id_unique" UNIQUE("quiz_id","question_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"topics" text[] NOT NULL,
	"question_count" integer DEFAULT 10 NOT NULL,
	"time_limit" integer,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"shuffle_questions" boolean DEFAULT true NOT NULL,
	"shuffle_options" boolean DEFAULT true NOT NULL,
	"show_explanations" boolean DEFAULT true NOT NULL,
	"allow_review" boolean DEFAULT true NOT NULL,
	"max_attempts" integer,
	"is_adaptive" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"join_code" text,
	"max_members" integer DEFAULT 50 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "study_groups_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "syllabus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"subtopics" text[] DEFAULT ,
	"order" integer DEFAULT 0 NOT NULL,
	"exam_weight" integer,
	"estimated_hours" integer DEFAULT 2,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topic_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"topic" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"nodes_viewed" integer DEFAULT 0 NOT NULL,
	"nodes_total" integer DEFAULT 0 NOT NULL,
	"quizzes_passed" integer DEFAULT 0 NOT NULL,
	"quizzes_total" integer DEFAULT 0 NOT NULL,
	"average_score" real,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"mastery_level" real DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topic_progress_user_id_module_topic_unique" UNIQUE("user_id","module","topic")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "user_achievements_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_learning_path" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"path_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"current_topic_index" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_learning_path_user_id_path_id_unique" UNIQUE("user_id","path_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module" "module" DEFAULT 'ccna' NOT NULL,
	"total_time_spent" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_streak_date" timestamp,
	"level" integer DEFAULT 1 NOT NULL,
	"experience_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_progress_user_id_module_unique" UNIQUE("user_id","module")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar" text,
	"role" "role" DEFAULT 'student' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_log_user_idx" ON "activity_log" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_log_date_idx" ON "activity_log" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_user_idx" ON "audit_log" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_log" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_at_idx" ON "audit_log" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cli_attempts_user_idx" ON "cli_attempts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cli_exercises_module_idx" ON "cli_exercises" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cli_exercises_topic_idx" ON "cli_exercises" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "error_log_created_at_idx" ON "error_log" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_attempts_user_idx" ON "exam_attempts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_attempts_exam_idx" ON "exam_attempts" ("exam_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exams_module_idx" ON "exams" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcard_progress_user_idx" ON "flashcard_progress" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcard_progress_next_review_idx" ON "flashcard_progress" ("next_review_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcard_reviews_user_idx" ON "flashcard_reviews" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_module_idx" ON "flashcards" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_topic_idx" ON "flashcards" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_node_idx" ON "flashcards" ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "generation_jobs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_created_by_idx" ON "generation_jobs" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_challenges_group_idx" ON "group_challenges" ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_discussions_group_idx" ON "group_discussions" ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_members_group_idx" ON "group_members" ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_members_user_idx" ON "group_members" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_messages_discussion_idx" ON "group_messages" ("discussion_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_module_idx" ON "knowledge_nodes" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_topic_idx" ON "knowledge_nodes" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_status_idx" ON "knowledge_nodes" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_intent_idx" ON "knowledge_nodes" ("intent");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "versions_node_version_idx" ON "knowledge_versions" ("node_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lab_attempts_user_idx" ON "lab_attempts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lab_attempts_lab_idx" ON "lab_attempts" ("lab_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "labs_module_idx" ON "labs" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "labs_topic_idx" ON "labs" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magic_links_token_idx" ON "magic_links" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magic_links_email_idx" ON "magic_links" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_progress_user_idx" ON "node_progress" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_progress_node_idx" ON "node_progress" ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_module_idx" ON "questions" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_topic_idx" ON "questions" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_node_idx" ON "questions" ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_difficulty_idx" ON "questions" ("difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_user_idx" ON "quiz_attempts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_quiz_idx" ON "quiz_attempts" ("quiz_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_completed_idx" ON "quiz_attempts" ("completed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_questions_quiz_idx" ON "quiz_questions" ("quiz_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quizzes_module_idx" ON "quizzes" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quizzes_status_idx" ON "quizzes" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_expires_idx" ON "sessions" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_groups_module_idx" ON "study_groups" ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_groups_public_idx" ON "study_groups" ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "syllabus_module_order_idx" ON "syllabus" ("module","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topic_progress_user_idx" ON "topic_progress" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_group_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "group_challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cli_attempts" ADD CONSTRAINT "cli_attempts_exercise_id_cli_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "cli_exercises"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cli_attempts" ADD CONSTRAINT "cli_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cli_exercises" ADD CONSTRAINT "cli_exercises_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_log" ADD CONSTRAINT "error_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_challenges" ADD CONSTRAINT "group_challenges_group_id_study_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_challenges" ADD CONSTRAINT "group_challenges_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_challenges" ADD CONSTRAINT "group_challenges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_discussions" ADD CONSTRAINT "group_discussions_group_id_study_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_discussions" ADD CONSTRAINT "group_discussions_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "knowledge_nodes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_discussions" ADD CONSTRAINT "group_discussions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_study_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_discussion_id_group_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "group_discussions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_versions" ADD CONSTRAINT "knowledge_versions_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_versions" ADD CONSTRAINT "knowledge_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lab_attempts" ADD CONSTRAINT "lab_attempts_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lab_attempts" ADD CONSTRAINT "lab_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "labs" ADD CONSTRAINT "labs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_progress" ADD CONSTRAINT "node_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_progress" ADD CONSTRAINT "node_progress_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_node_id_knowledge_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "knowledge_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_progress" ADD CONSTRAINT "topic_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_learning_path" ADD CONSTRAINT "user_learning_path_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_learning_path" ADD CONSTRAINT "user_learning_path_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
