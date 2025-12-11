import { info, setFailed, setSecret } from '@actions/core';
import { ensureBdyInstalled } from '@/bdy';

function checkBuddyLogin(): void {
  const token = process.env.BUDDY_TOKEN;
  const endpoint = process.env.BUDDY_API_ENDPOINT;

  if (token) {
    setSecret(token);
    info('✅ BUDDY_TOKEN found');
  } else {
    info('ℹ️ BUDDY_TOKEN not set');
  }

  if (endpoint) {
    info(`✅ BUDDY_API_ENDPOINT found: ${endpoint}`);
  } else {
    info('ℹ️ BUDDY_API_ENDPOINT not set');
  }
}

async function run(): Promise<void> {
  try {
    await ensureBdyInstalled();
    checkBuddyLogin();
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed('An unknown error occurred');
    }
  }
}

run();
