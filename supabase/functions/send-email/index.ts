import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "HDI Connect <info@hdi-tech.com>";
const SITE_URL = Deno.env.get("SITE_URL") || "https://intel-med-flow.lovable.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Helper: resolve user_id (UUID) to email address
async function resolveEmail(to: string): Promise<string | null> {
  // If it looks like an email, return as-is
  if (to.includes("@")) return to;
  // Otherwise treat as user_id and lookup via admin API
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await supabase.auth.admin.getUserById(to);
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

const templates: Record<string, (data: any) => { subject: string; html: string }> = {

  // 1. Registration welcome / verify
  "welcome": (d) => ({
    subject: "Welcome to HDI Connect — Verify Your Email",
    html: layout(`
      <h1 style="${h1Style}">Welcome to HDI Connect</h1>
      <p style="${textStyle}">Hi ${d.name || "there"},</p>
      <p style="${textStyle}">Thank you for creating your HDI Connect account. Please verify your email address to get started.</p>
      <p style="${textStyle}">Once verified, you'll get a <strong>free trial case</strong> on every service category.</p>
      <a href="${SITE_URL}/login" style="${btnStyle}">Go to HDI Connect</a>
      <p style="${footerStyle}">If you didn't create this account, you can safely ignore this email.</p>
    `),
  }),

  // 2. Case submitted
  "case-submitted": (d) => ({
    subject: `Case ${d.caseRef} Submitted Successfully`,
    html: layout(`
      <h1 style="${h1Style}">Case Submitted</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Your case has been submitted successfully. Here's a summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Reference</td><td style="${tdVal}">${d.caseRef}</td></tr>
        <tr><td style="${tdLabel}">Service</td><td style="${tdVal}">${d.serviceCode} — ${d.serviceName}</td></tr>
        <tr><td style="${tdLabel}">Delivery</td><td style="${tdVal}">${d.deliveryType === "rush" ? "Rush (24h)" : "Standard (48h)"}</td></tr>
        <tr><td style="${tdLabel}">Files</td><td style="${tdVal}">${d.fileCount} file(s)</td></tr>
      </table>
      <p style="${textStyle}">Our team will review your case shortly.</p>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">View Case</a>
    `),
  }),

  // 3. Payment proof submitted (to admin)
  "payment-proof-admin": (d) => ({
    subject: `Payment Proof Submitted — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">Payment Proof Received</h1>
      <p style="${textStyle}">A client has submitted payment proof for verification.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Client</td><td style="${tdVal}">${d.clientName}</td></tr>
        <tr><td style="${tdLabel}">Case ID</td><td style="${tdVal}">${d.caseRef}</td></tr>
        <tr><td style="${tdLabel}">Amount</td><td style="${tdVal}">$${d.amount}</td></tr>
        ${d.reference ? `<tr><td style="${tdLabel}">Reference</td><td style="${tdVal}">${d.reference}</td></tr>` : ""}
      </table>
      <a href="${SITE_URL}/admin/cases/${d.caseId}" style="${btnStyle}">Review Payment</a>
    `),
  }),

  // 4. Payment approved
  "payment-approved": (d) => ({
    subject: `Payment Confirmed — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">Payment Confirmed</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Your payment for case <strong>${d.caseRef}</strong> has been verified and confirmed.</p>
      <p style="${textStyle}">Your case is now in the assignment queue and a specialist will begin work shortly.</p>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">View Case</a>
    `),
  }),

  // 5. Case assigned to designer
  "case-assigned": (d) => ({
    subject: `New Case Assigned — ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">New Case Assignment</h1>
      <p style="${textStyle}">Hi ${d.designerName || "Designer"},</p>
      <p style="${textStyle}">A new case has been assigned to you. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Case ID</td><td style="${tdVal}">${d.caseRef}</td></tr>
        <tr><td style="${tdLabel}">Service</td><td style="${tdVal}">${d.serviceCode} — ${d.serviceName}</td></tr>
        <tr><td style="${tdLabel}">Delivery</td><td style="${tdVal}">${d.deliveryType === "rush" ? "Rush (24h)" : "Standard (48h)"}</td></tr>
        <tr><td style="${tdLabel}">Patient Ref</td><td style="${tdVal}">${d.patientRef || "—"}</td></tr>
      </table>
      ${d.clinicalNotes ? `<div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;"><p style="font-size:12px;color:#64748b;margin:0 0 4px;">Clinical Notes</p><p style="font-size:14px;color:#1e293b;margin:0;white-space:pre-wrap;">${d.clinicalNotes}</p></div>` : ""}
      <a href="${SITE_URL}/designer/cases/${d.caseId}" style="${btnStyle}">Open Case</a>
    `),
  }),

  // 6. Design delivered
  "design-delivered": (d) => ({
    subject: `Your case is ready — ${d.serviceName || "HDI Connect"} | HDI Connect`,
    html: layout(`
      <h1 style="${h1Style}">Great news, ${d.clientName || "there"}! 🎉</h1>
      <p style="${textStyle}">Your case has been completed and your files are ready to download.</p>
      <p style="font-size:13px;color:#64748b;margin:18px 0 6px;font-family:Arial,sans-serif;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Case Details</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        <tr><td style="${tdLabel}">Service</td><td style="${tdVal}">${d.serviceName || "—"}</td></tr>
        <tr><td style="${tdLabel}">Case ID</td><td style="${tdVal}">${d.caseRef}</td></tr>
        <tr><td style="${tdLabel}">Completed</td><td style="${tdVal}">${d.completedAt || new Date().toLocaleDateString()}</td></tr>
        <tr><td style="${tdLabel}">Designer</td><td style="${tdVal}">${d.designerName || "Your specialist"}</td></tr>
      </table>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">View &amp; Download Your Files</a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
      <h2 style="font-size:16px;font-weight:600;color:#0d1b2e;margin:0 0 8px;font-family:Georgia,serif;">How was your experience?</h2>
      <p style="${textStyle}">We'd love to hear your thoughts. It only takes 30 seconds.</p>
      <a href="${SITE_URL}/feedback?case=${d.caseId}" style="display:inline-block;background:#f59e0b;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;margin:8px 0 16px;">⭐ Leave Feedback for This Case</a>
      <p style="${footerStyle}">Thank you for choosing HDI Connect. We look forward to working with you again.<br/><br/>The HDI Connect Team<br/>info@hdi-tech.com<br/>hdi-tech.com</p>
    `),
  }),

  // 7. New message from designer → notify client
  "new-message-client": (d) => ({
    subject: `New Message — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">New Message from Your Specialist</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">You have a new unread message on case <strong>${d.caseRef}</strong>.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="font-size:14px;color:#1e293b;margin:0;font-style:italic;">"${(d.preview || "").substring(0, 200)}${(d.preview || "").length > 200 ? "..." : ""}"</p>
      </div>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">View Message</a>
    `),
  }),

  // 8. New message from client → notify designer
  "new-message-designer": (d) => ({
    subject: `New Message — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">New Message from Client</h1>
      <p style="${textStyle}">Hi ${d.designerName || "Designer"},</p>
      <p style="${textStyle}">You have a new unread message on case <strong>${d.caseRef}</strong>.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="font-size:14px;color:#1e293b;margin:0;font-style:italic;">"${(d.preview || "").substring(0, 200)}${(d.preview || "").length > 200 ? "..." : ""}"</p>
      </div>
      <a href="${SITE_URL}/designer/cases/${d.caseId}" style="${btnStyle}">View Message</a>
    `),
  }),

  // 9. Consultation requested confirmation
  "consultation-requested": (d) => ({
    subject: `Consultation Request Received — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">Consultation Request Received</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">We've received your consultation request for case <strong>${d.caseRef}</strong>.</p>
      <p style="${textStyle}">Our team will review your case and respond with <strong>three available time slots</strong> as soon as possible via the case message thread.</p>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">View Case</a>
      <p style="${footerStyle}">You'll receive a notification when the time slots are shared.</p>
    `),
  }),

  // 10. Post-delivery feedback
  "feedback-request": (d) => ({
    subject: `How Was Your Experience? — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">We'd Love Your Feedback</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Your case <strong>${d.caseRef}</strong> was delivered recently. We'd love to hear about your experience.</p>
      <p style="${textStyle}">Please take a moment to rate:</p>
      <ul style="color:#334155;font-size:14px;line-height:1.8;">
        <li>Design quality</li>
        <li>Designer performance</li>
        <li>Overall experience</li>
      </ul>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}?feedback=true" style="${btnStyle}">Share Feedback</a>
      <p style="${footerStyle}">Your feedback helps us improve our services.</p>
    `),
  }),

  // 11. Consultation booking confirmation → to client
  "consultation-booking-confirm": (d) => ({
    subject: "Consultation Request Received — HDI Connect",
    html: layout(`
      <h1 style="${h1Style}">Consultation Request Received</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Thank you for submitting your consultation request. We received your details and our team will contact you within <strong>24 hours</strong> to schedule your consultation.</p>
      <p style="${textStyle}">In the meantime, feel free to explore our services or submit a case through your dashboard.</p>
      <a href="${SITE_URL}" style="${btnStyle}">Visit HDI Connect</a>
      <p style="${footerStyle}">If you didn't submit this request, you can safely ignore this email.</p>
    `),
  }),

  // 12. New consultation alert → to admin
  "consultation-new-alert": (d) => ({
    subject: `New Consultation Request — ${d.clientName}`,
    html: layout(`
      <h1 style="${h1Style}">New Consultation Request</h1>
      <p style="${textStyle}">A new consultation request has been submitted.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Client</td><td style="${tdVal}">${d.clientName}</td></tr>
        <tr><td style="${tdLabel}">Email</td><td style="${tdVal}">${d.email}</td></tr>
        <tr><td style="${tdLabel}">Country</td><td style="${tdVal}">${d.country}</td></tr>
        <tr><td style="${tdLabel}">Service</td><td style="${tdVal}">${d.service}</td></tr>
      </table>
      <a href="${SITE_URL}/admin/consultations" style="${btnStyle}">Review in Admin</a>
    `),
  }),

  // 13. Consultation assigned to designer
  "consultation-assigned": (d) => ({
    subject: "New Consultation Assigned to You — HDI Connect",
    html: layout(`
      <h1 style="${h1Style}">Consultation Assignment</h1>
      <p style="${textStyle}">Hi ${d.designerName || "Designer"},</p>
      <p style="${textStyle}">A consultation has been assigned to you.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Client</td><td style="${tdVal}">${d.clientName}</td></tr>
        <tr><td style="${tdLabel}">Service</td><td style="${tdVal}">${d.service || "General"}</td></tr>
      </table>
      <p style="${textStyle}">Please propose up to 3 available time slots through your designer dashboard.</p>
      <a href="${SITE_URL}/designer/consultations" style="${btnStyle}">Open Consultations</a>
    `),
  }),

  // 14. Meeting confirmed → to client
  "consultation-confirmed": (d) => ({
    subject: "Your Consultation is Confirmed — HDI Connect",
    html: layout(`
      <h1 style="${h1Style}">Consultation Confirmed</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Your consultation has been confirmed. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Date</td><td style="${tdVal}">${d.date}</td></tr>
        <tr><td style="${tdLabel}">Time</td><td style="${tdVal}">${d.time} (${d.timezone || "UTC+04:00"})</td></tr>
        <tr><td style="${tdLabel}">Specialist</td><td style="${tdVal}">${d.designerName}</td></tr>
      </table>
      <p style="${textStyle}">If you need to reschedule, you can do so from your dashboard.</p>
      <a href="${SITE_URL}/dashboard/consultations" style="${btnStyle}">View My Consultations</a>
      <p style="${footerStyle}">Need to reschedule? Click the link above and use the reschedule option.</p>
    `),
  }),

  // 15. Reschedule request → to admin
  "consultation-reschedule": (d) => ({
    subject: `Reschedule Request — ${d.clientName}`,
    html: layout(`
      <h1 style="${h1Style}">Reschedule Request</h1>
      <p style="${textStyle}">A client has requested to reschedule their consultation.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Client</td><td style="${tdVal}">${d.clientName}</td></tr>
        <tr><td style="${tdLabel}">Reason</td><td style="${tdVal}">${d.reason}</td></tr>
        ${d.preferredTime ? `<tr><td style="${tdLabel}">Preferred Time</td><td style="${tdVal}">${d.preferredTime}</td></tr>` : ""}
      </table>
      <a href="${SITE_URL}/admin/consultations" style="${btnStyle}">Handle in Admin</a>
    `),
  }),
  // 16. Additional data requested — to client
  "additional-data-requested": (d) => ({
    subject: `Additional Files Requested — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">Additional Files Requested</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Your specialist has requested additional files or information for case <strong>${d.caseRef}</strong>.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="font-size:12px;color:#64748b;margin:0 0 4px;">Designer's Message</p>
        <p style="font-size:14px;color:#1e293b;margin:0;white-space:pre-wrap;">${d.designerMessage || ""}</p>
      </div>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">Upload Files</a>
      <p style="${footerStyle}">Please respond as soon as possible to avoid delays.</p>
    `),
  }),

  // 17. Additional data approved — to client
  "additional-data-approved": (d) => ({
    subject: `Files Accepted — Case ${d.caseRef}`,
    html: layout(`
      <h1 style="${h1Style}">Files Reviewed & Accepted</h1>
      <p style="${textStyle}">Hi ${d.clientName || "there"},</p>
      <p style="${textStyle}">Your additional files for case <strong>${d.caseRef}</strong> have been reviewed and accepted by your specialist.</p>
      <p style="${textStyle}">Your case is now back in progress.</p>
      <a href="${SITE_URL}/dashboard/cases/${d.caseId}" style="${btnStyle}">View Case</a>
    `),
  }),

  // 18. Designer invitation
  "designer-invitation": (d) => ({
    subject: "You've been invited to join HDI Connect as a Designer",
    html: layout(`
      <h1 style="${h1Style}">You're Invited to HDI Connect</h1>
      <p style="${textStyle}">Hi ${d.name || "there"},</p>
      <p style="${textStyle}">You've been invited to join <strong>HDI Connect</strong> as a <strong>Designer</strong>.</p>
      <p style="${textStyle}">HDI Connect is a digital dental design platform where specialists like you create high-quality dental designs for clinics worldwide.</p>
      <p style="${textStyle}">Click below to complete your profile and get started:</p>
      <a href="${d.signupLink}" style="${btnStyle}">Complete Your Signup</a>
      <p style="${footerStyle}">This invitation link expires in 7 days.<br/>If you have questions, contact us at info@hdi-tech.com</p>
    `),
  }),

  // 20. HDI Align application — admin notification
  "hdi-align-application": (d) => ({
    subject: `New HDI Align Application — ${d.full_name}, ${d.clinic_name}`,
    html: layout(`
      <h1 style="${h1Style}">New HDI Align Application</h1>
      <p style="${textStyle}">A new HDI Align application has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Name</td><td style="${tdVal}">${d.full_name || "—"}</td></tr>
        <tr><td style="${tdLabel}">Clinic</td><td style="${tdVal}">${d.clinic_name || "—"}</td></tr>
        <tr><td style="${tdLabel}">Email</td><td style="${tdVal}">${d.email || "—"}</td></tr>
        <tr><td style="${tdLabel}">Phone</td><td style="${tdVal}">${d.phone || "—"}</td></tr>
        <tr><td style="${tdLabel}">Country</td><td style="${tdVal}">${d.country || "—"}</td></tr>
        <tr><td style="${tdLabel}">Monthly cases</td><td style="${tdVal}">${d.monthly_cases || "—"}</td></tr>
        <tr><td style="${tdLabel}">Notes</td><td style="${tdVal}">${d.notes || "—"}</td></tr>
        <tr><td style="${tdLabel}">Submitted</td><td style="${tdVal}">${d.created_at || new Date().toISOString()}</td></tr>
      </table>
      <a href="${SITE_URL}/admin/hdi-align" style="${btnStyle}">View in Admin</a>
    `),
  }),

  // 21. HDI OS enquiry — admin notification
  "hdi-os-enquiry": (d) => ({
    subject: `New HDI OS Enquiry — ${d.full_name || ""}, ${d.organisation_name || ""}`,
    html: layout(`
      <h1 style="${h1Style}">New HDI OS Enquiry</h1>
      <p style="${textStyle}">A new HDI OS enquiry has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Name</td><td style="${tdVal}">${d.full_name || "—"}</td></tr>
        <tr><td style="${tdLabel}">Organisation</td><td style="${tdVal}">${d.organisation_name || "—"}</td></tr>
        <tr><td style="${tdLabel}">Email</td><td style="${tdVal}">${d.email || "—"}</td></tr>
        <tr><td style="${tdLabel}">Phone</td><td style="${tdVal}">${d.phone || "—"}</td></tr>
        <tr><td style="${tdLabel}">Facility type</td><td style="${tdVal}">${d.facility_type || "—"}</td></tr>
        <tr><td style="${tdLabel}">Country</td><td style="${tdVal}">${d.country || "—"}</td></tr>
        <tr><td style="${tdLabel}">Challenge</td><td style="${tdVal}" >${(d.workflow_challenge || "—").toString().replace(/\n/g, "<br/>")}</td></tr>
        <tr><td style="${tdLabel}">Submitted</td><td style="${tdVal}">${d.created_at || new Date().toISOString()}</td></tr>
      </table>
      <a href="${SITE_URL}/admin" style="${btnStyle}">Open Admin</a>
    `),
  }),

  // 22. Contact form submission — admin notification
  "contact-form": (d) => ({
    subject: `New Contact Form Submission — ${d.full_name || ""}`,
    html: layout(`
      <h1 style="${h1Style}">New Contact Form Submission</h1>
      <p style="${textStyle}">A new message has been received via the website contact form.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Name</td><td style="${tdVal}">${d.full_name || "—"}</td></tr>
        <tr><td style="${tdLabel}">Email</td><td style="${tdVal}">${d.email || "—"}</td></tr>
        <tr><td style="${tdLabel}">Phone</td><td style="${tdVal}">${d.phone || "—"}</td></tr>
        <tr><td style="${tdLabel}">Subject</td><td style="${tdVal}">${d.subject || "—"}</td></tr>
        <tr><td style="${tdLabel}">Message</td><td style="${tdVal}">${(d.message || "—").toString().replace(/\n/g, "<br/>")}</td></tr>
        <tr><td style="${tdLabel}">Submitted</td><td style="${tdVal}">${d.created_at || new Date().toISOString()}</td></tr>
      </table>
    `),
  }),

  // 23. Generic admin notification
  "admin-notification": (d) => ({
    subject: d.subject || "HDI Admin Notification",
    html: layout(`
      <h1 style="${h1Style}">${d.subject || "Admin Notification"}</h1>
      <p style="${textStyle}">${(d.message || "").toString().replace(/\n/g, "<br/>")}</p>
    `),
  }),

  // 19. Designer welcome after signup
  "designer-welcome": (d) => ({
    subject: "Welcome to HDI Connect — Designer Account",
    html: layout(`
      <h1 style="${h1Style}">Welcome to the Team!</h1>
      <p style="${textStyle}">Hi ${d.name || "Designer"},</p>
      <p style="${textStyle}">Your designer account on HDI Connect has been created successfully.</p>
      <p style="${textStyle}">Once your email is verified, you can log in to your designer dashboard where you'll find assigned cases and tools to collaborate with the team.</p>
      <a href="${SITE_URL}/login" style="${btnStyle}">Go to Login</a>
      <p style="${footerStyle}">Questions? Reach us at info@hdi-tech.com</p>
    `),
  }),

  // 24. Feedback received — admin notification
  "feedback-admin": (d) => ({
    subject: d.is_low_rating
      ? `⚠️ Low Rating Alert — ${d.rating}★ from ${d.user_name || "User"}${d.related_case_ref ? ` on ${d.related_case_ref}` : ""}`
      : (d.related_case_ref && d.rating
          ? `New Case Feedback — ${d.rating}★ rating from ${d.user_name || "User"}`
          : `New ${d.feedback_type || "Feedback"} from ${d.user_name || "User"} — HDI Connect Feedback`),
    html: layout(`
      <h1 style="${h1Style}">${d.is_low_rating ? "⚠️ Low Rating Alert" : "💬 New Feedback Received"}</h1>
      ${d.is_low_rating ? `<p style="background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:8px;font-size:13px;font-family:Arial,sans-serif;margin:0 0 16px;"><strong>This client gave a low rating (${d.rating}★).</strong> Please review and follow up promptly.</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">From</td><td style="${tdVal}">${d.user_name || "—"}</td></tr>
        <tr><td style="${tdLabel}">Email</td><td style="${tdVal}">${d.user_email || "—"}</td></tr>
        <tr><td style="${tdLabel}">Role</td><td style="${tdVal}">${d.user_role || "—"}</td></tr>
        <tr><td style="${tdLabel}">Date</td><td style="${tdVal}">${d.created_at || new Date().toISOString()}</td></tr>
        <tr><td style="${tdLabel}">Type</td><td style="${tdVal}">${d.feedback_type || "—"}</td></tr>
        <tr><td style="${tdLabel}">Subject</td><td style="${tdVal}">${d.subject || "—"}</td></tr>
        ${d.rating ? `<tr><td style="${tdLabel}">Rating</td><td style="${tdVal}">${"⭐".repeat(d.rating)} (${d.rating}/5)</td></tr>` : ""}
        <tr><td style="${tdLabel}">Related Case</td><td style="${tdVal}">${d.related_case_ref || "None"}</td></tr>
        ${d.designer_name ? `<tr><td style="${tdLabel}">Designer</td><td style="${tdVal}">${d.designer_name}</td></tr>` : ""}
      </table>
      <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="font-size:12px;color:#64748b;margin:0 0 4px;">Message</p>
        <p style="font-size:14px;color:#1e293b;margin:0;white-space:pre-wrap;">${(d.message || "").toString().replace(/\n/g, "<br/>")}</p>
      </div>
      ${d.screenshot_url ? `<p style="${textStyle}"><strong>Screenshot:</strong> <a href="${d.screenshot_url}" style="color:#1d9e75;">View attached screenshot</a></p>` : ""}
      <a href="${SITE_URL}/admin/feedback/${d.feedback_id}" style="${btnStyle}">View in Admin Panel</a>
    `),
  }),

  // 25. Feedback received — confirmation to user
  "feedback-user-confirm": (d) => ({
    subject: "We received your feedback — HDI Connect",
    html: layout(`
      <h1 style="${h1Style}">Thanks for your feedback</h1>
      <p style="${textStyle}">Hi ${d.user_name || "there"},</p>
      <p style="${textStyle}">Thank you for taking the time to share your feedback with us.</p>
      <p style="${textStyle}"><strong>Your submission:</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="${tdLabel}">Type</td><td style="${tdVal}">${d.feedback_type || "—"}</td></tr>
        <tr><td style="${tdLabel}">Subject</td><td style="${tdVal}">${d.subject || "—"}</td></tr>
        <tr><td style="${tdLabel}">Submitted</td><td style="${tdVal}">${d.created_at || new Date().toISOString()}</td></tr>
      </table>
      <p style="${textStyle}">Our team reviews all feedback carefully and we may reach out to you if we have any follow-up questions.</p>
      <p style="${textStyle}">If you have any urgent issues, please contact us directly at <a href="mailto:info@hdi-tech.com" style="color:#1d9e75;">info@hdi-tech.com</a>.</p>
      <p style="${footerStyle}">The HDI Connect Team<br/>hdi-tech.com</p>
    `),
  }),
};

