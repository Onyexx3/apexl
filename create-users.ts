import "dotenv/config";
import { db } from "./server/db";
import { staff, branches } from "@shared/schema";
import { hashPassword } from "./server/auth";

async function createUsers() {
  try {
    console.log("Creating users...");

    // Get existing branch
    const [branch] = await db.select().from(branches).limit(1);
    if (!branch) {
      console.error("No branch found. Please create a branch first.");
      process.exit(1);
    }

    console.log("Using branch:", branch.name);

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

    console.log("✅ Created admin user:", admin.username);

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

    console.log("✅ Created manager user:", manager.username);

    console.log("\n=== Login Credentials ===");
    console.log("Admin:   username: admin    password: admin123");
    console.log("Manager: username: manager  password: manager123");
    console.log("=========================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

createUsers();
