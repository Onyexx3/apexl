import "dotenv/config";
import { db } from "./server/db.js";
import { staff, branches } from "./shared/schema.js";
import { hashPassword } from "./server/auth.js";

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Get first branch
    const [branch] = await db.select().from(branches).limit(1);
    if (!branch) {
      console.error('No branch found. Please create a branch first.');
      process.exit(1);
    }
    
    // Hash the password
    const hashedPassword = await hashPassword("admin123");
    
    // Create admin user
    const [admin] = await db
      .insert(staff)
      .values({
        branchId: branch.id,
        name: "Admin User",
        email: "admin@apexl.com",
        phone: "08011111111",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        status: "active",
      })
      .returning();

    console.log('✅ Admin user created successfully:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('   Branch:', branch.name);
    
    // Also create a manager for testing
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

    console.log('✅ Manager user created successfully:');
    console.log('   Username: manager');
    console.log('   Password: manager123');
    console.log('   Role: manager');
    console.log('   Branch:', branch.name);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
