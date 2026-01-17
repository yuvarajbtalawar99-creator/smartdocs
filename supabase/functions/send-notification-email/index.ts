import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

Deno.serve(async (req: Request) => {
  console.log("Send-notification-email function invoked")
  try {
    const body = await req.json()
    console.log("Request body:", JSON.stringify(body))
    const { type, email } = body

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: "Missing type or email" }),
        { status: 400 }
      )
    }

    const subject =
      type === "welcome"
        ? "Welcome to SmartDocs Hub"
        : "New Login Alert"

    const html =
      type === "welcome"
        ? `<h2>Welcome to SmartDocs Hub 👋</h2><p>Your digital documents are now secure.</p>`
        : `<h2>Login Alert 🔐</h2><p>A new login was detected for your account.</p>`

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
