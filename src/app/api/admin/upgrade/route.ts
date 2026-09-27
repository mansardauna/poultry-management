'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { 
  APP_VERSION, 
  getInstalledVersion, 
  isUpgradeAvailable, 
  runSystemMigrations 
} from '@/lib/version';

/**
 * GET /api/admin/upgrade — Check version status and migration availability
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized: Requires SuperAdmin access.' }, { status: 401 });
    }

    const installedVersion = await getInstalledVersion();
    const updateAvailable = isUpgradeAvailable(installedVersion, APP_VERSION);

    return NextResponse.json({
      currentVersion: APP_VERSION,
      installedVersion,
      updateAvailable,
      highlights: [
        'Automatic database schema and column verification',
        'Direct installer guard with automatic database connection detection',
        'Staff permission and role enforcement hardening',
        'Real-time version synchronization and migration logs'
      ]
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to retrieve version information.'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/upgrade — Run database migrations and update DB version to APP_VERSION
 */
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized: Requires SuperAdmin access.' }, { status: 401 });
    }

    const migrationResult = await runSystemMigrations();

    return NextResponse.json({
      ok: true,
      message: `System successfully upgraded to v${APP_VERSION}!`,
      currentVersion: APP_VERSION,
      installedVersion: APP_VERSION,
      updateAvailable: false,
      result: migrationResult,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Database upgrade execution failed.'
    }, { status: 500 });
  }
}
