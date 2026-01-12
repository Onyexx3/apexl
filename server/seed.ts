import "dotenv/config";
import { db } from "./db";
import { branches, staff, members, yearlySavingsPlans, yearlyPlanContributions } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding database...");

  // Create a default branch
  const [branch] = await db
    .insert(branches)
    .values({
      name: "Head Office",
      code: "HQ001",
      address: "123 Main Street",
      phone: "08012345678",
      status: "active",
    })
    .returning();

  console.log("Created branch:", branch.name);

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const [admin] = await db
    .insert(staff)
    .values({
      branchId: branch.id,
      name: "Admin User",
      email: "admin@apexl.com",
      phone: "08011111111",
      username: "admin",
      password: adminPassword,
      role: "admin",
      status: "active",
    })
    .returning();

  console.log("Created admin user:", admin.username);

  // Create manager user
  const managerPassword = await hashPassword("manager123");
  const [manager] = await db
    .insert(staff)
    .values({
      branchId: branch.id,
      name: "Manager User",
      email: "manager@apexl.com",
      phone: "08022222222",
      username: "manager",
      password: managerPassword,
      role: "manager",
      status: "active",
    })
    .returning();

  console.log("Created manager user:", manager.username);

  // Create collector (staff) user
  const staffPassword = await hashPassword("staff123");
  const [collector] = await db
    .insert(staff)
    .values({
      branchId: branch.id,
      name: "Staff User",
      email: "staff@apexl.com",
      phone: "08033333333",
      username: "staff",
      password: staffPassword,
      role: "collector",
      status: "active",
    })
    .returning();

  console.log("Created staff user:", collector.username);

  // Create sample members
  const [member1] = await db
    .insert(members)
    .values({
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "08012345678",
      address: "123 Main Street, Lagos",
      walletNumber: "WAL001",
      balance: "50000.00",
      status: "active",
    })
    .returning();

  const [member2] = await db
    .insert(members)
    .values({
      name: "Jane Smith",
      email: "jane.smith@email.com",
      phone: "08098765432",
      address: "456 Oak Avenue, Abuja",
      walletNumber: "WAL002",
      balance: "75000.00",
      status: "active",
    })
    .returning();

  const [member3] = await db
    .insert(members)
    .values({
      name: "Michael Johnson",
      email: "michael.j@email.com",
      phone: "08055555555",
      address: "789 Palm Road, Port Harcourt",
      walletNumber: "WAL003",
      balance: "30000.00",
      status: "active",
    })
    .returning();

  console.log("Created 3 sample members");

  // Create yearly savings plans
  const maturityDate1 = new Date();
  maturityDate1.setDate(maturityDate1.getDate() + 372);

  const [yearlyPlan1] = await db
    .insert(yearlySavingsPlans)
    .values({
      memberId: member1.id,
      planName: "Premium Yearly Investment",
      targetAmount: "372000.00",
      contributionAmount: "1000.00",
      status: "active",
      contributionsCount: 50,
      maxContributions: 372,
      maxDays: 372,
      maturityDate: maturityDate1,
      totalSaved: "50000.00",
      profitRate: "5.00",
      profitEarned: "0.00",
      payoutStatus: "none",
    })
    .returning();

  const maturityDate2 = new Date();
  maturityDate2.setDate(maturityDate2.getDate() + 372);

  const [yearlyPlan2] = await db
    .insert(yearlySavingsPlans)
    .values({
      memberId: member2.id,
      planName: "Gold Yearly Savings",
      targetAmount: "744000.00",
      contributionAmount: "2000.00",
      status: "active",
      contributionsCount: 100,
      maxContributions: 372,
      maxDays: 372,
      maturityDate: maturityDate2,
      totalSaved: "200000.00",
      profitRate: "6.00",
      profitEarned: "0.00",
      payoutStatus: "none",
    })
    .returning();

  // Create a matured yearly plan
  const pastMaturityDate = new Date();
  pastMaturityDate.setDate(pastMaturityDate.getDate() - 30);

  const [yearlyPlan3] = await db
    .insert(yearlySavingsPlans)
    .values({
      memberId: member3.id,
      planName: "Completed Yearly Plan",
      targetAmount: "186000.00",
      contributionAmount: "500.00",
      status: "matured",
      contributionsCount: 372,
      maxContributions: 372,
      maxDays: 372,
      maturityDate: pastMaturityDate,
      completedDate: pastMaturityDate,
      totalSaved: "186000.00",
      profitRate: "4.50",
      profitEarned: "8370.00",
      payoutStatus: "completed",
    })
    .returning();

  console.log("Created 3 yearly savings plans (2 active, 1 matured)");

  // Create some sample contributions for the first plan
  const contributionDate = new Date();
  for (let i = 1; i <= 50; i++) {
    contributionDate.setDate(contributionDate.getDate() - (50 - i));
    await db.insert(yearlyPlanContributions).values({
      planId: yearlyPlan1.id,
      memberId: member1.id,
      amount: "1000.00",
      contributionNumber: i,
      date: new Date(contributionDate),
      paymentMethod: "bank_transfer",
      notes: `Contribution ${i}`,
      recordedBy: admin.id,
    });
  }

  console.log("Created 50 sample contributions for first yearly plan");

  console.log("\n=== Login Credentials ===");
  console.log("Admin:   username: admin    password: admin123");
  console.log("Manager: username: manager  password: manager123");
  console.log("Staff:   username: staff    password: staff123");
  console.log("=========================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
