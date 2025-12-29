import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { consultant_id, position_title, company_name } = body;

        if (!consultant_id || !position_title || !company_name) {
            return NextResponse.json({ error: "Eksik bilgi: Danışman ID, Pozisyon ve Firma adı zorunludur." }, { status: 400 });
        }

        // Initialize Supabase Client
        // We use service role key here if we need to fetch consultant email securely without RLS blocking,
        // OR we use the auth header to act as the admin.
        // Since we are fetching public profile info (email might be private depending on policies, but usually accessible to admin),
        // let's use the provided auth header to be safe and consistent with RLS.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const authHeader = req.headers.get('Authorization');

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader || '' } }
        });

        // 1. Get User (Sender - Admin)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error("Auth Fail:", authError);
            return NextResponse.json({ error: "Yetkisiz işlem: Lütfen giriş yapın." }, { status: 401 });
        }
        const sentBy = user.id;

        // 2. Fetch Consultant Details (Email & Name)
        // We might need to use service role if profiles RLS prevents reading email of others (though Admin should have access).
        // Let's assume Admin RLS allows reading profiles.
        const { data: consultant, error: consultantError } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', consultant_id)
            .single();

        if (consultantError || !consultant || !consultant.email) {
            return NextResponse.json({ error: "Danışman bilgileri veya e-posta adresi bulunamadı." }, { status: 404 });
        }

        const consultantName = consultant.first_name ? `${consultant.first_name} ${consultant.last_name || ''}`.trim() : 'Danışman';
        const consultantEmail = consultant.email;

        // 3. Configure Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: process.env.SMTP_USE_SSL === 'true',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // 4. Prepare Mail Content
        const subject = `[${company_name}] - ${position_title} pozisyonu size atandı`;

        const logoHtml = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                <img src="https://www.upgunai.com/works/omuzomuza_logo.png" 
                     alt="Omuz Omuza Engelsiz İnsan Kaynakları" 
                     style="max-width: 200px; height: auto;" />
            </div>
        `;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <p>Sayın <strong>${consultantName}</strong>,</p>
                <p><strong>${company_name}</strong> bünyesinde açılan <strong>${position_title}</strong> pozisyonu, takip etmeniz için size atanmıştır.</p>
                <p>Aday değerlendirme ve paylaşım süreçlerine başlayabilmek için lütfen HR sistemimizdeki <strong>Açık Pozisyonlar</strong> menüsünü kontrol edin.</p>
                <br/>
                <p>İyi çalışmalar dileriz,<br/>Omuz Omuza Engelsiz İnsan Kaynakları Ekibi</p>
                ${logoHtml}
            </div>
        `;

        // 5. Send Mail
        await transporter.sendMail({
            from: '"Omuz Omuza Engelsiz İK" <basvuru@omuzomuza.com.tr>',
            to: consultantEmail,
            subject: subject,
            html: htmlContent,
        });

        // 6. Log to DB
        // reusing 'candidate_email' for consultant email as requested
        // reusing 'candidate_name' for consultant name
        // result_type = 'pozisyon_atama'
        const { error: logError } = await supabase.from('mail_logs').insert({
            candidate_email: consultantEmail,
            candidate_name: consultantName,
            company_name: company_name,
            position_name: position_title,
            result_type: 'pozisyon_atama',
            sent_by: sentBy,
            sent_at: new Date().toISOString(),
            error_message: null
        });

        if (logError) {
            console.error("Mail log error:", logError);
        }

        return NextResponse.json({ success: true, message: "Atama maili gönderildi." });

    } catch (error: any) {
        console.error("Assign Mail Error:", error);
        return NextResponse.json({ error: "Mail gönderim hatası: " + error.message }, { status: 500 });
    }
}
