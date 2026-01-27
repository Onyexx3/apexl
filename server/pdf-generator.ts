import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

interface PlanSummaryData {
  member: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  planType: 'savings' | 'investment';
  planData: any;
  createdAt: Date;
}

export async function generatePlanSummaryPDF(data: PlanSummaryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', reject);

    try {
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('APEXL INVESTMENT', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('Plan Summary Document', { align: 'center' });
      doc.moveDown();

      // Document info
      doc.fontSize(10).font('Helvetica').text(`Generated: ${format(new Date(), 'PPP')}`, { align: 'center' });
      doc.text(`Document ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, { align: 'center' });
      doc.moveDown();

      // Separator line
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Member Information Section
      doc.fontSize(16).font('Helvetica-Bold').text('MEMBER INFORMATION');
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica');
      doc.text(`Name: ${data.member.name}`);
      if (data.member.email) doc.text(`Email: ${data.member.email}`);
      if (data.member.phone) doc.text(`Phone: ${data.member.phone}`);
      if (data.member.address) doc.text(`Address: ${data.member.address}`);
      doc.moveDown();

      // Plan Details Section
      doc.fontSize(16).font('Helvetica-Bold').text('PLAN DETAILS');
      doc.moveDown(0.5);

      if (data.planType === 'savings') {
        // Savings Plan Details
        doc.fontSize(12).font('Helvetica-Bold').text('Plan Type: Savings Plan');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Plan Name: ${data.planData.planName}`);
        doc.text(`Category: ${data.planData.planType?.category || 'N/A'}`);
        doc.text(`Target Amount: ₦${parseFloat(data.planData.targetAmount).toLocaleString()}`);
        doc.text(`Contribution Amount: ₦${parseFloat(data.planData.contributionAmount).toLocaleString()}`);
        doc.text(`Maximum Contributions: ${data.planData.maxContributions}`);
        doc.text(`Interest Rate: ${data.planData.interestRate}%`);
        doc.text(`Break Fee: ${data.planData.breakFee}%`);
        doc.text(`Early Withdrawal Penalty: ${data.planData.earlyWithdrawalPenalty}%`);
        doc.text(`Profit Calculation: ${data.planData.profitCalculationType}`);
        
        // Dates
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Important Dates:');
        doc.font('Helvetica');
        doc.text(`Start Date: ${format(new Date(data.planData.startDate), 'PPP')}`);
        doc.text(`Maturity Date: ${format(new Date(data.planData.maturityDate), 'PPP')}`);
        doc.text(`Can Break After: ${data.planData.canBreakAfterDays} days`);

        // Calculate expected returns
        const totalContributions = parseFloat(data.planData.contributionAmount) * data.planData.maxContributions;
        const expectedInterest = totalContributions * (parseFloat(data.planData.interestRate) / 100);
        const expectedTotal = totalContributions + expectedInterest;

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Projected Returns:');
        doc.font('Helvetica');
        doc.text(`Total Contributions: ₦${totalContributions.toLocaleString()}`);
        doc.text(`Expected Interest: ₦${expectedInterest.toLocaleString()}`);
        doc.text(`Expected Total at Maturity: ₦${expectedTotal.toLocaleString()}`);

      } else {
        // Investment Plan Details
        doc.fontSize(12).font('Helvetica-Bold').text('Plan Type: Investment Plan');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Investment Type: ${data.planData.investmentType?.name || 'N/A'}`);
        doc.text(`Category: ${data.planData.investmentType?.category || 'N/A'}`);
        doc.text(`Investment Amount: ₦${parseFloat(data.planData.amount).toLocaleString()}`);
        doc.text(`Interest Rate: ${data.planData.interestRate}%`);
        doc.text(`Payment Plan: ${data.planData.investmentType?.paymentPlan || 'N/A'}`);
        
        // Dates
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Important Dates:');
        doc.font('Helvetica');
        doc.text(`Start Date: ${format(new Date(data.planData.startDate), 'PPP')}`);
        
        if (data.planData.investmentType?.durationDays) {
          const maturityDate = new Date(data.planData.startDate);
          maturityDate.setDate(maturityDate.getDate() + data.planData.investmentType.durationDays);
          doc.text(`Maturity Date: ${format(maturityDate, 'PPP')}`);
          doc.text(`Duration: ${data.planData.investmentType.durationDays} days`);
        }

        // Calculate expected returns
        const investmentAmount = parseFloat(data.planData.amount);
        const expectedReturn = investmentAmount * (parseFloat(data.planData.interestRate) / 100);
        const totalExpected = investmentAmount + expectedReturn;

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Projected Returns:');
        doc.font('Helvetica');
        doc.text(`Principal Amount: ₦${investmentAmount.toLocaleString()}`);
        doc.text(`Expected Return: ₦${expectedReturn.toLocaleString()}`);
        doc.text(`Expected Total at Maturity: ₦${totalExpected.toLocaleString()}`);

        if (data.planData.investmentType?.breakFee && parseFloat(data.planData.investmentType.breakFee) > 0) {
          doc.text(`Break Fee: ${data.planData.investmentType.breakFee}%`);
          doc.text(`Is Breakable: ${data.planData.investmentType?.isBreakable ? 'Yes' : 'No'}`);
        }
      }

      // Terms and Conditions
      doc.moveDown();
      doc.fontSize(16).font('Helvetica-Bold').text('TERMS AND CONDITIONS');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      const terms = [
        '1. This plan summary is a formal record of the savings/investment agreement.',
        '2. All interest rates and returns are projections and may be subject to market conditions.',
        '3. Early withdrawal may incur penalties as specified in the plan details.',
        '4. The plan is governed by the terms and conditions of ApexL Investment.',
        '5. For any queries or concerns, please contact your relationship manager.',
        '6. This document should be kept safe for future reference.'
      ];

      terms.forEach(term => {
        doc.text(term, { align: 'justify' });
      });

      // Footer
      doc.moveDown(2);
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(10).font('Helvetica-Bold').text('APEXL INVESTMENT', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text('Your Trusted Financial Partner', { align: 'center' });
      doc.text('Contact: support@apexlinvestment.com | Phone: +234 800 000 0000', { align: 'center' });

      // Signature section
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica');
      doc.text('_________________________', { align: 'left' });
      doc.text('Member Signature', { align: 'left' });
      
      doc.text('_________________________', { align: 'right' });
      doc.text('Authorized Signatory', { align: 'right' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

export async function generateMemberPlanSummary(
  memberData: any,
  planData: any,
  planType: 'savings' | 'investment'
): Promise<Buffer> {
  const summaryData: PlanSummaryData = {
    member: {
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      address: memberData.address,
    },
    planType,
    planData,
    createdAt: new Date(),
  };

  return generatePlanSummaryPDF(summaryData);
}
