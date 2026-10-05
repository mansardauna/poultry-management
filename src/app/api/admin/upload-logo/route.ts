'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/upload-logo
 * Uploads brand logo image from Super Admin.
 * 1. Writes file to public/uploads/brand-logo.[ext]
 * 2. Overwrites public/icon.png so PWA icons, favicons, and apple-touch-icons match immediately.
 * 3. Updates public/manifest.json with the brand name and icon.
 * 4. Persists logoUrl & brandName into database systemSettings (landing_page_cms & gateways_config).
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SuperAdmin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only Super Admin can upload the platform brand logo' },
        { status: 403 }
      );
    }

    let fileBuffer: Buffer | null = null;
    let fileName = 'brand-logo.png';
    let brandNameInput = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null || formData.get('logo') as File | null;
      brandNameInput = (formData.get('brandName') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No image file provided in request' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.png';
      fileName = `brand-logo${ext.toLowerCase()}`;
    } else {
      // JSON payload containing base64 data URL
      const body = await request.json();
      const { imageBase64, brandName } = body;
      brandNameInput = brandName || '';

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return NextResponse.json({ error: 'No image data provided in request' }, { status: 400 });
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
        const ext = mimeType.includes('svg') ? '.svg' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' : mimeType.includes('webp') ? '.webp' : '.png';
        fileName = `brand-logo${ext}`;
      } else {
        fileBuffer = Buffer.from(imageBase64, 'base64');
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty image file' }, { status: 400 });
    }

    // 1. Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 2. Write file to public/uploads/brand-logo.[ext]
    const targetFilePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(targetFilePath, fileBuffer);

    // 3. Overwrite public/icon.png so default PWA and browser shortcut icons match
    try {
      const iconPath = path.join(process.cwd(), 'public', 'icon.png');
      fs.writeFileSync(iconPath, fileBuffer);
    } catch (_iconErr) {}

    const timestamp = Date.now();
    const logoUrl = `/uploads/${fileName}?v=${timestamp}`;

    // 4. Update landing_page_cms in database
    const { data: cmsRow } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'landing_page_cms')
      .maybeSingle();

    let cmsParsed: any = {};
    if (cmsRow?.adminName) {
      try {
        cmsParsed = typeof cmsRow.adminName === 'string' ? JSON.parse(cmsRow.adminName) : cmsRow.adminName;
      } catch (_e) {}
    }

    const effectiveBrandName = brandNameInput.trim() || cmsParsed.brandName || 'PFMS';

    const updatedCms = {
      ...cmsParsed,
      logoUrl,
      brandName: effectiveBrandName,
      platformName: effectiveBrandName
    };

    await serviceRoleClient.from('systemSettings').upsert([{
      id: 'landing_page_cms',
      workspaceId: 'global',
      adminName: JSON.stringify(updatedCms)
    }]);

    // 5. Update gateways_config in database
    try {
      const { data: gwRow } = await serviceRoleClient
        .from('systemSettings')
        .select('adminName')
        .eq('id', 'gateways_config')
        .maybeSingle();

      let gwParsed: any = {};
      if (gwRow?.adminName) {
        try {
          gwParsed = typeof gwRow.adminName === 'string' ? JSON.parse(gwRow.adminName) : gwRow.adminName;
        } catch (_e) {}
      }

      const updatedGw = {
        ...gwParsed,
        logoUrl,
        platformName: effectiveBrandName
      };

      await serviceRoleClient.from('systemSettings').upsert([{
        id: 'gateways_config',
        workspaceId: 'global',
        adminName: JSON.stringify(updatedGw)
      }]);
    } catch (_gwErr) {}

    // 6. Synchronize public/manifest.json (PWA manifest)
    try {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestRaw);
        manifest.name = effectiveBrandName;
        manifest.short_name = effectiveBrandName;
        manifest.icons = [
          {
            src: "/icon.png",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/png"
          },
          {
            src: "/icon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ];
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      }
    } catch (_mErr) {}

    return NextResponse.json({
      success: true,
      logoUrl,
      brandName: effectiveBrandName,
      message: 'Brand logo uploaded and applied globally across web app and PWA!'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process logo upload' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/upload-logo
 * Resets the brand logo back to the default icon.
 */
export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can reset the platform brand logo' }, { status: 403 });
    }

    // Reset logoUrl in database
    const { data: cmsRow } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'landing_page_cms')
      .maybeSingle();

    let cmsParsed: any = {};
    if (cmsRow?.adminName) {
      try {
        cmsParsed = typeof cmsRow.adminName === 'string' ? JSON.parse(cmsRow.adminName) : cmsRow.adminName;
      } catch (_e) {}
    }

    cmsParsed.logoUrl = '';

    await serviceRoleClient.from('systemSettings').upsert([{
      id: 'landing_page_cms',
      workspaceId: 'global',
      adminName: JSON.stringify(cmsParsed)
    }]);

    return NextResponse.json({
      success: true,
      logoUrl: '/icon.png',
      message: 'Logo reset to default application icon'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to reset logo' }, { status: 500 });
  }
}
