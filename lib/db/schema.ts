import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    pgEnum,
    jsonb,
    boolean,
    index,
    real,
    unique,
} from 'drizzle-orm/pg-core';

// ============ ENUMS ============
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const statusEnum = pgEnum('status', ['draft', 'approved', 'published', 'archived']);
export const moduleEnum = pgEnum('module', ['ccna', 'netsec', 'ccnp', 'aws']);
export const generatedByEnum = pgEnum('generated_by', ['llm', 'human']);
export const roleEnum = pgEnum('role', ['student', 'faculty_reviewer', 'content_admin', 'super_admin']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);

export const questionTypeEnum = pgEnum('question_type', [
    'multiple_choice',
    'multiple_select',
    'drag_drop',
    'fill_blank',
    'hotspot',
    'simulation',
]);

export const examStatusEnum = pgEnum('exam_status', [
    'not_started',
    'in_progress',
    'completed',
    'abandoned',
]);

export const flashcardRatingEnum = pgEnum('flashcard_rating', [
    'again',
    'hard',
    'good',
    'easy',
]);

export const labDifficultyEnum = pgEnum('lab_difficulty', [
    'guided',
    'standard',
    'challenge',
]);

export const achievementTypeEnum = pgEnum('achievement_type', [
    'streak',
    'mastery',
    'quiz_score',
    'exam_pass',
    'lab_complete',
    'flashcard_streak',
    'group_leader',
]);

// ============ CORE TABLES ============
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar: text('avatar'),
    role: roleEnum('role').default('student').notNull(),
    preferences: jsonb('preferences').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
}, (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
}));

export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('sessions_user_idx').on(table.userId),
    expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
}));

export const magicLinks = pgTable('magic_links', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    tokenIdx: index('magic_links_token_idx').on(table.token),
    emailIdx: index('magic_links_email_idx').on(table.email),
}));

// ============ KNOWLEDGE TABLES ============
export const knowledgeNodes = pgTable('knowledge_nodes', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    subtopic: text('subtopic'),
    intent: text('intent').notNull(),
    difficulty: difficultyEnum('difficulty').default('intermediate').notNull(),
    prerequisites: text('prerequisites').array().default([]),
    coreExplanation: text('core_explanation').notNull(),
    mentalModel: text('mental_model').notNull(),
    wireLogic: text('wire_logic').notNull(),
    cliExample: text('cli_example'),
    commonMistakes: text('common_mistakes').array().default([]),
    examNote: text('exam_note'),
    status: statusEnum('status').default('draft').notNull(),
    version: integer('version').default(1).notNull(),
    generatedBy: generatedByEnum('generated_by').default('llm').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewNotes: text('review_notes'),
    estimatedMinutes: integer('estimated_minutes').default(10),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    publishedAt: timestamp('published_at'),
    deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
    moduleIdx: index('knowledge_module_idx').on(table.module),
    topicIdx: index('knowledge_topic_idx').on(table.topic),
    statusIdx: index('knowledge_status_idx').on(table.status),
    intentIdx: index('knowledge_intent_idx').on(table.intent),
}));

export const knowledgeVersions = pgTable('knowledge_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    nodeId: uuid('node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }).notNull(),
    version: integer('version').notNull(),
    data: jsonb('data').notNull(),
    changedBy: uuid('changed_by').references(() => users.id),
    changeReason: text('change_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    nodeVersionIdx: index('versions_node_version_idx').on(table.nodeId, table.version),
}));

export const syllabus = pgTable('syllabus', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    subtopics: text('subtopics').array().default([]),
    order: integer('order').default(0).notNull(),
    examWeight: integer('exam_weight'),
    estimatedHours: integer('estimated_hours').default(2),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    moduleOrderIdx: index('syllabus_module_order_idx').on(table.module, table.order),
}));

