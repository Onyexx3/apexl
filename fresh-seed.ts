import "dotenv/config";
import { db } from "./server/db";
import { branches, staff, members, yearlySavingsPlans, yearlyPlanContributions } from "@shared/schema";
import { hashPassword } from "./server/auth";

async function freshSeed() {
  try {
    console.log("Creating fresh database with admin user...");

    // Clean existing data
    console.log("Cleaning existing data...");
    await db.delete(yearlyPlanContributions);
    await db.delete(yearlySavingsPlans);
    await db.delete(members);
    await db.delete(staff);
    await db.delete(branches);

    // Create a default branch
    console.log("Creating branch...");
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

    console.log("✅ Created branch:", branch.name);

    // Create admin user
    console.log("Creating admin user...");
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

    console.log("✅ Created admin user:", admin.username);

    // Create manager user
    console.log("Creating manager user...");
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

    console.log("✅ Created manager user:", manager.username);

    // Create field staff user
    console.log("Creating field staff user...");
    const staffPassword = await hashPassword("staff123");
    const [fieldStaff] = await db
      .insert(staff)
      .values({
        branchId: branch.id,
        name: "Field Staff User",
        email: "staff@apexl.com",
        phone: "08033333333",
        username: "staff",
        password: staffPassword,
        role: "collector",
        status: "active",
      })
      .returning();

    console.log("✅ Created field staff user:", fieldStaff.username);

    console.log("\n=== Login Credentials ===");
    console.log("Admin:   username: admin    password: admin123");
    console.log("Manager: username: manager  password: manager123");
    console.log("Staff:   username: staff    password: staff123");
    console.log("=========================\n");

    console.log("✅ Fresh database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

freshSeed();
