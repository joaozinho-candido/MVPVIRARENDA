import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  date,
  primaryKey,
  uniqueIndex,
  index,
  serial,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () => ts("updated_at").notNull().defaultNow();

/* ------------------------------------------------------------------ */
/* Contas, sessões e segurança                                         */
/* ------------------------------------------------------------------ */

export type Role = "user" | "editor" | "reviewer" | "admin";
export type UserPrefs = {
  sound: boolean;
  clientReminderEmails: boolean;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<Role>().notNull().default("user"),
    status: text("status").$type<"active" | "blocked">().notNull().default("active"),
    emailVerifiedAt: ts("email_verified_at"),
    prefs: jsonb("prefs").$type<UserPrefs>().notNull().default({ sound: true, clientReminderEmails: true }),
    lastSeenAt: ts("last_seen_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 do token; o token em si só existe no cookie
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
});

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<"verify_email" | "reset_password">().notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    success: boolean("success").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_email_idx").on(t.email, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* LGPD                                                                */
/* ------------------------------------------------------------------ */

export type ConsentKind = "terms" | "privacy" | "marketing_email" | "analytics_cookies";

export const consents = pgTable("consents", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").$type<ConsentKind>().notNull(),
  version: text("version").notNull(),
  granted: boolean("granted").notNull(),
  createdAt: createdAt(),
});

export const privacyRequests = pgTable("privacy_requests", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  emailMasked: text("email_masked").notNull(),
  kind: text("kind").$type<"export" | "delete">().notNull(),
  status: text("status").$type<"open" | "done">().notNull().default("open"),
  createdAt: createdAt(),
  resolvedAt: ts("resolved_at"),
});

export const legalDocuments = pgTable("legal_documents", {
  id: serial("id").primaryKey(),
  kind: text("kind").$type<"terms" | "privacy" | "cookies">().notNull(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  status: text("status").$type<"draft" | "published">().notNull().default("draft"),
  lawyerReviewed: boolean("lawyer_reviewed").notNull().default(false),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Questionário, oportunidades e recomendações                         */
/* ------------------------------------------------------------------ */

export type QuizAnswers = {
  skills: string[];
  interests: string[];
  helpWith: string[];
  timeFlies?: string[];
  experiences: string[];
  experienceText?: string;
  period: string[];
  hoursPerDay: number;
  equipment: string[];
  budget: number; // em reais
  mode: "online" | "presencial" | "tanto_faz";
  salesComfort: "baixo" | "medio" | "alto";
  salesPreference?: string;
  goal: number | null; // meta mensal em reais, opcional
};

export const talentProfiles = pgTable("talent_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<QuizAnswers>().notNull(),
  completedAt: ts("completed_at"),
  updatedAt: updatedAt(),
});

export type OpportunityMode = "online" | "presencial" | "ambos";

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(), // O que é
  buyers: text("buyers").notNull(), // Quem compra
  howToFindBuyers: text("how_to_find_buyers").notNull(),
  risks: text("risks").notNull(),
  skillsText: text("skills_text").notNull(),
  equipmentText: text("equipment_text").notNull(),
  investmentLevel: text("investment_level").$type<"baixo" | "medio" | "alto">().notNull(),
  investmentMin: integer("investment_min").notNull().default(0), // reais
  timeText: text("time_text").notNull(),
  difficulty: integer("difficulty").notNull().default(2), // 1..3
  costsText: text("costs_text").notNull(),
  suggestedPrice: text("suggested_price").notNull(),
  whereToSell: text("where_to_sell").notNull(),
  mode: text("mode").$type<OpportunityMode>().notNull(),
  phoneOnly: boolean("phone_only").notNull().default(false),
  requiredEquipment: jsonb("required_equipment").$type<string[]>().notNull().default([]),
  scoringSkills: jsonb("scoring_skills").$type<string[]>().notNull().default([]),
  scoringInterests: jsonb("scoring_interests").$type<string[]>().notNull().default([]),
  minHoursPerDay: integer("min_hours_per_day_x10").notNull().default(5), // horas x10 (0.5h = 5)
  salesIntensity: text("sales_intensity").$type<"baixo" | "medio" | "alto">().notNull().default("medio"),
  status: text("status").$type<"draft" | "published">().notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Reason = string;

export const recommendations = pgTable(
  "recommendations",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    rank: integer("rank").notNull(),
    reasons: jsonb("reasons").$type<Reason[]>().notNull(),
    limits: jsonb("limits").$type<string[]>().notNull(),
    computedAt: ts("computed_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.opportunityId] })],
);

export const journeys = pgTable("journeys", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
  chosenAt: ts("chosen_at"),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Jornada: etapas, missões, progresso e gamificação                   */
/* ------------------------------------------------------------------ */

export type UnlockCondition = "profile_complete" | "opportunity_chosen" | "first_sale" | "records_30_days";

export const stages = pgTable("stages", {
  number: integer("number").primaryKey(), // 1..14
  title: text("title").notNull(),
  mentor: text("mentor").notNull(),
  description: text("description").notNull(),
  unlockStages: jsonb("unlock_stages").$type<number[]>().notNull().default([]),
  unlockConditions: jsonb("unlock_conditions").$type<UnlockCondition[]>().notNull().default([]),
  unlockHint: text("unlock_hint").notNull().default(""),
});

export type MissionField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type AutoKey = "profile_complete" | "opportunity_chosen" | "first_sale" | "first_client" | "first_material";

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  stageNumber: integer("stage_number").notNull().references(() => stages.number),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  mentor: text("mentor").notNull(),
  minutes: integer("minutes").notNull().default(10),
  points: integer("points").notNull().default(50),
  objective: text("objective").notNull(),
  explanation: text("explanation").notNull(),
  example: text("example").notNull().default(""),
  tools: jsonb("tools").$type<string[]>().notNull().default([]),
  fields: jsonb("fields").$type<MissionField[]>().notNull().default([]),
  checklist: jsonb("checklist").$type<string[]>().notNull().default([]),
  autoKey: text("auto_key").$type<AutoKey | null>(),
  dependsOnKey: text("depends_on_key"),
  status: text("status").$type<"draft" | "published">().notNull().default("published"),
  updatedAt: updatedAt(),
});

export const missionVariants = pgTable(
  "mission_variants",
  {
    missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    example: text("example").notNull().default(""),
    tools: jsonb("tools").$type<string[]>().notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.missionId, t.opportunityId] })],
);

