import "dotenv/config";
import { db } from "./server/db.js";
import { staff } from "./shared/schema.js";
import { eq } from 'drizzle-orm';

async function testLogin() {
  try {
    console.log('Testing database connection and staff data...');
    
    // Check if admin user exists
    const [adminUser] = await db
      .select()
      .from(staff)
      .where(eq(staff.username, 'admin'))
      .limit(1);
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Has Password: ${!!adminUser.password}`);
      console.log(`   Branch ID: ${adminUser.branchId}`);
      console.log(`   Status: ${adminUser.status}`);
    } else {
      console.log('❌ No admin user found');
    }
    
    // List all staff
    const allStaff = await db.select().from(staff).limit(5);
    console.log(`\nTotal staff members: ${allStaff.length}`);
    allStaff.forEach(s => {
      console.log(`   - ${s.username} (${s.role}) - ${s.name}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

testLogin();
