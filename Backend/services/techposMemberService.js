const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const UserModel = require('../models/userModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_COMPANY_CODE = '467-41';
const DEFAULT_STORE_ID = 467;
const DEFAULT_TECHPOS_KEY = 'Ym9KsXaM3M7W2B301iI3ynU1';

/**
 * Helper to get active configuration
 */
function getConfig() {
  const companyCode = process.env.TECHPOS_COMPANY_CODE || DEFAULT_COMPANY_CODE;
  const storeId = Number(process.env.TECHPOS_STORE_ID || DEFAULT_STORE_ID);
  const apiKey = process.env.TECHPOS_API_KEY || DEFAULT_TECHPOS_KEY;
  const baseUrl = `https://integrations-api.techpos.ca/${companyCode}`;

  return { companyCode, storeId, apiKey, baseUrl };
}

/**
 * Format Date into ISO string or null
 */
function formatIsoDate(dateVal) {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Split full name into first and last name
 */
function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/);
  const firstName = parts[0] || 'Customer';
  const lastName = parts.slice(1).join(' ') || 'Pharsyde';
  return { firstName, lastName };
}

/**
 * Robust helper to extract member lists from TechPOS response shapes
 * (Handles: { data: { list: [...] } }, { data: [...] }, { items: [...] }, direct array)
 */
function extractListFromTechPosResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data.list)) return data.data.list;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.list && Array.isArray(data.list)) return data.list;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (typeof data.data === 'object' && data.data && (data.data.id || data.data.memberId)) return [data.data];
  if (typeof data === 'object' && (data.id || data.memberId)) return [data];
  return [];
}

/**
 * 1. Create Member in TechPOS
 * POST /api/openAPI/createMember/{storeId}
 * Payload: HighTideCustomerVM
 */
async function createTechPOSMember(memberData) {
  const { storeId, apiKey, baseUrl } = getConfig();
  const url = `${baseUrl}/api/openAPI/createMember/${storeId}`;

  const names = splitName(memberData.name || '');
  const firstName = memberData.firstName || memberData.first_name || names.firstName;
  const lastName = memberData.lastName || memberData.last_name || names.lastName;
  const phone = memberData.phone || memberData.mob_no || '';
  const email = (memberData.email || '').trim().toLowerCase();
  const dateOfBirth = formatIsoDate(memberData.dateOfBirth || memberData.date_of_birth);

  const payload = {
    storeId: Number(storeId),
    memberId: 0,
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    email: email,
    dateOfBirth: dateOfBirth,
    eliteMemberStartDate: formatIsoDate(memberData.eliteMemberStartDate),
    eliteMemberEndDate: formatIsoDate(memberData.eliteMemberEndDate),
  };

  console.log(`[TechPOS Member] Creating member at ${url}:`, { firstName, lastName, email, phone });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'TechPOSAPIKey': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    const errorMsg = typeof parsed === 'object' ? (parsed.error || parsed.message || JSON.stringify(parsed)) : parsed;
    throw new Error(`TechPOS createMember failed (${response.status} ${response.statusText}): ${errorMsg}`);
  }

  // Extract memberId from response
  let createdMemberId = null;
  if (typeof parsed === 'number') {
    createdMemberId = parsed;
  } else if (parsed && typeof parsed === 'object') {
    createdMemberId = parsed.id || parsed.memberId || parsed.data?.id || parsed.data?.memberId || (typeof parsed.data === 'number' ? parsed.data : null);
  }

  return {
    success: true,
    memberId: createdMemberId,
    data: parsed,
  };
}

/**
 * 2. Update Member in TechPOS
 * POST /api/openAPI/updateMember/{storeId}
 * Payload: HighTideCustomerVM
 */