export const missionProgress = pgTable(
  "mission_progress",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
    status: text("status").$type<"in_progress" | "paused" | "completed">().notNull(),
    answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
    checklist: jsonb("checklist").$type<boolean[]>().notNull().default([]),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    completedAt: ts("completed_at"),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.missionId] })],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"mission" | "stage" | "badge" | "challenge" | "event">().notNull(),
    title: text("title").notNull(),
    points: integer("points").notNull().default(0),
    day: date("day").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("activity_user_idx").on(t.userId, t.createdAt)],
);

export const badges = pgTable("badges", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  description: text("description").notNull(),
  rule: text("rule").notNull(), // ex.: signup, profile_complete, stage:5, first_sale
  points: integer("points").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeKey: text("badge_key").notNull().references(() => badges.key, { onDelete: "cascade" }),
    awardedAt: ts("awarded_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeKey] })],
);

/* ------------------------------------------------------------------ */
/* Materiais, clientes e financeiro                                    */
/* ------------------------------------------------------------------ */

export type MaterialKind =
  | "business_name"
  | "description"
  | "offer"
  | "instagram_post"
  | "whatsapp"
  | "catalog"
  | "proposal"
  | "service_script"
  | "delivery_checklist";
export type Tone = "simpatico" | "direto" | "formal";

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<MaterialKind>().notNull(),
    tone: text("tone").$type<Tone>().notNull().default("simpatico"),
    variant: integer("variant").notNull().default(0),
    content: text("content").notNull(),
    edited: boolean("edited").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("materials_user_kind_idx").on(t.userId, t.kind)],
);

export type ClientStatus = "novo" | "abordado" | "interessado" | "negociacao" | "conquistado" | "nao_avancou";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contactName: text("contact_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    channel: text("channel").notNull().default("WhatsApp"),
    origin: text("origin").notNull().default(""),
    status: text("status").$type<ClientStatus>().notNull().default("novo"),
    firstContactAt: date("first_contact_at"),
    notes: text("notes").notNull().default(""),
    nextAction: text("next_action").notNull().default(""),
    nextActionAt: ts("next_action_at"),
    reminderOn: boolean("reminder_on").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("clients_user_idx").on(t.userId)],
);

export const clientInteractions = pgTable("client_interactions", {
  id: serial("id").primaryKey(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: createdAt(),
});

export const financeEntries = pgTable(
  "finance_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"sale" | "cost" | "expense">().notNull(),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    date: date("date").notNull(),
    received: boolean("received").notNull().default(true),
    receivedAt: date("received_at"),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("finance_user_idx").on(t.userId, t.date)],
);

/* ------------------------------------------------------------------ */
/* Conteúdos: jurídico/contábil com revisão e conteúdo contínuo        */
/* ------------------------------------------------------------------ */

export type LegalStatus = "draft" | "in_review" | "approved" | "published" | "outdated";

export const legalContents = pgTable("legal_contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  area: text("area").$type<"contabil" | "juridico">().notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  sourceUrl: text("source_url").notNull().default(""),
  sourceCheckedAt: date("source_checked_at"),
  reviewerName: text("reviewer_name").notNull().default(""),
  reviewerRegistry: text("reviewer_registry").notNull().default(""),
  reviewAgainAt: date("review_again_at"),
  status: text("status").$type<LegalStatus>().notNull().default("draft"),
  approvedAt: ts("approved_at"),
  publishedAt: ts("published_at"),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: updatedAt(),
});