// ============ GENERATION TABLES ============
export const generationJobs = pgTable('generation_jobs', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    topics: text('topics').array().notNull(),
    status: jobStatusEnum('status').default('pending').notNull(),
    provider: text('provider').default('openai').notNull(),
    model: text('model').default('gpt-4-turbo').notNull(),
    temperature: text('temperature').default('0.3').notNull(),
    estimatedCost: text('estimated_cost'),
    actualCost: text('actual_cost'),
    totalNodes: integer('total_nodes').default(0).notNull(),
    completedNodes: integer('completed_nodes').default(0).notNull(),
    failedNodes: integer('failed_nodes').default(0).notNull(),
    errorLog: jsonb('error_log').default([]),
    retryCount: integer('retry_count').default(0).notNull(),
    maxRetries: integer('max_retries').default(3).notNull(),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    statusIdx: index('jobs_status_idx').on(table.status),
    createdByIdx: index('jobs_created_by_idx').on(table.createdBy),
}));

// ============ QUIZ TABLES ============
export const questions = pgTable('questions', {
    id: uuid('id').defaultRandom().primaryKey(),
    nodeId: uuid('node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    type: questionTypeEnum('type').default('multiple_choice').notNull(),
    difficulty: difficultyEnum('difficulty').default('intermediate').notNull(),
    questionText: text('question_text').notNull(),
    questionHtml: text('question_html'),
    options: jsonb('options').notNull(),
    correctAnswer: jsonb('correct_answer').notNull(),
    explanation: text('explanation').notNull(),
    wrongAnswerExplanations: jsonb('wrong_answer_explanations').default({}),
    hints: text('hints').array().default([]),
    tags: text('tags').array().default([]),
    timeLimit: integer('time_limit'),
    points: integer('points').default(1).notNull(),
    status: statusEnum('status').default('draft').notNull(),
    generatedBy: generatedByEnum('generated_by').default('llm').notNull(),
    usageCount: integer('usage_count').default(0).notNull(),
    correctRate: real('correct_rate'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    moduleIdx: index('questions_module_idx').on(table.module),
    topicIdx: index('questions_topic_idx').on(table.topic),
    nodeIdx: index('questions_node_idx').on(table.nodeId),
    difficultyIdx: index('questions_difficulty_idx').on(table.difficulty),
}));

export const quizzes = pgTable('quizzes', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    topics: text('topics').array().notNull(),
    questionCount: integer('question_count').default(10).notNull(),
    timeLimit: integer('time_limit'),
    passingScore: integer('passing_score').default(70).notNull(),
    shuffleQuestions: boolean('shuffle_questions').default(true).notNull(),
    shuffleOptions: boolean('shuffle_options').default(true).notNull(),
    showExplanations: boolean('show_explanations').default(true).notNull(),
    allowReview: boolean('allow_review').default(true).notNull(),
    maxAttempts: integer('max_attempts'),
    isAdaptive: boolean('is_adaptive').default(false).notNull(),
    status: statusEnum('status').default('draft').notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    moduleIdx: index('quizzes_module_idx').on(table.module),
    statusIdx: index('quizzes_status_idx').on(table.status),
}));

export const quizQuestions = pgTable('quiz_questions', {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    order: integer('order').default(0).notNull(),
}, (table) => ({
    quizIdx: index('quiz_questions_quiz_idx').on(table.quizId),
    uniqueQuizQuestion: unique().on(table.quizId, table.questionId),
}));

export const quizAttempts = pgTable('quiz_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    timeSpent: integer('time_spent'),
    score: real('score'),
    correctCount: integer('correct_count').default(0).notNull(),
    totalCount: integer('total_count').default(0).notNull(),
    passed: boolean('passed'),
    answers: jsonb('answers').default([]),
    questionOrder: uuid('question_order').array().default([]),
}, (table) => ({
    userIdx: index('quiz_attempts_user_idx').on(table.userId),
    quizIdx: index('quiz_attempts_quiz_idx').on(table.quizId),
    completedIdx: index('quiz_attempts_completed_idx').on(table.completedAt),
}));

// ============ PROGRESS TABLES ============
export const userProgress = pgTable('user_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    module: moduleEnum('module').default('ccna').notNull(),
    totalTimeSpent: integer('total_time_spent').default(0).notNull(),
    lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    lastStreakDate: timestamp('last_streak_date'),
    level: integer('level').default(1).notNull(),
    experiencePoints: integer('experience_points').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userModuleIdx: unique().on(table.userId, table.module),
}));

