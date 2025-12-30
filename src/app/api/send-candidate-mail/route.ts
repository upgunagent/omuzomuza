import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        // Parse FormData instead of JSON
        const formData = await req.formData();

        const candidate_name = formData.get("candidate_name") as string;
        const candidate_email = formData.get("candidate_email") as string;
        const company_name = formData.get("company_name") as string;
        const position_name = formData.get("position_name") as string;
        const result_type = formData.get("result_type") as string;
        const extra_note = formData.get("extra_note") as string;

        const file = formData.get("file") as File | null;

        // 1. Basic Validation
        if (!candidate_email || !candidate_name || !company_name || !result_type) {
            return NextResponse.json({ error: "Eksik bilgi: Ad, E-posta, Şirket ve Sonuç tipi zorunludur." }, { status: 400 });
        }

        // 2. Auth Check (Get User ID)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const authHeader = req.headers.get('Authorization');

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader || '' } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error("Auth Fail:", authError);
            return NextResponse.json({ error: "Yetkisiz işlem: Lütfen giriş yapın." }, { status: 401 });
        }

        const sentBy = user.id;

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
        // Template Logic
        const isPositive = result_type === "olumlu";
        const isOffer = result_type === "teklif";

        let subject = "";
        let messageBody = "";

        // Common Logo
        const logoHtml = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                <img src="https://www.upgunai.com/works/omuzomuza_logo.png" 
                     alt="Omuz Omuza Engelsiz İnsan Kaynakları" 
                     style="max-width: 200px; height: auto;" />
            </div>
        `;

        // Format Extra Note HTML if exists
        const extraNoteHtml = extra_note ? `
            <p>${extra_note.replace(/\n/g, '<br/>')}</p>
        ` : '';

        if (isOffer) {
            // JOB OFFER TEMPLATE
            subject = `İş Teklifi! ${company_name} - ${position_name ? position_name : 'Yeni Göreviniz'}`;
            messageBody = `
                <p>Merhaba <strong>${candidate_name}</strong>,</p>
                <p><strong>${company_name}</strong> şirketi ile <strong>${position_name}</strong> pozisyonu için işe alım süreciniz olumlu değerlendirme ile sonuçlanmıştır, öncelikle sizi tebrik ediyoruz!</p>
                <p>Beraber çalışmaktan mutluluk duyacağımızı belirterek, teklifimize ilişkin detayları ekte tarafınıza sunarız. Cevabınızı ve kabul etmeniz halinde işe başlayabileceğiniz en erken tarihi e-maile cevaben yazılı olarak iletmenizi rica ederiz.</p>
                
                ${extraNoteHtml}

                <p>Saygılarımızla,<br/>${company_name} adına Omuz Omuza Engelsiz İnsan Kaynakları Ekibi</p>
            `;
        } else if (isPositive) {
            // POSITIVE TEMPLATE
            subject = `Tebrikler! ${company_name} - Yeni Göreviniz`;
            messageBody = `
                <p>Sayın <strong>${candidate_name}</strong>,</p>
                <p><strong>${company_name}</strong>'ndaki yeni göreviniz için sizi en içten dileklerimizle tebrik etmek isteriz! Bu önemli adımınızda size destek olabildiğimiz için büyük mutluluk duyuyoruz.</p>
                <p>Yeni işinizin kariyerinizde önemli bir dönüm noktası olacağına ve yeteneklerinizle <strong>${company_name}</strong>'na değerli katkılar sağlayacağınıza yürekten inanıyoruz.</p>
                
                ${extraNoteHtml}
                
                <p>Başarılarınızın devamını diler, bu yeni başlangıcınızın size ve <strong>${company_name}</strong>'na hayırlı olmasını temenni ederiz.</p>
                <p>Saygılarımızla,<br/>Omuz Omuza Engelsiz İnsan Kaynakları Ekibi</p>
            `;
        } else {
            // NEGATIVE TEMPLATE
            subject = `${company_name} - Başvurunuz Hakkında`;
            messageBody = `
                <p>Sayın <strong>${candidate_name}</strong>,</p>
                <p>İşe alım süreciniz ve mülakat değerlendirmeleri sonucunda mevcut pozisyonla ilgili size ne yazık ki olumlu cevap veremiyoruz. Özgeçmişinizin niteliklerinize uygun bir pozisyon ve yeni bir iş fırsatı olduğunda tekrar değerlendirilmek üzere veri tabanımızda gizlilik prensipleri çerçevesinde saklanacağını belirtmek isteriz.</p>
                
                ${extraNoteHtml}

                <p>Göstermiş olduğunuz ilgiye teşekkür eder, çalışma yaşamınızda başarılar dileriz.</p>
                <p>Saygılarımızla,<br/>Omuz Omuza Engelsiz İnsan Kaynakları Ekibi</p>
            `;
        }

        const finalHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                ${messageBody}
                ${logoHtml}
            </div>
        `;

        // Prepare Attachments
        const attachments = [];
        if (file) {
            // Convert file to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            attachments.push({
                filename: file.name,
                content: buffer,
                contentType: file.type
            });
        }

        const consultantEmail = user.email;
        const fixedCcEmail = "ozgul@omuzomuza.com.tr";
        const resipientsCc = consultantEmail ? [consultantEmail, fixedCcEmail] : [fixedCcEmail];

        // 5. Send Mail
        await transporter.sendMail({
            from: '"Omuz Omuza Engelsiz İK" <basvuru@omuzomuza.com.tr>',
            to: candidate_email,
            cc: resipientsCc,
            subject: subject,
            html: finalHtml,
            attachments: attachments
        });

        // 6. Log Success to Supabase (User Context)
        const { error: logError } = await supabase.from('mail_logs').insert({
            candidate_email,
            candidate_name,
            company_name,
            position_name: position_name || '',
            result_type,
            extra_note,
            sent_by: sentBy,
            sent_at: new Date().toISOString(),
            error_message: null
        });

        if (logError) {
            console.error("Mail Sent but Log Failed:", logError);
        }

        return NextResponse.json({ success: true, message: "Mail başarıyla gönderildi." });

    } catch (error: any) {
        console.error("Mail Send Error:", error);
        return NextResponse.json({ error: "Mail gönderilirken hata: " + (error.message || "Bilinmeyen hata") }, { status: 500 });
    }
}
