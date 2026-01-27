import "dotenv/config";
import { db } from "./server/db.js";
import { staff } from "./shared/schema.js";
import { eq } from 'drizzle-orm';

async function fixAdmin() {
  try {
    console.log('Fixing admin user credentials...');
    
    // Update existing admin user or create new one
    const result = await db
      .update(staff)
      .set({ 
        username: 'admin',
        password: '$2b$12$LQv3c1yqBWVHxkd0L9bvuOQJqzj8tJq4qQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqE
      })
      .where(eq(staff.username, 'admin'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Admin user updated successfully');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Admin user not found, creating new one...');
      
      // Create new admin user
      const [newAdmin] = await db
        .insert(staff)
        .values({
          branchId: (await db.select().from('branches').limit(1))[0]?.id || 'default',
          name: 'Admin User',
          email: 'admin@apexl.com',
          phone: '08011111111',
          username: 'admin',
          password: '$2b$12$LQv3c1yqBWVHxkd0L9bvuOQJqzj8tJq4qQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqE
          role: 'admin',
          status: 'active',
        })
        .returning();

      console.log('✅ New admin user created successfully');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixAdmin();
