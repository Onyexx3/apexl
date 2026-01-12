import { sql } from "drizzle-orm";
import { 
  pgTable, serial, varchar, text, integer, decimal, timestamp, boolean, 
  real, json, pgEnum, index, primaryKey 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }).unique().notNull(),
  address: text("address"),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  username: text("username").unique(),
  password: text("password"),
  role: text("role").notNull().default("collector"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  joinDate: timestamp("join_date").notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  totalSavings: decimal("total_savings", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).notNull().default("0"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  walletNumber: varchar("wallet_number", { length: 10 }).unique(),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").references(() => savingsPlans.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  status: text("status").notNull().default("completed"),
  payoutDestination: text("payout_destination"),
  payoutAccountNumber: text("payout_account_number"),
  payoutAccountName: text("payout_account_name"),
  payoutBankName: text("payout_bank_name"),
  processedBy: varchar("processed_by").references(() => staff.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Dynamic Savings Plan Types
export const savingsPlanTypes = pgTable("savings_plan_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., "food", "education", "investment", "emergency"
  description: text("description"),
  defaultDuration: integer("default_duration").notNull(), // in days
  defaultMaxContributions: integer("default_max_contributions").notNull(),
  defaultInterestRate: text("default_interest_rate").notNull(), // monthly rate as string
  defaultBreakFee: text("default_break_fee").notNull(), // percentage as string
  defaultEarlyWithdrawalPenalty: text("default_early_withdrawal_penalty").notNull(), // percentage as string
  isActive: boolean("is_active").notNull().default(true),
  canBreakAfterDays: integer("can_break_after_days").notNull().default(31), // minimum days before breaking
  profitCalculationType: text("profit_calculation_type").notNull().default("monthly"), // "monthly", "quarterly", "biannually", "yearly"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Dynamic Savings Plans (replaces both daily and yearly savings plans)
export const dynamicSavingsPlans = pgTable("dynamic_savings_plans", {
  id: serial("id").primaryKey(),
  planTypeId: integer("plan_type_id").notNull(),
  memberId: text("member_id").notNull(),
  planName: text("plan_name").notNull(),
  targetAmount: text("target_amount").notNull(),
  contributionAmount: text("contribution_amount").notNull(),
  maxContributions: integer("max_contributions").notNull(),
  currentContributions: integer("current_contributions").notNull().default(0),
  totalSaved: text("total_saved").notNull().default("0"),
  interestRate: text("interest_rate").notNull(), // monthly rate
  breakFee: text("break_fee").notNull(), // percentage
  earlyWithdrawalPenalty: text("early_withdrawal_penalty").notNull(), // percentage
  status: text("status").notNull().default("active"), // "active", "matured", "broken", "completed"
  startDate: timestamp("start_date").notNull().default(sql`now()`),
  maturityDate: timestamp("maturity_date").notNull(),
  completedDate: timestamp("completed_date"),
  profitEarned: text("profit_earned").notNull().default("0"),
  totalWithProfit: text("total_with_profit").notNull().default("0"),
  payoutStatus: text("payout_status").notNull().default("none"), // "none", "pending", "completed"
  canBreakAfterDays: integer("can_break_after_days").notNull(),
  profitCalculationType: text("profit_calculation_type").notNull().default("monthly"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Dynamic Savings Plan Contributions
export const dynamicSavingsPlanContributions = pgTable("dynamic_savings_plan_contributions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  memberId: text("member_id").notNull(),
  amount: text("amount").notNull(),
  date: timestamp("date").notNull().default(sql`now()`),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  contributionNumber: integer("contribution_number").notNull(),
  recordedBy: text("recorded_by"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Keep existing tables for backward compatibility
export const savingsPlans = pgTable("savings_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  planName: text("plan_name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  contributionAmount: decimal("contribution_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  contributionsCount: integer("contributions_count").notNull().default(0),
  maxContributions: integer("max_contributions").notNull().default(31),
  maxDays: integer("max_days").notNull().default(62),
  startDate: timestamp("start_date").notNull().defaultNow(),
  completedDate: timestamp("completed_date"),
  totalSaved: decimal("total_saved", { precision: 12, scale: 2 }).notNull().default("0"),
  payoutStatus: text("payout_status").default("none"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const planContributions = pgTable("plan_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => savingsPlans.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  contributionNumber: integer("contribution_number").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const yearlySavingsPlans = pgTable("yearly_savings_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  planName: text("plan_name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  contributionAmount: decimal("contribution_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  contributionsCount: integer("contributions_count").notNull().default(0),
  maxContributions: integer("max_contributions").notNull().default(372),
  maxDays: integer("max_days").notNull().default(372),
  startDate: timestamp("start_date").notNull().defaultNow(),
  maturityDate: timestamp("maturity_date").notNull(),
  completedDate: timestamp("completed_date"),
  totalSaved: decimal("total_saved", { precision: 12, scale: 2 }).notNull().default("0"),
  profitRate: decimal("profit_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  profitEarned: decimal("profit_earned", { precision: 12, scale: 2 }).notNull().default("0"),
  payoutStatus: text("payout_status").default("none"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const yearlyPlanContributions = pgTable("yearly_plan_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => yearlySavingsPlans.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  contributionNumber: integer("contribution_number").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  memberId: varchar("member_id").references(() => members.id, { onDelete: "cascade" }),
  transactionId: varchar("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  read: text("read").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => savingsPlans.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  totalRepayment: decimal("total_repayment", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => staff.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
});

export const branchesRelations = relations(branches, ({ many }) => ({
  staff: many(staff),
}));

// Relations for Dynamic Savings Plan Types
export const savingsPlanTypesRelations = relations(savingsPlanTypes, ({ many }) => ({
  dynamicPlans: many(dynamicSavingsPlans),
}));

// Relations for Dynamic Savings Plans
export const dynamicSavingsPlansRelations = relations(dynamicSavingsPlans, ({ one, many }) => ({
  planType: one(savingsPlanTypes, {
    fields: [dynamicSavingsPlans.planTypeId],
    references: [savingsPlanTypes.id],
  }),
  member: one(members, {
    fields: [dynamicSavingsPlans.memberId],
    references: [members.id],
  }),
  contributions: many(dynamicSavingsPlanContributions),
}));

// Relations for Dynamic Savings Plan Contributions
export const dynamicSavingsPlanContributionsRelations = relations(dynamicSavingsPlanContributions, ({ one }) => ({
  plan: one(dynamicSavingsPlans, {
    fields: [dynamicSavingsPlanContributions.planId],
    references: [dynamicSavingsPlans.id],
  }),
  member: one(members, {
    fields: [dynamicSavingsPlanContributions.memberId],
    references: [members.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  branch: one(branches, {
    fields: [staff.branchId],
    references: [branches.id],
  }),
  members: many(members),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  staff: one(staff, {
    fields: [members.staffId],
    references: [staff.id],
  }),
  transactions: many(transactions),
  savingsPlans: many(savingsPlans),
  yearlySavingsPlans: many(yearlySavingsPlans),
  yearlyPlanContributions: many(yearlyPlanContributions),
  dynamicSavingsPlans: many(dynamicSavingsPlans),
  dynamicSavingsPlanContributions: many(dynamicSavingsPlanContributions),
  loans: many(loans),
  notifications: many(notifications),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
  plan: one(savingsPlans, {
    fields: [transactions.planId],
    references: [savingsPlans.id],
  }),
  processedByStaff: one(staff, {
    fields: [transactions.processedBy],
    references: [staff.id],
  }),
}));

export const savingsPlansRelations = relations(savingsPlans, ({ one, many }) => ({
  member: one(members, {
    fields: [savingsPlans.memberId],
    references: [members.id],
  }),
  contributions: many(planContributions),
}));

export const yearlySavingsPlansRelations = relations(yearlySavingsPlans, ({ one, many }) => ({
  member: one(members, {
    fields: [yearlySavingsPlans.memberId],
    references: [members.id],
  }),
  contributions: many(yearlyPlanContributions),
}));

export const planContributionsRelations = relations(planContributions, ({ one }) => ({
  plan: one(savingsPlans, {
    fields: [planContributions.planId],
    references: [savingsPlans.id],
  }),
  member: one(members, {
    fields: [planContributions.memberId],
    references: [members.id],
  }),
  recordedByStaff: one(staff, {
    fields: [planContributions.recordedBy],
    references: [staff.id],
  }),
}));

export const yearlyPlanContributionsRelations = relations(yearlyPlanContributions, ({ one }) => ({
  plan: one(yearlySavingsPlans, {
    fields: [yearlyPlanContributions.planId],
    references: [yearlySavingsPlans.id],
  }),
  member: one(members, {
    fields: [yearlyPlanContributions.memberId],
    references: [members.id],
  }),
  recordedByStaff: one(staff, {
    fields: [yearlyPlanContributions.recordedBy],
    references: [staff.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  member: one(members, {
    fields: [notifications.memberId],
    references: [members.id],
  }),
  transaction: one(transactions, {
    fields: [notifications.transactionId],
    references: [transactions.id],
  }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
  plan: one(savingsPlans, {
    fields: [loans.planId],
    references: [savingsPlans.id],
  }),
  approvedByStaff: one(staff, {
    fields: [loans.approvedBy],
    references: [staff.id],
  }),
}));

export const investmentTypes = pgTable("investment_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  minimumDeposit: decimal("minimum_deposit", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  paymentPlan: text("payment_plan").notNull(),
  durationDays: integer("duration_days").notNull(),
  breakFee: decimal("break_fee", { precision: 5, scale: 2 }).notNull().default("0"),
  isBreakable: boolean("is_breakable").notNull().default(true),
  status: text("status").notNull().default("active"),
  createdBy: varchar("created_by").references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberInvestments = pgTable("member_investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  investmentTypeId: varchar("investment_type_id").notNull().references(() => investmentTypes.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  expectedReturn: decimal("expected_return", { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  maturityDate: timestamp("maturity_date").notNull(),
  status: text("status").notNull().default("active"),
  breakFeeApplied: decimal("break_fee_applied", { precision: 12, scale: 2 }),
  actualReturn: decimal("actual_return", { precision: 12, scale: 2 }),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  assignedBy: varchar("assigned_by").references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investmentTypesRelations = relations(investmentTypes, ({ one, many }) => ({
  createdByStaff: one(staff, {
    fields: [investmentTypes.createdBy],
    references: [staff.id],
  }),
  memberInvestments: many(memberInvestments),
}));

export const memberInvestmentsRelations = relations(memberInvestments, ({ one }) => ({
  member: one(members, {
    fields: [memberInvestments.memberId],
    references: [members.id],
  }),
  investmentType: one(investmentTypes, {
    fields: [memberInvestments.investmentTypeId],
    references: [investmentTypes.id],
  }),
  assignedByStaff: one(staff, {
    fields: [memberInvestments.assignedBy],
    references: [staff.id],
  }),
}));

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(2, "Branch code is required").max(10, "Branch code must be 10 characters or less"),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  branchId: z.string().min(1, "Branch is required"),
  name: z.string().min(1, "Staff name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["manager", "collector", "admin"]).default("collector"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  joinDate: true,
  totalSavings: true,
  totalPayouts: true,
  balance: true,
  walletNumber: true,
  walletBalance: true,
}).extend({
  staffId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  date: true,
  processedAt: true,
}).extend({
  memberId: z.string().min(1, "Member is required"),
  planId: z.string().optional().nullable(),
  type: z.enum(["savings", "payout"]),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["completed", "pending", "approved", "rejected"]).default("completed"),
  date: z.string().optional(),
  payoutDestination: z.string().optional(),
  payoutAccountNumber: z.string().optional(),
  payoutAccountName: z.string().optional(),
  payoutBankName: z.string().optional(),
  processedBy: z.string().optional(),
});

// Dynamic Savings Plan Type Schemas
export const insertSavingsPlanTypeSchema = createInsertSchema(savingsPlanTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Plan type name is required"),
  category: z.string().min(1, "Category is required"),
  defaultDuration: z.number().min(1, "Duration must be at least 1 day"),
  defaultMaxContributions: z.number().min(1, "Max contributions must be at least 1"),
  defaultInterestRate: z.string().min(1, "Interest rate is required"),
  defaultBreakFee: z.string().min(1, "Break fee is required"),
  defaultEarlyWithdrawalPenalty: z.string().min(1, "Early withdrawal penalty is required"),
  profitCalculationType: z.enum(["monthly", "quarterly", "biannually", "yearly"]).default("monthly"),
});

// Dynamic Savings Plan Schemas
export const insertDynamicSavingsPlanSchema = createInsertSchema(dynamicSavingsPlans).omit({
  id: true,
  currentContributions: true,
  totalSaved: true,
  status: true,
  startDate: true,
  completedDate: true,
  profitEarned: true,
  totalWithProfit: true,
  payoutStatus: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  planTypeId: z.number().min(1, "Plan type is required"),
  memberId: z.string().min(1, "Member is required"),
  planName: z.string().min(1, "Plan name is required"),
  targetAmount: z.string().min(1, "Target amount is required"),
  contributionAmount: z.string().min(1, "Contribution amount is required"),
  maxContributions: z.number().min(1, "Max contributions must be at least 1"),
  interestRate: z.string().min(1, "Interest rate is required"),
  breakFee: z.string().min(1, "Break fee is required"),
  earlyWithdrawalPenalty: z.string().min(1, "Early withdrawal penalty is required"),
  maturityDate: z.string().min(1, "Maturity date is required"),
  canBreakAfterDays: z.number().min(1, "Can break after days must be at least 1"),
  profitCalculationType: z.enum(["monthly", "quarterly", "biannually", "yearly"]).default("monthly"),
});

// Dynamic Savings Plan Contribution Schemas
export const insertDynamicSavingsPlanContributionSchema = createInsertSchema(dynamicSavingsPlanContributions).omit({
  id: true,
  contributionNumber: true,
  createdAt: true,
}).extend({
  planId: z.number().min(1, "Plan is required"),
  memberId: z.string().min(1, "Member is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().optional(),
});

export const insertSavingsPlanSchema = createInsertSchema(savingsPlans).omit({
  id: true,
  contributionsCount: true,
  startDate: true,
  completedDate: true,
  totalSaved: true,
  createdAt: true,
  status: true,
  payoutStatus: true,
}).extend({
  memberId: z.string().min(1, "Member is required"),
  planName: z.string().min(1, "Plan name is required"),
  targetAmount: z.string().min(1, "Target amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Target amount must be a positive number",
  }),
  contributionAmount: z.string().min(1, "Contribution amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Contribution amount must be a positive number",
  }),
  maxContributions: z.number().int().positive().default(31),
  maxDays: z.number().int().positive().default(62),
});

export const insertPlanContributionSchema = createInsertSchema(planContributions).omit({
  id: true,
  createdAt: true,
  date: true,
  contributionNumber: true,
}).extend({
  planId: z.string().min(1, "Plan ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().optional(),
});

export const insertYearlySavingsPlanSchema = createInsertSchema(yearlySavingsPlans).omit({
  id: true,
  contributionsCount: true,
  startDate: true,
  completedDate: true,
  totalSaved: true,
  profitEarned: true,
  createdAt: true,
  status: true,
  payoutStatus: true,
}).extend({
  memberId: z.string().min(1, "Member is required"),
  planName: z.string().min(1, "Plan name is required"),
  targetAmount: z.string().min(1, "Target amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Target amount must be a positive number",
  }),
  contributionAmount: z.string().min(1, "Contribution amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Contribution amount must be a positive number",
  }),
  maxContributions: z.number().int().positive().default(372),
  maxDays: z.number().int().positive().default(372),
  profitRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Profit rate must be zero or positive",
  }).default("5.00"),
  maturityDate: z.string().min(1, "Maturity date is required"),
});

export const insertYearlyPlanContributionSchema = createInsertSchema(yearlyPlanContributions).omit({
  id: true,
  createdAt: true,
  date: true,
  contributionNumber: true,
}).extend({
  planId: z.string().min(1, "Plan ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["pending_payout", "payout_approved", "plan_completed", "reminder", "plan_closed", "loan_requested", "loan_approved", "loan_rejected", "yearly_plan_matured", "monthly_payout"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  memberId: z.string().optional(),
  transactionId: z.string().optional(),
  read: z.enum(["true", "false"]).default("false"),
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  requestedAt: true,
  approvedAt: true,
  amountPaid: true,
  status: true,
  interestRate: true,
  totalRepayment: true,
  dueDate: true,
  approvedBy: true,
}).extend({
  memberId: z.string().min(1, "Member is required"),
  planId: z.string().min(1, "Savings plan is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  notes: z.string().optional(),
});

export const insertInvestmentTypeSchema = createInsertSchema(investmentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Investment name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  minimumDeposit: z.string().min(1, "Minimum deposit is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Minimum deposit must be a positive number",
  }),
  interestRate: z.string().min(1, "Interest rate is required").refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Interest rate must be zero or positive",
  }),
  paymentPlan: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "maturity"]),
  durationDays: z.number().int().positive("Duration must be positive"),
  breakFee: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Break fee must be zero or positive",
  }).default("0"),
  isBreakable: z.boolean().default(true),
  status: z.enum(["active", "inactive"]).default("active"),
  createdBy: z.string().optional(),
});

export const insertMemberInvestmentSchema = createInsertSchema(memberInvestments).omit({
  id: true,
  createdAt: true,
  startDate: true,
  expectedReturn: true,
  maturityDate: true,
  breakFeeApplied: true,
  actualReturn: true,
  completedDate: true,
}).extend({
  memberId: z.string().min(1, "Member is required"),
  investmentTypeId: z.string().min(1, "Investment type is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  interestRate: z.string().optional(),
  status: z.enum(["active", "matured", "broken", "completed"]).default("active"),
  notes: z.string().optional(),
  assignedBy: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SavingsPlan = typeof savingsPlans.$inferSelect;
export type InsertSavingsPlan = z.infer<typeof insertSavingsPlanSchema>;
export type PlanContribution = typeof planContributions.$inferSelect;
export type InsertPlanContribution = z.infer<typeof insertPlanContributionSchema>;
export type YearlySavingsPlan = typeof yearlySavingsPlans.$inferSelect;
export type InsertYearlySavingsPlan = z.infer<typeof insertYearlySavingsPlanSchema>;
export type YearlyPlanContribution = typeof yearlyPlanContributions.$inferSelect;
export type InsertYearlyPlanContribution = z.infer<typeof insertYearlyPlanContributionSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

// Dynamic Savings Plan Types
export type SavingsPlanType = typeof savingsPlanTypes.$inferSelect;
export type InsertSavingsPlanType = z.infer<typeof insertSavingsPlanTypeSchema>;
export type DynamicSavingsPlan = typeof dynamicSavingsPlans.$inferSelect;
export type InsertDynamicSavingsPlan = z.infer<typeof insertDynamicSavingsPlanSchema>;
export type DynamicSavingsPlanContribution = typeof dynamicSavingsPlanContributions.$inferSelect;
export type InsertDynamicSavingsPlanContribution = z.infer<typeof insertDynamicSavingsPlanContributionSchema>;

export type BranchWithStaff = Branch & {
  staff: Staff[];
};

export type StaffWithBranch = Staff & {
  branch: Branch;
};

export type StaffWithMembers = Staff & {
  branch: Branch;
  members: Member[];
};

export type MemberWithStaff = Member & {
  staff: StaffWithBranch | null;
};

export type MemberWithTransactions = Member & {
  transactions: Transaction[];
};

export type TransactionWithMember = Transaction & {
  member: Member;
};

export type TransactionWithDetails = Transaction & {
  member: Member;
  processedByStaff?: Staff | null;
};

export type SavingsPlanWithDetails = SavingsPlan & {
  member: Member;
  contributions: PlanContribution[];
};

export type YearlySavingsPlanWithDetails = YearlySavingsPlan & {
  member: Member;
  contributions: YearlyPlanContribution[];
};

export type MemberWithPlans = Member & {
  staff: StaffWithBranch | null;
  savingsPlans: SavingsPlan[];
  yearlySavingsPlans: YearlySavingsPlan[];
  dynamicSavingsPlans: (DynamicSavingsPlan & { planType: SavingsPlanType })[];
};

export type DynamicSavingsPlanWithDetails = DynamicSavingsPlan & {
  planType: SavingsPlanType;
  member: Member;
  contributions: DynamicSavingsPlanContribution[];
};

export type SavingsPlanTypeWithPlans = SavingsPlanType & {
  dynamicPlans: DynamicSavingsPlan[];
};

export type LoanWithDetails = Loan & {
  member: Member;
  plan: SavingsPlan;
  approvedByStaff?: Staff | null;
};

export type InvestmentType = typeof investmentTypes.$inferSelect;
export type InsertInvestmentType = z.infer<typeof insertInvestmentTypeSchema>;
export type MemberInvestment = typeof memberInvestments.$inferSelect;
export type InsertMemberInvestment = z.infer<typeof insertMemberInvestmentSchema>;

export type InvestmentTypeWithCreator = InvestmentType & {
  createdByStaff?: Staff | null;
};

export type MemberInvestmentWithDetails = MemberInvestment & {
  member: Member;
  investmentType: InvestmentType;
  assignedByStaff?: Staff | null;
};