export const topicProgress = pgTable('topic_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    status: text('status').default('not_started').notNull(),
    nodesViewed: integer('nodes_viewed').default(0).notNull(),
    nodesTotal: integer('nodes_total').default(0).notNull(),
    quizzesPassed: integer('quizzes_passed').default(0).notNull(),
    quizzesTotal: integer('quizzes_total').default(0).notNull(),
    averageScore: real('average_score'),
    timeSpent: integer('time_spent').default(0).notNull(),
    masteryLevel: real('mastery_level').default(0).notNull(),
    lastAccessedAt: timestamp('last_accessed_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userTopicIdx: unique().on(table.userId, table.module, table.topic),
    userIdx: index('topic_progress_user_idx').on(table.userId),
}));

export const nodeProgress = pgTable('node_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    nodeId: uuid('node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }).notNull(),
    viewed: boolean('viewed').default(false).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    timeSpent: integer('time_spent').default(0).notNull(),
    understood: boolean('understood'),
    bookmarked: boolean('bookmarked').default(false).notNull(),
    notes: text('notes'),
    firstViewedAt: timestamp('first_viewed_at'),
    lastViewedAt: timestamp('last_viewed_at'),
}, (table) => ({
    userNodeIdx: unique().on(table.userId, table.nodeId),
    userIdx: index('node_progress_user_idx').on(table.userId),
    nodeIdx: index('node_progress_node_idx').on(table.nodeId),
}));

export const learningPaths = pgTable('learning_paths', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    topics: jsonb('topics').notNull(),
    estimatedHours: integer('estimated_hours').default(40).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userLearningPath = pgTable('user_learning_path', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    pathId: uuid('path_id').references(() => learningPaths.id, { onDelete: 'cascade' }).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    currentTopicIndex: integer('current_topic_index').default(0).notNull(),
}, (table) => ({
    userPathIdx: unique().on(table.userId, table.pathId),
}));

export const activityLog = pgTable('activity_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    activityType: text('activity_type').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').default({}),
    duration: integer('duration'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('activity_log_user_idx').on(table.userId),
    dateIdx: index('activity_log_date_idx').on(table.createdAt),
}));

export const achievements = pgTable('achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: achievementTypeEnum('type').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    criteria: jsonb('criteria').notNull(),
    xpReward: integer('xp_reward').default(100).notNull(),
    isSecret: boolean('is_secret').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userAchievements = pgTable('user_achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    achievementId: uuid('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }).notNull(),
    earnedAt: timestamp('earned_at').defaultNow().notNull(),
    metadata: jsonb('metadata').default({}),
}, (table) => ({
    userAchievementIdx: unique().on(table.userId, table.achievementId),
}));

// ============ FLASHCARD TABLES ============
export const flashcards = pgTable('flashcards', {
    id: uuid('id').defaultRandom().primaryKey(),
    nodeId: uuid('node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    front: text('front').notNull(),
    back: text('back').notNull(),
    frontHtml: text('front_html'),
    backHtml: text('back_html'),
    tags: text('tags').array().default([]),
    difficulty: difficultyEnum('difficulty').default('intermediate').notNull(),
    status: statusEnum('status').default('draft').notNull(),
    generatedBy: generatedByEnum('generated_by').default('llm').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    moduleIdx: index('flashcards_module_idx').on(table.module),
    topicIdx: index('flashcards_topic_idx').on(table.topic),
    nodeIdx: index('flashcards_node_idx').on(table.nodeId),
}));

export const flashcardProgress = pgTable('flashcard_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    flashcardId: uuid('flashcard_id').references(() => flashcards.id, { onDelete: 'cascade' }).notNull(),
    easeFactor: real('ease_factor').default(2.5).notNull(),
    interval: integer('interval').default(1).notNull(),
    repetitions: integer('repetitions').default(0).notNull(),
    nextReviewAt: timestamp('next_review_at').defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at'),
    totalReviews: integer('total_reviews').default(0).notNull(),
    correctReviews: integer('correct_reviews').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userFlashcardIdx: unique().on(table.userId, table.flashcardId),
    userIdx: index('flashcard_progress_user_idx').on(table.userId),
    nextReviewIdx: index('flashcard_progress_next_review_idx').on(table.nextReviewAt),
}));

