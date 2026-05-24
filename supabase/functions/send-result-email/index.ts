import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const {
      candidate_email,
      candidate_name,
      candidate_id,
      job_role,
      rounds,
      overall_result,
    } = await req.json();

    if (!candidate_email || !candidate_name || !candidate_id || !job_role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const resultColor =
      overall_result === "Pass" ?"#16a34a"
        : overall_result === "Fail" ?"#dc2626" :"#d97706";

    const roundRows = (rounds ?? [])
      .map(
        (r: any) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-size:13px;color:#374151;">Round ${r.round_number}: ${r.round_name}</td>
        <td style="padding:10px 12px;font-size:13px;color:#374151;text-align:center;">${r.marks_obtained} / ${r.total_marks}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:center;">
          <span style="padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:${
            r.status === "passed" ?"#dcfce7"
              : r.status === "failed" ?"#fee2e2" :"#f3f4f6"
          };color:${
          r.status === "passed" ?"#16a34a"
            : r.status === "failed" ?"#dc2626" :"#6b7280"
        };">
            ${
              r.status === "passed" ?"PASS"
                : r.status === "failed" ?"FAIL" :"PENDING"
            }
          </span>
        </td>
      </tr>`
      )
      .join("");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#1e293b;padding:24px 28px;">
      <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Exam Result Report</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">ExamPortal — Automated Notification</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">Dear <strong>${candidate_name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        Here is your exam result summary for the <strong>${job_role}</strong> role assessment.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;color:#64748b;">Candidate ID</span>
          <span style="font-size:12px;font-weight:600;color:#1e293b;font-family:monospace;">${candidate_id}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;color:#64748b;">Role Applied</span>
          <span style="font-size:12px;font-weight:600;color:#1e293b;">${job_role}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:12px;color:#64748b;">Overall Result</span>
          <span style="font-size:12px;font-weight:700;color:${resultColor};">${overall_result.toUpperCase()}</span>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px 12px;font-size:11px;font-weight:600;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Round</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:600;color:#64748b;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Score</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:600;color:#64748b;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Result</th>
          </tr>
        </thead>
        <tbody>${roundRows}</tbody>
      </table>
      <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
        Minimum passing score per round: <strong>30 marks</strong>. Candidates must pass each round to proceed to the next.
      </p>
      ${
        overall_result === "Pass"
          ? '<p style="margin:0;font-size:13px;color:#16a34a;font-weight:600;">🎉 Congratulations! You have successfully cleared all rounds.</p>'
          : overall_result === "Fail"
          ? '<p style="margin:0;font-size:13px;color:#dc2626;">We appreciate your effort. Unfortunately, you did not meet the minimum passing criteria for all rounds.</p>'
          : '<p style="margin:0;font-size:13px;color:#d97706;">Your assessment is still in progress. Further rounds are pending.</p>'
      }
    </div>
    <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated message from ExamPortal. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ExamPortal <onboarding@resend.dev>",
        to: [candidate_email],
        subject: `Your Exam Result — ${job_role} Role Assessment`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.json();
      return new Response(
        JSON.stringify({ error: "Email send failed", details: resendError }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const resendData = await resendRes.json();

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
