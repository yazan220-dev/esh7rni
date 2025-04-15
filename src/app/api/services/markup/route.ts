import { NextRequest, NextResponse } from 'next/server';
import { updateServiceMarkup } from '@/lib/api/services';
import { isAdmin } from '@/lib/auth/session';

// POST /api/services/markup - Update service markup (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { markupPercentage } = body;
    
    if (typeof markupPercentage !== 'number' || markupPercentage < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid markup percentage' },
        { status: 400 }
      );
    }
    
    const result = await updateServiceMarkup(markupPercentage);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating markup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update markup' },
      { status: 500 }
    );
  }
}