export const flashcardReviews = pgTable('flashcard_reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    flashcardId: uuid('flashcard_id').references(() => flashcards.id, { onDelete: 'cascade' }).notNull(),
    rating: flashcardRatingEnum('rating').notNull(),
    responseTime: integer('response_time'),
    previousInterval: integer('previous_interval'),
    newInterval: integer('new_interval'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('flashcard_reviews_user_idx').on(table.userId),
}));

// ============ LAB TABLES ============
export const labs = pgTable('labs', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    difficulty: labDifficultyEnum('difficulty').default('standard').notNull(),
    estimatedMinutes: integer('estimated_minutes').default(30).notNull(),
    objectives: jsonb('objectives').notNull(),
    topology: jsonb('topology').notNull(),
    topologyImage: text('topology_image'),
    initialConfigs: jsonb('initial_configs').default({}),
    solutionConfigs: jsonb('solution_configs').default({}),
    hints: text('hints').array().default([]),
    instructions: jsonb('instructions').default([]),
    prerequisites: text('prerequisites').array().default([]),
    packetTracerFile: text('packet_tracer_file'),
    status: statusEnum('status').default('draft').notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    moduleIdx: index('labs_module_idx').on(table.module),
    topicIdx: index('labs_topic_idx').on(table.topic),
}));

export const labAttempts = pgTable('lab_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    labId: uuid('lab_id').references(() => labs.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    timeSpent: integer('time_spent'),
    objectivesCompleted: jsonb('objectives_completed').default([]),
    finalConfigs: jsonb('final_configs').default({}),
    commandHistory: jsonb('command_history').default([]),
    hintsUsed: integer('hints_used').default(0).notNull(),
    score: real('score'),
    passed: boolean('passed'),
}, (table) => ({
    userIdx: index('lab_attempts_user_idx').on(table.userId),
    labIdx: index('lab_attempts_lab_idx').on(table.labId),
}));

export const cliExercises = pgTable('cli_exercises', {
    id: uuid('id').defaultRandom().primaryKey(),
    nodeId: uuid('node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }),
    module: moduleEnum('module').default('ccna').notNull(),
    topic: text('topic').notNull(),
    title: text('title').notNull(),
    scenario: text('scenario').notNull(),
    deviceType: text('device_type').default('router').notNull(),
    initialPrompt: text('initial_prompt').default('Router>').notNull(),
    initialConfig: text('initial_config'),
    targetCommands: jsonb('target_commands').notNull(),
    validationRules: jsonb('validation_rules').notNull(),
    hints: text('hints').array().default([]),
    difficulty: difficultyEnum('difficulty').default('intermediate').notNull(),
    estimatedMinutes: integer('estimated_minutes').default(5).notNull(),
    status: statusEnum('status').default('draft').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    moduleIdx: index('cli_exercises_module_idx').on(table.module),
    topicIdx: index('cli_exercises_topic_idx').on(table.topic),
}));

export const cliAttempts = pgTable('cli_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    exerciseId: uuid('exercise_id').references(() => cliExercises.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    commandHistory: jsonb('command_history').default([]),
    hintsUsed: integer('hints_used').default(0).notNull(),
    completed: boolean('completed').default(false).notNull(),
    timeSpent: integer('time_spent'),
}, (table) => ({
    userIdx: index('cli_attempts_user_idx').on(table.userId),
}));

// ============ EXAM TABLES ============
export const exams = pgTable('exams', {
    id: uuid('id').defaultRandom().primaryKey(),
    module: moduleEnum('module').default('ccna').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    duration: integer('duration').default(120).notNull(),
    totalQuestions: integer('total_questions').default(100).notNull(),
    passingScore: integer('passing_score').default(825).notNull(),
    sections: jsonb('sections').notNull(),
    rules: jsonb('rules').default({}),
    isOfficial: boolean('is_official').default(false).notNull(),
    status: statusEnum('status').default('draft').notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    moduleIdx: index('exams_module_idx').on(table.module),
}));

