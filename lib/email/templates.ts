/**
 * Email Templates for Property Submissions
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

interface SubmissionEmailData {
  ownerName: string;
  ownerEmail: string;
  propertyTitle: string;
  trackingUrl: string;
  reviewNotes?: string | null;
  livePropertyUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const companyName = "Real Estate Pulse";

// Shared email styles
const styles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  `,
  header: `
    background: linear-gradient(135deg, #004aac 0%, #003380 100%);
    padding: 32px;
    text-align: center;
  `,
  headerText: `
    color: white;
    font-size: 28px;
    font-weight: bold;
    margin: 0;
  `,
  body: `
    padding: 32px;
  `,
  title: `
    font-size: 24px;
    color: #1e293b;
    margin: 0 0 16px 0;
  `,
  text: `
    font-size: 16px;
    color: #475569;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,
  highlight: `
    background-color: #eff6ff;
    border-left: 4px solid #004aac;
    padding: 16px;
    margin: 24px 0;
  `,
  button: `
    display: inline-block;
    background: #004aac;
    color: white;
    padding: 14px 28px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
  `,
  buttonWrapper: `
    text-align: center;
    margin: 32px 0;
  `,
  footer: `
    background-color: #f8fafc;
    padding: 24px 32px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
  `,
  footerText: `
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  `,
  notes: `
    background-color: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    padding: 16px;
    margin: 24px 0;
  `,
  notesTitle: `
    font-weight: 600;
    color: #92400e;
    margin: 0 0 8px 0;
  `,
  notesText: `
    color: #a16207;
    margin: 0;
  `,
};

// Template: Submission Received (sent when customer submits)
export function submissionReceivedTemplate(data: SubmissionEmailData): { subject: string; html: string } {
  const subject = `✅ Submission Received - ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName}</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Thank You, ${data.ownerName}!</h2>
          <p style="${styles.text}">
            We have received your property submission for <strong>"${data.propertyTitle}"</strong>. 
            Our team will review your submission within <strong>24 hours</strong>.
          </p>
          
          <div style="${styles.highlight}">
            <p style="${styles.text}; margin: 0;">
              <strong>What happens next?</strong><br>
              1. We review your property details<br>
              2. Once approved, you can upload photos<br>
              3. After final review, your property goes live!
            </p>
          </div>
          
          <p style="${styles.text}">
            Track the status of your submission anytime using the button below:
          </p>
          
          <div style="${styles.buttonWrapper}">
            <a href="${data.trackingUrl}" style="${styles.button}">Track My Submission</a>
          </div>
          
          <p style="${styles.text}">
            <strong>Bookmark this link:</strong><br>
            <a href="${data.trackingUrl}">${data.trackingUrl}</a>
          </p>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            Questions? Reply to this email or contact us at info@realestatepulse.com
          </p>
          <p style="${styles.footerText}">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: Submission Approved (customer can now upload images)
export function submissionApprovedTemplate(data: SubmissionEmailData): { subject: string; html: string } {
  const subject = `🎉 Good News! Your Property Has Been Approved - ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName}</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Great News, ${data.ownerName}! 🎉</h2>
          <p style="${styles.text}">
            Your property <strong>"${data.propertyTitle}"</strong> has been approved by our team!
          </p>
          
          ${data.reviewNotes ? `
            <div style="${styles.notes}">
              <p style="${styles.notesTitle}">📝 Notes from our team:</p>
              <p style="${styles.notesText}">${data.reviewNotes}</p>
            </div>
          ` : ''}
          
          <div style="${styles.highlight}">
            <p style="${styles.text}; margin: 0;">
              <strong>Next Step: Upload Your Property Photos</strong><br><br>
              High-quality photos are essential to attract potential buyers. 
              We recommend uploading at least 5 images including exterior, interior, 
              bedrooms, bathrooms, and any special features.
            </p>
          </div>
          
          <div style="${styles.buttonWrapper}">
            <a href="${data.trackingUrl}" style="${styles.button}">Upload Photos Now</a>
          </div>
          
          <p style="${styles.text}">
            Once you upload your photos, we'll review them and your property will go live!
          </p>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            Need help with photos? We offer professional photography services!
          </p>
          <p style="${styles.footerText}">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: Information Requested
export function infoRequestedTemplate(data: SubmissionEmailData): { subject: string; html: string } {
  const subject = `📋 Action Required - More Information Needed for ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName}</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Hi ${data.ownerName},</h2>
          <p style="${styles.text}">
            We're reviewing your property submission for <strong>"${data.propertyTitle}"</strong> 
            and need some additional information before we can proceed.
          </p>
          
          <div style="${styles.notes}">
            <p style="${styles.notesTitle}">📝 Information Requested:</p>
            <p style="${styles.notesText}">${data.reviewNotes || 'Please contact us for more details.'}</p>
          </div>
          
          <p style="${styles.text}">
            Please reply to this email with the requested information, or update your submission:
          </p>
          
          <div style="${styles.buttonWrapper}">
            <a href="${data.trackingUrl}" style="${styles.button}">View My Submission</a>
          </div>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            Questions? Reply directly to this email.
          </p>
          <p style="${styles.footerText}">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: Submission Rejected
export function submissionRejectedTemplate(data: SubmissionEmailData): { subject: string; html: string } {
  const subject = `Update on Your Property Submission - ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName}</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Hi ${data.ownerName},</h2>
          <p style="${styles.text}">
            Thank you for your interest in listing your property with us. After careful review, 
            we're unfortunately unable to proceed with your submission for 
            <strong>"${data.propertyTitle}"</strong> at this time.
          </p>
          
          ${data.reviewNotes ? `
            <div style="${styles.notes}">
              <p style="${styles.notesTitle}">📝 Reason:</p>
              <p style="${styles.notesText}">${data.reviewNotes}</p>
            </div>
          ` : ''}
          
          <p style="${styles.text}">
            If you believe this decision was made in error or if your circumstances have changed, 
            please don't hesitate to submit a new listing or contact us directly.
          </p>
          
          <div style="${styles.buttonWrapper}">
            <a href="${baseUrl}/list-your-property" style="${styles.button}">Submit New Listing</a>
          </div>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            We appreciate your understanding.
          </p>
          <p style="${styles.footerText}">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: Property Published
export function propertyPublishedTemplate(data: SubmissionEmailData): { subject: string; html: string } {
  const subject = `🏠 Congratulations! Your Property is Now Live - ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName}</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Congratulations, ${data.ownerName}! 🎊</h2>
          <p style="${styles.text}">
            Your property <strong>"${data.propertyTitle}"</strong> is now live on our website 
            and visible to thousands of potential buyers!
          </p>
          
          <div style="${styles.highlight}">
            <p style="${styles.text}; margin: 0;">
              <strong>Your property is now being marketed to:</strong><br>
              ✅ International buyers from Europe, USA, Australia & Asia<br>
              ✅ Our extensive network of real estate investors<br>
              ✅ Premium property portal listings
            </p>
          </div>
          
          <div style="${styles.buttonWrapper}">
            <a href="${data.livePropertyUrl || data.trackingUrl}" style="${styles.button}">View Your Live Listing</a>
          </div>
          
          <p style="${styles.text}">
            <strong>What's next?</strong><br>
            Our team will reach out to you directly when we have interested buyers. 
            Make sure your phone is ready for inquiries!
          </p>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            Thank you for choosing ${companyName}!
          </p>
          <p style="${styles.footerText}">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: Images Uploaded (notification to admin - optional)
export function imagesUploadedAdminTemplate(data: SubmissionEmailData & { adminEmail: string }): { subject: string; html: string } {
  const subject = `📸 New Images Uploaded - ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName} Admin</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">New Images Uploaded</h2>
          <p style="${styles.text}">
            <strong>${data.ownerName}</strong> has uploaded images for their property 
            <strong>"${data.propertyTitle}"</strong>.
          </p>
          
          <p style="${styles.text}">
            Please review the images and publish the listing if everything looks good.
          </p>
          
          <div style="${styles.buttonWrapper}">
            <a href="${baseUrl}/dashboard/submissions" style="${styles.button}">Review in Dashboard</a>
          </div>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            This is an automated admin notification.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: New Submission Admin Notification
export function newSubmissionAdminTemplate(data: SubmissionEmailData & { 
  adminEmail: string;
  propertyCategory: string;
  propertyType: string;
  location: string;
  askingPrice: string;
  exclusiveRights: boolean;
}): { subject: string; html: string } {
  const subject = `🏠 New Property Submission - ${data.propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName} Admin</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">New Property Submission!</h2>
          <p style="${styles.text}">
            A new property has been submitted and is waiting for your review.
          </p>
          
          <div style="${styles.highlight}">
            <p style="margin: 0 0 8px 0;"><strong>Property:</strong> ${data.propertyTitle}</p>
            <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${data.propertyCategory} - ${data.propertyType === 'FOR_SALE' ? 'For Sale' : 'For Rent'}</p>
            <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${data.location}</p>
            <p style="margin: 0 0 8px 0;"><strong>Price:</strong> ฿${data.askingPrice}</p>
            <p style="margin: 0;"><strong>Package:</strong> ${data.exclusiveRights ? '⭐ Exclusive Partnership' : 'Standard'}</p>
          </div>
          
          <p style="${styles.text}">
            <strong>Owner Details:</strong><br>
            Name: ${data.ownerName}<br>
            Email: ${data.ownerEmail}
          </p>
          
          <div style="${styles.buttonWrapper}">
            <a href="${baseUrl}/dashboard/submissions" style="${styles.button}">Review Submission</a>
          </div>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            This is an automated admin notification.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// ========================================
// OFFER TEMPLATES
// ========================================

interface OfferEmailData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  propertyTitle: string;
  propertySlug: string;
  propertyPrice: string;
  offerAmount: string;
  message?: string;
  language?: string;
}

// Template: Offer Confirmation (sent to buyer)
export function offerConfirmationTemplate(data: OfferEmailData): { subject: string; html: string } {
  const subject = `✅ Your offer has been received - ${data.propertyTitle}`;
  const propertyUrl = `${baseUrl}/properties/${data.propertySlug}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <h1 style="${styles.headerText}">${companyName}</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Thank You, ${data.buyerName}! 🎉</h2>
          <p style="${styles.text}">
            We have received your offer for <strong>"${data.propertyTitle}"</strong>.
            Our team will review your offer and get back to you within <strong>24 hours</strong>.
          </p>
          
          <div style="${styles.highlight}">
            <p style="${styles.text}; margin: 0;">
              <strong>Your Offer Details:</strong><br><br>
              💰 <strong>Offer Amount:</strong> ฿${data.offerAmount}<br>
              🏠 <strong>Property:</strong> ${data.propertyTitle}<br>
              📍 <strong>Asking Price:</strong> ฿${data.propertyPrice}
            </p>
          </div>
          
          <p style="${styles.text}">
            <strong>What happens next?</strong><br>
            1. Our team reviews your offer<br>
            2. We present your offer to the property owner<br>
            3. We negotiate on your behalf if needed<br>
            4. You receive a response within 24-48 hours
          </p>
          
          <div style="${styles.buttonWrapper}">
            <a href="${propertyUrl}" style="${styles.button}">View Property</a>
          </div>
          
          <p style="${styles.text}">
            If you have any questions, feel free to reply to this email or call us directly.
          </p>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            Questions? Reply to this email or contact us at info@realestatepulse.com
          </p>
          <p style="${styles.footerText}">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

// Template: Offer Admin Notification (sent to admin)
export function offerAdminNotificationTemplate(data: OfferEmailData): { subject: string; html: string } {
  const subject = `💰 New Offer Received - ฿${data.offerAmount} for ${data.propertyTitle}`;
  const dashboardUrl = `${baseUrl}/dashboard/viewing-requests`;
  const propertyUrl = `${baseUrl}/properties/${data.propertySlug}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div style="${styles.container}">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
          <h1 style="${styles.headerText}">💰 New Offer Received!</h1>
        </div>
        <div style="${styles.body}">
          <h2 style="${styles.title}">Offer Details</h2>
          
          <div style="${styles.highlight}">
            <p style="margin: 0 0 8px 0;"><strong>Offer Amount:</strong> <span style="color: #059669; font-size: 24px; font-weight: bold;">฿${data.offerAmount}</span></p>
            <p style="margin: 0 0 8px 0;"><strong>Asking Price:</strong> ฿${data.propertyPrice}</p>
            <p style="margin: 0;"><strong>Property:</strong> <a href="${propertyUrl}">${data.propertyTitle}</a></p>
          </div>
          
          <h3 style="font-size: 18px; color: #1e293b; margin: 24px 0 12px 0;">Buyer Information</h3>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px;">
            <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${data.buyerName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${data.buyerEmail}">${data.buyerEmail}</a></p>
            <p style="margin: 0 0 8px 0;"><strong>Phone:</strong> <a href="tel:${data.buyerPhone}">${data.buyerPhone}</a></p>
            ${data.language ? `<p style="margin: 0;"><strong>Preferred Language:</strong> ${data.language}</p>` : ''}
          </div>
          
          ${data.message ? `
            <h3 style="font-size: 18px; color: #1e293b; margin: 24px 0 12px 0;">Message from Buyer</h3>
            <div style="${styles.notes}">
              <p style="${styles.notesText}">${data.message}</p>
            </div>
          ` : ''}
          
          <div style="${styles.buttonWrapper}">
            <a href="${dashboardUrl}" style="${styles.button}">View in Dashboard</a>
          </div>
          
          <p style="${styles.text}">
            <strong>Quick Actions:</strong><br>
            📧 <a href="mailto:${data.buyerEmail}?subject=Re: Your Offer for ${data.propertyTitle}">Reply to Buyer</a><br>
            📞 <a href="tel:${data.buyerPhone}">Call Buyer</a>
          </p>
        </div>
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            This is an automated admin notification from ${companyName}.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

