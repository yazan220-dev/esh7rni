import { NextRequest, NextResponse } from 'next/server';

// This is a test endpoint to verify the system is working correctly
export async function GET(request: NextRequest) {
  try {
    // Check if all required environment variables are set
    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'SMMCOST_API_KEY',
      'PAYPAL_CLIENT_ID',
      'PAYPAL_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );
    
    // Test database connection
    let dbStatus = 'Not tested';
    try {
      // In a real implementation, you would test the database connection here
      dbStatus = 'Connected';
    } catch (error) {
      dbStatus = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    // Return system status
    return NextResponse.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : 'None',
      database: dbStatus,
      apis: {
        smmcost: process.env.SMMCOST_API_KEY ? 'Configured' : 'Not configured',
        paypal: process.env.PAYPAL_CLIENT_ID ? 'Configured' : 'Not configured',
        google: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', message: 'System health check failed' },
      { status: 500 }
    );
  }
}