export const examAttempts = pgTable('exam_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: examStatusEnum('status').default('not_started').notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    timeRemaining: integer('time_remaining'),
    currentQuestionIndex: integer('current_question_index').default(0).notNull(),
    questions: jsonb('questions').default([]),
    answers: jsonb('answers').default({}),
    flaggedQuestions: uuid('flagged_questions').array().default([]),
    sectionScores: jsonb('section_scores').default({}),
    rawScore: integer('raw_score'),
    scaledScore: integer('scaled_score'),
    passed: boolean('passed'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('exam_attempts_user_idx').on(table.userId),
    examIdx: index('exam_attempts_exam_idx').on(table.examId),
}));

// ============ STUDY GROUP TABLES ============
export const studyGroups = pgTable('study_groups', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    module: moduleEnum('module').default('ccna').notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    joinCode: text('join_code').unique(),
    maxMembers: integer('max_members').default(50).notNull(),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    moduleIdx: index('study_groups_module_idx').on(table.module),
    publicIdx: index('study_groups_public_idx').on(table.isPublic),
}));

export const groupMembers = pgTable('group_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => studyGroups.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: text('role').default('member').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    lastActiveAt: timestamp('last_active_at'),
}, (table) => ({
    groupUserIdx: unique().on(table.groupId, table.userId),
    groupIdx: index('group_members_group_idx').on(table.groupId),
    userIdx: index('group_members_user_idx').on(table.userId),
}));

export const groupDiscussions = pgTable('group_discussions', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => studyGroups.id, { onDelete: 'cascade' }).notNull(),
    nodeId: uuid('node_id').references(() => knowledgeNodes.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isLocked: boolean('is_locked').default(false).notNull(),
    messageCount: integer('message_count').default(0).notNull(),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    groupIdx: index('group_discussions_group_idx').on(table.groupId),
}));

export const groupMessages = pgTable('group_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    discussionId: uuid('discussion_id').references(() => groupDiscussions.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    replyToId: uuid('reply_to_id'),
    isEdited: boolean('is_edited').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    discussionIdx: index('group_messages_discussion_idx').on(table.discussionId),
}));

export const groupChallenges = pgTable('group_challenges', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => studyGroups.id, { onDelete: 'cascade' }).notNull(),
    quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    groupIdx: index('group_challenges_group_idx').on(table.groupId),
}));

export const challengeParticipants = pgTable('challenge_participants', {
    id: uuid('id').defaultRandom().primaryKey(),
    challengeId: uuid('challenge_id').references(() => groupChallenges.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    score: real('score'),
    completedAt: timestamp('completed_at'),
    attemptId: uuid('attempt_id').references(() => quizAttempts.id),
}, (table) => ({
    challengeUserIdx: unique().on(table.challengeId, table.userId),
}));

// ============ AUDIT TABLES ============
export const auditLog = pgTable('audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('audit_user_idx').on(table.userId),
    actionIdx: index('audit_action_idx').on(table.action),
    createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
}));

export const errorLog = pgTable('error_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    endpoint: text('endpoint'),
    requestId: text('request_id'),
    errorMessage: text('error_message').notNull(),
    stackTrace: text('stack_trace'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    createdAtIdx: index('error_log_created_at_idx').on(table.createdAt),
}));

// ============ FEATURE FLAGS TABLE ============
export const featureFlags = pgTable('feature_flags', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    enabled: boolean('enabled').default(false).notNull(),
    description: text('description'),
    metadata: jsonb('metadata').default({}),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ TYPE EXPORTS ============
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type NewKnowledgeNode = typeof knowledgeNodes.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type TopicProgress = typeof topicProgress.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type FlashcardProgress = typeof flashcardProgress.$inferSelect;
export type Lab = typeof labs.$inferSelect;
export type LabAttempt = typeof labAttempts.$inferSelect;
export type CLIExercise = typeof cliExercises.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type Syllabus = typeof syllabus.$inferSelect;
