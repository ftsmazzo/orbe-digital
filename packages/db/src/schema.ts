import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const crmStageEnum = pgEnum("crm_stage", [
  "lead",
  "sessao",
  "proposta",
  "contrato",
  "ciclo",
  "renovacao",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "gravando",
  "enviado",
  "processando",
  "pronto",
  "erro",
]);

export const perspectiveEnum = pgEnum("perspective", [
  "financeira",
  "clientes",
  "processos",
  "aprendizagem",
]);

export const actionStatusEnum = pgEnum("action_status", [
  "aguardando",
  "em_andamento",
  "concluido",
  "atrasado",
  "nao_iniciado",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** Playbook comercial, price book, feriados locais, etc. */
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Better Auth tables — IDs must be text (not uuid). */
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessionsAuth = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull().default("local:credential"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    issuerAccountIdx: uniqueIndex("account_issuer_account_id_uidx").on(
      table.issuer,
      table.accountId,
    ),
  }),
);

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("owner").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  cnpj: text("cnpj"),
  sector: text("sector"),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  notes: text("notes"),
  stage: crmStageEnum("stage").default("lead").notNull(),
  /** Areas/equipes do cliente (Donna equipes). */
  teams: jsonb("teams").$type<string[]>().default([]).notNull(),
  /** Checklist admitir/nao admitir + notas comerciais. */
  salesQualification: jsonb("sales_qualification")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const artifactKindEnum = pgEnum("artifact_kind", [
  "sales_qualification",
  "score360",
  "working_capital",
  "valuation",
  "payroll_cost",
]);

/** Artifacts versionados por cliente (CG, valuation, folha light, etc.). */
export const clientArtifacts = pgTable("client_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  kind: artifactKindEnum("kind").notNull(),
  title: text("title").notNull(),
  status: text("status").default("rascunho").notNull(),
  version: integer("version").default(1).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Pessoas / headcount do cliente (equipes + folha light). */
export const clientPeople = pgTable("client_people", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  team: text("team"),
  salaryBase: numeric("salary_base", { precision: 12, scale: 2 }),
  employerCostFactor: numeric("employer_cost_factor", { precision: 6, scale: 4 }).default("1.7"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const consultingSessions = pgTable("consulting_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  /** estrategica | followup_fechamento | ciclo */
  kind: text("kind").default("ciclo").notNull(),
  consentGiven: boolean("consent_given").default(false).notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  audioKey: text("audio_key"),
  audioUrl: text("audio_url"),
  mimeType: text("mime_type"),
  transcriptRaw: text("transcript_raw"),
  transcriptSegments: jsonb("transcript_segments").$type<
    { speaker?: string; text: string; start?: number; end?: number }[]
  >(),
  status: sessionStatusEnum("status").default("gravando").notNull(),
  errorMessage: text("error_message"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const diagnostics = pgTable("diagnostics", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => consultingSessions.id, {
    onDelete: "set null",
  }),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  maturity: integer("maturity"),
  gaps: jsonb("gaps").$type<string[]>().default([]).notNull(),
  priorities: jsonb("priorities").$type<string[]>().default([]).notNull(),
  risks: jsonb("risks").$type<string[]>().default([]).notNull(),
  openQuestions: jsonb("open_questions").$type<string[]>().default([]).notNull(),
  validated: boolean("validated").default(false).notNull(),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  validatedById: text("validated_by_id").references(() => users.id),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const indicators = pgTable("indicators", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  perspective: perspectiveEnum("perspective").notNull(),
  name: text("name").notNull(),
  direction: text("direction").default("aumentar").notNull(),
  unit: text("unit").default("numero").notNull(),
  year: integer("year").notNull(),
  planned: jsonb("planned").$type<Record<string, number | null>>().default({}).notNull(),
  actual: jsonb("actual").$type<Record<string, number | null>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const actionItems = pgTable("action_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  indicatorId: uuid("indicator_id").references(() => indicators.id, {
    onDelete: "set null",
  }),
  perspective: perspectiveEnum("perspective"),
  title: text("title").notNull(),
  how: text("how"),
  sector: text("sector"),
  ownerName: text("owner_name"),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  businessDays: integer("business_days"),
  status: actionStatusEnum("status").default("nao_iniciado").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  contentHtml: text("content_html").notNull(),
  approved: boolean("approved").default(false).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  contentHtml: text("content_html").notNull(),
  investment: numeric("investment", { precision: 12, scale: 2 }),
  status: text("status").default("rascunho").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Pesquisa de mercado da fase R (Resultar) — regional ou global. */
export const marketInsights = pgTable("market_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(),
  region: text("region"),
  sector: text("sector"),
  summary: text("summary").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** DRE mensal do cliente para honorarios 15% EBITDA. */
export const clientFinancials = pgTable("client_financials", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  revenueNet: numeric("revenue_net", { precision: 14, scale: 2 }).default("0").notNull(),
  cpv: numeric("cpv", { precision: 14, scale: 2 }).default("0").notNull(),
  opex: numeric("opex", { precision: 14, scale: 2 }).default("0").notNull(),
  depreciation: numeric("depreciation", { precision: 14, scale: 2 }).default("0").notNull(),
  amortization: numeric("amortization", { precision: 14, scale: 2 }).default("0").notNull(),
  ebitda: numeric("ebitda", { precision: 14, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientContracts = pgTable("client_contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  billingStart: text("billing_start").default("m6").notNull(),
  ebitdaShare: numeric("ebitda_share", { precision: 6, scale: 4 }).default("0.15").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  status: text("status").default("rascunho").notNull(),
  contentHtml: text("content_html").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  area: text("area"),
  weight: integer("weight").default(1).notNull(),
  kind: text("kind").default("card").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => knowledgeSources.id, { onDelete: "cascade" }),
  heading: text("heading"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const salesScoreEvents = pgTable("sales_score_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  verdict: text("verdict").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});