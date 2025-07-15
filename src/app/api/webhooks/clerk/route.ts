import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    first_name?: string;
    last_name?: string;
    email_addresses?: Array<{
      email_address: string;
      id: string;
    }>;
    image_url?: string;
    username?: string;
    created_at?: number;
    updated_at?: number;
  };
};

export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Missing webhook secret configuration' },
        { status: 500 }
      );
    }

    const headersList = await headers();
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    const body = await request.text();
    const webhook = new Webhook(webhookSecret);

    let event: ClerkWebhookEvent;

    try {
      event = webhook.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    switch (event.type) {
      case 'user.created':
        await handleUserCreated(supabase, event);
        break;
      
      case 'user.updated':
        await handleUserUpdated(supabase, event);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(supabase, event);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(supabase: any, event: ClerkWebhookEvent) {
  const { error } = await supabase
    .from('profiles')
    .insert({
      user_id: event.data.id,
      full_name: [event.data.first_name, event.data.last_name]
        .filter(Boolean)
        .join(' ') || null,
      avatar_url: event.data.image_url || null,
    });

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  console.log('User profile created successfully:', event.data.id);
}

async function handleUserUpdated(supabase: any, event: ClerkWebhookEvent) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: [event.data.first_name, event.data.last_name]
        .filter(Boolean)
        .join(' ') || null,
      avatar_url: event.data.image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', event.data.id);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  console.log('User profile updated successfully:', event.data.id);
}

async function handleUserDeleted(supabase: any, event: ClerkWebhookEvent) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', event.data.id);

  if (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }

  console.log('User profile deleted successfully:', event.data.id);
}