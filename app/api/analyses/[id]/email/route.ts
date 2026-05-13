import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { generateAnalysisPDF } from '@/lib/pdf-server';
import { getInternalPrintToken, requireAnyRole } from '@/lib/authz';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const { recipientEmail } = body;

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_for_build') {
      return NextResponse.json(
        { error: 'Service d\'email non configuré sur ce serveur (Clé API manquante).' },
        { status: 500 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email du destinataire manquant' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    console.log(`Generating PDF for analysis ${id}...`);
    const origin = request.nextUrl.origin;
    const printToken = getInternalPrintToken();
    const pdfBuffer = await generateAnalysisPDF(id, origin, printToken);

    const patientName = `${analysis.patientLastName} ${analysis.patientFirstName}`.trim();
    const formattedDate = new Date(analysis.creationDate).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Résultats d'Analyse — NexLab</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:16px 16px 0 0;padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1;">
                      CSSB <span style="color:#3b82f6;">GALLEL</span>
                    </div>
                    <div style="font-size:10px;font-weight:700;color:#475569;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">
                      Service de Laboratoire
                    </div>
                  </td>
                  <td align="right">
                    <div style="display:inline-block;background-color:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 16px;text-align:right;">
                      <div style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Référence</div>
                      <div style="font-size:15px;font-weight:900;color:#ffffff;font-family:monospace;margin-top:3px;">${analysis.orderNumber}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Blue accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa);"></td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Rapport Médical</p>
              <h1 style="margin:0 0 24px;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">
                Bonjour, <span style="color:#2563eb;">${patientName}</span>
              </h1>

              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Votre rapport d'analyse médicale est disponible. Veuillez trouver ci-joint votre document en format PDF.
              </p>

              <!-- Info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Patient</div>
                                <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:4px;">${patientName}</div>
                              </td>
                              <td align="right">
                                <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">N° Dossier</div>
                                <div style="font-size:14px;font-weight:900;color:#2563eb;font-family:monospace;margin-top:4px;">${analysis.orderNumber}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:16px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Date de prélèvement</div>
                                <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:4px;">${formattedDate}</div>
                              </td>
                              <td align="right">
                                <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Établissement</div>
                                <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:4px;">CSSB Gallel</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                      <strong>Important :</strong> Ces résultats doivent être interprétés par votre médecin traitant. 
                      Ne modifiez pas votre traitement sans avis médical.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">
                Pour toute question, n'hésitez pas à contacter notre service de laboratoire directement.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:12px;font-weight:700;color:#0f172a;">CSSB Gallel — Laboratoire d'Analyses Médicales</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Hôpital Menzel Bouzaïene</div>
                  </td>
                  <td align="right">
                    <div style="font-size:10px;color:#cbd5e1;text-align:right;line-height:1.6;">
                      Message automatique<br/>Ne pas répondre à cet email
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: 'NexLab <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `Vos résultats d'analyse — ${patientName} — Réf. ${analysis.orderNumber}`,
      html,
      attachments: [
        {
          filename: `Rapport_${analysis.orderNumber}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await prisma.analysis.update({
        where: { id },
        data: { emailedAt: new Date() }
      });
    } catch (dbError) {
      console.error('Error updating emailedAt:', dbError);
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
