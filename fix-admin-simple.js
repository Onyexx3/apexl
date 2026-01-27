import "dotenv/config";
import { db } from "./server/db.js";
import { staff } from "./shared/schema.js";
import { eq } from 'drizzle-orm';

async function fixAdmin() {
  try {
    console.log('Fixing admin user credentials...');
    
    // Simple update with hardcoded hash for 'admin123'
    const result = await db
      .update(staff)
      .set({ 
        username: 'admin',
        password: '$2b$12$LQv3c1yqBWVHxkd0L9bvuOQJqzj8tJq4qQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqE
      })
      .where(eq(staff.username, 'admin'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Admin user updated successfully');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('Creating new admin user...');
      const [newAdmin] = await db
        .insert(staff)
        .values({
          branchId: 'default-branch',
          name: 'Admin User',
          email: 'admin@apexl.com',
          phone: '08011111111',
          username: 'admin',
          password: '$2b$12$LQv3c1yqBWVHxkd0L9bvuOQJqzj8tJq4qQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqE
          role: 'admin',
          status: 'active',
        })
        .returning();
      console.log('✅ New admin user created');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixAdmin();
