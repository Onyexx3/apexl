import { 
  members, staff, branches, transactions, savingsPlans, planContributions, 
  yearlySavingsPlans, yearlyPlanContributions, notifications, walletTransactions,
  investmentTypes, memberInvestments, loans, sessions,
  // New dynamic savings plan tables
  savingsPlanTypes, dynamicSavingsPlans, dynamicSavingsPlanContributions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, lt, and, inArray, ilike, or } from "drizzle-orm";
import { hashPassword } from "./auth";
import type { 
  Branch, Staff, Member, Transaction, SavingsPlan, PlanContribution,
  YearlySavingsPlan, YearlyPlanContribution, Notification, WalletTransaction,
  InvestmentType, MemberInvestment, Loan, Session,
  // Dynamic savings plan types
  SavingsPlanType, DynamicSavingsPlan, DynamicSavingsPlanContribution,
  InsertSavingsPlanType, InsertDynamicSavingsPlan, InsertDynamicSavingsPlanContribution,
  // Combined types
  BranchWithStaff, StaffWithBranch, StaffWithMembers, MemberWithStaff,
  MemberWithTransactions, TransactionWithMember, TransactionWithDetails,
  SavingsPlanWithDetails, YearlySavingsPlanWithDetails,
  DynamicSavingsPlanWithDetails, SavingsPlanTypeWithPlans,
  LoanWithDetails, InvestmentTypeWithCreator, MemberInvestmentWithDetails
} from "@shared/schema";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContributionResult {
  contributions: PlanContribution[];
  overflowAmount: number;
  remainingSlots: number;
}

export interface IStorage {
  getBranch(id: string): Promise<BranchWithStaff | undefined>;
  getAllBranches(): Promise<Branch[]>;
  getBranchesPaginated(page: number, limit: number): Promise<PaginatedResponse<Branch>>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;

  getStaff(id: string): Promise<StaffWithBranch | undefined>;
  getAllStaff(): Promise<StaffWithBranch[]>;
  getStaffPaginated(page: number, limit: number): Promise<PaginatedResponse<StaffWithBranch>>;
  getStaffByBranch(branchId: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: string): Promise<void>;

  getMember(id: string): Promise<MemberWithTransactions | undefined>;
  getMemberWithStaff(id: string): Promise<MemberWithStaff | undefined>;
  getAllMembers(): Promise<Member[]>;
  getMembersPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<Member>>;
  getMembersByStaff(staffId: string): Promise<Member[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: string): Promise<void>;

