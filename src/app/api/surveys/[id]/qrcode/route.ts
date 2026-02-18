import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

// GET /api/surveys/[id]/qrcode - Generate QR code for survey
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const size = parseInt(url.searchParams.get('size') || '300');
    
    // Generate the survey URL (this will be the form URL)
    const surveyUrl = `${url.origin}/?form=${id}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(surveyUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    });

    return NextResponse.json({ 
      qrCode: qrCodeDataUrl,
      url: surveyUrl 
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
