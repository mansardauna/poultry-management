'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const [coopRes, apiKeysRes, consultantsRes, bulkOrdersRes, workspacesRes] = await Promise.all([
      supabase.from('enterprise_cooperatives').select('*').eq('workspaceId', workspaceId).limit(1),
      supabase.from('enterprise_api_keys').select('*').eq('workspaceId', workspaceId),
      supabase.from('enterprise_consultants').select('*').eq('workspaceId', workspaceId),
      supabase.from('enterprise_bulk_orders').select('*').eq('workspaceId', workspaceId),
      supabase.from('workspaces').select('*')
    ]);

    return NextResponse.json({
      cooperative: coopRes.data?.[0] || null,
      apiKeys: apiKeysRes.data || [],
      consultants: consultantsRes.data || [],
      bulkOrders: bulkOrdersRes.data || [],
      workspaces: workspacesRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch enterprise data' }, { status: 500 });
  }
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    // 1. Save White-Label Cooperative Branding
    if (body.action === 'save_cooperative') {
      const coopData = {
        workspaceId,
        coopName: body.coopName || 'My Farm Enterprise',
        subdomain: body.subdomain || 'myfarm',
        logoUrl: body.logoUrl || '',
        brandColor: body.brandColor || 'indigo',
        customReportHeader: body.customReportHeader || 'Official Farm Management Report',
        customInvoiceFooter: body.customInvoiceFooter || 'Thank you for your business!',
        themeMode: body.themeMode || 'modern',
        updatedAt: new Date().toISOString()
      };

      try {
        const { data: existing } = await supabase
          .from('enterprise_cooperatives')
          .select('id')
          .eq('workspaceId', workspaceId)
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          await supabase.from('enterprise_cooperatives').update(coopData).eq('id', existing.id);
        } else {
          await supabase.from('enterprise_cooperatives').insert([{ id: 'coop_' + Date.now(), ...coopData }]);
        }
      } catch (_e) {}

      // Also sync to systemSettings for app-wide white-labeling
      try {
        await supabase.from('systemSettings').upsert([{
          workspaceId,
          farmName: body.coopName,
          adminName: body.customReportHeader,
          updatedAt: new Date().toISOString()
        }], { onConflict: 'workspaceId' });
      } catch (_e) {}

      return NextResponse.json({ success: true, cooperative: coopData });
    }

    // 2. Permanent Delete Branch
    if (body.action === 'delete_branch') {
      const targetId = body.branchId;
      if (!targetId || targetId === 'main') {
        return NextResponse.json({ error: 'Cannot delete the primary main workspace' }, { status: 400 });
      }
      
      try {
        await supabase.from('workspaces').delete().eq('id', targetId);
      } catch (_e) {}

      return NextResponse.json({ success: true, message: 'Branch permanently deleted' });
    }

    // 3. Cross-Branch Stock Transfer
    if (body.action === 'transfer_stock') {
      const { fromBranchId, toBranchId, itemType, quantity, notes } = body;
      if (!fromBranchId || !toBranchId || !quantity) {
        return NextResponse.json({ error: 'Missing required transfer fields' }, { status: 400 });
      }

      // Record Transfer Entry in inventory/finance logs
      const transferLog = {
        id: 'trans_' + Date.now(),
        workspaceId: fromBranchId,
        itemName: `Stock Transfer (${itemType}) to Branch ${toBranchId}`,
        category: 'Inter-Branch Transfer',
        quantity: Number(quantity),
        unit: itemType === 'Eggs' ? 'Crates' : (itemType === 'Feed' ? 'Kg' : 'Birds'),
        notes: notes || `Transferred ${quantity} ${itemType} to destination branch ${toBranchId}`,
        createdAt: new Date().toISOString()
      };

      try {
        await supabase.from('inventory').insert([transferLog]);
      } catch (_e) {}

      return NextResponse.json({ success: true, transferLog });
    }

    // 4. Create Enterprise API Key
    if (body.action === 'create_api_key') {
      const newKey = {
        id: 'key_' + Date.now(),
        workspaceId,
        name: body.name || 'Production API Key',
        secretKey: 'pfms_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        scope: body.scope || 'read:analytics,write:sales',
        webhookUrl: body.webhookUrl || '',
        status: 'Active',
        createdAt: new Date().toISOString()
      };

      try {
        await supabase.from('enterprise_api_keys').insert([newKey]);
      } catch (_e) {}

      return NextResponse.json({ success: true, apiKey: newKey }, { status: 201 });
    }

    // 5. Revoke API Key
    if (body.action === 'revoke_api_key') {
      try {
        await supabase.from('enterprise_api_keys').delete().eq('id', body.id).eq('workspaceId', workspaceId);
      } catch (_e) {}
      return NextResponse.json({ success: true });
    }

    // 6. Create Emergency Vet Inspection Ticket
    if (body.action === 'create_vet_ticket') {
      const newTicket = {
        id: 'vet_' + Date.now(),
        workspaceId,
        ticketType: body.ticketType || 'Emergency Outbreak',
        notes: body.notes || 'Emergency request',
        contactPhone: body.contactPhone || '+234 800-POULTRY-VET',
        status: 'Assigned',
        createdAt: new Date().toISOString()
      };

      try {
        await supabase.from('enterprise_consultants').insert([newTicket]);
      } catch (_e) {}

      return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
    }

    // 7. Create Bulk Feed Order
    if (body.action === 'create_bulk_order') {
      const newOrder = {
        id: 'bulk_' + Date.now(),
        workspaceId,
        feedType: body.feedType || 'Layer Mash',
        quantityBags: Number(body.quantityBags) || 100,
        discountPrice: Number(body.discountPrice) || 12500,
        status: 'Processing Pool',
        createdAt: new Date().toISOString()
      };

      try {
        await supabase.from('enterprise_bulk_orders').insert([newOrder]);
      } catch (_e) {}

      return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid enterprise action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to process enterprise action' }, { status: 500 });
  }
}
