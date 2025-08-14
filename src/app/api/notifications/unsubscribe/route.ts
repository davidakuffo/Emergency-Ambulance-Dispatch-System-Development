import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for push subscriptions (in production, use a database)
// This should be the same storage as in subscribe route
const subscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, endpoint } = body;

    let targetId = subscriptionId;

    // If no subscriptionId provided, try to find by endpoint
    if (!targetId && endpoint) {
      targetId = generateSubscriptionId(endpoint);
    }

    if (!targetId) {
      return NextResponse.json(
        { error: 'Subscription ID or endpoint required' },
        { status: 400 }
      );
    }

    // Remove subscription
    const existed = subscriptions.delete(targetId);

    console.log(`Push subscription ${existed ? 'removed' : 'not found'}: ${targetId}`);

    return NextResponse.json({
      success: true,
      message: existed 
        ? 'Successfully unsubscribed from push notifications'
        : 'Subscription not found (may have already been removed)'
    });

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    );
  }
}

function generateSubscriptionId(endpoint: string): string {
  // Generate a simple hash of the endpoint for identification
  let hash = 0;
  for (let i = 0; i < endpoint.length; i++) {
    const char = endpoint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
