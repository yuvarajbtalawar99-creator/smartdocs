import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

Deno.serve(async (req: Request) => {
  console.log("Send-notification-email function invoked")
  try {
    const { type, email, name, code } = await req.json()
    console.log(`Sending ${type} email to ${email}`)

    let subject = ""
    let html = ""

    if (type === 'welcome') {
      subject = "Welcome to SmartDocs Hub!"
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #00BA88;">Welcome, ${name || 'User'}!</h1>
          <p>We're excited to help you manage your digital vault securely.</p>
          <p>Get started by uploading your first document or setting up your 6-digit PIN for extra security.</p>
          <br />
          <p>Best regards,<br />The SmartDocs Team</p>
        </div>
      `
    } else if (type === 'verification') {
      subject = `${code} is your SmartDocs security code`
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
          <h1 style="color: #00BA88;">Security Verification</h1>
          <p>You requested a change to your Vault PIN. Please use the 6-digit code below to confirm:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; color: #1a1a1a;">${code}</div>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email or contact support.</p>
          <br />
          <p>Best regards,<br />The SmartDocs Team</p>
        </div>
      `
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid email type provided" }),
        { status: 400 }
      )
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email address" }),
        { status: 400 }
      )
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SmartDocs Hub <onboarding@resend.dev>",
        to: email,
        subject,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error(err)
    }

    return new Response(
      JSON.stringify({ success: true, emailSent: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
})
