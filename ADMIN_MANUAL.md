# ApexL Investment Management System - Admin Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Member Management](#member-management)
4. [Transaction Processing](#transaction-processing)
5. [Savings Plans Management](#savings-plans-management)
6. [Branch & Staff Administration](#branch--staff-administration)
7. [Financial Reporting](#financial-reporting)
8. [Daily Operations Workflow](#daily-operations-workflow)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Best Practices](#best-practices)

---

## Getting Started

### System Login
1. Open your web browser and navigate to your ApexL domain
2. Enter your admin credentials:
   - **Username**: [Your admin username]
   - **Password**: [Your admin password]
3. Click "Login" to access the dashboard

### First-Time Setup
After logging in for the first time:
1. **Verify Branch Information**: Navigate to Branches → ensure your branch details are correct
2. **Check Staff Accounts**: Verify staff accounts are properly configured
3. **Review System Settings**: Confirm all configurations are appropriate for your operations

### Navigation Overview
The main navigation menu provides access to:
- **Dashboard**: System overview and key metrics
- **Members**: Member registration and management
- **Transactions**: All financial transactions
- **Savings**: Savings plan management
- **Investments**: Investment plan administration
- **Branches**: Multi-branch management
- **Staff**: User account management
- **Analytics**: Reports and insights

---

## Dashboard Overview

### Understanding Your Dashboard

The dashboard provides a real-time snapshot of your investment operations:

#### Key Metrics Cards
1. **Total Savings Pool**
   - Shows the total amount saved by all members
   - Updates in real-time with each transaction
   - Click to see detailed breakdown

2. **Active Members**
   - Number of currently active members
   - Excludes inactive or suspended accounts
   - Click to view member list

3. **Today's Collections**
   - Total amount collected today
   - Resets at midnight
   - Helps track daily performance

4. **Pending Payouts**
   - Amount awaiting approval/processing
   - Requires attention for member satisfaction
   - Click to review pending requests

#### Recent Transactions Table
- Shows the last 10 transactions
- Includes member name, amount, type, and status
- Click any transaction to view full details
- Use filters to find specific transactions

### Daily Dashboard Review
**Morning Routine** (First 15 minutes):
1. Check total savings pool growth
2. Review today's collections target
3. Address any pending payouts
4. Scan recent transactions for anomalies

**Throughout the Day**:
- Monitor active member count
- Track collection progress
- Address pending items promptly

---

## Member Management

### Adding New Members

#### Step-by-Step Member Registration
1. **Navigate to Members Section**
   - Click "Members" in the main navigation
   - Click the "Add Member" button

2. **Fill Member Information**
   ```
   Required Fields:
   - Full Name (as appears on ID)
   - Phone Number (with country code)
   - Email Address (optional but recommended)
   - Physical Address
   
   Optional Fields:
   - Alternative Contact
   - Occupation
   - Next of Kin
   ```

3. **Assign Member Details**
   - **Wallet Number**: System auto-generates unique 10-digit number
   - **Staff Assignment**: Select the staff member responsible
   - **Branch**: Automatically assigned to your branch

4. **Review and Save**
   - Verify all information is correct
   - Click "Save Member" to complete registration
   - System will generate member ID and wallet number

#### Member Onboarding Process
1. **Welcome**: Explain the savings system to new member
2. **Documentation**: Collect necessary identification documents
3. **Initial Deposit**: Record first savings contribution
4. **Savings Plan**: Discuss and set up appropriate savings plan
5. **Education**: Explain withdrawal procedures and timelines

### Managing Existing Members

#### Viewing Member Details
1. **Find Member**: Use search or browse member list
2. **Click Member Name**: Opens detailed member profile
3. **Review Information**: 
   - Personal details and contact information
   - Current savings balance
   - Transaction history
   - Active savings plans
   - Recent activities

#### Editing Member Information
1. **Navigate to Member Profile**
2. **Click "Edit" Button**
3. **Update Required Fields**:
   - Contact information changes
   - Address updates
   - Status changes (active/inactive)
4. **Save Changes**: System logs all modifications

#### Member Status Management
**Active Members**:
- Can make deposits and withdrawals
- Participate in savings plans
- Receive notifications

**Inactive Members**:
- Cannot make new transactions
- Existing savings remain intact
- Can be reactivated anytime

**Suspending a Member**:
1. Go to member profile
2. Click "Edit"
3. Change status to "inactive"
4. Add reason for suspension (optional)
5. Save changes

### Bulk Member Operations

#### Selecting Multiple Members
1. **Use Checkboxes**: Select members using row checkboxes
2. **Select All**: Use header checkbox to select all visible members
3. **Bulk Actions Menu**: Appears when members are selected

#### Bulk Operations Available
1. **Status Change**: Activate/deactivate multiple members
2. **Delete**: Remove multiple members (use with caution)
3. **Export**: Export member data to Excel

#### Best Practices for Bulk Operations
- Always double-check selections before executing
- Use filters to target specific member groups
- Keep records of bulk operations for audit purposes

---

## Transaction Processing

### Recording Daily Savings

#### Step-by-Step Savings Transaction
1. **Navigate to Transactions**
   - Click "Transactions" in navigation
   - Click "Add Transaction"

2. **Select Transaction Type**
   - Choose "Savings" from transaction type dropdown
   - Other options: Withdrawal, Payout, Transfer

3. **Enter Transaction Details**
   ```
   Required Information:
   - Member: Search and select member
   - Amount: Enter savings amount (₦)
   - Payment Method: Cash, Bank Transfer, Mobile Money
   - Date: Defaults to today, can be changed
   - Notes: Optional transaction description
   ```

4. **Verify and Save**
   - Double-check member selection
   - Confirm amount is correct
   - Add receipt number if applicable
   - Click "Save Transaction"

#### Transaction Confirmation
After saving:
- **Print Receipt**: Option to print member receipt
- **SMS Notification**: Send confirmation to member (if configured)
- **Update Balance**: Member balance updates immediately
- **Transaction ID**: Record for future reference

### Processing Withdrawals and Payouts

#### Withdrawal Request Processing
1. **Member Request**: Member submits withdrawal request
2. **Verify Eligibility**: Check savings plan maturity and rules
3. **Process Transaction**:
   - Navigate to Transactions → Add Transaction
   - Select "Withdrawal" as transaction type
   - Enter member and withdrawal amount
   - Add payout destination details
4. **Approval**: Manager approval may be required
5. **Processing**: Execute bank transfer or cash payment
6. **Confirmation**: Update transaction status to "completed"

#### Payout Destination Information
```
Required for Withdrawals:
- Bank Name
- Account Number
- Account Holder Name
- Reason for Withdrawal
- Processing Staff Member
```

### Transaction Management

#### Viewing Transaction History
1. **Member Transactions**: From member profile, click "View Transactions"
2. **Global Transactions**: In Transactions section, use filters
3. **Date Range**: Filter by specific date periods
4. **Transaction Types**: Filter by savings, withdrawals, etc.

#### Transaction Status Management
**Statuses**:
- **Pending**: Awaiting processing or approval
- **Completed**: Successfully processed
- **Failed**: Processing failed, needs attention
- **Cancelled**: Transaction cancelled

#### Correcting Transaction Errors
1. **Identify Error**: Review transaction details
2. **Contact Support**: For system errors
3. **Manual Correction**: For data entry errors
4. **Audit Trail**: All corrections are logged

### Daily Transaction Reconciliation

#### End-of-Day Process
1. **Run Transaction Report**:
   - Go to Analytics → Daily Report
   - Select today's date
   - Generate transaction summary

2. **Verify Totals**:
   - Count physical cash collected
   - Verify bank transfers received
   - Cross-check with system totals

3. **Address Discrepancies**:
   - Investigate missing transactions
   - Correct data entry errors
   - Document all adjustments

4. **Backup Data**:
   - Export daily transactions to Excel
   - Save backup reports
   - Archive receipts and documentation

---

## Savings Plans Management

### Understanding Savings Plans

#### Types of Savings Plans
1. **Daily Savings Plans**
   - Short-term savings (30-90 days)
   - Daily or weekly contributions
   - Quick access to funds
   - Lower interest rates

2. **Yearly Savings Plans**
   - Long-term investments (1-5 years)
   - Monthly or quarterly contributions
   - Higher interest rates
   - Maturity benefits

3. **Custom Plans**
   - Tailored to member needs
   - Flexible contribution schedules
   - Customized interest rates
   - Special terms and conditions

#### Plan Features
- **Target Amount**: Savings goal for the plan
- **Contribution Amount**: Regular deposit amount
- **Duration**: Plan length in days/months
- **Interest Rate**: Annual or monthly rate
- **Maturity Date**: When plan completes
- **Early Withdrawal**: Terms and penalties

### Creating Savings Plans

#### Step-by-Step Plan Creation
1. **Navigate to Savings Plans**
   - Click "Savings" in navigation
   - Click "Create New Plan"

2. **Select Member**
   - Search and select the member
   - Review member's current plans
   - Check eligibility for new plan

3. **Configure Plan Details**
   ```
   Plan Configuration:
   - Plan Type: Daily, Yearly, or Custom
   - Plan Name: Descriptive name for the plan
   - Target Amount: Total savings goal (₦)
   - Contribution Amount: Regular deposit amount (₦)
   - Duration: Plan length in days
   - Interest Rate: Annual percentage rate
   ```

4. **Set Special Terms** (if applicable)
   - Early withdrawal penalties
   - Grace periods
   - Special conditions
   - Payment schedules

5. **Review and Activate**
   - Verify all calculations
   - Confirm member agreement
   - Activate the plan
   - Print plan agreement

### Managing Active Plans

#### Monitoring Plan Progress
1. **Plan Overview**: View all active plans
2. **Individual Plans**: Click plan for detailed view
3. **Progress Tracking**: Monitor contributions vs. targets
4. **Maturity Alerts**: System alerts for approaching maturities

#### Plan Modifications
**Allowed Changes**:
- Contribution amount adjustments
- Duration extensions
- Interest rate updates (with approval)

**Restricted Changes**:
- Target amount reduction
- Early termination without penalties
- Retroactive changes

#### Processing Plan Maturity
1. **Maturity Notification**: System alerts 30 days before maturity
2. **Member Consultation**: Discuss maturity options
3. **Processing Options**:
   - **Payout**: Full amount plus interest
   - **Rollover**: Start new plan with matured amount
   - **Partial Withdrawal**: Take some, continue with rest
4. **Final Processing**: Execute selected option
5. **Documentation**: Record maturity details

### Plan Performance Analytics

#### Plan Success Metrics
- **Completion Rate**: Percentage of plans that reach maturity
- **Average Duration**: Typical plan lifecycle
- **Contribution Consistency**: Regularity of member payments
- **Profitability**: Interest earned vs. administrative costs

#### Generating Plan Reports
1. **Navigate to Analytics**
2. **Select "Savings Plans Report"**
3. **Configure Filters**:
   - Date range
   - Plan types
   - Member categories
   - Status filters
4. **Generate Report**: View online or export to Excel/PDF

---

## Branch & Staff Administration

### Branch Management

#### Setting Up Branches
1. **Navigate to Branches Section**
2. **Click "Add Branch"**
3. **Enter Branch Information**:
   ```
   Branch Details:
   - Branch Name: Official branch name
   - Branch Code: Unique identifier (max 10 chars)
   - Address: Physical location
   - Phone: Contact number
   - Manager: Assigned branch manager
   ```

#### Branch Operations
- **Member Assignment**: Members automatically assigned to branch
- **Staff Management**: Manage branch-specific staff accounts
- **Performance Tracking**: Monitor branch-level metrics
- **Reporting**: Generate branch-specific reports

### Staff Account Management

#### Creating Staff Accounts
1. **Navigate to Staff Section**
2. **Click "Add Staff Member"**
3. **Enter Staff Details**:
   ```
   Staff Information:
   - Full Name: Legal name of staff member
   - Email: Official email address
   - Phone: Contact number
   - Username: Unique login username
   - Role: Admin, Manager, or Collector
   - Branch: Assigned branch
   ```

4. **Set Initial Password**:
   - Temporary password provided
   - Staff must change on first login
   - Password complexity requirements apply

#### Staff Roles and Permissions

**Administrator**:
- Full system access
- User account management
- System configuration
- All transaction permissions

**Branch Manager**:
- Branch-level administration
- Staff supervision
- Transaction approvals
- Branch reporting

**Collector**:
- Transaction recording
- Member management
- Basic reporting
- Limited administrative functions

#### Managing Staff Performance
1. **Performance Metrics**:
   - Transaction volume
   - Member acquisition
   - Error rates
   - Customer satisfaction

2. **Activity Monitoring**:
   - Login tracking
   - Transaction audit trail
   - System usage patterns
   - Compliance adherence

---

## Financial Reporting

### Daily Reports

#### End-of-Day Summary
1. **Generate Daily Report**:
   - Go to Analytics → Daily Reports
   - Select current date
   - Click "Generate Report"

2. **Report Contents**:
   - Total collections
   - Number of transactions
   - New members registered
   - Withdrawals processed
   - Cash on hand

3. **Review and Verify**:
   - Cross-check with physical cash
   - Verify bank deposits
   - Identify discrepancies
   - Document findings

#### Cash Reconciliation Report
```
Daily Cash Reconciliation:
- Opening Balance: ₦0.00
- Total Collections: ₦45,500.00
- Total Withdrawals: ₦12,000.00
- Bank Deposits: ₦30,000.00
- Closing Balance: ₦3,500.00
```

### Weekly Reports

#### Weekly Performance Summary
1. **Access Weekly Analytics**
2. **Key Metrics**:
   - Weekly collection totals
   - Member growth
   - Plan performance
   - Staff productivity

3. **Trend Analysis**:
   - Compare with previous weeks
   - Identify growth patterns
   - Spot potential issues

### Monthly Reports

#### Comprehensive Monthly Report
1. **Financial Summary**:
   - Total savings collected
   - Interest paid out
   - Operational expenses
   - Net profit/loss

2. **Member Analytics**:
   - New member acquisition
   - Member retention rates
   - Average savings per member
   - Demographic breakdown

3. **Plan Performance**:
   - Plans created vs. completed
   - Average plan duration
   - Success rates by plan type
   - Profitability analysis

### Custom Reports

#### Creating Custom Reports
1. **Navigate to Analytics → Custom Reports**
2. **Select Report Type**:
   - Member reports
   - Transaction reports
   - Plan performance reports
   - Staff performance reports

3. **Configure Filters**:
   - Date ranges
   - Member categories
   - Transaction types
   - Branch locations

4. **Generate and Export**:
   - View online
   - Export to Excel
   - Export to PDF
   - Schedule recurring reports

---

## Daily Operations Workflow

### Morning Routine (First 30 Minutes)

#### System Check
1. **Login and Dashboard Review**
   - Check system status
   - Review overnight transactions
   - Address any alerts or errors

2. **Cash Reconciliation**
   - Count opening cash balance
   - Verify bank deposits from previous day
   - Check for any pending transactions

3. **Staff Briefing**
   - Review daily targets
   - Assign tasks and responsibilities
   - Address any issues from previous day

### Mid-Day Operations

#### Transaction Processing
1. **Member Services**
   - Process new member registrations
   - Handle member inquiries
   - Process withdrawal requests
   - Update member information

2. **Transaction Recording**
   - Record all cash collections
   - Process bank transfers
   - Update savings plans
   - Generate receipts

3. **Quality Control**
   - Review transaction accuracy
   - Verify member balances
   - Check for duplicate entries
   - Address any discrepancies

### End-of-Day Procedures (Last 60 Minutes)

#### Daily Closing
1. **Transaction Finalization**
   - Process all pending transactions
   - Complete any pending withdrawals
   - Update plan progress
   - Generate daily reports

2. **Cash Management**
   - Count all cash on hand
   - Prepare bank deposits
   - Secure remaining cash
   - Document cash movements

3. **System Backup**
   - Export daily data
   - Save transaction records
   - Backup member information
   - Archive reports

4. **Security Procedures**
   - Log out of all systems
   - Secure physical documents
   - Lock cash storage
   - Set alarms if applicable

### Weekly Tasks

#### Monday: Planning and Review
- Review previous week performance
- Set weekly targets
- Plan staff schedules
- Address any outstanding issues

#### Wednesday: Mid-Week Check
- Progress review against targets
- Staff performance evaluation
- Member feedback collection
- System maintenance checks

#### Friday: Weekly Closing
- Complete weekly reports
- Process weekly payouts
- Staff performance review
- Plan for following week

---

## Troubleshooting Common Issues

### Login and Access Issues

#### Cannot Login to System
**Symptoms**: Invalid credentials, system unavailable
**Solutions**:
1. Verify username and password
2. Check internet connection
3. Clear browser cache and cookies
4. Try different browser
5. Contact system administrator

#### Session Timeout Issues
**Symptoms**: Frequent logouts, lost work
**Solutions**:
1. Save work frequently
2. Check session timeout settings
3. Ensure stable internet connection
4. Avoid multiple browser tabs

### Transaction Issues

#### Transaction Not Saving
**Symptoms**: Error messages, lost transactions
**Solutions**:
1. Check all required fields are filled
2. Verify member selection
3. Check internet connection
4. Refresh page and try again
5. Contact support if persistent

#### Incorrect Balance Display
**Symptoms**: Wrong member balance, calculation errors
**Solutions**:
1. Refresh the page
2. Check transaction history
3. Verify recent transactions
4. Run balance recalculation
5. Report to administrator

### Member Management Issues

#### Cannot Find Member
**Symptoms**: Member not appearing in search
**Solutions**:
1. Check spelling of member name
2. Try different search criteria
3. Verify member status (active/inactive)
4. Check member ID or wallet number
5. Browse member list if needed

#### Duplicate Member Records
**Symptoms**: Same member appearing multiple times
**Solutions**:
1. Verify if actually different people
2. Check member details carefully
3. Merge records if confirmed duplicate
4. Delete incorrect record
5. Update all related transactions

### System Performance Issues

#### Slow System Response
**Symptoms**: Pages loading slowly, timeouts
**Solutions**:
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try during off-peak hours
5. Report performance issues

#### Data Not Updating
**Symptoms**: Old data showing, no recent updates
**Solutions**:
1. Refresh the page
2. Check last sync time
3. Verify data was actually saved
4. Try logging out and back in
5. Contact support if issue persists

### Emergency Procedures

#### System Down
1. **Switch to Manual Processes**
   - Use paper transaction forms
   - Record all transactions manually
   - Maintain member service

2. **Document Everything**
   - Keep detailed records
   - Note system downtime
   - Document manual processes

3. **Communicate**
   - Inform members of system issues
   - Provide alternative service methods
   - Set expectations for resolution

#### Data Loss Concerns
1. **Stop All Operations**
   - Halt new transactions
   - Preserve current data
   - Contact technical support

2. **Verify Backups**
   - Check last backup time
   - Verify backup integrity
   - Plan for data restoration

3. **Member Communication**
   - Inform members of situation
   - Explain data protection measures
   - Provide timeline for resolution

---

## Best Practices

### Data Management

#### Regular Data Backup
- **Daily**: Export transaction data
- **Weekly**: Full system backup
- **Monthly**: Archive historical data
- **Store backups** in secure, multiple locations

#### Data Quality Assurance
1. **Double-Check Entries**: Verify all data before saving
2. **Regular Audits**: Weekly review of transactions
3. **Error Tracking**: Log and monitor error patterns
4. **Continuous Training**: Regular staff training updates

### Customer Service Excellence

#### Member Communication
1. **Professional Conduct**: Maintain professional demeanor
2. **Clear Explanations**: Explain processes clearly
3. **Timely Responses**: Address inquiries promptly
4. **Problem Resolution**: Handle issues efficiently

#### Privacy and Confidentiality
1. **Data Protection**: Protect member information
2. **Secure Conversations**: Private discussions only
3. **Document Security**: Secure physical and digital documents
4. **Access Control**: Limit access to sensitive information

### Financial Integrity

#### Transaction Accuracy
1. **Verify Amounts**: Double-check all figures
2. **Receipt Generation**: Provide receipts for all transactions
3. **Regular Reconciliation**: Daily cash and system reconciliation
4. **Audit Trail**: Maintain complete transaction history

#### Fraud Prevention
1. **Identity Verification**: Verify member identity
2. **Transaction Limits**: Set appropriate transaction limits
3. **Regular Audits**: Periodic internal and external audits
4. **Staff Training**: Regular fraud awareness training

### Operational Efficiency

#### Time Management
1. **Prioritize Tasks**: Handle urgent items first
2. **Batch Processing**: Group similar tasks together
3. **Standard Procedures**: Follow established workflows
4. **Continuous Improvement**: Regularly review and improve processes

#### Technology Utilization
1. **System Features**: Use all available system features
2. **Automation**: Automate repetitive tasks
3. **Integration**: Utilize system integrations
4. **Training**: Regular training on new features

### Compliance and Regulation

#### Regulatory Compliance
1. **Know Your Customer**: Verify member identities
2. **Anti-Money Laundering**: Monitor for suspicious activities
3. **Reporting Requirements**: File required regulatory reports
4. **Record Keeping**: Maintain required records

#### Internal Controls
1. **Segregation of Duties**: Separate key responsibilities
2. **Approval Processes**: Implement proper approval workflows
3. **Access Controls**: Limit system access based on roles
4. **Monitoring**: Regular monitoring of all activities

---

## Quick Reference Guide

### Common Keyboard Shortcuts
- **Ctrl + S**: Save current form
- **Ctrl + P**: Print current page
- **F5**: Refresh page
- **Esc**: Close modal/dialog

### Important Phone Numbers
- **System Administrator**: [Admin Phone]
- **Technical Support**: [Support Phone]
- **Bank Contact**: [Bank Phone]
- **Emergency Contact**: [Emergency Phone]

### Daily Checklist
- [ ] Login and check dashboard
- [ ] Process new member registrations
- [ ] Record all transactions
- [ ] Handle withdrawal requests
- [ ] Update savings plans
- [ ] Generate daily reports
- [ ] Reconcile cash
- [ ] Backup data
- [ ] Log out securely

### Weekly Checklist
- [ ] Generate weekly reports
- [ ] Review staff performance
- [ ] Analyze plan performance
- [ ] Conduct system maintenance
- [ ] Update member communications
- [ ] Review compliance requirements

### Monthly Checklist
- [ ] Generate monthly financial reports
- [ ] Conduct full system audit
- [ ] Review and update procedures
- [ ] Staff performance reviews
- [ ] Member satisfaction survey
- [ ] System backup verification

---

*Admin Manual Version: 1.0*  
*Last Updated: January 2024*  
*Next Review Date: April 2024*

For technical support or system issues, contact the system administrator immediately.