  getTransaction(id: string): Promise<TransactionWithMember | undefined>;
  getAllTransactions(): Promise<TransactionWithMember[]>;
  getTransactionsPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<TransactionWithMember>>;
  getRecentTransactions(limit: number, user: { role: string; id: string; branchId: string }): Promise<TransactionWithMember[]>;
  getTransactionsByType(type: string): Promise<TransactionWithMember[]>;
  getPayoutsPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<TransactionWithMember>>;
  createTransaction(transaction: InsertTransaction, skipWalletUpdate?: boolean): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction>;
  completePayoutTransaction(id: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string; processedBy: string }): Promise<Transaction>;

  getSavingsPlan(id: string): Promise<SavingsPlanWithDetails | undefined>;
  getAllSavingsPlans(): Promise<SavingsPlan[]>;
  getPlansPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<SavingsPlan>>;
  getMemberSavingsPlans(memberId: string): Promise<SavingsPlan[]>;
  createSavingsPlan(plan: InsertSavingsPlan): Promise<SavingsPlan>;
  cancelSavingsPlan(id: string): Promise<{ plan: SavingsPlan; payoutAmount: number }>;
  deleteSavingsPlan(id: string): Promise<void>;
  createPlanContribution(contribution: InsertPlanContribution): Promise<PlanContribution>;
  createMultiplePlanContributions(planId: string, memberId: string, totalAmount: number, paymentMethod?: string, notes?: string, date?: string, recordedBy?: string): Promise<ContributionResult>;
  checkAndClosePlan(planId: string): Promise<void>;
  checkAndCloseExpiredPlans(): Promise<void>;
  getPlanRemainingSlots(planId: string): Promise<number>;
  requestPlanPayout(planId: string, memberId: string): Promise<Transaction>;
  completePlanPayout(transactionId: string, staffId: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string }): Promise<Transaction>;

  getYearlySavingsPlan(id: string): Promise<YearlySavingsPlanWithDetails | undefined>;
  getAllYearlySavingsPlans(): Promise<YearlySavingsPlan[]>;
  getYearlyPlansPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<YearlySavingsPlan>>;
  getMemberYearlySavingsPlans(memberId: string): Promise<YearlySavingsPlan[]>;
  createYearlySavingsPlan(plan: InsertYearlySavingsPlan): Promise<YearlySavingsPlan>;
  createYearlyPlanContribution(contribution: InsertYearlyPlanContribution): Promise<YearlyPlanContribution>;
  createMultipleYearlyPlanContributions(planId: string, memberId: string, totalAmount: number, paymentMethod?: string, notes?: string, date?: string, recordedBy?: string): Promise<ContributionResult>;
  checkAndMatureYearlyPlan(planId: string): Promise<void>;
  checkAndMatureExpiredYearlyPlans(): Promise<void>;
  getYearlyPlanRemainingSlots(planId: string): Promise<number>;
  requestYearlyPlanPayout(planId: string, memberId: string): Promise<Transaction>;
  completeYearlyPlanPayout(transactionId: string, staffId: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string }): Promise<Transaction>;
  calculateYearlyPlanProfit(planId: string): Promise<{ profitEarned: string; totalWithProfit: string; monthlyProfitEarned: string; fullProfitEarned: string }>;
  requestYearlyPlanMonthlyPayout(planId: string, memberId: string): Promise<Transaction>;
  checkAndPayMonthlyProfits(): Promise<void>;

  // Dynamic Savings Plan Type Management
  getSavingsPlanTypes(): Promise<SavingsPlanType[]>;
  getSavingsPlanType(id: number): Promise<SavingsPlanType | null>;
  createSavingsPlanType(planType: InsertSavingsPlanType): Promise<SavingsPlanType>;
  updateSavingsPlanType(id: number, planType: Partial<InsertSavingsPlanType>): Promise<SavingsPlanType>;
  deleteSavingsPlanType(id: number): Promise<void>;

  // Dynamic Savings Plan Management
  getDynamicSavingsPlans(): Promise<DynamicSavingsPlanWithDetails[]>;
  getDynamicSavingsPlansPaginated(page: number, limit: number): Promise<PaginatedResponse<DynamicSavingsPlanWithDetails>>;
  getDynamicSavingsPlan(id: number): Promise<DynamicSavingsPlanWithDetails | null>;
  getMemberDynamicSavingsPlans(memberId: string): Promise<DynamicSavingsPlanWithDetails[]>;
  createDynamicSavingsPlan(plan: InsertDynamicSavingsPlan): Promise<DynamicSavingsPlan>;
  createDynamicSavingsPlanContribution(contribution: InsertDynamicSavingsPlanContribution): Promise<DynamicSavingsPlanContribution>;
  createMultipleDynamicSavingsPlanContributions(planId: number, memberId: string, totalAmount: number, paymentMethod?: string, notes?: string, date?: string, recordedBy?: string): Promise<ContributionResult>;
  calculateDynamicPlanProfit(planId: number): Promise<{ profitEarned: string; totalWithProfit: string; monthlyProfitEarned: string; fullProfitEarned: string; breakFeeAmount: string; earlyWithdrawalPenaltyAmount: string }>;
  checkAndMatureDynamicPlan(planId: number): Promise<void>;
  checkAndMatureExpiredDynamicPlans(): Promise<void>;
  getDynamicPlanRemainingSlots(planId: number): Promise<number>;
  requestDynamicPlanPayout(planId: number, memberId: string): Promise<Transaction>;
  completeDynamicPlanPayout(transactionId: string, staffId: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string }): Promise<Transaction>;
  breakDynamicPlan(planId: number, memberId: string, reason?: string): Promise<Transaction>;
  requestDynamicPlanEarlyWithdrawal(planId: number, memberId: string): Promise<Transaction>;

  addToWallet(memberId: string, amount: number): Promise<Member>;
  withdrawFromWallet(memberId: string, amount: number): Promise<Member>;

  getDashboardStats(): Promise<{
    totalSavings: string;
    activeMembers: number;
    todayCollections: string;
    pendingPayouts: string;
    totalBranches: number;
    totalStaff: number;
  }>;

  getAnalytics(): Promise<{
    dailySavings: Array<{ date: string; amount: number; count: number }>;
    memberStats: { activeCount: number; inactiveCount: number; totalWalletBalance: string };
    planStats: { activePlans: number; completedPlans: number; totalAmountLocked: string };
    payoutStats: { completed: string; pending: string; rejected: string };
  }>;

  getAllNotifications(): Promise<Notification[]>;
  getNotificationsPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }): Promise<PaginatedResponse<Notification>>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  getUnreadNotificationCount(user: { role: string; id: string; branchId: string }): Promise<number>;

  // Investment Type Management
  getInvestmentTypes(): Promise<InvestmentType[]>;
  getInvestmentType(id: string): Promise<InvestmentTypeWithCreator | undefined>;
  createInvestmentType(investmentType: InsertInvestmentType): Promise<InvestmentType>;
  updateInvestmentType(id: string, investmentType: Partial<InsertInvestmentType>): Promise<InvestmentType>;
  deleteInvestmentType(id: string): Promise<void>;
  getInvestmentTypesPaginated(page: number, limit: number): Promise<PaginatedResponse<InvestmentType>>;

  // Member Investment Management
  getMemberInvestmentsPaginated(page: number, limit: number, memberId?: string, investmentTypeId?: string): Promise<PaginatedResponse<MemberInvestmentWithDetails>>;
  getMemberInvestment(id: string): Promise<MemberInvestmentWithDetails | undefined>;
  getMemberInvestmentsByMember(memberId: string): Promise<MemberInvestmentWithDetails[]>;
  createMemberInvestment(investment: InsertMemberInvestment): Promise<MemberInvestment>;
  breakMemberInvestment(id: string): Promise<MemberInvestment>;
  matureMemberInvestment(id: string): Promise<MemberInvestment>;
  checkAndMatureInvestments(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getBranch(id: string): Promise<BranchWithStaff | undefined> {
    const result = await db.query.branches.findFirst({
      where: eq(branches.id, id),
      with: {
        staff: true,
      },
    });
    return result;
  }

  async getAllBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(desc(branches.createdAt));
  }

  async getBranchesPaginated(page: number, limit: number): Promise<PaginatedResponse<Branch>> {
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      db.select().from(branches).orderBy(desc(branches.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(branches),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const [branch] = await db
      .insert(branches)
      .values(insertBranch)
      .returning();
    return branch;
  }

  async updateBranch(id: string, insertBranch: Partial<InsertBranch>): Promise<Branch> {
    const [branch] = await db
      .update(branches)
      .set({ ...insertBranch, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return branch;
  }

  async deleteBranch(id: string): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  async getStaff(id: string): Promise<StaffWithBranch | undefined> {
    const result = await db.query.staff.findFirst({
      where: eq(staff.id, id),
      with: {
        branch: true,
      },
    });
    return result;
  }

  async getAllStaff(): Promise<StaffWithBranch[]> {
    const result = await db.query.staff.findMany({
      with: {
        branch: true,
      },
      orderBy: [desc(staff.createdAt)],
    });
    return result;
  }

  async getStaffPaginated(page: number, limit: number): Promise<PaginatedResponse<StaffWithBranch>> {
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      db.query.staff.findMany({
        with: { branch: true },
        orderBy: [desc(staff.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql`count(*)` }).from(staff),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStaffByBranch(branchId: string): Promise<Staff[]> {
    return await db
      .select()
      .from(staff)
      .where(eq(staff.branchId, branchId))
      .orderBy(desc(staff.createdAt));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    let hashedPassword: string | undefined;
    if (insertStaff.password) {
      hashedPassword = await hashPassword(insertStaff.password);
    }
    const [newStaff] = await db
      .insert(staff)
      .values({
        ...insertStaff,
        password: hashedPassword,
      })
      .returning();
    return newStaff;
  }

  async updateStaff(id: string, insertStaff: Partial<InsertStaff>): Promise<Staff> {
    let updateData: any = { ...insertStaff, updatedAt: new Date() };
    if (insertStaff.password) {
      updateData.password = await hashPassword(insertStaff.password);
    }
    const [updatedStaff] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();
    return updatedStaff;
  }

  async deleteStaff(id: string): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  async getMember(id: string): Promise<MemberWithTransactions | undefined> {
    const result = await db.query.members.findFirst({
      where: eq(members.id, id),
      with: {
        transactions: {
          orderBy: [desc(transactions.date)],
        },
      },
    });
    return result;
  }

  async getMemberWithStaff(id: string): Promise<MemberWithStaff | undefined> {
    const result = await db.query.members.findFirst({
      where: eq(members.id, id),
      with: {
        staff: {
          with: {
            branch: true,
          },
        },
      },
    });
    return result as MemberWithStaff | undefined;
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(desc(members.joinDate));
  }

  async getMembersPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<Member>> {
    const offset = (page - 1) * limit;
    const whereClause = search && search.trim()
      ? or(ilike(members.name, `%${search.trim()}%`), ilike(members.email, `%${search.trim()}%`), ilike(members.phone, `%${search.trim()}%`))
      : undefined;
    const [data, countResult] = await Promise.all([
      db.select().from(members).where(whereClause).orderBy(desc(members.joinDate)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(members).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMembersByStaff(staffId: string): Promise<Member[]> {
    return await db
      .select()
      .from(members)
      .where(eq(members.staffId, staffId))
      .orderBy(desc(members.joinDate));
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const walletNumber = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const [member] = await db
      .insert(members)
      .values({
        ...insertMember,
        walletNumber,
      })
      .returning();
    return member;
  }

  async updateMember(id: string, insertMember: Partial<InsertMember>): Promise<Member> {
    const [member] = await db
      .update(members)
      .set(insertMember)
      .where(eq(members.id, id))
      .returning();
    return member;
  }

  async deleteMember(id: string): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  async getTransaction(id: string): Promise<TransactionWithMember | undefined> {
    const result = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        member: true,
      },
    });
    return result;
  }

  async getAllTransactions(): Promise<TransactionWithMember[]> {
    const result = await db.query.transactions.findMany({
      with: {
        member: true,
      },
      orderBy: [desc(transactions.date)],
    });
    return result;
  }

  // Resolves member ids matching a name search, intersected with an optional
  // scoping list. Returns undefined when there's no search term (no filter needed).
  private async getSearchMemberIds(search: string | undefined, scopedMemberIds: string[] | undefined): Promise<string[] | undefined> {
    if (!search || !search.trim()) {
      return undefined;
    }
    const matches = await db.select({ id: members.id }).from(members).where(ilike(members.name, `%${search.trim()}%`));
    const matchingIds = matches.map(m => m.id);
    if (!scopedMemberIds) {
      return matchingIds;
    }
    const scopedSet = new Set(scopedMemberIds);
    return matchingIds.filter(id => scopedSet.has(id));
  }

  async getTransactionsPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<TransactionWithMember>> {
    const offset = (page - 1) * limit;
    const scopedMemberIds = await this.getScopedMemberIds(user);
    if (scopedMemberIds && scopedMemberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const searchMemberIds = await this.getSearchMemberIds(search, scopedMemberIds);
    if (searchMemberIds && searchMemberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const effectiveMemberIds = searchMemberIds ?? scopedMemberIds;
    const whereClause = effectiveMemberIds ? inArray(transactions.memberId, effectiveMemberIds) : undefined;

    const [data, countResult] = await Promise.all([
      db.query.transactions.findMany({
        where: whereClause,
        with: { member: true },
        orderBy: [desc(transactions.date)],
        limit,
        offset,
      }),
      db.select({ count: sql`count(*)` }).from(transactions).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecentTransactions(limit: number, user: { role: string; id: string; branchId: string }): Promise<TransactionWithMember[]> {
    const scopedMemberIds = await this.getScopedMemberIds(user);
    if (scopedMemberIds && scopedMemberIds.length === 0) {
      return [];
    }

    const result = await db.query.transactions.findMany({
      where: scopedMemberIds ? inArray(transactions.memberId, scopedMemberIds) : undefined,
      with: {
        member: true,
      },
      orderBy: [desc(transactions.date)],
      limit,
    });
    return result;
  }

  async getTransactionsByType(type: string): Promise<TransactionWithMember[]> {
    const result = await db.query.transactions.findMany({
      where: eq(transactions.type, type),
      with: {
        member: true,
      },
      orderBy: [desc(transactions.date)],
    });
    return result;
  }

  async getPayoutsPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<TransactionWithMember>> {
    const offset = (page - 1) * limit;
    const scopedMemberIds = await this.getScopedMemberIds(user);
    if (scopedMemberIds && scopedMemberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const searchMemberIds = await this.getSearchMemberIds(search, scopedMemberIds);
    if (searchMemberIds && searchMemberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const effectiveMemberIds = searchMemberIds ?? scopedMemberIds;
    const whereClause = effectiveMemberIds
      ? and(eq(transactions.type, "payout"), inArray(transactions.memberId, effectiveMemberIds))
      : eq(transactions.type, "payout");

    const [data, countResult] = await Promise.all([
      db.query.transactions.findMany({
        where: whereClause,
        with: { member: true },
        orderBy: [desc(transactions.date)],
        limit,
        offset,
      }),
      db.select({ count: sql`count(*)` }).from(transactions).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTransaction(insertTransaction: InsertTransaction, skipWalletUpdate = false): Promise<Transaction> {
    const amount = parseFloat(insertTransaction.amount);
    const memberId = insertTransaction.memberId;
    const type = insertTransaction.type;

    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        date: insertTransaction.date ? new Date(insertTransaction.date) : new Date(),
      })
      .returning();

    if (type === "savings") {
      await db
        .update(members)
        .set({
          totalSavings: sql`${members.totalSavings} + ${amount}`,
          balance: sql`${members.balance} + ${amount}`,
          ...(skipWalletUpdate ? {} : { walletBalance: sql`${members.walletBalance} + ${amount}` }),
        })
        .where(eq(members.id, memberId));
    } else if (type === "payout" && insertTransaction.status === "completed") {
      await db
        .update(members)
        .set({
          totalPayouts: sql`${members.totalPayouts} + ${amount}`,
          balance: sql`${members.balance} - ${amount}`,
          ...(skipWalletUpdate ? {} : { walletBalance: sql`${members.walletBalance} - ${amount}` }),
        })
        .where(eq(members.id, memberId));
    }

    return transaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const [updatedTransaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();

    if (transaction.type === "payout" && status === "completed" && transaction.status !== "completed") {
      const amount = parseFloat(transaction.amount);
      await db
        .update(members)
        .set({
          totalPayouts: sql`${members.totalPayouts} + ${amount}`,
          balance: sql`${members.balance} - ${amount}`,
          walletBalance: sql`${members.walletBalance} - ${amount}`,
        })
        .where(eq(members.id, transaction.memberId));
    }

    return updatedTransaction;
  }

  async completePayoutTransaction(id: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string; processedBy: string }): Promise<Transaction> {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.type !== "payout") {
      throw new Error("Transaction is not a payout");
    }

    // Calculate fee (1 contribution slot) - ONLY for regular savings plans
    let actualPayoutAmount = parseFloat(transaction.amount);
    let feeAmount = 0;
    
    if (transaction.planId) {
      // Check if this is a regular savings plan (not yearly or dynamic)
      const regularPlan = await db.query.savingsPlans.findFirst({
        where: eq(savingsPlans.id, transaction.planId),
      });
      
      if (regularPlan && regularPlan.contributionAmount) {
        // Deduct 1 contribution slot as fee for regular savings plans only
        feeAmount = parseFloat(regularPlan.contributionAmount);
        actualPayoutAmount = actualPayoutAmount - feeAmount;
        
        // Update transaction amount to reflect actual payout after fee
        await db
          .update(transactions)
          .set({
            amount: actualPayoutAmount.toString(),
            notes: `${transaction.notes} (Fee: ₦${feeAmount.toFixed(2)} for 1 contribution slot deducted)`,
          })
          .where(eq(transactions.id, id));
      }
      // No fee for yearly or dynamic plans - they already have interest
    }

    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        status: "completed",
        payoutDestination: payoutDetails.payoutDestination,
        payoutAccountNumber: payoutDetails.payoutAccountNumber,
        payoutAccountName: payoutDetails.payoutAccountName,
        payoutBankName: payoutDetails.payoutBankName,
        processedBy: payoutDetails.processedBy,
        processedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();

    if (transaction.status !== "completed") {
      await db
        .update(members)
        .set({
          totalPayouts: sql`${members.totalPayouts} + ${actualPayoutAmount}`,
          walletBalance: sql`${members.walletBalance} - ${actualPayoutAmount}`,
        })
        .where(eq(members.id, transaction.memberId));
    }

    // Update payout status for regular savings plans only
    if (transaction.planId) {
      const regularPlan = await db.query.savingsPlans.findFirst({
        where: eq(savingsPlans.id, transaction.planId),
      });
      
      if (regularPlan) {
        await db
          .update(savingsPlans)
          .set({ payoutStatus: "completed" })
          .where(eq(savingsPlans.id, transaction.planId));
      }
    }

    return updatedTransaction;
  }

  async getSavingsPlan(id: string): Promise<SavingsPlanWithDetails | undefined> {
    const result = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, id),
      with: {
        member: true,
        contributions: {
          orderBy: [desc(planContributions.contributionNumber)],
        },
      },
    });
    return result;
  }

  async getAllSavingsPlans(): Promise<SavingsPlan[]> {
    return await db.select().from(savingsPlans).orderBy(desc(savingsPlans.startDate));
  }

  async getPlansPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<SavingsPlan>> {
    const offset = (page - 1) * limit;
    const scopedMemberIds = await this.getScopedMemberIds(user);
    if (scopedMemberIds && scopedMemberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const conditions = [];
    if (scopedMemberIds) {
      conditions.push(inArray(savingsPlans.memberId, scopedMemberIds));
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const matchingMembers = await db.select({ id: members.id }).from(members).where(ilike(members.name, term));
      const matchingMemberIds = matchingMembers.map(m => m.id);
      conditions.push(
        matchingMemberIds.length > 0
          ? or(ilike(savingsPlans.planName, term), inArray(savingsPlans.memberId, matchingMemberIds))
          : ilike(savingsPlans.planName, term)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(savingsPlans).where(whereClause).orderBy(desc(savingsPlans.startDate)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(savingsPlans).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberSavingsPlans(memberId: string): Promise<SavingsPlan[]> {
    return await db
      .select()
      .from(savingsPlans)
      .where(eq(savingsPlans.memberId, memberId))
      .orderBy(desc(savingsPlans.startDate));
  }

  async createSavingsPlan(insertPlan: InsertSavingsPlan): Promise<SavingsPlan> {
    const [plan] = await db
      .insert(savingsPlans)
      .values({
        ...insertPlan,
        startDate: new Date(insertPlan.startDate),
        maxContributions: insertPlan.maxContributions || 31,
        maxDays: insertPlan.maxDays || 62,
      })
      .returning();
    return plan;
  }

  async cancelSavingsPlan(id: string): Promise<{ plan: SavingsPlan; payoutAmount: number }> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, id),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Only an active plan can be cancelled");
    }

    const totalSaved = parseFloat(plan.totalSaved);
    const fee = parseFloat(plan.contributionAmount);
    const payoutAmount = Math.max(0, totalSaved - fee);

    const [updatedPlan] = await db
      .update(savingsPlans)
      .set({
        status: "cancelled",
        completedDate: new Date(),
      })
      .where(eq(savingsPlans.id, id))
      .returning();

    if (payoutAmount > 0) {
      await this.createTransaction({
        memberId: plan.memberId,
        planId: plan.id,
        type: "payout",
        amount: payoutAmount.toString(),
        status: "completed",
        date: new Date().toISOString(),
        notes: `Plan "${plan.planName}" cancelled early${totalSaved > 0 ? ` (₦${fee.toFixed(2)} fee deducted)` : ""}`,
      }, true);

      await this.addToWallet(plan.memberId, payoutAmount);
    }

    await this.createNotification({
      type: "plan_cancelled",
      title: "Savings Plan Cancelled",
      message: payoutAmount > 0
        ? `Your savings plan "${plan.planName}" has been cancelled. ₦${payoutAmount.toFixed(2)} has been transferred to your wallet after a ₦${fee.toFixed(2)} fee.`
        : `Your savings plan "${plan.planName}" has been cancelled.`,
      memberId: plan.memberId,
      read: "false",
    });

    return { plan: updatedPlan, payoutAmount };
  }

  async deleteSavingsPlan(id: string): Promise<void> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, id),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    if (plan.status !== "cancelled") {
      throw new Error("Only a cancelled plan can be deleted");
    }

    const linkedLoan = await db.query.loans.findFirst({
      where: eq(loans.planId, id),
    });

    if (linkedLoan) {
      throw new Error("Cannot delete a plan with an associated loan record");
    }

    await db.delete(savingsPlans).where(eq(savingsPlans.id, id));
  }

  async createPlanContribution(insertContribution: InsertPlanContribution): Promise<PlanContribution> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, insertContribution.planId),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Cannot contribute to a closed savings plan");
    }

    const amount = parseFloat(insertContribution.amount);
    const contributionNumber = plan.contributionsCount + 1;

    const [contribution] = await db
      .insert(planContributions)
      .values({
        ...insertContribution,
        contributionNumber,
      })
      .returning();

    await db
      .update(savingsPlans)
      .set({
        contributionsCount: contributionNumber,
        totalSaved: sql`${savingsPlans.totalSaved} + ${amount}`,
      })
      .where(eq(savingsPlans.id, insertContribution.planId));

    await this.checkAndClosePlan(insertContribution.planId);

    return contribution;
  }

  async getPlanRemainingSlots(planId: string): Promise<number> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, planId),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    return Math.max(0, plan.maxContributions - plan.contributionsCount);
  }

  async createMultiplePlanContributions(planId: string, memberId: string, totalAmount: number, paymentMethod?: string, notes?: string, date?: string, recordedBy?: string): Promise<ContributionResult> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, planId),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Cannot contribute to a closed savings plan");
    }

    const dailyContribution = parseFloat(plan.contributionAmount);
    const remainingSlots = plan.maxContributions - plan.contributionsCount;
    const numContributions = Math.min(Math.floor(totalAmount / dailyContribution), remainingSlots);
    
    if (numContributions === 0 && remainingSlots > 0) {
      throw new Error(`Amount must be at least ₦${dailyContribution.toFixed(2)}`);
    }

    const contributions: PlanContribution[] = [];
    let currentContributionNumber = plan.contributionsCount;
    const totalToSave = numContributions * dailyContribution;
    const overflowAmount = totalAmount - totalToSave;

    for (let i = 0; i < numContributions; i++) {
      currentContributionNumber += 1;
      
      const [contribution] = await db
        .insert(planContributions)
        .values({
          planId,
          memberId,
          amount: dailyContribution.toString(),
          contributionNumber: currentContributionNumber,
          paymentMethod: paymentMethod || null,
          notes: notes ? `${notes} (contribution ${i + 1}/${numContributions})` : null,
          date: date ? new Date(date) : new Date(),
          recordedBy: recordedBy || null,
        })
        .returning();
      
      contributions.push(contribution);
    }

    if (numContributions > 0) {
      await db
        .update(savingsPlans)
        .set({
          contributionsCount: currentContributionNumber,
          totalSaved: sql`${savingsPlans.totalSaved} + ${totalToSave}`,
        })
        .where(eq(savingsPlans.id, planId));

      await this.checkAndClosePlan(planId);
    }

    const updatedPlan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, planId),
    });
    const newRemainingSlots = updatedPlan ? updatedPlan.maxContributions - updatedPlan.contributionsCount : 0;

    return { contributions, overflowAmount, remainingSlots: newRemainingSlots };
  }

  async checkAndClosePlan(planId: string): Promise<void> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, planId),
    });

    if (!plan || plan.status !== "active") {
      return;
    }

    if (plan.contributionsCount >= plan.maxContributions) {
      const totalSaved = parseFloat(plan.totalSaved);

      await db
        .update(savingsPlans)
        .set({
          status: "completed",
          completedDate: new Date(),
          payoutStatus: "pending",
        })
        .where(eq(savingsPlans.id, planId));

      if (totalSaved > 0) {
        // Deduct 1 contribution slot as fee
        const feeAmount = parseFloat(plan.contributionAmount);
        const actualAmount = totalSaved - feeAmount;
        
        await this.addToWallet(plan.memberId, actualAmount);

        await this.createNotification({
          type: "plan_completed",
          title: "Savings Plan Completed",
          message: `Savings plan "${plan.planName}" has been completed with ₦${actualAmount.toFixed(2)} transferred to wallet (after ₦${feeAmount.toFixed(2)} fee). Payout is pending.`,
          memberId: plan.memberId,
          read: "false",
        });
      }
    }
  }

  async checkAndCloseExpiredPlans(): Promise<void> {
    const now = new Date();
    const activePlans = await db
      .select()
      .from(savingsPlans)
      .where(eq(savingsPlans.status, "active"));

    for (const plan of activePlans) {
      const startDate = new Date(plan.startDate);
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceStart >= plan.maxDays) {
        const totalSaved = parseFloat(plan.totalSaved);

        await db
          .update(savingsPlans)
          .set({
            status: "closed",
            completedDate: new Date(),
            payoutStatus: "pending",
          })
          .where(eq(savingsPlans.id, plan.id));

        if (totalSaved > 0) {
          // Deduct 1 contribution slot as fee
          const feeAmount = parseFloat(plan.contributionAmount);
          const actualAmount = totalSaved - feeAmount;
          
          await this.addToWallet(plan.memberId, actualAmount);
        }

        await this.createNotification({
          type: "plan_closed",
          title: "Savings Plan Auto-Closed",
          message: `Savings plan "${plan.planName}" has been automatically closed after ${plan.maxDays} days. ₦${totalSaved > 0 ? (totalSaved - parseFloat(plan.contributionAmount)).toFixed(2) : '0.00'} transferred to wallet (after ₦${parseFloat(plan.contributionAmount).toFixed(2)} fee). Payout is pending.`,
          memberId: plan.memberId,
          read: "false",
        });
      }
    }
  }

  async requestPlanPayout(planId: string, memberId: string): Promise<Transaction> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, planId),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (!member) {
      throw new Error("Member not found");
    }

    const totalSaved = parseFloat(plan.totalSaved);
    
    // Deduct 1 contribution slot as fee
    const feeAmount = parseFloat(plan.contributionAmount);
    const actualPayoutAmount = totalSaved - feeAmount;

    const [transaction] = await db
      .insert(transactions)
      .values({
        memberId,
        planId,
        type: "payout",
        amount: actualPayoutAmount.toString(),
        status: "pending",
        notes: `Payout request for savings plan: ${plan.planName} (Fee: ₦${feeAmount.toFixed(2)} for 1 contribution slot deducted)`,
      })
      .returning();

    await db
      .update(savingsPlans)
      .set({ payoutStatus: "requested" })
      .where(eq(savingsPlans.id, planId));

    await this.createNotification({
      type: "pending_payout",
      title: "Payout Requested",
      message: `Payout of ₦${actualPayoutAmount.toFixed(2)} requested for savings plan "${plan.planName}" (after ₦${feeAmount.toFixed(2)} fee).`,
      memberId,
      transactionId: transaction.id,
      read: "false",
    });

    return transaction;
  }

  async completePlanPayout(transactionId: string, staffId: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string }): Promise<Transaction> {
    return this.completePayoutTransaction(transactionId, {
      ...payoutDetails,
      processedBy: staffId,
    });
  }

  async addToWallet(memberId: string, amount: number): Promise<Member> {
    const [member] = await db
      .update(members)
      .set({
        walletBalance: sql`${members.walletBalance} + ${amount}`,
      })
      .where(eq(members.id, memberId))
      .returning();
    return member;
  }

  async withdrawFromWallet(memberId: string, amount: number): Promise<Member> {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (!member) {
      throw new Error("Member not found");
    }

    const walletBalance = parseFloat(member.walletBalance);
    if (amount > walletBalance) {
      throw new Error(`Insufficient wallet balance. Available: ₦${walletBalance.toFixed(2)}`);
    }

    const [updatedMember] = await db
      .update(members)
      .set({
        walletBalance: sql`${members.walletBalance} - ${amount}`,
      })
      .where(eq(members.id, memberId))
      .returning();
    
    return updatedMember;
  }

  async getDashboardStats(): Promise<{
    totalSavings: string;
    activeMembers: number;
    todayCollections: string;
    pendingPayouts: string;
    totalBranches: number;
    totalStaff: number;
  }> {
    const allMembers = await db.select().from(members);
    const activeMembers = allMembers.filter(m => m.status === "active").length;
    const totalSavings = allMembers.reduce((sum, m) => sum + parseFloat(m.totalSavings), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await db
      .select()
      .from(transactions)
      .where(sql`${transactions.date} >= ${today} AND ${transactions.date} < ${tomorrow} AND ${transactions.type} = 'savings'`);
    
    const todayCollections = todayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const pendingPayoutTransactions = await db
      .select()
      .from(transactions)
      .where(sql`${transactions.type} = 'payout' AND ${transactions.status} = 'pending'`);
    
    const pendingPayouts = pendingPayoutTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const [branchCount, staffCount] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(branches),
      db.select({ count: sql`count(*)` }).from(staff),
    ]);

    return {
      totalSavings: totalSavings.toFixed(2),
      activeMembers,
      todayCollections: todayCollections.toFixed(2),
      pendingPayouts: pendingPayouts.toFixed(2),
      totalBranches: Number(branchCount[0]?.count) || 0,
      totalStaff: Number(staffCount[0]?.count) || 0,
    };
  }

  async getAnalytics(): Promise<{
    dailySavings: Array<{ date: string; amount: number; count: number }>;
    memberStats: { activeCount: number; inactiveCount: number; totalWalletBalance: string };
    planStats: { activePlans: number; completedPlans: number; totalAmountLocked: string };
    payoutStats: { completed: string; pending: string; rejected: string };
  }> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const savingsTransactions = await db
      .select()
      .from(transactions)
      .where(sql`${transactions.type} = 'savings' AND ${transactions.date} >= ${last30Days}`);

    const dailySavingsMap = new Map<string, { amount: number; count: number }>();
    savingsTransactions.forEach(t => {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      const existing = dailySavingsMap.get(dateStr) || { amount: 0, count: 0 };
      existing.amount += parseFloat(t.amount);
      existing.count += 1;
      dailySavingsMap.set(dateStr, existing);
    });

    const dailySavings = Array.from(dailySavingsMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allMembers = await db.select().from(members);
    const activeCount = allMembers.filter(m => m.status === "active").length;
    const inactiveCount = allMembers.filter(m => m.status === "inactive").length;
    const totalWalletBalance = allMembers.reduce((sum, m) => sum + parseFloat(m.walletBalance), 0);

    const allPlans = await db.select().from(savingsPlans);
    const activePlans = allPlans.filter(p => p.status === "active").length;
    const completedPlans = allPlans.filter(p => p.status === "completed" || p.status === "closed").length;
    const totalAmountLocked = allPlans.filter(p => p.status === "active").reduce((sum, p) => sum + parseFloat(p.totalSaved), 0);

    const allTransactions = await db.select().from(transactions);
    const payoutTransactions = allTransactions.filter(t => t.type === "payout");
    const completedPayouts = payoutTransactions
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pendingPayouts = payoutTransactions
      .filter(t => t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const rejectedPayouts = payoutTransactions
      .filter(t => t.status === "rejected")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      dailySavings,
      memberStats: {
        activeCount,
        inactiveCount,
        totalWalletBalance: totalWalletBalance.toFixed(2),
      },
      planStats: {
        activePlans,
        completedPlans,
        totalAmountLocked: totalAmountLocked.toFixed(2),
      },
      payoutStats: {
        completed: completedPayouts.toFixed(2),
        pending: pendingPayouts.toFixed(2),
        rejected: rejectedPayouts.toFixed(2),
      },
    };
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  // Shared role/branch scoping: resolves which member ids a user may see records for.
  // Returns undefined for admin (no filter needed) or an array (possibly empty)
  // of member ids in scope for manager (branch) / staff (own assigned members).
  private async getScopedMemberIds(user: { role: string; id: string; branchId: string }): Promise<string[] | undefined> {
    if (user.role === "admin") {
      return undefined;
    }

    let staffIds: string[];
    if (user.role === "manager") {
      const branchStaff = await db.select().from(staff).where(eq(staff.branchId, user.branchId));
      staffIds = branchStaff.map(s => s.id);
    } else {
      staffIds = [user.id];
    }

    if (staffIds.length === 0) {
      return [];
    }

    const scopedMembers = await db.select({ id: members.id }).from(members).where(inArray(members.staffId, staffIds));
    return scopedMembers.map(m => m.id);
  }

  async getNotificationsPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }): Promise<PaginatedResponse<Notification>> {
    const offset = (page - 1) * limit;
    const memberIds = await this.getScopedMemberIds(user);

    if (memberIds && memberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const whereClause = memberIds ? inArray(notifications.memberId, memberIds) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(notifications).where(whereClause).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(notifications).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notif] = await db
      .update(notifications)
      .set({ read: "true" })
      .where(eq(notifications.id, id))
      .returning();
    return notif;
  }

  async getUnreadNotificationCount(user: { role: string; id: string; branchId: string }): Promise<number> {
    const memberIds = await this.getScopedMemberIds(user);

    if (memberIds && memberIds.length === 0) {
      return 0;
    }

    const whereClause = memberIds
      ? and(eq(notifications.read, "false"), inArray(notifications.memberId, memberIds))
      : eq(notifications.read, "false");

    const result = await db
      .select()
      .from(notifications)
      .where(whereClause);
    return result.length;
  }

  async getLoan(id: string): Promise<LoanWithDetails | undefined> {
    const result = await db.query.loans.findFirst({
      where: eq(loans.id, id),
      with: {
        member: true,
        plan: true,
        approvedByStaff: true,
      },
    });
    return result as LoanWithDetails | undefined;
  }

  async getAllLoans(): Promise<LoanWithDetails[]> {
    const result = await db.query.loans.findMany({
      with: {
        member: true,
        plan: true,
        approvedByStaff: true,
      },
      orderBy: [desc(loans.requestedAt)],
    });
    return result as LoanWithDetails[];
  }

  async getLoansPaginated(page: number, limit: number): Promise<PaginatedResponse<LoanWithDetails>> {
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      db.query.loans.findMany({
        with: { member: true, plan: true, approvedByStaff: true },
        orderBy: [desc(loans.requestedAt)],
        limit,
        offset,
      }),
      db.select({ count: sql`count(*)` }).from(loans),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data: data as LoanWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberLoans(memberId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.memberId, memberId))
      .orderBy(desc(loans.requestedAt));
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const plan = await db.query.savingsPlans.findFirst({
      where: eq(savingsPlans.id, insertLoan.planId),
    });

    if (!plan) {
      throw new Error("Savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Can only borrow from an active savings plan");
    }

    const amount = parseFloat(insertLoan.amount);
    const totalSaved = parseFloat(plan.totalSaved);
    const maxBorrowable = totalSaved * 0.5;

    if (amount > maxBorrowable) {
      throw new Error(`Maximum borrowable amount is ₦${maxBorrowable.toFixed(2)} (50% of saved amount)`);
    }

    const existingLoan = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.planId, insertLoan.planId),
        eq(loans.status, "pending")
      ))
      .limit(1);

    if (existingLoan.length > 0) {
      throw new Error("There is already a pending loan request for this savings plan");
    }

    const activeLoan = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.planId, insertLoan.planId),
        eq(loans.status, "active")
      ))
      .limit(1);

    if (activeLoan.length > 0) {
      throw new Error("There is already an active loan on this savings plan. Please repay it first.");
    }

    const interestRate = 5.00;
    const totalRepayment = amount + (amount * interestRate / 100);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [loan] = await db
      .insert(loans)
      .values({
        memberId: insertLoan.memberId,
        planId: insertLoan.planId,
        amount: amount.toString(),
        interestRate: interestRate.toString(),
        totalRepayment: totalRepayment.toString(),
        dueDate: dueDate,
        notes: insertLoan.notes,
      })
      .returning();

    return loan;
  }

  async approveLoan(loanId: string, staffId: string): Promise<Loan> {
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
    });

    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.status !== "pending") {
      throw new Error("Loan is not pending approval");
    }

    const [updatedLoan] = await db
      .update(loans)
      .set({
        status: "active",
        approvedAt: new Date(),
        approvedBy: staffId,
      })
      .where(eq(loans.id, loanId))
      .returning();

    await this.addToWallet(loan.memberId, parseFloat(loan.amount));

    const member = await db.query.members.findFirst({
      where: eq(members.id, loan.memberId),
    });

    await this.createNotification({
      type: "loan_approved",
      title: "Loan Approved",
      message: `Your loan of ₦${parseFloat(loan.amount).toFixed(2)} has been approved and credited to your wallet.`,
      memberId: loan.memberId,
      read: "false",
    });

    return updatedLoan;
  }

  async rejectLoan(loanId: string, staffId: string): Promise<Loan> {
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
    });

    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.status !== "pending") {
      throw new Error("Loan is not pending approval");
    }

    const [updatedLoan] = await db
      .update(loans)
      .set({
        status: "rejected",
      })
      .where(eq(loans.id, loanId))
      .returning();

    await this.createNotification({
      type: "loan_rejected",
      title: "Loan Rejected",
      message: `Your loan request of ₦${parseFloat(loan.amount).toFixed(2)} has been rejected.`,
      memberId: loan.memberId,
      read: "false",
    });

    return updatedLoan;
  }

  async repayLoan(loanId: string, amount: number): Promise<Loan> {
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
    });

    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.status !== "active") {
      throw new Error("Loan is not active");
    }

    const member = await db.query.members.findFirst({
      where: eq(members.id, loan.memberId),
    });

    if (!member) {
      throw new Error("Member not found");
    }

    const walletBalance = parseFloat(member.walletBalance);
    if (amount > walletBalance) {
      throw new Error(`Insufficient wallet balance. Available: ₦${walletBalance.toFixed(2)}`);
    }

    const currentPaid = parseFloat(loan.amountPaid);
    const totalRepayment = parseFloat(loan.totalRepayment);
    const newAmountPaid = currentPaid + amount;
    
    let newStatus = loan.status;
    if (newAmountPaid >= totalRepayment) {
      newStatus = "paid";
    }

    const [updatedLoan] = await db
      .update(loans)
      .set({
        amountPaid: newAmountPaid.toString(),
        status: newStatus,
      })
      .where(eq(loans.id, loanId))
      .returning();

    await this.withdrawFromWallet(loan.memberId, amount);

    if (newStatus === "paid") {
      await this.createNotification({
        type: "loan_approved",
        title: "Loan Fully Repaid",
        message: `Your loan has been fully repaid. Thank you!`,
        memberId: loan.memberId,
        read: "false",
      });
    }

    return updatedLoan;
  }

  async getMembersByBranch(branchId: string): Promise<Member[]> {
    const branchStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.branchId, branchId));
    
    const staffIds = branchStaff.map(s => s.id);
    
    if (staffIds.length === 0) {
      return [];
    }

    const allMembers: Member[] = [];
    for (const staffId of staffIds) {
      const membersList = await db
        .select()
        .from(members)
        .where(eq(members.staffId, staffId));
      allMembers.push(...membersList);
    }
    
    return allMembers;
  }

  async getMembersPaginatedByBranch(branchId: string, page: number, limit: number, search?: string): Promise<PaginatedResponse<Member>> {
    let branchMembers = await this.getMembersByBranch(branchId);
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      branchMembers = branchMembers.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.phone?.toLowerCase().includes(term)
      );
    }
    const total = branchMembers.length;
    const offset = (page - 1) * limit;
    const data = branchMembers.slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isMemberInBranch(memberId: string, branchId: string): Promise<boolean> {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      with: {
        staff: true,
      },
    });
    
    if (!member || !member.staff) {
      return false;
    }
    
    return member.staff.branchId === branchId;
  }

  async getMembersPaginatedByStaff(staffId: string, page: number, limit: number, search?: string): Promise<PaginatedResponse<Member>> {
    let staffMembers = await db.select().from(members).where(eq(members.staffId, staffId)).orderBy(desc(members.joinDate));
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      staffMembers = staffMembers.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.phone?.toLowerCase().includes(term)
      );
    }
    const total = staffMembers.length;
    const offset = (page - 1) * limit;
    const data = staffMembers.slice(offset, offset + limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDashboardStatsForStaff(staffId: string): Promise<{
    totalSavings: string;
    activeMembers: number;
    todayCollections: string;
    pendingPayouts: string;
  }> {
    const staffMembers = await db.select().from(members).where(eq(members.staffId, staffId));
    const activeMembers = staffMembers.filter(m => m.status === "active").length;
    const totalSavings = staffMembers.reduce((sum, m) => sum + parseFloat(m.totalSavings), 0);
    const memberIds = staffMembers.map(m => m.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayCollections = 0;
    let pendingPayouts = 0;

    if (memberIds.length > 0) {
      const allTodayTransactions = await db
        .select()
        .from(transactions)
        .where(sql`${transactions.date} >= ${today} AND ${transactions.date} < ${tomorrow} AND ${transactions.type} = 'savings'`);
      
      todayCollections = allTodayTransactions
        .filter(t => memberIds.includes(t.memberId))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const allPendingPayouts = await db
        .select()
        .from(transactions)
        .where(sql`${transactions.type} = 'payout' AND ${transactions.status} = 'pending'`);
      
      pendingPayouts = allPendingPayouts
        .filter(t => memberIds.includes(t.memberId))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }

    return {
      totalSavings: totalSavings.toFixed(2),
      activeMembers,
      todayCollections: todayCollections.toFixed(2),
      pendingPayouts: pendingPayouts.toFixed(2),
    };
  }

  async getDashboardStatsForBranch(branchId: string): Promise<{
    totalSavings: string;
    activeMembers: number;
    todayCollections: string;
    pendingPayouts: string;
    totalStaff: number;
  }> {
    const branchStaff = await db.select().from(staff).where(eq(staff.branchId, branchId));
    const staffIds = branchStaff.map(s => s.id);
    
    const branchMembers = await db.select().from(members);
    const filteredMembers = branchMembers.filter(m => m.staffId && staffIds.includes(m.staffId));
    const activeMembers = filteredMembers.filter(m => m.status === "active").length;
    const totalSavings = filteredMembers.reduce((sum, m) => sum + parseFloat(m.totalSavings), 0);
    const memberIds = filteredMembers.map(m => m.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayCollections = 0;
    let pendingPayouts = 0;

    if (memberIds.length > 0) {
      const allTodayTransactions = await db
        .select()
        .from(transactions)
        .where(sql`${transactions.date} >= ${today} AND ${transactions.date} < ${tomorrow} AND ${transactions.type} = 'savings'`);
      
      todayCollections = allTodayTransactions
        .filter(t => memberIds.includes(t.memberId))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const allPendingPayouts = await db
        .select()
        .from(transactions)
        .where(sql`${transactions.type} = 'payout' AND ${transactions.status} = 'pending'`);
      
      pendingPayouts = allPendingPayouts
        .filter(t => memberIds.includes(t.memberId))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }

    return {
      totalSavings: totalSavings.toFixed(2),
      activeMembers,
      todayCollections: todayCollections.toFixed(2),
      pendingPayouts: pendingPayouts.toFixed(2),
      totalStaff: branchStaff.filter(s => s.status === "active").length,
    };
  }

  async isStaffInBranch(staffId: string, branchId: string): Promise<boolean> {
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
    });
    
    if (!staffMember) {
      return false;
    }
    
    return staffMember.branchId === branchId;
  }

  async getInvestmentType(id: string): Promise<InvestmentTypeWithCreator | undefined> {
    const result = await db.query.investmentTypes.findFirst({
      where: eq(investmentTypes.id, id),
      with: {
        createdByStaff: true,
      },
    });
    return result as InvestmentTypeWithCreator | undefined;
  }

  async getAllInvestmentTypes(): Promise<InvestmentType[]> {
    return await db.select().from(investmentTypes).orderBy(desc(investmentTypes.createdAt));
  }

  async getActiveInvestmentTypes(): Promise<InvestmentType[]> {
    return await db.select().from(investmentTypes).where(eq(investmentTypes.status, "active")).orderBy(desc(investmentTypes.createdAt));
  }

  async getInvestmentTypes(): Promise<InvestmentType[]> {
    return await this.getActiveInvestmentTypes();
  }

  async getInvestmentTypesPaginated(page: number, limit: number): Promise<PaginatedResponse<InvestmentType>> {
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      db.select().from(investmentTypes).orderBy(desc(investmentTypes.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(investmentTypes),
    ]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createInvestmentType(insertData: InsertInvestmentType): Promise<InvestmentType> {
    const [investmentType] = await db
      .insert(investmentTypes)
      .values(insertData)
      .returning();
    return investmentType;
  }

  async updateInvestmentType(id: string, updateData: Partial<InsertInvestmentType>): Promise<InvestmentType> {
    const [investmentType] = await db
      .update(investmentTypes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(investmentTypes.id, id))
      .returning();
    return investmentType;
  }

  async deleteInvestmentType(id: string): Promise<void> {
    await db.delete(investmentTypes).where(eq(investmentTypes.id, id));
  }

  async getMemberInvestment(id: string): Promise<MemberInvestmentWithDetails | undefined> {
    const result = await db.query.memberInvestments.findFirst({
      where: eq(memberInvestments.id, id),
      with: {
        member: true,
        investmentType: true,
        assignedByStaff: true,
      },
    });
    return result as MemberInvestmentWithDetails | undefined;
  }

  async getAllMemberInvestments(): Promise<MemberInvestmentWithDetails[]> {
    const result = await db.query.memberInvestments.findMany({
      with: {
        member: true,
        investmentType: true,
        assignedByStaff: true,
      },
      orderBy: [desc(memberInvestments.createdAt)],
    });
    return result as MemberInvestmentWithDetails[];
  }

  async getMemberInvestmentsPaginated(page: number, limit: number, memberId?: string, investmentTypeId?: string): Promise<PaginatedResponse<MemberInvestmentWithDetails>> {
    const offset = (page - 1) * limit;
    
    let whereClause;
    if (memberId && investmentTypeId) {
      whereClause = and(eq(memberInvestments.memberId, memberId), eq(memberInvestments.investmentTypeId, investmentTypeId));
    } else if (memberId) {
      whereClause = eq(memberInvestments.memberId, memberId);
    } else if (investmentTypeId) {
      whereClause = eq(memberInvestments.investmentTypeId, investmentTypeId);
    }
    
    const dataQuery = db.query.memberInvestments.findMany({
      where: whereClause,
      with: { member: true, investmentType: true, assignedByStaff: true },
      orderBy: [desc(memberInvestments.createdAt)],
      limit,
      offset,
    });
    
    const countQuery = whereClause 
      ? db.select({ count: sql`count(*)` }).from(memberInvestments).where(whereClause)
      : db.select({ count: sql`count(*)` }).from(memberInvestments);
    
    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = Number(countResult[0]?.count) || 0;
    return {
      data: data as MemberInvestmentWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberInvestmentsByMember(memberId: string): Promise<MemberInvestmentWithDetails[]> {
    const result = await db.query.memberInvestments.findMany({
      where: eq(memberInvestments.memberId, memberId),
      with: {
        member: true,
        investmentType: true,
        assignedByStaff: true,
      },
      orderBy: [desc(memberInvestments.createdAt)],
    });
    return result as MemberInvestmentWithDetails[];
  }

  async createMemberInvestment(insertData: InsertMemberInvestment): Promise<MemberInvestment> {
    const investmentType = await db.query.investmentTypes.findFirst({
      where: eq(investmentTypes.id, insertData.investmentTypeId),
    });

    if (!investmentType) {
      throw new Error("Investment type not found");
    }

    if (investmentType.status !== "active") {
      throw new Error("Investment type is not active");
    }

    const amount = parseFloat(insertData.amount);
    const minDeposit = parseFloat(investmentType.minimumDeposit);
    
    if (amount < minDeposit) {
      throw new Error(`Minimum deposit is ₦${minDeposit.toFixed(2)}`);
    }

    const interestRate = parseFloat(investmentType.interestRate);
    const expectedReturn = amount + (amount * interestRate * investmentType.durationDays / 365 / 100);

    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + investmentType.durationDays);

    const [investment] = await db
      .insert(memberInvestments)
      .values({
        memberId: insertData.memberId,
        investmentTypeId: insertData.investmentTypeId,
        amount: amount.toString(),
        interestRate: interestRate.toString(),
        expectedReturn: expectedReturn.toFixed(2),
        maturityDate,
        notes: insertData.notes,
        assignedBy: insertData.assignedBy,
      })
      .returning();

    return investment;
  }

  async breakMemberInvestment(id: string): Promise<MemberInvestment> {
    const investment = await db.query.memberInvestments.findFirst({
      where: eq(memberInvestments.id, id),
      with: {
        investmentType: true,
      },
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.status !== "active") {
      throw new Error("Investment is not active");
    }

    const investmentType = investment.investmentType as InvestmentType;
    if (!investmentType.isBreakable) {
      throw new Error("This investment cannot be broken");
    }

    const amount = parseFloat(investment.amount);
    const breakFeePercent = parseFloat(investmentType.breakFee);
    const breakFeeAmount = amount * breakFeePercent / 100;
    const actualReturn = amount - breakFeeAmount;

    const [updatedInvestment] = await db
      .update(memberInvestments)
      .set({
        status: "broken",
        breakFeeApplied: breakFeeAmount.toFixed(2),
        actualReturn: actualReturn.toFixed(2),
        completedDate: new Date(),
      })
      .where(eq(memberInvestments.id, id))
      .returning();

    await this.addToWallet(investment.memberId, actualReturn);

    return updatedInvestment;
  }

  async matureMemberInvestment(id: string): Promise<MemberInvestment> {
    const investment = await db.query.memberInvestments.findFirst({
      where: eq(memberInvestments.id, id),
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.status !== "active") {
      throw new Error("Investment is not active");
    }

    if (new Date() < new Date(investment.maturityDate)) {
      throw new Error(`Investment has not reached its maturity date (${new Date(investment.maturityDate).toDateString()})`);
    }

    const expectedReturn = parseFloat(investment.expectedReturn);

    const [updatedInvestment] = await db
      .update(memberInvestments)
      .set({
        status: "matured",
        actualReturn: investment.expectedReturn,
        completedDate: new Date(),
      })
      .where(eq(memberInvestments.id, id))
      .returning();

    await this.addToWallet(investment.memberId, expectedReturn);

    return updatedInvestment;
  }

  async completeMemberInvestment(id: string): Promise<MemberInvestment> {
    const investment = await db.query.memberInvestments.findFirst({
      where: eq(memberInvestments.id, id),
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.status !== "matured") {
      throw new Error("Investment must be matured first");
    }

    const [updatedInvestment] = await db
      .update(memberInvestments)
      .set({
        status: "completed",
      })
      .where(eq(memberInvestments.id, id))
      .returning();

    return updatedInvestment;
  }

  async checkAndMatureInvestments(): Promise<void> {
    const now = new Date();
    const activeInvestments = await db
      .select()
      .from(memberInvestments)
      .where(and(
        eq(memberInvestments.status, "active"),
        lt(memberInvestments.maturityDate, now)
      ));

    for (const investment of activeInvestments) {
      try {
        await this.matureMemberInvestment(investment.id);
      } catch (error) {
        console.error(`Failed to mature investment ${investment.id}:`, error);
      }
    }
  }

  // Yearly Savings Plan Methods
  async getYearlySavingsPlan(id: string): Promise<YearlySavingsPlanWithDetails | undefined> {
    const result = await db.query.yearlySavingsPlans.findFirst({
      where: eq(yearlySavingsPlans.id, id),
      with: {
        member: true,
        contributions: {
          orderBy: desc(yearlyPlanContributions.date),
        },
      },
    });
    return result;
  }

  async getAllYearlySavingsPlans(): Promise<YearlySavingsPlan[]> {
    return await db.query.yearlySavingsPlans.findMany({
      orderBy: desc(yearlySavingsPlans.createdAt),
    });
  }

  async getYearlyPlansPaginated(page: number, limit: number, user: { role: string; id: string; branchId: string }, search?: string): Promise<PaginatedResponse<YearlySavingsPlan>> {
    const offset = (page - 1) * limit;
    const scopedMemberIds = await this.getScopedMemberIds(user);
    if (scopedMemberIds && scopedMemberIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const conditions = [];
    if (scopedMemberIds) {
      conditions.push(inArray(yearlySavingsPlans.memberId, scopedMemberIds));
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const matchingMembers = await db.select({ id: members.id }).from(members).where(ilike(members.name, term));
      const matchingMemberIds = matchingMembers.map(m => m.id);
      conditions.push(
        matchingMemberIds.length > 0
          ? or(ilike(yearlySavingsPlans.planName, term), inArray(yearlySavingsPlans.memberId, matchingMemberIds))
          : ilike(yearlySavingsPlans.planName, term)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db.query.yearlySavingsPlans.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: desc(yearlySavingsPlans.createdAt),
        with: {
          member: true,
        },
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(yearlySavingsPlans).where(whereClause),
    ]);

    const total = totalResult[0].count;
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberYearlySavingsPlans(memberId: string): Promise<YearlySavingsPlan[]> {
    return await db.query.yearlySavingsPlans.findMany({
      where: eq(yearlySavingsPlans.memberId, memberId),
      orderBy: desc(yearlySavingsPlans.createdAt),
    });
  }

  async createYearlySavingsPlan(plan: InsertYearlySavingsPlan): Promise<YearlySavingsPlan> {
    const startDate = new Date(plan.startDate);
    const maxDays = plan.maxDays || 372;
    const maturityDate = new Date(startDate);
    maturityDate.setDate(maturityDate.getDate() + maxDays);

    const planData = {
      ...plan,
      startDate,
      maturityDate,
    };
    const [newPlan] = await db.insert(yearlySavingsPlans).values(planData).returning();
    return newPlan;
  }

  async createYearlyPlanContribution(contribution: InsertYearlyPlanContribution): Promise<YearlyPlanContribution> {
    // Get the current plan to determine the next contribution number
    const plan = await db.query.yearlySavingsPlans.findFirst({
      where: eq(yearlySavingsPlans.id, contribution.planId),
    });

    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    const contributionData = {
      planId: contribution.planId,
      memberId: contribution.memberId,
      amount: contribution.amount,
      contributionNumber: plan.contributionsCount + 1,
      date: contribution.date ? new Date(contribution.date) : new Date(),
      paymentMethod: contribution.paymentMethod,
      notes: contribution.notes,
      recordedBy: contribution.recordedBy,
    };

    const [newContribution] = await db.insert(yearlyPlanContributions).values(contributionData).returning();
    
    // Update plan's total saved and contributions count
    await db.update(yearlySavingsPlans)
      .set({
        totalSaved: sql`total_saved + ${contribution.amount}`,
        contributionsCount: sql`contributions_count + 1`,
      })
      .where(eq(yearlySavingsPlans.id, contribution.planId));

    return newContribution;
  }

  async createMultipleYearlyPlanContributions(
    planId: string,
    memberId: string,
    totalAmount: number,
    paymentMethod?: string,
    notes?: string,
    date?: string,
    recordedBy?: string
  ): Promise<ContributionResult> {
    const plan = await this.getYearlySavingsPlan(planId);
    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Yearly savings plan is not active");
    }

    const contributionAmount = parseFloat(plan.contributionAmount);
    const maxContributions = plan.maxContributions - plan.contributionsCount;
    const contributionsToCreate = Math.min(Math.floor(totalAmount / contributionAmount), maxContributions);
    const overflowAmount = totalAmount - (contributionsToCreate * contributionAmount);

    const contributions: YearlyPlanContribution[] = [];
    const contributionDate = date ? new Date(date) : new Date();

    for (let i = 0; i < contributionsToCreate; i++) {
      const contributionNumber = plan.contributionsCount + i + 1;
      const [contribution] = await db.insert(yearlyPlanContributions)
        .values({
          planId,
          memberId,
          amount: contributionAmount.toString(),
          contributionNumber,
          date: contributionDate,
          paymentMethod,
          notes,
          recordedBy,
        })
        .returning();
      contributions.push(contribution);
    }

    // Update plan totals
    const totalAdded = contributionsToCreate * contributionAmount;
    await db.update(yearlySavingsPlans)
      .set({
        totalSaved: sql`total_saved + ${totalAdded}`,
        contributionsCount: sql`contributions_count + ${contributionsToCreate}`,
      })
      .where(eq(yearlySavingsPlans.id, planId));

    // Check if plan is complete
    if (plan.contributionsCount + contributionsToCreate >= plan.maxContributions) {
      await this.checkAndMatureYearlyPlan(planId);
    }

    return {
      contributions,
      overflowAmount,
      remainingSlots: Math.max(0, plan.maxContributions - plan.contributionsCount - contributionsToCreate),
    };
  }

  async checkAndMatureYearlyPlan(planId: string): Promise<void> {
    const plan = await db.query.yearlySavingsPlans.findFirst({
      where: eq(yearlySavingsPlans.id, planId),
    });

    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    if (plan.status !== "active") {
      return;
    }

    const isComplete = plan.contributionsCount >= plan.maxContributions;
    const isExpired = new Date() > new Date(plan.maturityDate);

    if (isComplete || isExpired) {
      // Calculate full profit for matured plan
      const profitCalculation = await this.calculateYearlyPlanProfit(planId);
      const alreadyPaidMonthly = parseFloat(plan.monthlyProfitPaid);
      const remainingProfit = Math.max(0, parseFloat(profitCalculation.fullProfitEarned) - alreadyPaidMonthly);

      await db.update(yearlySavingsPlans)
        .set({
          status: "matured",
          completedDate: new Date(),
          profitEarned: profitCalculation.fullProfitEarned, // Full profit ever earned (monthly + maturity combined)
        })
        .where(eq(yearlySavingsPlans.id, planId));

      // Transfer total amount + remaining profit (full profit minus what was already paid monthly) to wallet
      const totalWithProfit = remainingProfit + parseFloat(plan.totalSaved);
      await this.addToWallet(plan.memberId, totalWithProfit);

      // Create notification
      await this.createNotification({
        type: "yearly_plan_matured",
        title: "Yearly Savings Plan Matured",
        message: `Your yearly savings plan "${plan.planName}" has matured. ₦${totalWithProfit.toFixed(2)} (including ₦${remainingProfit.toFixed(2)} remaining profit) has been transferred to your wallet.`,
        memberId: plan.memberId,
        read: "false",
      });
    }
  }

  async checkAndMatureExpiredYearlyPlans(): Promise<void> {
    const now = new Date();
    const activePlans = await db
      .select()
      .from(yearlySavingsPlans)
      .where(and(
        eq(yearlySavingsPlans.status, "active"),
        lt(yearlySavingsPlans.maturityDate, now)
      ));

    for (const plan of activePlans) {
      try {
        await this.checkAndMatureYearlyPlan(plan.id);
      } catch (error) {
        console.error(`Failed to mature yearly plan ${plan.id}:`, error);
      }
    }
  }

  async getYearlyPlanRemainingSlots(planId: string): Promise<number> {
    const plan = await db.query.yearlySavingsPlans.findFirst({
      where: eq(yearlySavingsPlans.id, planId),
    });

    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    return Math.max(0, plan.maxContributions - plan.contributionsCount);
  }

  async requestYearlyPlanPayout(planId: string, memberId: string): Promise<Transaction> {
    const plan = await this.getYearlySavingsPlan(planId);
    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    if (plan.status !== "matured") {
      throw new Error("Yearly savings plan must be matured before payout");
    }

    const profitCalculation = await this.calculateYearlyPlanProfit(planId);
    const totalAmount = parseFloat(profitCalculation.totalWithProfit);
    
    // No fee for yearly savings plans (they have interest)

    const transaction = await this.createTransaction({
      memberId,
      planId,
      type: "payout",
      amount: totalAmount.toString(),
      status: "pending",
      date: new Date().toISOString(),
      notes: `Yearly plan payout with interest`,
    });

    await db.update(yearlySavingsPlans)
      .set({ payoutStatus: "pending" })
      .where(eq(yearlySavingsPlans.id, planId));

    return transaction;
  }

  async completeYearlyPlanPayout(
    transactionId: string,
    staffId: string,
    payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string }
  ): Promise<Transaction> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const updatedTransaction = await this.completePayoutTransaction(transactionId, {
      ...payoutDetails,
      processedBy: staffId,
    });

    if (transaction.planId) {
      await db.update(yearlySavingsPlans)
        .set({ payoutStatus: "completed" })
        .where(eq(yearlySavingsPlans.id, transaction.planId));
    }

    return updatedTransaction;
  }

  async calculateYearlyPlanProfit(planId: string): Promise<{ profitEarned: string; totalWithProfit: string; monthlyProfitEarned: string; fullProfitEarned: string }> {
    const plan = await db.query.yearlySavingsPlans.findFirst({
      where: eq(yearlySavingsPlans.id, planId),
    });

    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    const totalSaved = parseFloat(plan.totalSaved);
    const profitRate = parseFloat(plan.profitRate);
  
    // Calculate completed months (31 days each)
    const completedMonths = Math.floor(plan.contributionsCount / 31);
  
    // Calculate monthly profit (half of full monthly rate for each completed month)
    const monthlyProfitRate = profitRate / 12; // Monthly rate
    const halfMonthlyProfitRate = monthlyProfitRate / 2; // Half of monthly rate
    const monthlyProfitEarned = totalSaved * halfMonthlyProfitRate * (completedMonths / 12);
  
    // Full profit calculation (only paid at maturity)
    const fullProfitEarned = totalSaved * (profitRate / 100);
  
    // Total profit to be paid now (monthly profit only)
    const profitEarned = monthlyProfitEarned;
    const totalWithProfit = totalSaved + profitEarned;

    return {
      profitEarned: profitEarned.toFixed(2),
      totalWithProfit: totalWithProfit.toFixed(2),
      monthlyProfitEarned: monthlyProfitEarned.toFixed(2),
      fullProfitEarned: fullProfitEarned.toFixed(2),
    };
  }

  async requestYearlyPlanMonthlyPayout(planId: string, memberId: string): Promise<Transaction> {
    const plan = await this.getYearlySavingsPlan(planId);
    if (!plan) {
      throw new Error("Yearly savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Yearly savings plan must be active before monthly payout");
    }

    const profitCalculation = await this.calculateYearlyPlanProfit(planId);
    const monthlyProfit = parseFloat(profitCalculation.monthlyProfitEarned);

    if (monthlyProfit <= 0) {
      throw new Error("No monthly profit available for payout");
    }

    const transaction = await this.createTransaction({
      memberId,
      planId,
      type: "monthly_payout",
      amount: monthlyProfit.toString(),
      status: "pending",
      date: new Date().toISOString(),
    });

    return transaction;
  }

  async checkAndPayMonthlyProfits(): Promise<void> {
    const plans = await db.query.yearlySavingsPlans.findMany({
      where: {
        status: "active",
      },
    });

    for (const plan of plans) {
      const completedMonths = Math.floor(plan.contributionsCount / 31);
      if (completedMonths > 0) {
        const profitCalculation = await this.calculateYearlyPlanProfit(plan.id);
        const cumulativeMonthlyProfit = parseFloat(profitCalculation.monthlyProfitEarned);
        const alreadyPaid = parseFloat(plan.monthlyProfitPaid);
        const incrementalProfit = cumulativeMonthlyProfit - alreadyPaid;
        if (incrementalProfit > 0) {
          await this.addToWallet(plan.memberId, incrementalProfit);

          await db.update(yearlySavingsPlans)
            .set({ monthlyProfitPaid: cumulativeMonthlyProfit.toFixed(2) })
            .where(eq(yearlySavingsPlans.id, plan.id));

          await this.createNotification({
            type: "monthly_payout",
            title: "Monthly Profit Paid",
            message: `Your yearly savings plan "${plan.planName}" has paid ₦${incrementalProfit.toFixed(2)} monthly profit (${completedMonths} months completed).`,
            memberId: plan.memberId,
            read: "false",
          });
        }
      }
    }
  }

  async getYearlySavingsPlan(planId: string): Promise<YearlySavingsPlan | null> {
    const plan = await db.query.yearlySavingsPlans.findFirst({
      where: eq(yearlySavingsPlans.id, planId),
    });

    return plan;
  }

  // Dynamic Savings Plan Type Management
  async getSavingsPlanTypes(): Promise<SavingsPlanType[]> {
    return await db.query.savingsPlanTypes.findMany({
      orderBy: [desc(savingsPlanTypes.createdAt)],
    });
  }

  async getSavingsPlanType(id: number): Promise<SavingsPlanType | null> {
    const planType = await db.query.savingsPlanTypes.findFirst({
      where: eq(savingsPlanTypes.id, id),
    });
    return planType;
  }

  async createSavingsPlanType(planType: InsertSavingsPlanType): Promise<SavingsPlanType> {
    const [newPlanType] = await db.insert(savingsPlanTypes).values(planType).returning();
    return newPlanType;
  }

  async updateSavingsPlanType(id: number, planType: Partial<InsertSavingsPlanType>): Promise<SavingsPlanType> {
    const [updatedPlanType] = await db
      .update(savingsPlanTypes)
      .set({ ...planType, updatedAt: new Date() })
      .where(eq(savingsPlanTypes.id, id))
      .returning();
    return updatedPlanType;
  }

  async deleteSavingsPlanType(id: number): Promise<void> {
    await db.delete(savingsPlanTypes).where(eq(savingsPlanTypes.id, id));
  }

  // Dynamic Savings Plan Management
  async getDynamicSavingsPlans(): Promise<DynamicSavingsPlanWithDetails[]> {
    const plans = await db.query.dynamicSavingsPlans.findMany({
      with: {
        planType: true,
        member: true,
        contributions: true,
      },
      orderBy: [desc(dynamicSavingsPlans.createdAt)],
    });
    return plans;
  }

  async getDynamicSavingsPlansPaginated(page: number, limit: number): Promise<PaginatedResponse<DynamicSavingsPlanWithDetails>> {
    const offset = (page - 1) * limit;
    
    const plans = await db.query.dynamicSavingsPlans.findMany({
      with: {
        planType: true,
        member: true,
        contributions: true,
      },
      orderBy: [desc(dynamicSavingsPlans.createdAt)],
      limit,
      offset,
    });

    const totalCount = await db.select({ count: sql`count(*)` }).from(dynamicSavingsPlans);
    const total = Number(totalCount[0]?.count || 0);

    return {
      data: plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDynamicSavingsPlan(id: number): Promise<DynamicSavingsPlanWithDetails | null> {
    const plan = await db.query.dynamicSavingsPlans.findFirst({
      with: {
        planType: true,
        member: true,
        contributions: true,
      },
      where: eq(dynamicSavingsPlans.id, id),
    });
    return plan;
  }

  async getMemberDynamicSavingsPlans(memberId: string): Promise<DynamicSavingsPlanWithDetails[]> {
    const plans = await db.query.dynamicSavingsPlans.findMany({
      with: {
        planType: true,
        member: true,
        contributions: true,
      },
      where: eq(dynamicSavingsPlans.memberId, memberId),
      orderBy: [desc(dynamicSavingsPlans.createdAt)],
    });
    return plans;
  }

  async createDynamicSavingsPlan(plan: InsertDynamicSavingsPlan): Promise<DynamicSavingsPlan> {
    const [newPlan] = await db.insert(dynamicSavingsPlans).values({
      ...plan,
      maturityDate: new Date(plan.maturityDate),
    }).returning();
    return newPlan;
  }

  async createDynamicSavingsPlanContribution(contribution: InsertDynamicSavingsPlanContribution): Promise<DynamicSavingsPlanContribution> {
    const [newContribution] = await db.insert(dynamicSavingsPlanContributions).values({
      ...contribution,
      date: new Date(contribution.date || new Date()),
    }).returning();

    // Update plan's current contributions and total saved
    await db.update(dynamicSavingsPlans)
      .set({
        currentContributions: sql`current_contributions + 1`,
        totalSaved: sql`total_saved + ${contribution.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(dynamicSavingsPlans.id, contribution.planId));

    return newContribution;
  }

  async createMultipleDynamicSavingsPlanContributions(
    planId: number, 
    memberId: string, 
    totalAmount: number, 
    paymentMethod?: string, 
    notes?: string, 
    date?: string, 
    recordedBy?: string
  ): Promise<ContributionResult> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }

    const contributionAmount = parseFloat(plan.contributionAmount);
    const count = Math.floor(totalAmount / contributionAmount);
    const remainingAmount = totalAmount % contributionAmount;

    const contributions: DynamicSavingsPlanContribution[] = [];
    const currentDate = new Date(date || new Date());

    for (let i = 0; i < count; i++) {
      const contributionDate = new Date(currentDate);
      contributionDate.setDate(currentDate.getDate() + i);

      const contribution = await this.createDynamicSavingsPlanContribution({
        planId,
        memberId,
        amount: contributionAmount.toString(),
        date: contributionDate.toISOString(),
        paymentMethod,
        notes: notes ? `${notes} - ${i + 1}/${count}` : notes,
        recordedBy,
      });
      contributions.push(contribution);
    }

    return {
      count,
      contributions,
      remainingAmount: remainingAmount.toString(),
    };
  }

  async calculateDynamicPlanProfit(planId: number): Promise<{ 
    profitEarned: string; 
    totalWithProfit: string; 
    monthlyProfitEarned: string; 
    fullProfitEarned: string; 
    breakFeeAmount: string; 
    earlyWithdrawalPenaltyAmount: string 
  }> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }

    const totalSaved = parseFloat(plan.totalSaved);
    const interestRate = parseFloat(plan.interestRate);
    const breakFee = parseFloat(plan.breakFee);
    const earlyWithdrawalPenalty = parseFloat(plan.earlyWithdrawalPenalty);
    
    // Calculate completed periods based on profit calculation type
    let completedPeriods = 0;
    switch (plan.profitCalculationType) {
      case "monthly":
        completedPeriods = Math.floor(plan.currentContributions / 31);
        break;
      case "quarterly":
        completedPeriods = Math.floor(plan.currentContributions / 93);
        break;
      case "biannually":
        completedPeriods = Math.floor(plan.currentContributions / 186);
        break;
      case "yearly":
        completedPeriods = Math.floor(plan.currentContributions / 372);
        break;
    }
    
    // Calculate period profit (50% of rate for each completed period)
    const periodProfitRate = interestRate / 12; // Convert to monthly
    const halfPeriodProfitRate = periodProfitRate / 2;
    const periodProfitEarned = totalSaved * halfPeriodProfitRate * (completedPeriods / 12);
    
    // Full profit calculation (only paid at maturity)
    const fullProfitEarned = totalSaved * (interestRate / 100);
    
    // Calculate break fee and early withdrawal penalty
    const breakFeeAmount = totalSaved * (breakFee / 100);
    const earlyWithdrawalPenaltyAmount = totalSaved * (earlyWithdrawalPenalty / 100);
    
    // Total profit to be paid now (period profit only)
    const profitEarned = periodProfitEarned;
    const totalWithProfit = totalSaved + profitEarned;

    return {
      profitEarned: profitEarned.toFixed(2),
      totalWithProfit: totalWithProfit.toFixed(2),
      monthlyProfitEarned: periodProfitEarned.toFixed(2),
      fullProfitEarned: fullProfitEarned.toFixed(2),
      breakFeeAmount: breakFeeAmount.toFixed(2),
      earlyWithdrawalPenaltyAmount: earlyWithdrawalPenaltyAmount.toFixed(2),
    };
  }

  async checkAndMatureDynamicPlan(planId: number): Promise<void> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }

    if (plan.status !== "active") {
      return;
    }

    const isComplete = plan.currentContributions >= plan.maxContributions;
    const isExpired = new Date() > new Date(plan.maturityDate);

    if (isComplete || isExpired) {
      // Calculate full profit for matured plan
      const profitCalculation = await this.calculateDynamicPlanProfit(planId);
      
      await db.update(dynamicSavingsPlans)
        .set({
          status: "matured",
          completedDate: new Date(),
          profitEarned: profitCalculation.fullProfitEarned,
          totalWithProfit: (parseFloat(plan.totalSaved) + parseFloat(profitCalculation.fullProfitEarned)).toString(),
        })
        .where(eq(dynamicSavingsPlans.id, planId));

      // Transfer total amount + full profit to wallet
      const totalWithProfit = parseFloat(profitCalculation.fullProfitEarned) + parseFloat(plan.totalSaved);
      await this.addToWallet(plan.memberId, totalWithProfit);

      // Create notification
      await this.createNotification({
        type: "plan_completed",
        title: "Dynamic Savings Plan Matured",
        message: `Your dynamic savings plan "${plan.planName}" has matured. ₦${totalWithProfit.toFixed(2)} (including ₦${profitCalculation.fullProfitEarned} profit) has been transferred to your wallet.`,
        memberId: plan.memberId,
        read: "false",
      });
    }
  }

  async checkAndMatureExpiredDynamicPlans(): Promise<void> {
    const now = new Date();
    const activePlans = await db
      .select()
      .from(dynamicSavingsPlans)
      .where(eq(dynamicSavingsPlans.status, "active"));

    for (const plan of activePlans) {
      if (new Date(plan.maturityDate) <= now) {
        await this.checkAndMatureDynamicPlan(plan.id);
      }
    }
  }

  async getDynamicPlanRemainingSlots(planId: number): Promise<number> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }
    return Math.max(0, plan.maxContributions - plan.currentContributions);
  }

  async requestDynamicPlanPayout(planId: number, memberId: string): Promise<Transaction> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }

    if (plan.status !== "matured") {
      throw new Error("Dynamic savings plan must be matured before payout");
    }

    const profitCalculation = await this.calculateDynamicPlanProfit(planId);
    const totalWithProfit = parseFloat(profitCalculation.totalWithProfit);
    
    // No fee for dynamic savings plans (they have interest)

    const transaction = await this.createTransaction({
      memberId,
      planId: planId.toString(),
      type: "payout",
      amount: totalWithProfit.toString(),
      status: "pending",
      date: new Date().toISOString(),
      notes: `Dynamic plan payout with interest`,
    });

    await db.update(dynamicSavingsPlans)
      .set({ payoutStatus: "pending" })
      .where(eq(dynamicSavingsPlans.id, planId));

    return transaction;
  }

  async completeDynamicPlanPayout(transactionId: string, staffId: string, payoutDetails: { payoutDestination: string; payoutAccountNumber: string; payoutAccountName: string; payoutBankName: string }): Promise<Transaction> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const updatedTransaction = await this.completePayoutTransaction(transactionId, staffId, {
      payoutDestination: payoutDetails.payoutDestination,
      payoutAccountNumber: payoutDetails.payoutAccountNumber,
      payoutAccountName: payoutDetails.payoutAccountName,
      payoutBankName: payoutDetails.payoutBankName,
      processedBy: staffId,
    });

    if (transaction.planId) {
      await db.update(dynamicSavingsPlans)
        .set({ payoutStatus: "completed" })
        .where(eq(dynamicSavingsPlans.id, parseInt(transaction.planId)));
    }

    return updatedTransaction;
  }

  async breakDynamicPlan(planId: number, memberId: string, reason?: string): Promise<Transaction> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Dynamic savings plan must be active to break");
    }

    const daysSinceStart = Math.floor((new Date().getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart < plan.canBreakAfterDays) {
      throw new Error(`Plan can only be broken after ${plan.canBreakAfterDays} days`);
    }

    const profitCalculation = await this.calculateDynamicPlanProfit(planId);
    const breakFeeAmount = parseFloat(profitCalculation.breakFeeAmount);
    const payoutAmount = parseFloat(plan.totalSaved) - breakFeeAmount;

    // Update plan status
    await db.update(dynamicSavingsPlans)
      .set({
        status: "broken",
        completedDate: new Date(),
        profitEarned: "0", // No profit when breaking
        totalWithProfit: payoutAmount.toString(),
      })
      .where(eq(dynamicSavingsPlans.id, planId));

    // Create transaction for break payout. skipWalletUpdate=true because this
    // "payout" moves funds into the wallet (via addToWallet below), the opposite
    // of a disbursement payout that createTransaction normally debits from it.
    const transaction = await this.createTransaction({
      memberId,
      planId: planId.toString(),
      type: "payout",
      amount: payoutAmount.toString(),
      status: "completed",
      date: new Date().toISOString(),
      notes: reason || `Plan broken with break fee of ₦${breakFeeAmount.toFixed(2)}`,
    }, true);

    // Transfer amount minus break fee to wallet
    await this.addToWallet(memberId, payoutAmount);

    // Create notification
    await this.createNotification({
      type: "plan_completed",
      title: "Dynamic Savings Plan Broken",
      message: `Your dynamic savings plan "${plan.planName}" has been broken. ₦${payoutAmount.toFixed(2)} has been transferred to your wallet after break fee of ₦${breakFeeAmount.toFixed(2)}.`,
      memberId: plan.memberId,
      read: "false",
    });

    return transaction;
  }

  async requestDynamicPlanEarlyWithdrawal(planId: number, memberId: string): Promise<Transaction> {
    const plan = await this.getDynamicSavingsPlan(planId);
    if (!plan) {
      throw new Error("Dynamic savings plan not found");
    }

    if (plan.status !== "active") {
      throw new Error("Dynamic savings plan must be active for early withdrawal");
    }

    const profitCalculation = await this.calculateDynamicPlanProfit(planId);
    const earlyWithdrawalPenaltyAmount = parseFloat(profitCalculation.earlyWithdrawalPenaltyAmount);
    const payoutAmount = parseFloat(plan.totalSaved) - earlyWithdrawalPenaltyAmount;

    // Update plan status
    await db.update(dynamicSavingsPlans)
      .set({
        status: "broken",
        completedDate: new Date(),
        profitEarned: "0", // No profit for early withdrawal
        totalWithProfit: payoutAmount.toString(),
      })
      .where(eq(dynamicSavingsPlans.id, planId));

    // Create transaction for early withdrawal
    const transaction = await this.createTransaction({
      memberId,
      planId: planId.toString(),
      type: "payout",
      amount: payoutAmount.toString(),
      status: "pending",
      date: new Date().toISOString(),
      notes: `Early withdrawal with penalty of ₦${earlyWithdrawalPenaltyAmount.toFixed(2)}`,
    });

    return transaction;
  }
}

export const storage = new DatabaseStorage();
