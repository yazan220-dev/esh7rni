import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';

// This API route generates optimized images for the website
// It can be used to resize, compress, and format images on-the-fly

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const width = parseInt(searchParams.get('width') || '800', 10);
    const height = parseInt(searchParams.get('height') || '600', 10);
    const format = searchParams.get('format') || 'webp';
    
    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 });
    }
    
    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: 500 });
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Process the image (in a real implementation, you would use a library like Sharp)
    // For this example, we'll just return the image with proper cache headers
    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error optimizing image:', error);
    return new Response('Error optimizing image', { status: 500 });
  }
}
