import { setFailed } from '@actions/core';
import { ensureBdyInstalled } from '@/cli';

async function run(): Promise<void> {
  try {
    await ensureBdyInstalled();
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed('An unknown error occurred');
    }
  }
}

run();