export const legalComments = pgTable("legal_comments", {
  id: serial("id").primaryKey(),
  contentId: uuid("content_id").notNull().references(() => legalContents.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  action: text("action").notNull(),
  message: text("message").notNull().default(""),
  createdAt: createdAt(),
});

export type ContentCategory =
  | "vendas"
  | "preco"
  | "divulgacao"
  | "dinheiro"
  | "atendimento"
  | "produtividade"
  | "clientes"
  | "melhorias";

export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").$type<ContentCategory>().notNull(),
  kind: text("kind").$type<"article" | "challenge">().notNull().default("article"),
  body: text("body").notNull(),
  minutes: integer("minutes").notNull().default(3),
  minStage: integer("min_stage").notNull().default(1),
  maxStage: integer("max_stage").notNull().default(14),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
  challengeGoal: integer("challenge_goal").notNull().default(0),
  challengePoints: integer("challenge_points").notNull().default(0),
  status: text("status").$type<"draft" | "published">().notNull().default("draft"),
  createdAt: createdAt(),
});

export const contentProgress = pgTable(
  "content_progress",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    contentId: uuid("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }),
    readAt: ts("read_at"),
    count: integer("count").notNull().default(0),
    completedAt: ts("completed_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.contentId] })],
);

/* ------------------------------------------------------------------ */
/* Planos, assinaturas, pagamentos e webhooks                          */
/* ------------------------------------------------------------------ */

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  intervalMonths: integer("interval_months").notNull(),
  firstPeriodPriceCents: integer("first_period_price_cents"),
  priceCents: integer("price_cents").notNull(),
  active: boolean("active").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: updatedAt(),
});

export const billingSettings = pgTable("billing_settings", {
  id: integer("id").primaryKey().default(1),
  noticeDaysBefore: integer("notice_days_before").notNull().default(3),
  pauseAfterDays: integer("pause_after_days").notNull().default(7),
  promoOnlyFirstSubscription: boolean("promo_only_first").notNull().default(true),
  pixExpiresMinutes: integer("pix_expires_minutes").notNull().default(30),
  gatewayMode: text("gateway_mode").$type<"demo" | "production">().notNull().default("demo"),
  updatedAt: updatedAt(),
});

export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  percentOff: integer("percent_off").notNull(),
  firstPeriodOnly: boolean("first_period_only").notNull().default(true),
  active: boolean("active").notNull().default(true),
  uses: integer("uses").notNull().default(0),
  createdAt: createdAt(),
});

export type SubscriptionStatus = "pending" | "active" | "past_due" | "paused" | "canceled" | "expired";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    planId: uuid("plan_id").notNull().references(() => plans.id),
    status: text("status").$type<SubscriptionStatus>().notNull().default("pending"),
    paymentMethod: text("payment_method").$type<"card" | "pix">().notNull(),
    cardLast4: text("card_last4"),
    couponCode: text("coupon_code"),
    firstPeriodPriceCents: integer("first_period_price_cents").notNull(),
    priceCents: integer("price_cents").notNull(),
    periodsPaid: integer("periods_paid").notNull().default(0),
    currentPeriodStart: ts("current_period_start"),
    currentPeriodEnd: ts("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: ts("canceled_at"),
    pastDueSince: ts("past_due_since"),
    noticeSentForPeriod: integer("notice_sent_for_period").notNull().default(0),
    gatewayRef: text("gateway_ref"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("subs_user_idx").on(t.userId)],
);

export type PaymentStatus = "pending" | "approved" | "refused" | "expired" | "refunded";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    periodNumber: integer("period_number").notNull(),
    amountCents: integer("amount_cents").notNull(),
    method: text("method").$type<"card" | "pix">().notNull(),
    status: text("status").$type<PaymentStatus>().notNull().default("pending"),
    attempt: integer("attempt").notNull().default(1),
    gatewayPaymentId: text("gateway_payment_id").notNull().unique(),
    pixCode: text("pix_code"),
    pixExpiresAt: ts("pix_expires_at"),
    failureReason: text("failure_reason"),
    confirmedAt: ts("confirmed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_sub_idx").on(t.subscriptionId)],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // id do evento no gateway → idempotência
  type: text("type").notNull(),
  gatewayPaymentId: text("gateway_payment_id"),
  payload: jsonb("payload").notNull(),
  result: text("result").notNull(),
  receivedAt: createdAt(),
});

/* ------------------------------------------------------------------ */
/* E-mails, auditoria e métricas anônimas                              */
/* ------------------------------------------------------------------ */

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  to: text("to_email").notNull(),
  template: text("template").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").$type<"queued" | "sent" | "failed">().notNull().default("queued"),
  createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: uuid("actor_id"),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull().default(""),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
});

export const funnelEvents = pgTable("funnel_events", {
  id: serial("id").primaryKey(),
  kind: text("kind").$type<"quiz_started" | "quiz_completed">().notNull(),
  createdAt: createdAt(),
});
