import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole, requireBranchAccess, filterByUserBranch } from "./auth";
import { insertMemberSchema, insertTransactionSchema, insertSavingsPlanSchema, insertPlanContributionSchema, insertYearlySavingsPlanSchema, insertYearlyPlanContributionSchema, insertNotificationSchema, insertBranchSchema, insertStaffSchema, insertLoanSchema, insertInvestmentTypeSchema, insertMemberInvestmentSchema, insertSavingsPlanTypeSchema, insertDynamicSavingsPlanSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { generateMemberPlanSummary } from "./pdf-generator";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "./uploads/profile-photos";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_upload = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_upload,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const express = await import('express');
  app.use('/uploads', express.default.static('uploads'));

  app.post("/api/upload/profile-photo", requireAuth, upload.single('photo'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = `/uploads/profile-photos/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to upload file" });
    }
  });

  setInterval(async () => {
    try {
      await storage.checkAndCloseExpiredPlans();
      await storage.checkAndMatureExpiredYearlyPlans();
    } catch (error) {
      console.error("Error checking expired plans:", error);
    }
  }, 60 * 60 * 1000);

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      let stats;
      
      if (user.role === "admin") {
        stats = await storage.getDashboardStats();
      } else if (user.role === "manager") {
        stats = await storage.getDashboardStatsForBranch(user.branchId);
      } else {
        stats = await storage.getDashboardStatsForStaff(user.id);
      }
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch analytics" });
    }
  });

  app.get("/api/branches", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getBranchesPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch branches" });
    }
  });

  app.get("/api/branches/all", requireAuth, async (req, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch branches" });
    }
  });

  app.get("/api/branches/:id", requireAuth, async (req, res) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch branch" });
    }
  });

  app.post("/api/branches", requireRole("admin", "manager"), async (req, res) => {
    try {
      const result = insertBranchSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const branch = await storage.createBranch(result.data);
      res.status(201).json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create branch" });
    }
  });

  app.put("/api/branches/:id", requireRole("admin", "manager"), async (req, res) => {
    try {
      const result = insertBranchSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const branch = await storage.updateBranch(req.params.id, result.data);
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteBranch(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete branch" });
    }
  });

  app.get("/api/staff", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      
      const branchId = filterByUserBranch(req);
      
      if (branchId) {
        const branchStaff = await storage.getStaffByBranch(branchId);
        const total = branchStaff.length;
        const offset = (page - 1) * limit;
        const data = branchStaff.slice(offset, offset + limit);
        res.json({
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      } else {
        const paginated = await storage.getStaffPaginated(page, limit);
        res.json(paginated);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/all", requireAuth, async (req, res) => {
    try {
      const allStaff = req.user?.role === "admin"
        ? await storage.getAllStaff()
        : await storage.getStaffByBranch(req.user!.branchId);
      res.json(allStaff);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", requireAuth, async (req, res) => {
    try {
      const staffMember = await storage.getStaff(req.params.id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff not found" });
      }
      
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isStaffInBranch(req.params.id, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only access staff in your branch" });
        }
      }
      
      res.json(staffMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch staff" });
    }
  });

  app.get("/api/branches/:branchId/staff", requireAuth, async (req, res) => {
    try {
      const staffList = await storage.getStaffByBranch(req.params.branchId);
      res.json(staffList);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch branch staff" });
    }
  });

  app.post("/api/staff", requireRole("admin"), async (req, res) => {
    try {
      const result = insertStaffSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const staffMember = await storage.createStaff(result.data);
      res.status(201).json(staffMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create staff" });
    }
  });

  app.put("/api/staff/:id", requireRole("admin", "manager"), async (req, res) => {
    try {
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isStaffInBranch(req.params.id, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only update staff in your branch" });
        }
      }
      
      const result = insertStaffSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      if (req.user!.role !== "admin") {
        delete result.data.role;
      }
      const staffMember = await storage.updateStaff(req.params.id, result.data);
      res.json(staffMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update staff" });
    }
  });

  app.delete("/api/staff/:id", requireRole("admin"), async (req, res) => {
    try {
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isStaffInBranch(req.params.id, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only delete staff in your branch" });
        }
      }
      
      await storage.deleteStaff(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete staff" });
    }
  });

  app.get("/api/staff/:staffId/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getMembersByStaff(req.params.staffId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch staff members" });
    }
  });

  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      
      const user = req.user!;
      
      if (user.role === "admin") {
        const paginated = await storage.getMembersPaginated(page, limit);
        res.json(paginated);
      } else if (user.role === "manager") {
        const paginated = await storage.getMembersPaginatedByBranch(user.branchId, page, limit);
        res.json(paginated);
      } else {
        const paginated = await storage.getMembersPaginatedByStaff(user.id, page, limit);
        res.json(paginated);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch members" });
    }
  });

  app.get("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(req.params.id, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only access members in your branch" });
        }
      }
      
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch member" });
    }
  });

  app.get("/api/members/:id/with-staff", requireAuth, async (req, res) => {
    try {
      const member = await storage.getMemberWithStaff(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch member" });
    }
  });

  app.post("/api/members", requireAuth, async (req, res) => {
    try {
      const result = insertMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const member = await storage.createMember(result.data);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create member" });
    }
  });

  app.put("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(req.params.id, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only update members in your branch" });
        }
      }
      
      const result = insertMemberSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const member = await storage.updateMember(req.params.id, result.data);
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", requireRole("admin", "manager"), async (req, res) => {
    try {
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(req.params.id, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only delete members in your branch" });
        }
      }
      
      await storage.deleteMember(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete member" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getTransactionsPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/recent", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getRecentTransactions(10);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch recent transactions" });
    }
  });

  app.get("/api/transactions/payouts", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getPayoutsPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch payouts" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const result = insertTransactionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const member = await storage.getMember(result.data.memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      if (result.data.type === "payout") {
        const requestedAmount = parseFloat(result.data.amount);
        const walletBalance = parseFloat(member.walletBalance);
        
        if (result.data.status === "completed" && requestedAmount > walletBalance) {
          return res.status(400).json({ 
            message: `Insufficient wallet balance. Member has ₦${walletBalance.toFixed(2)} but requested ₦${requestedAmount.toFixed(2)}` 
          });
        }
      }

      const transaction = await storage.createTransaction(result.data);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id/approve", requireRole("admin", "manager"), async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.type !== "payout") {
        return res.status(400).json({ message: "Only payout transactions can be approved" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not pending" });
      }

      const member = await storage.getMember(transaction.memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const requestedAmount = parseFloat(transaction.amount);
      const walletBalance = parseFloat(member.walletBalance);
      
      if (requestedAmount > walletBalance) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Member has ₦${walletBalance.toFixed(2)} but payout is ₦${requestedAmount.toFixed(2)}` 
        });
      }

      const updatedTransaction = await storage.updateTransactionStatus(req.params.id, "approved");
      
      await storage.createNotification({
        type: "payout_approved",
        title: "Payout Approved",
        message: `Payout of ₦${requestedAmount.toFixed(2)} for ${member.name} has been approved. Awaiting processing.`,
        memberId: transaction.memberId,
        transactionId: transaction.id,
        read: "false",
      });

      res.json(updatedTransaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to approve transaction" });
    }
  });

  app.patch("/api/transactions/:id/complete-payout", requireRole("admin", "manager"), async (req, res) => {
    try {
      const { payoutDestination, payoutAccountNumber, payoutAccountName, payoutBankName } = req.body;
      
      if (!payoutDestination || !payoutAccountNumber || !payoutAccountName || !payoutBankName) {
        return res.status(400).json({ message: "All payout details are required" });
      }

      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.type !== "payout") {
        return res.status(400).json({ message: "Transaction is not a payout" });
      }

      if (transaction.status !== "pending" && transaction.status !== "approved") {
        return res.status(400).json({ message: "Transaction cannot be completed" });
      }

      const member = await storage.getMember(transaction.memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const requestedAmount = parseFloat(transaction.amount);
      const walletBalance = parseFloat(member.walletBalance);
      
      if (requestedAmount > walletBalance) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Member has ₦${walletBalance.toFixed(2)} but payout is ₦${requestedAmount.toFixed(2)}` 
        });
      }

      const updatedTransaction = await storage.completePayoutTransaction(req.params.id, {
        payoutDestination,
        payoutAccountNumber,
        payoutAccountName,
        payoutBankName,
        processedBy: req.user!.id,
      });

      await storage.createNotification({
        type: "payout_approved",
        title: "Payout Completed",
        message: `Payout of ₦${requestedAmount.toFixed(2)} for ${member.name} has been sent to ${payoutBankName} - ${payoutAccountNumber}.`,
        memberId: transaction.memberId,
        transactionId: transaction.id,
        read: "false",
      });

      res.json(updatedTransaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to complete payout" });
    }
  });

  app.patch("/api/transactions/:id/reject", requireRole("admin", "manager"), async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.type !== "payout") {
        return res.status(400).json({ message: "Only payout transactions can be rejected" });
      }

      if (transaction.status !== "pending" && transaction.status !== "approved") {
        return res.status(400).json({ message: "Transaction cannot be rejected" });
      }

      const member = await storage.getMember(transaction.memberId);
      const requestedAmount = parseFloat(transaction.amount);

      const updatedTransaction = await storage.updateTransactionStatus(req.params.id, "rejected");
      
      if (member) {
        await storage.createNotification({
          type: "pending_payout",
          title: "Payout Request Rejected",
          message: `Payout request of ₦${requestedAmount.toFixed(2)} for ${member.name} has been rejected.`,
          memberId: transaction.memberId,
          transactionId: transaction.id,
          read: "false",
        });
      }

      res.json(updatedTransaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reject transaction" });
    }
  });

  app.get("/api/savings-plans", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getPlansPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch savings plans" });
    }
  });

  app.get("/api/savings-plans/:id", requireAuth, async (req, res) => {
    try {
      const plan = await storage.getSavingsPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Savings plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch savings plan" });
    }
  });

  app.get("/api/savings-plans/:id/remaining-slots", requireAuth, async (req, res) => {
    try {
      const remainingSlots = await storage.getPlanRemainingSlots(req.params.id);
      res.json({ remainingSlots });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch remaining slots" });
    }
  });

  app.get("/api/members/:memberId/plans", requireAuth, async (req, res) => {
    try {
      const plans = await storage.getMemberSavingsPlans(req.params.memberId);
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch member plans" });
    }
  });

  app.post("/api/savings-plans", requireAuth, async (req, res) => {
    try {
      const result = insertSavingsPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const plan = await storage.createSavingsPlan(result.data);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create savings plan" });
    }
  });

  app.post("/api/plans/:planId/contribute", requireAuth, async (req, res) => {
    try {
      const { amount, paymentMethod, notes, date, memberId } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const result = await storage.createMultiplePlanContributions(
        req.params.planId,
        memberId,
        parseFloat(amount),
        paymentMethod,
        notes,
        date,
        req.user?.id
      );
      
      const plan = await storage.getSavingsPlan(req.params.planId);
      if (plan && (plan.status === "completed" || plan.status === "closed")) {
        const member = await storage.getMember(plan.memberId);
        if (member) {
          await storage.createNotification({
            type: "plan_completed",
            title: "Savings Plan Completed",
            message: `Savings plan "${plan.planName}" has been completed with ₦${parseFloat(plan.totalSaved).toFixed(2)} transferred to wallet.`,
            memberId: plan.memberId,
            read: "false",
          });
        }
      }

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create contribution" });
    }
  });

  app.post("/api/plans/:planId/request-payout", requireAuth, async (req, res) => {
    try {
      const plan = await storage.getSavingsPlan(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Savings plan not found" });
      }

      const transaction = await storage.requestPlanPayout(req.params.planId, plan.memberId);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to request payout" });
    }
  });

  app.post("/api/wallet/:memberId/withdraw", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      const member = await storage.withdrawFromWallet(req.params.memberId, parseFloat(amount));
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to process withdrawal" });
    }
  });

  // Yearly Savings Plans Routes
  app.get("/api/yearly-savings-plans", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getYearlyPlansPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch yearly savings plans" });
    }
  });

  app.get("/api/yearly-savings-plans/:id", requireAuth, async (req, res) => {
    try {
      const plan = await storage.getYearlySavingsPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Yearly savings plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch yearly savings plan" });
    }
  });

  app.get("/api/yearly-savings-plans/:id/remaining-slots", requireAuth, async (req, res) => {
    try {
      const remainingSlots = await storage.getYearlyPlanRemainingSlots(req.params.id);
      res.json({ remainingSlots });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch remaining slots" });
    }
  });

  app.get("/api/yearly-savings-plans/:id/profit-calculation", requireAuth, async (req, res) => {
    try {
      const profitCalculation = await storage.calculateYearlyPlanProfit(req.params.id);
      res.json(profitCalculation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to calculate profit" });
    }
  });

  app.get("/api/members/:memberId/yearly-plans", requireAuth, async (req, res) => {
    try {
      const plans = await storage.getMemberYearlySavingsPlans(req.params.memberId);
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch member yearly plans" });
    }
  });

  app.post("/api/yearly-savings-plans", requireAuth, async (req, res) => {
    try {
      const result = insertYearlySavingsPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const plan = await storage.createYearlySavingsPlan(result.data);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create yearly savings plan" });
    }
  });

  app.post("/api/yearly-plans/:planId/contribute", requireAuth, async (req, res) => {
    try {
      const { amount, paymentMethod, notes, date, memberId } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const result = await storage.createMultipleYearlyPlanContributions(
        req.params.planId,
        memberId,
        parseFloat(amount),
        paymentMethod,
        notes,
        date,
        req.user?.id
      );
      
      const plan = await storage.getYearlySavingsPlan(req.params.planId);
      if (plan && plan.status === "matured") {
        const member = await storage.getMember(plan.memberId);
        if (member) {
          await storage.createNotification({
            type: "yearly_plan_matured",
            title: "Yearly Savings Plan Matured",
            message: `Your yearly savings plan "${plan.planName}" has matured with ₦${parseFloat(plan.totalSaved).toFixed(2)} saved and ₦${parseFloat(plan.profitEarned || "0").toFixed(2)} profit transferred to wallet.`,
            memberId: plan.memberId,
            read: "false",
          });
        }
      }

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create contribution" });
    }
  });

  app.post("/api/yearly-plans/:planId/request-payout", requireAuth, async (req, res) => {
    try {
      const plan = await storage.getYearlySavingsPlan(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Yearly savings plan not found" });
      }

      const transaction = await storage.requestYearlyPlanPayout(req.params.planId, plan.memberId);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to request payout" });
    }
  });

  app.post("/api/yearly-plans/:planId/request-monthly-payout", requireAuth, async (req, res) => {
    try {
      const plan = await storage.getYearlySavingsPlan(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Yearly savings plan not found" });
      }

      const transaction = await storage.requestYearlyPlanMonthlyPayout(req.params.planId, plan.memberId);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to request monthly payout" });
    }
  });

  app.post("/admin/yearly-plans/pay-monthly-profits", requireRole("admin"), async (req, res) => {
    try {
      await storage.checkAndPayMonthlyProfits();
      res.json({ message: "Monthly profits paid successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to pay monthly profits" });
    }
  });

  app.get("/api/transactions/:id/receipt", requireAuth, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="receipt-${req.params.id}.pdf"`);
      doc.pipe(res);

      doc.fontSize(24).font("Helvetica-Bold").text("ApexL Investment", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("Transaction Receipt", { align: "center" });
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(12).font("Helvetica-Bold").text("Receipt Information", { underline: true });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Receipt #: ${req.params.id.substring(0, 8).toUpperCase()}`);
      doc.text(`Date: ${new Date(transaction.date).toLocaleDateString()}`);
      doc.text(`Time: ${new Date(transaction.createdAt).toLocaleTimeString()}`);
      doc.moveDown();

      doc.fontSize(12).font("Helvetica-Bold").text("Member Information", { underline: true });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${transaction.member?.name || "N/A"}`);
      doc.text(`Email: ${transaction.member?.email || "N/A"}`);
      doc.text(`Phone: ${transaction.member?.phone || "N/A"}`);
      doc.text(`Wallet Number: ${transaction.member?.walletNumber || "N/A"}`);
      doc.moveDown();

      doc.fontSize(12).font("Helvetica-Bold").text("Transaction Details", { underline: true });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Type: ${transaction.type.toUpperCase()}`);
      doc.text(`Amount: ₦${parseFloat(transaction.amount).toFixed(2)}`);
      doc.text(`Status: ${transaction.status.toUpperCase()}`);
      doc.text(`Payment Method: ${transaction.paymentMethod || "N/A"}`);
      if (transaction.notes) {
        doc.text(`Notes: ${transaction.notes}`);
      }
      doc.moveDown();

      doc.fontSize(8).text("This receipt confirms the transaction recorded in the ApexL Investment system.", { align: "center" });
      doc.text("For inquiries, contact admin@apexl.com", { align: "center" });

      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate receipt" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getNotificationsPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread/count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount();
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const result = insertNotificationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const notif = await storage.createNotification(result.data);
      res.status(201).json(notif);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notif = await storage.markNotificationAsRead(req.params.id);
      res.json(notif);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to mark notification as read" });
    }
  });

  app.get("/api/transactions/export/excel", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      
      const data = transactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString(),
        Member: t.member?.name || "Unknown",
        Type: t.type,
        Amount: parseFloat(t.amount).toFixed(2),
        "Payment Method": t.paymentMethod || "N/A",
        Status: t.status,
        Notes: t.notes || "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to export transactions" });
    }
  });

  app.get("/api/loans", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getLoansPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch loans" });
    }
  });

  app.get("/api/loans/:id", requireAuth, async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch loan" });
    }
  });

  app.get("/api/members/:memberId/loans", requireAuth, async (req, res) => {
    try {
      const loans = await storage.getMemberLoans(req.params.memberId);
      res.json(loans);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch member loans" });
    }
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    try {
      const result = insertLoanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(result.data.memberId, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only create loans for members in your branch" });
        }
      }
      
      const loan = await storage.createLoan(result.data);
      
      const member = await storage.getMember(loan.memberId);
      if (member) {
        await storage.createNotification({
          type: "loan_requested",
          title: "Loan Request Submitted",
          message: `Loan request of ₦${parseFloat(loan.amount).toFixed(2)} submitted by ${member.name}. Awaiting approval.`,
          memberId: loan.memberId,
          read: "false",
        });
      }
      
      res.status(201).json(loan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create loan request" });
    }
  });

  app.patch("/api/loans/:id/approve", requireRole("admin", "manager"), async (req, res) => {
    try {
      const loan = await storage.approveLoan(req.params.id, req.user!.id);
      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to approve loan" });
    }
  });

  app.patch("/api/loans/:id/reject", requireRole("admin", "manager"), async (req, res) => {
    try {
      const loan = await storage.rejectLoan(req.params.id, req.user!.id);
      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reject loan" });
    }
  });

  app.post("/api/loans/:id/repay", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid repayment amount" });
      }
      const loan = await storage.repayLoan(req.params.id, parseFloat(amount));
      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to process loan repayment" });
    }
  });

  // Investment Types Routes (Admin only for management)
  app.get("/api/investment-types", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const paginated = await storage.getInvestmentTypesPaginated(page, limit);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch investment types" });
    }
  });

  app.get("/api/investment-types/active", requireAuth, async (req, res) => {
    try {
      const types = await storage.getActiveInvestmentTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch active investment types" });
    }
  });

  app.get("/api/investment-types/:id", requireAuth, async (req, res) => {
    try {
      const investmentType = await storage.getInvestmentType(req.params.id);
      if (!investmentType) {
        return res.status(404).json({ message: "Investment type not found" });
      }
      res.json(investmentType);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch investment type" });
    }
  });

  app.post("/api/investment-types", requireRole("admin"), async (req, res) => {
    try {
      const result = insertInvestmentTypeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const investmentType = await storage.createInvestmentType({
        ...result.data,
        createdBy: req.user!.id,
      });
      res.status(201).json(investmentType);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create investment type" });
    }
  });

  app.put("/api/investment-types/:id", requireRole("admin"), async (req, res) => {
    try {
      const result = insertInvestmentTypeSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const investmentType = await storage.updateInvestmentType(req.params.id, result.data);
      res.json(investmentType);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update investment type" });
    }
  });

  app.delete("/api/investment-types/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteInvestmentType(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete investment type" });
    }
  });

  // Member Investments Routes
  app.get("/api/investments", requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const memberId = req.query.memberId as string | undefined;
      const investmentTypeId = req.query.investmentTypeId as string | undefined;
      const paginated = await storage.getMemberInvestmentsPaginated(page, limit, memberId, investmentTypeId);
      res.json(paginated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch investments" });
    }
  });

  app.get("/api/investments/:id", requireAuth, async (req, res) => {
    try {
      const investment = await storage.getMemberInvestment(req.params.id);
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      res.json(investment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch investment" });
    }
  });

  app.get("/api/members/:memberId/investments", requireAuth, async (req, res) => {
    try {
      const investments = await storage.getMemberInvestmentsByMember(req.params.memberId);
      res.json(investments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch member investments" });
    }
  });

  app.post("/api/investments", requireAuth, async (req, res) => {
    try {
      const result = insertMemberInvestmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(result.data.memberId, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only create investments for members in your branch" });
        }
      }
      
      const investment = await storage.createMemberInvestment({
        ...result.data,
        assignedBy: req.user!.id,
      });
      
      const member = await storage.getMember(investment.memberId);
      if (member) {
        await storage.createNotification({
          type: "reminder",
          title: "New Investment Created",
          message: `Investment of ₦${parseFloat(investment.amount).toFixed(2)} has been created for ${member.name}. Expected return: ₦${parseFloat(investment.expectedReturn).toFixed(2)}.`,
          memberId: investment.memberId,
          read: "false",
        });
      }
      
      res.status(201).json(investment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create investment" });
    }
  });

  app.patch("/api/investments/:id/break", requireRole("admin", "manager"), async (req, res) => {
    try {
      const existingInvestment = await storage.getMemberInvestment(req.params.id);
      if (!existingInvestment) {
        return res.status(404).json({ message: "Investment not found" });
      }

      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(existingInvestment.memberId, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden: You can only break investments for members in your branch" });
        }
      }

      const investment = await storage.breakMemberInvestment(req.params.id);

      const member = await storage.getMember(investment.memberId);
      if (member) {
        await storage.createNotification({
          type: "reminder",
          title: "Investment Broken",
          message: `Investment has been broken early. Amount returned: ₦${parseFloat(investment.actualReturn || "0").toFixed(2)} (after break fee).`,
          memberId: investment.memberId,
          read: "false",
        });
      }
      
      res.json(investment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to break investment" });
    }
  });

  app.patch("/api/investments/:id/mature", requireRole("admin", "manager"), async (req, res) => {
    try {
      const investment = await storage.matureMemberInvestment(req.params.id);
      
      const member = await storage.getMember(investment.memberId);
      if (member) {
        await storage.createNotification({
          type: "reminder",
          title: "Investment Matured",
          message: `Your investment has matured! Amount credited to wallet: ₦${parseFloat(investment.actualReturn || "0").toFixed(2)}.`,
          memberId: investment.memberId,
          read: "false",
        });
      }
      
      res.json(investment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to mature investment" });
    }
  });

  // Savings Plan Types Routes
  app.get("/api/savings-plan-types", requireAuth, async (req, res) => {
    try {
      const planTypes = await storage.getSavingsPlanTypes();
      res.json(planTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch savings plan types" });
    }
  });

  // Dynamic Savings Plans Routes
  app.post("/api/dynamic-savings-plans", requireAuth, async (req, res) => {
    try {
      const result = insertDynamicSavingsPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const branchId = filterByUserBranch(req);
      if (branchId) {
        const hasAccess = await storage.isMemberInBranch(result.data.memberId, branchId);
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to create plans for this member" });
        }
      }

      const plan = await storage.createDynamicSavingsPlan(result.data);
      
      const member = await storage.getMember(plan.memberId);
      if (member) {
        await storage.createNotification({
          type: "reminder",
          title: "New Savings Plan Created",
          message: `Savings plan "${plan.planName}" has been created for ${member.name}. Target: ₦${parseFloat(plan.targetAmount).toLocaleString()}.`,
          memberId: plan.memberId,
          read: "false",
        });
      }

      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create savings plan" });
    }
  });

  // Investment Types Routes
  app.get("/api/investment-types", requireAuth, async (req, res) => {
    try {
      const investmentTypes = await storage.getInvestmentTypes();
      res.json(investmentTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch investment types" });
    }
  });

  // PDF Generation Route
  app.post("/api/generate-plan-summary", requireAuth, async (req, res) => {
    try {
      const { planData, planType, memberId } = req.body;

      if (!planData || !planType || !memberId) {
        return res.status(400).json({ message: "Missing required fields: planData, planType, memberId" });
      }

      const member = await storage.getMember(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const pdfBuffer = await generateMemberPlanSummary(member, planData, planType);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="plan-summary-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: error.message || "Failed to generate PDF" });
    }
  });

  // Periodic check for matured investments
  setInterval(async () => {
    try {
      await storage.checkAndMatureInvestments();
    } catch (error) {
      console.error("Error checking matured investments:", error);
    }
  }, 60 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
