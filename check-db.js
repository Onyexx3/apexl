import "dotenv/config";
import { db } from "./server/db.js";
import { staff } from "./shared/schema.js";

async function checkStaff() {
  try {
    const existingStaff = await db.select().from(staff).limit(5);
    console.log('Existing staff:');
    existingStaff.forEach(s => {
      console.log(`ID: ${s.id}, Username: ${s.username}, Name: ${s.name}, Role: ${s.role}, HasPassword: ${!!s.password}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStaff();