async function updateTechPOSMember(memberId, memberData) {
  const { storeId, apiKey, baseUrl } = getConfig();
  const url = `${baseUrl}/api/openAPI/updateMember/${storeId}`;

  const names = splitName(memberData.name || '');
  const firstName = memberData.firstName || memberData.first_name || names.firstName;
  const lastName = memberData.lastName || memberData.last_name || names.lastName;
  const phone = memberData.phone || memberData.mob_no || '';
  const email = (memberData.email || '').trim().toLowerCase();
  const dateOfBirth = formatIsoDate(memberData.dateOfBirth || memberData.date_of_birth);

  const payload = {
    storeId: Number(storeId),
    memberId: Number(memberId),
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    email: email,
    dateOfBirth: dateOfBirth,
    eliteMemberStartDate: formatIsoDate(memberData.eliteMemberStartDate || memberData.elite_member_start_date),
    eliteMemberEndDate: formatIsoDate(memberData.eliteMemberEndDate || memberData.elite_member_end_date),
  };

  console.log(`[TechPOS Member] Updating member #${memberId} at ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'TechPOSAPIKey': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    const errorMsg = typeof parsed === 'object' ? (parsed.error || parsed.message || JSON.stringify(parsed)) : parsed;
    throw new Error(`TechPOS updateMember failed (${response.status} ${response.statusText}): ${errorMsg}`);
  }

  return {
    success: true,
    data: parsed,
  };
}

/**
 * 3. Search Member in TechPOS
 * GET /api/openAPI/searchMember/{storeId}?firstName=...&lastName=...&email=...&phoneNumber=...&cardNumber=...
 */
async function searchTechPOSMember({ firstName, lastName, email, phoneNumber, cardNumber } = {}) {
  const { storeId, apiKey, baseUrl } = getConfig();

  const params = new URLSearchParams();
  if (firstName) params.append('firstName', firstName);
  if (lastName) params.append('lastName', lastName);
  if (email) params.append('email', email);
  if (phoneNumber) params.append('phoneNumber', phoneNumber);
  if (cardNumber) params.append('cardNumber', cardNumber);

  const url = `${baseUrl}/api/openAPI/searchMember/${storeId}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'TechPOSAPIKey': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TechPOS searchMember failed (${response.status} ${response.statusText}): ${errorText}`);
  }

  const data = await response.json();
  return extractListFromTechPosResponse(data);
}

/**
 * 4. Fetch Member Details / Member List from TechPOS
 * GET /api/openAPI/memberDetails/{storeId}?pageNumber=1&pageSize=500
 */
async function fetchTechPOSMemberDetails(pageNumber = 1, pageSize = 500, modifiedSince = null) {
  const { storeId, apiKey, baseUrl } = getConfig();

  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  if (modifiedSince) params.append('modifiedSince', modifiedSince);

  const url = `${baseUrl}/api/openAPI/memberDetails/${storeId}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'TechPOSAPIKey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const list = extractListFromTechPosResponse(data);
      if (list && list.length > 0) return list;
    }
  } catch (err) {
    console.warn(`[TechPOS Member] memberDetails error (${err.message}), falling back to memberlist`);
  }

  // Fallback to memberlist endpoint
  const fallbackUrl = `${baseUrl}/api/openAPI/memberlist?branchId=1&pageNumber=${pageNumber}&pageSize=${pageSize}`;
  console.log(`[TechPOS Member] Fetching via memberlist: ${fallbackUrl}`);
  const fallbackRes = await fetch(fallbackUrl, {
    method: 'GET',
    headers: {
      'TechPOSAPIKey': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!fallbackRes.ok) {
    const errText = await fallbackRes.text();
    throw new Error(`TechPOS fetchMemberDetails failed (${fallbackRes.status} ${fallbackRes.statusText}): ${errText}`);
  }

  const fbData = await fallbackRes.json();
  return extractListFromTechPosResponse(fbData);
}

/**
 * Bi-Directional Synchronization between Pharsyde and TechPOS
 * 1. Pulls all members from TechPOS and upserts into local MySQL `users` table
 * 2. Pushes local pending customers to TechPOS (search -> create or update)
 */
async function syncUsersBiDirectional({ maxPages = 10, pageSize = 500 } = {}) {
  console.log('🔄 ========================================================');
  console.log('🔄 Starting Bi-Directional TechPOS User Synchronization');
  console.log('🔄 ========================================================');

  await UserModel.createTable();

  const stats = {
    fetchedFromTechPOS: 0,
    importedFromTechPOS: 0,
    updatedFromTechPOS: 0,
    pushedToTechPOS: 0,
    errors: [],
  };

  // --------------------------------------------------------------------------
  // STEP 1: PULL FROM TECHPOS -> LOCAL MYSQL
  // --------------------------------------------------------------------------
  console.log('[Sync Step 1] Pulling members from TechPOS into local database...');
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    try {
      const members = await fetchTechPOSMemberDetails(page, pageSize);
      if (!members || members.length === 0) {
        hasMore = false;
        break;
      }

      stats.fetchedFromTechPOS += members.length;
      console.log(`[Sync Step 1] Page ${page}: received ${members.length} members from TechPOS`);

      for (const m of members) {
        try {
          const mId = m.id || m.memberId;
          const email = (m.email || '').trim().toLowerCase();
          const phone = (m.phone || m.phoneNumber || '').trim();
          const firstName = m.firstName || '';
          const lastName = m.lastName || '';
          const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'TechPOS Customer';
          const dob = m.dateOfBirth ? new Date(m.dateOfBirth) : null;
          const eliteStart = m.eliteMemberStartDate ? new Date(m.eliteMemberStartDate) : null;
          const eliteEnd = m.eliteMemberEndDate ? new Date(m.eliteMemberEndDate) : null;
          const rewardPoints = Number(m.rewardPoints) || 0.00;
          const rewardDollarValue = Number(m.rewardPointsDollarValue) || 0.00;
          const cardNumber = m.cardNumber || null;
          const isElite = Boolean(m.isElite);
          const visitCount = Number(m.visitCount) || 0;

          // Check if user exists locally by:
          // 1) techpos_member_id
          // 2) email
          // 3) phone
          let existingUser = null;
          if (mId) existingUser = await UserModel.findByTechPOSMemberId(mId);
          if (!existingUser && email) existingUser = await UserModel.findByEmail(email);
          if (!existingUser && phone) existingUser = await UserModel.findByPhone(phone);

          if (existingUser) {
            // Update existing user with TechPOS member details & reward points
            await UserModel.update(existingUser.id, {
              techpos_member_id: mId || existingUser.techpos_member_id,
              first_name: firstName || existingUser.first_name,
              last_name: lastName || existingUser.last_name,
              name: fullName || existingUser.name,
              mob_no: phone || existingUser.mob_no,
              date_of_birth: dob || existingUser.date_of_birth,
              elite_member_start_date: eliteStart || existingUser.elite_member_start_date,
              elite_member_end_date: eliteEnd || existingUser.elite_member_end_date,
              reward_points: rewardPoints,
              reward_points_dollar_value: rewardDollarValue,
              card_number: cardNumber || existingUser.card_number,
              is_elite: isElite,
              visit_count: visitCount || existingUser.visit_count,
              techpos_sync_status: 'synced',
              techpos_last_synced_at: new Date(),
            });
            stats.updatedFromTechPOS++;
          } else {
            // Import new member as Customer (unactivated password until online signup)
            const randomPassword = await bcrypt.hash(`TechPOS_${mId || Date.now()}_${Math.random()}`, 10);
            const userEmail = email || `member_${mId || Date.now()}@placeholder.techpos.ca`;

            await UserModel.create({
              name: fullName,
              first_name: firstName,
              last_name: lastName,
              email: userEmail,
              password: randomPassword,
              role: 'user',
              user_type: 'Customer',
              mob_no: phone || null,
              date_of_birth: dob,
              techpos_member_id: mId || null,
              elite_member_start_date: eliteStart,
              elite_member_end_date: eliteEnd,
              password_set: false, // Flag as in-store member awaiting online activation
              reward_points: rewardPoints,
              reward_points_dollar_value: rewardDollarValue,
              card_number: cardNumber,
              is_elite: isElite,
              visit_count: visitCount,
              techpos_sync_status: 'synced',
              techpos_last_synced_at: new Date(),
              active: true,
            });
            stats.importedFromTechPOS++;
          }
        } catch (memberErr) {
          stats.errors.push(`Member sync error (${m.id || m.memberId || m.email}): ${memberErr.message}`);
        }
      }

      if (members.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (pageErr) {
      console.warn(`[Sync Step 1 Warning] Failed to fetch page ${page}:`, pageErr.message);
      stats.errors.push(`Page ${page} fetch error: ${pageErr.message}`);
      hasMore = false;
    }
  }

  // --------------------------------------------------------------------------
  // STEP 2: PUSH LOCAL CUSTOMERS -> TECHPOS
  // --------------------------------------------------------------------------
  console.log('[Sync Step 2] Checking for local customers needing TechPOS sync...');
  try {
    const localPending = await UserModel.findCustomersNeedingSync();
    console.log(`[Sync Step 2] Found ${localPending.length} local customer(s) to synchronize.`);

    for (const customer of localPending) {
      try {
        if (customer.techpos_member_id) {
          // Member already has an ID, update on TechPOS
          await updateTechPOSMember(customer.techpos_member_id, {
            name: customer.name,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: customer.mob_no,
            email: customer.email,
            dateOfBirth: customer.date_of_birth,
            eliteMemberStartDate: customer.elite_member_start_date,
            eliteMemberEndDate: customer.elite_member_end_date,
          });

          await UserModel.update(customer.id, {
            techpos_sync_status: 'synced',
            techpos_last_synced_at: new Date(),
          });
          stats.pushedToTechPOS++;
        } else {
          // Member has no ID: First search TechPOS by email and phone to avoid duplicates
          let foundMember = null;
          try {
            if (customer.email) {
              const matchesEmail = await searchTechPOSMember({ email: customer.email.trim().toLowerCase() });
              if (matchesEmail && matchesEmail.length > 0) {
                foundMember = matchesEmail[0];
              }
            }
            if (!foundMember && customer.mob_no) {
              const matchesPhone = await searchTechPOSMember({ phoneNumber: customer.mob_no.trim() });
              if (matchesPhone && matchesPhone.length > 0) {
                foundMember = matchesPhone[0];
              }
            }
          } catch (searchErr) {
            console.warn(`[Sync Search Note] ${searchErr.message}`);
          }

          if (foundMember && (foundMember.id || foundMember.memberId)) {
            const linkedId = foundMember.id || foundMember.memberId;
            console.log(`[Sync Step 2] Customer "${customer.email}" matched existing TechPOS member #${linkedId}`);
            
            // Link locally with rewards
            await UserModel.update(customer.id, {
              techpos_member_id: linkedId,
              reward_points: Number(foundMember.rewardPoints) || customer.reward_points || 0.00,
              reward_points_dollar_value: Number(foundMember.rewardPointsDollarValue) || customer.reward_points_dollar_value || 0.00,
              card_number: foundMember.cardNumber || customer.card_number || null,
              is_elite: Boolean(foundMember.isElite),
              visit_count: Number(foundMember.visitCount) || customer.visit_count || 0,
              techpos_sync_status: 'synced',
              techpos_last_synced_at: new Date(),
            });

            // Update TechPOS with latest profile info
            try {
              await updateTechPOSMember(linkedId, {
                name: customer.name,
                firstName: customer.first_name,
                lastName: customer.last_name,
                phone: customer.mob_no,
                email: customer.email,
                dateOfBirth: customer.date_of_birth,
              });
            } catch (updErr) {
              console.warn(`[Sync Step 2 Note] Profile update note for #${linkedId}: ${updErr.message}`);
            }

            stats.pushedToTechPOS++;
          } else {
            // Create brand new member in TechPOS
            try {
              const created = await createTechPOSMember({
                name: customer.name,
                firstName: customer.first_name,
                lastName: customer.last_name,
                phone: customer.mob_no,
                email: customer.email,
                dateOfBirth: customer.date_of_birth,
              });

              const newMemberId = created.memberId || null;
              await UserModel.update(customer.id, {
                techpos_member_id: newMemberId,
                techpos_sync_status: 'synced',
                techpos_last_synced_at: new Date(),
              });
              stats.pushedToTechPOS++;
            } catch (createErr) {
              // If creation failed due to duplicate email/phone in TechPOS, try recovery search
              if (createErr.message && /unique|already exists|duplicate/i.test(createErr.message)) {
                console.log(`[Sync Recovery] Member "${customer.email}" duplicate detected. Searching to link existing...`);
                let recovered = null;
                try {
                  if (customer.email) {
                    const m = await searchTechPOSMember({ email: customer.email.trim().toLowerCase() });
                    if (m && m.length > 0) recovered = m[0];
                  }
                  if (!recovered && customer.mob_no) {
                    const m = await searchTechPOSMember({ phoneNumber: customer.mob_no.trim() });
                    if (m && m.length > 0) recovered = m[0];
                  }
                } catch {}

                if (recovered && (recovered.id || recovered.memberId)) {
                  const recId = recovered.id || recovered.memberId;
                  await UserModel.update(customer.id, {
                    techpos_member_id: recId,
                    techpos_sync_status: 'synced',
                    techpos_last_synced_at: new Date(),
                  });
                  stats.pushedToTechPOS++;
                  console.log(`[Sync Recovery] Successfully linked customer ID ${customer.id} to TechPOS member #${recId}!`);
                  continue;
                }
              }
              throw createErr;
            }
          }
        }
      } catch (pushErr) {
        console.warn(`[Sync Push Warning] Failed for customer ID ${customer.id}:`, pushErr.message);
        await UserModel.update(customer.id, {
          techpos_sync_status: 'failed',
        });
        stats.errors.push(`Customer ${customer.id} push error: ${pushErr.message}`);
      }
    }
  } catch (localErr) {
    console.error('[Sync Step 2 Error] Failed to scan local customers:', localErr.message);
    stats.errors.push(`Local customer scan error: ${localErr.message}`);
  }

  console.log('🔄 ========================================================');
  console.log('🔄 TechPOS Bi-Directional Synchronization Finished!');
  console.log(`📥 Total Fetched from TechPOS:  ${stats.fetchedFromTechPOS}`);
  console.log(`✨ New Imported from TechPOS:   ${stats.importedFromTechPOS}`);
  console.log(`🔄 Updated from TechPOS:        ${stats.updatedFromTechPOS}`);
  console.log(`🚀 Pushed/Synced to TechPOS:    ${stats.pushedToTechPOS}`);
  console.log(`⚠️ Errors:                     ${stats.errors.length}`);
  console.log('🔄 ========================================================');

  return {
    success: stats.errors.length === 0,
    stats,
  };
}

module.exports = {
  createTechPOSMember,
  updateTechPOSMember,
  searchTechPOSMember,
  fetchTechPOSMemberDetails,
  syncUsersBiDirectional,
};