// ---- Styles ----
const h1Style = "font-size:22px;font-weight:700;color:#0d1b2e;margin:0 0 16px;font-family:Georgia,serif;";
const textStyle = "font-size:14px;color:#334155;line-height:1.6;margin:0 0 12px;font-family:Arial,sans-serif;";
const footerStyle = "font-size:12px;color:#94a3b8;margin:24px 0 0;font-family:Arial,sans-serif;";
const btnStyle = "display:inline-block;background:#1d9e75;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;margin:16px 0;";
const tdLabel = "padding:8px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;";
const tdVal = "padding:8px 12px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;";

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:#0d1b2e;padding:24px 32px;">
          <table><tr>
            <td><span style="font-family:'Fugaz One',cursive;font-size:20px;letter-spacing:0.08em;color:#f0f2f5;">H D I</span></td>
            <td style="padding-left:12px;"><span style="font-size:13px;color:#8fb5c9;font-family:Arial,sans-serif;">Connect</span></td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:11px;color:#94a3b8;margin:0;font-family:Arial,sans-serif;">
            © ${new Date().getFullYear()} HDI Connect. All rights reserved.<br/>
            <a href="${SITE_URL}" style="color:#1d9e75;text-decoration:none;">hdi-tech.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { template, to, data } = await req.json();

    if (!template || !to) {
      return new Response(JSON.stringify({ error: "template and to are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve user_id to email if needed
    const recipientEmail = await resolveEmail(to);
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Could not resolve recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If data has no clientName/designerName, try to fetch from profile
    const enrichedData = { ...data };
    if (!enrichedData.clientName && !enrichedData.designerName && !to.includes("@")) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", to).single();
        if (profile?.full_name) {
          enrichedData.clientName = profile.full_name;
          enrichedData.designerName = profile.full_name;
        }
      } catch {}
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = templateFn(enrichedData || {});

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: [recipientEmail], subject, html }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
