import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for push subscriptions (in production, use a database)
const subscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store subscription (in production, save to database)
    const subscriptionId = generateSubscriptionId(subscription.endpoint);
    subscriptions.set(subscriptionId, {
      ...subscription,
      subscribedAt: new Date().toISOString(),
      active: true
    });

    console.log(`New push subscription registered: ${subscriptionId}`);

    return NextResponse.json({
      success: true,
      subscriptionId,
      message: 'Successfully subscribed to push notifications'
    });

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
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
