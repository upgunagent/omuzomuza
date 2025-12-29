import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { candidate_name, candidate_email, extra_note } = body;

        if (!candidate_email || !candidate_name) {
            return NextResponse.json({ error: "Eksik bilgi: Ad ve E-posta zorunludur." }, { status: 400 });
        }

        // Auth Check
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const authHeader = req.headers.get('Authorization');

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader || '' } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: process.env.SMTP_USE_SSL === 'true',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Common Logo
        const logoHtml = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                <img src="https://www.upgunai.com/works/omuzomuza_logo.png" 
                     alt="Omuz Omuza Engelsiz İnsan Kaynakları" 
                     style="max-width: 200px; height: auto;" />
            </div>
        `;

        const extraNoteHtml = extra_note ? `<p>${extra_note.replace(/\n/g, '<br/>')}</p>` : '';
        const registerLink = "https://www.omuzomuza.com.tr";

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                <p>Merhaba <strong>${candidate_name}</strong>,</p>
                
                <p>Kariyer yolculuğunuzda size destek olmak ve potansiyelinizi en iyi şekilde değerlendirmeniz için sizi Omuz Omuza Platformu'na üye olmaya davet ediyoruz.</p>
                
                <p>Platformumuza üye olarak güncel iş ilanlarına ulaşabilir, profilinizi oluşturarak firmaların size ulaşmasını sağlayabilirsiniz.</p>

                ${extraNoteHtml}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${registerLink}" style="background-color: #1498e0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Üyelik Yap</a>
                </div>

                <p>Aramıza katılmanızdan mutluluk duyarız.</p>
                
                <p>Saygılarımızla,<br/>Omuz Omuza Engelsiz İnsan Kaynakları Ekibi</p>
                
                ${logoHtml}
            </div>
        `;

        await transporter.sendMail({
            from: '"Omuz Omuza Engelsiz İK" <basvuru@omuzomuza.com.tr>',
            to: candidate_email,
            subject: "Aramıza Katılın! - Omuz Omuza Platformu Üyelik Daveti",
            html: htmlContent
        });

        // Log functionality can be added here if needed, similar to other mail sender.
        // For now preventing creating complexity if table structure for logs differs.

        return NextResponse.json({ success: true, message: "Davet maili gönderildi." });

    } catch (error: any) {
        console.error("Mail Send Error:", error);
        return NextResponse.json({ error: "Mail gönderilirken hata: " + (error.message || "Bilinmeyen hata") }, { status: 500 });
    }
}
