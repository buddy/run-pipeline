import { arch, platform } from 'node:os';
import { info } from '@actions/core';
import { exec } from '@actions/exec';
import {
  type PlatformInfo,
  SUPPORTED_ARCHITECTURE,
  SUPPORTED_PLATFORM,
} from '@/const/platform';

/**
 * Checks if BDY CLI is already installed
 * @returns True if BDY CLI is installed, false otherwise
 */
export async function isBdyInstalled(): Promise<boolean> {
  try {
    const command = platform() === 'win32' ? 'where' : 'which';
    const exitCode = await exec(command, ['bdy'], { silent: true });
    return exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Gets the installed BDY CLI version
 * @returns The version string or 'unknown' if not found
 */
export async function getBdyVersion(): Promise<string> {
  try {
    let output = '';
    await exec('bdy', ['version'], {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    });

    const lines = output.trim().split('\n');

    // Find the last line that looks like a version (X.Y.Z or X.Y.Z-suffix)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]?.trim();
      if (line && /^\d+\.\d+\.\d+(-[\w.]+)?/.test(line)) {
        return line;
      }
    }

    return output.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Detects and validates the system platform and architecture
 * @returns Platform information including OS, architecture, and download details
 * @throws Error if the platform/architecture combination is not supported
 */
function getPlatformInfo(): PlatformInfo {
  const PLATFORM_MAP = new Map<string, SUPPORTED_PLATFORM>([
    ['linux', SUPPORTED_PLATFORM.LINUX],
    ['darwin', SUPPORTED_PLATFORM.DARWIN],
    ['win32', SUPPORTED_PLATFORM.WIN32],
  ]);

  const ARCH_MAP = new Map<string, SUPPORTED_ARCHITECTURE>([
    ['x64', SUPPORTED_ARCHITECTURE.X64],
    ['arm64', SUPPORTED_ARCHITECTURE.ARM64],
  ]);

  const systemPlatform = platform();
  const systemArch = arch();

  const detectedPlatform = PLATFORM_MAP.get(systemPlatform);
  const detectedArch = ARCH_MAP.get(systemArch);

  if (!detectedPlatform) {
    throw new Error(
      `Unsupported platform: ${systemPlatform}. Only linux, darwin, and win32 are supported.`,
    );
  }

  if (!detectedArch) {
    throw new Error(
      `Unsupported architecture: ${systemArch}. Only x64 and arm64 are supported.`,
    );
  }

  // Validate platform + architecture combinations
  if (
    detectedPlatform === SUPPORTED_PLATFORM.DARWIN &&
    detectedArch === SUPPORTED_ARCHITECTURE.X64
  ) {
    throw new Error(
      'macOS x64 is not supported. Only darwin-arm64 binaries are available.',
    );
  }

  if (
    detectedPlatform === SUPPORTED_PLATFORM.WIN32 &&
    detectedArch === SUPPORTED_ARCHITECTURE.ARM64
  ) {
    throw new Error(
      'Windows ARM64 is not supported. Only win-x64 binaries are available.',
    );
  }

  // Determine file extension and download prefix
  const fileExtension =
    detectedPlatform === SUPPORTED_PLATFORM.WIN32 ? '.zip' : '.tar.gz';
  const platformName =
    detectedPlatform === SUPPORTED_PLATFORM.WIN32 ? 'win' : detectedPlatform;
  const downloadPrefix = `${platformName}-${detectedArch}`;

  return {
    platform: detectedPlatform,
    architecture: detectedArch,
    downloadPrefix,
    fileExtension,
  };
}

/**
 * Installs BDY CLI using the download method
 */
async function installBdyCli(): Promise<void> {
  const platformInfo = getPlatformInfo();
  const env = 'prod';
  const version = 'latest';

  info(`Installing BDY CLI (${version}) for ${platformInfo.downloadPrefix}...`);

  const fileName = `bdy${platformInfo.fileExtension}`;
  const url = `https://es.buddy.works/bdy/${env}/${version}/${platformInfo.downloadPrefix}${platformInfo.fileExtension}`;

  // macOS requires creating the directory first
  if (platformInfo.platform === SUPPORTED_PLATFORM.DARWIN) {
    await exec('sudo', ['mkdir', '-p', '-m', '755', '/usr/local/bin']);
  }

  try {
    await exec('curl', ['-fL', url, '-o', fileName]);
  } catch {
    throw new Error(`Failed to download BDY CLI. URL: ${url}`);
  }

  // Extract based on file type
  if (platformInfo.platform === SUPPORTED_PLATFORM.WIN32) {
    await exec('tar', ['-xf', fileName]);
  } else {
    await exec('sudo', ['tar', '-zxf', fileName, '-C', '/usr/local/bin/']);
  }

  await exec('rm', [fileName]);

  info('BDY CLI installed successfully');
}

/**
 * Ensures BDY CLI is installed and ready to use
 */
export async function ensureBdyInstalled(): Promise<void> {
  const isInstalled = await isBdyInstalled();

  if (isInstalled) {
    const version = await getBdyVersion();
    info(`✅ BDY CLI is already installed (version: ${version})`);
  } else {
    info('BDY CLI not found, installing...');
    await installBdyCli();
    const version = await getBdyVersion();
    info(`✅ BDY CLI installed successfully (version: ${version})`);
  }
}
