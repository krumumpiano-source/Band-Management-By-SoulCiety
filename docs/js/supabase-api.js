/**
 * Band Management By SoulCiety — Supabase API Wrapper
 * แทนที่ gasRun() ทุก action ด้วย Supabase REST SDK
 *
 * Load order ใน HTML:
 *   1. i18n.js
 *   2. app.js          ← inject Supabase SDK + ไฟล์นี้ อัตโนมัติ
 *   3. nav.js
 */
(function (global) {
  'use strict';

  // ── ⚙️ CONFIG — แก้ค่านี้หลังสร้าง Supabase project ─────────────
  var SUPABASE_URL    = (global._SB_CONFIG && global._SB_CONFIG.url)    || '';
  var SUPABASE_ANON   = (global._SB_CONFIG && global._SB_CONFIG.anon)   || '';
  // ──────────────────────────────────────────────────────────────────

  // รอ SDK โหลดก่อน แล้ว init
  function waitForSDK(cb, tries) {
    tries = tries || 0;
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      cb();
    } else if (tries < 100) {
      setTimeout(function () { waitForSDK(cb, tries + 1); }, 50);
    } else {
      console.error('Supabase SDK โหลดไม่สำเร็จ');
    }
  }

  waitForSDK(function () {
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: true, storage: localStorage }
    });
    global._sb = sb;

    // ── Helpers ─────────────────────────────────────────────────────
    function getBandId()   { return localStorage.getItem('bandId')   || ''; }
    function getRole()     { return localStorage.getItem('userRole') || ''; }

    function saveSession(session, profile) {
      localStorage.setItem('auth_token',    session.access_token);
      // ข้อมูลส่วนตัว
      localStorage.setItem('userTitle',     profile.title      || '');
      localStorage.setItem('userFirstName', profile.first_name || '');
      localStorage.setItem('userLastName',  profile.last_name  || '');
      localStorage.setItem('userNickname',  profile.nickname   || '');
      localStorage.setItem('userInstrument',profile.instrument || '');
      // ชื่อแสดง: ชื่อเล่น ถ้ามี ไม่มีใช้ first_name หรือ user_name
      var displayName = profile.nickname || profile.first_name || profile.user_name || '';
      localStorage.setItem('userName',   displayName);
      localStorage.setItem('userEmail',  profile.email      || '');
      localStorage.setItem('bandId',     profile.band_id    || '');
      localStorage.setItem('bandName',   profile.band_name  || '');
      localStorage.setItem('userRole',     profile.role       || 'member');
      localStorage.setItem('bandProvince',  profile.province   || '');
    }

    function clearSession() {
      ['auth_token','bandId','bandName','bandManager','userRole','userName',
       'userTitle','userFirstName','userLastName','userNickname','userInstrument','userEmail',
       'bandProvince'].forEach(function (k) {
        localStorage.removeItem(k);
      });
    }

    // snake_case → camelCase (เพื่อ backward compat กับ frontend เดิม)
    function toCamel(obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      var result = {};
      Object.keys(obj).forEach(function (k) {
        var camel = k.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
        result[camel] = obj[k];
      });
      return result;
    }
    function toCamelList(arr) { return (arr || []).map(toCamel); }

    // ── sbRun — interface เดิมกับ gasRun ──────────────────────────
    function sbRun(action, data, callback) {
      dispatch(action, data || {}).then(function (result) {
        if (result && result.authError) {
          clearSession();
          window.location.replace('index.html');
          return;
        }
        if (callback) callback(result);
      }).catch(function (err) {
        console.error('[sbRun]', action, err);
        if (callback) callback({ success: false, message: err.message || err.toString() });
      });
    }
    global.sbRun  = sbRun;
    global.gasRun = sbRun;   // override gasRun เดิมทั้งหมด

    // ── dispatch ────────────────────────────────────────────────────
    async function dispatch(action, d) {
      switch (action) {

        // ── Auth ───────────────────────────────────────────────────
        case 'login':               return doLogin(d);
        case 'register':            return doRegister(d);
        case 'logout':              return doLogout();
        case 'requestPasswordReset':
        case 'verifyPasswordResetOtp':
        case 'resetPassword':
          return { success: false, message: 'ฟีเจอร์นี้ยังไม่เปิด กรุณาติดต่อ Admin' };

        // ── Invite ─────────────────────────────────────────────────
        case 'generateInviteCode':  return doGenerateInviteCode(d);
        case 'lookupInviteCode':    return doLookupInviteCode(d);

        // ── Songs ──────────────────────────────────────────────────
        case 'getAllSongs':         return doGetAllSongs(d);
        case 'getSong':            return doGetOne('band_songs', d.songId);
        case 'addSong':            return doInsert('band_songs', d.data || d);
        case 'updateSong':         return doUpdate('band_songs', d.songId, d.data || d);
        case 'deleteSong':         return doDelete('band_songs', d.songId);
        case 'savePlaylistHistory':return doInsert('playlist_history', d.data || d);
        case 'getPlaylistHistory': return doSelect('playlist_history', { band_id: getBandId() }, '-created_at', 50);

        // ── Band Members ───────────────────────────────────────────
        case 'getAllBandMembers':   return doGetBandMembers();
        case 'addBandMember':      return doInsert('band_members', d.data || d);
        case 'updateBandMember':   return doUpdate('band_members', d.memberId, d.data || d);
        case 'deleteBandMember':   return doDelete('band_members', d.memberId);

        // ── Attendance ─────────────────────────────────────────────
        case 'addAttendancePayroll':    return doInsert('attendance_payroll', d.data || d);
        case 'getAllAttendancePayroll':  return doGetAttendance(d);
        case 'updateAttendancePayroll': return doUpdate('attendance_payroll', d.recordId, d.data || d);
        case 'deleteAttendancePayroll': return doDelete('attendance_payroll', d.recordId);

        // ── Check-in ───────────────────────────────────────────────
        case 'memberCheckIn':      return doMemberCheckIn(d);
        case 'getMyCheckIn':       return doGetMyCheckIn(d);
        case 'getCheckInsForDate': return doSelect('member_check_ins', { band_id: getBandId(), date: d.date });

        // ── Leave ──────────────────────────────────────────────────
        case 'requestLeave':       return doInsert('leave_requests', d);
        case 'getMyLeaveRequests': return doSelect('leave_requests', { band_id: getBandId(), member_id: d.memberId }, '-date', 100);
        case 'getAllLeaveRequests': return doSelect('leave_requests', { band_id: getBandId() }, '-date', 200);
        case 'assignSubstitute':   return doUpdate('leave_requests', d.leaveId, { substitute_id: d.substituteId, substitute_name: d.substituteName, status: 'approved' });
        case 'rejectLeave':        return doUpdate('leave_requests', d.leaveId, { status: 'rejected' });

        case 'getDashboardSummary': return doGetDashboardSummary();

        // ── Band Settings ──────────────────────────────────────────
        case 'saveBandSettings':   return doSaveBandSettings(d);
        case 'getBandSettings':    return doGetBandSettings(d.bandId || getBandId());

        // ── Schedule ───────────────────────────────────────────────
        case 'saveSchedule':  return doSaveSchedule(d);
        case 'getSchedule':   return doGetSchedule(d);
        case 'addJob':        return doInsert('schedule', Object.assign({ band_id: getBandId() }, toSnakeObj(d)));
        case 'updateJob':     return doUpdate('schedule', d.scheduleId, d);
        case 'deleteJob':     return doDelete('schedule', d.scheduleId);

        // ── Equipment ──────────────────────────────────────────────
        case 'getAllEquipment':   return doSelect('equipment', { band_id: getBandId() }, 'name');
        case 'addEquipment':      return doInsert('equipment', d.data || d);
        case 'updateEquipment':   return doUpdate('equipment', d.equipmentId, d.data || d);
        case 'deleteEquipment':   return doDelete('equipment', d.equipmentId);

        // ── Clients ────────────────────────────────────────────────
        case 'getAllClients':   return doSelect('clients', { band_id: getBandId() }, 'name');
        case 'addClient':      return doInsert('clients', d.data || d);
        case 'updateClient':   return doUpdate('clients', d.clientId, d.data || d);
        case 'deleteClient':   return doDelete('clients', d.clientId);

        // ── Quotations ─────────────────────────────────────────────
        case 'getAllQuotations': return doSelect('quotations', { band_id: getBandId() }, '-date');
        case 'addQuotation':    return doInsert('quotations', d.data || d);
        case 'updateQuotation': return doUpdate('quotations', d.quotationId, d.data || d);
        case 'deleteQuotation': return doDelete('quotations', d.quotationId);

        // ── Profile ────────────────────────────────────────────────
        case 'getMyProfile':    return doGetMyProfile();
        case 'updateMyProfile': return doUpdateMyProfile(d);

        // ── Admin ──────────────────────────────────────────────────
        case 'getAllUsers':     return doAdminGetAllUsers();
        case 'updateUserRole':  return doUpdate('profiles', d.userId, { role: d.role });
        case 'deleteUser':      return doAdminDeleteUser(d.userId);
        case 'getSystemInfo':   return doGetSystemInfo();

        default:
          return { success: false, message: 'Unknown action: ' + action };
      }
    }

    // ── camelCase payload → snake_case row ──────────────────────────
    function toSnakeObj(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      var result = {};
      var fieldMap = {
        bandId: 'band_id', bandName: 'band_name', venueId: 'venue_id',
        venueName: 'venue_name', memberId: 'member_id', memberName: 'member_name',
        clientId: 'client_id', clientName: 'client_name', quotationId: 'quotation_id',
        leaveId: 'leave_id', substituteId: 'substitute_id', substituteName: 'substitute_name',
        scheduleId: 'schedule_id', equipmentId: 'equipment_id',
        timeSlots: 'time_slots', dayOfWeek: 'day_of_week', totalPay: 'total_pay',
        totalAmount: 'total_amount', priceAdjustments: 'price_adjustments',
        defaultHourlyRate: 'default_hourly_rate', defaultPay: 'default_pay',
        joinedAt: 'joined_at', checkInAt: 'check_in_at', expiresAt: 'expires_at',
        eventDate: 'event_date', eventType: 'event_type', vatAmount: 'vat_amount',
        docUrl: 'doc_url', serialNo: 'serial_no', purchaseDate: 'purchase_date',
        contactPerson: 'contact_person', lineId: 'line_id',
        totalGigs: 'total_gigs', totalRevenue: 'total_revenue',
        effectiveFrom: 'effective_from', effectiveTo: 'effective_to',
        hourlyRate: 'hourly_rate', startTime: 'start_time', endTime: 'end_time',
        // profile fields
        firstName: 'first_name', lastName: 'last_name', userName: 'user_name',
        userId: 'user_id'
      };
      Object.keys(obj).forEach(function (k) {
        if (k === '_token' || k === 'action') return;
        var snakeKey = fieldMap[k] || k;
        result[snakeKey] = obj[k];
      });
      return result;
    }

    // ── Generic CRUD ─────────────────────────────────────────────
    async function doSelect(table, filters, order, limit) {
      var q = sb.from(table).select('*');
      if (filters) {
        Object.keys(filters).forEach(function (k) { q = q.eq(k, filters[k]); });
      }
      if (order) {
        var desc = order.startsWith('-');
        q = q.order(desc ? order.slice(1) : order, { ascending: !desc });
      }
      if (limit) q = q.limit(limit);
      var { data, error } = await q;
      if (error) throw error;
      return { success: true, data: toCamelList(data) };
    }

    async function doGetOne(table, id) {
      if (!id) return { success: false, message: 'ไม่พบ id' };
      var { data, error } = await sb.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return { success: true, data: toCamel(data) };
    }

    async function doInsert(table, payload) {
      var row = toSnakeObj(Object.assign({ band_id: getBandId() }, payload));
      delete row.action; delete row._token;
      var { data, error } = await sb.from(table).insert(row).select().single();
      if (error) throw error;
      return { success: true, data: toCamel(data) };
    }

    async function doUpdate(table, id, payload) {
      if (!id) return { success: false, message: 'ไม่พบ id' };
      var row = toSnakeObj(payload);
      delete row.action; delete row._token;
      row.updated_at = new Date().toISOString();
      var { data, error } = await sb.from(table).update(row).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data: toCamel(data) };
    }

    async function doDelete(table, id) {
      if (!id) return { success: false, message: 'ไม่พบ id' };
      var { error } = await sb.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    }

    // ── Auth ─────────────────────────────────────────────────────
    async function doLogin(d) {
      var { data, error } = await sb.auth.signInWithPassword({
        email: d.email, password: d.password
      });
      if (error) return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };

      // ดึง profile
      var { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
      saveSession(data.session, profile || {});
      var p = profile || {};
      var displayName = p.nickname || p.first_name || p.user_name || d.email.split('@')[0];
      return {
        success:    true,
        token:      data.session.access_token,
        userName:   displayName,
        userTitle:  p.title      || '',
        firstName:  p.first_name || '',
        lastName:   p.last_name  || '',
        nickname:   p.nickname   || '',
        instrument: p.instrument || '',
        bandId:     p.band_id    || '',
        bandName:   p.band_name  || '',
        role:       p.role       || 'member'
      };
    }

    async function doRegister(d) {
      var meta = {
        user_name:  d.nickname || d.firstName || d.name || d.email.split('@')[0],
        title:      d.title      || '',
        first_name: d.firstName  || '',
        last_name:  d.lastName   || '',
        nickname:   d.nickname   || '',
        instrument: d.instrument || '',
        band_name:  d.bandName   || '',
        role:       d.inviteCode ? 'member' : 'manager'
      };

      var { data, error } = await sb.auth.signUp({
        email: d.email, password: d.password,
        options: { data: meta }
      });
      if (error) return { success: false, message: error.message };

      // ถ้ามี invite code → redeem
      if (d.inviteCode && d.inviteCode.trim() && data.user) {
        var { data: result, error: rErr } = await sb.rpc('redeem_invite_code', {
          p_code:    d.inviteCode.toUpperCase(),
          p_user_id: data.user.id
        });
        if (rErr || !result.success) {
          // ลบ user ที่สร้างไปแล้ว
          await sb.auth.admin.deleteUser(data.user.id).catch(function(){});
          return { success: false, message: (result && result.message) || 'รหัสวงไม่ถูกต้อง' };
        }
        var provincePart = result.province ? ' (' + result.province + ')' : '';
        return { success: true, message: 'สมัครสำเร็จ! ส่งคำขอเข้าร่วมวง ' + result.band_name + provincePart + ' แล้ว รอผู้จัดการวงอนุมัติ' };
      }

      // manager ใหม่ → สร้าง band แล้วอัปเดต profile
      if (data.user) {
        var { data: band } = await sb.from('bands').insert({
          band_name:     meta.band_name || (meta.user_name + "'s Band"),
          province:      d.province || '',
          manager_id:    data.user.id,
          manager_email: d.email,
          status:        'active'
        }).select().single();

        if (band) {
          await sb.from('profiles').update({
            band_id:   band.id,
            band_name: band.band_name,
            province:  band.province || '',
            role:      'manager'
          }).eq('id', data.user.id);
        }
      }
      return { success: true, message: 'สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อน login' };
    }

    async function doLogout() {
      await sb.auth.signOut();
      clearSession();
      return { success: true };
    }

    // ── Songs ─────────────────────────────────────────────────────
    async function doGetAllSongs(d) {
      var source = d.source || 'global';
      var q = sb.from('band_songs').select('*').order('name');
      if (source === 'band') q = q.eq('band_id', getBandId());
      var { data, error } = await q.limit(500);
      if (error) throw error;
      return { success: true, data: toCamelList(data) };
    }

    // ── Band Members ──────────────────────────────────────────────
    async function doGetBandMembers() {
      var { data, error } = await sb.from('band_members')
        .select('*')
        .eq('band_id', getBandId())
        .neq('status', 'inactive')
        .order('name');
      if (error) throw error;
      return { success: true, data: toCamelList(data) };
    }

    // ── Attendance ────────────────────────────────────────────────
    async function doGetAttendance(d) {
      var bandId   = d.bandId || getBandId();
      var year     = d.year   || String(new Date().getFullYear());
      var page     = Math.max(1, parseInt(d.page)     || 1);
      var pageSize = Math.min(200, parseInt(d.pageSize) || 50);

      var q = sb.from('attendance_payroll').select('*', { count: 'exact' })
        .eq('band_id', bandId)
        .order('date', { ascending: false });

      if (year && year !== 'all') q = q.like('date', year + '%');
      if (d.startDate) q = q.gte('date', d.startDate);
      if (d.endDate)   q = q.lte('date', d.endDate);

      var from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);

      var { data, error, count } = await q;
      if (error) throw error;
      var totalPages = Math.ceil((count || 0) / pageSize) || 1;
      return { success: true, data: toCamelList(data), total: count, page: page, pageSize: pageSize, totalPages: totalPages, year: year };
    }

    // ── Check-in ──────────────────────────────────────────────────
    async function doMemberCheckIn(d) {
      var today = new Date().toISOString().slice(0, 10);
      var { data: exist } = await sb.from('member_check_ins')
        .select('id').eq('band_id', getBandId())
        .eq('member_id', d.memberId).eq('date', today).limit(1);
      if (exist && exist.length > 0) return { success: false, message: 'เช็คอินวันนี้ไปแล้ว' };

      var { data, error } = await sb.from('member_check_ins').insert({
        band_id:     getBandId(),
        member_id:   d.memberId,
        member_name: d.memberName || '',
        date:        today,
        check_in_at: new Date().toISOString(),
        status:      'present'
      }).select().single();
      if (error) throw error;
      return { success: true, data: toCamel(data) };
    }

    async function doGetMyCheckIn(d) {
      var today = new Date().toISOString().slice(0, 10);
      var { data } = await sb.from('member_check_ins')
        .select('*').eq('band_id', getBandId())
        .eq('member_id', d.memberId).eq('date', today).limit(1);
      return { success: true, data: (data && data.length > 0) ? toCamel(data[0]) : null };
    }

    // ── Schedule ──────────────────────────────────────────────────
    async function doGetSchedule(d) {
      var bandId = d.bandId || getBandId();
      var year   = d.year   || String(new Date().getFullYear());
      var q = sb.from('schedule').select('*').eq('band_id', bandId).order('date');
      if (year && year !== 'all') q = q.like('date', year + '%');
      var { data, error } = await q.limit(500);
      if (error) throw error;
      return { success: true, data: toCamelList(data) };
    }

    async function doSaveSchedule(d) {
      var bandId = d.bandId || getBandId();
      var items  = d.scheduleData || [];
      // ลบของเดิม
      await sb.from('schedule').delete().eq('band_id', bandId);
      // insert ใหม่
      if (items.length > 0) {
        var rows = items.map(function (item) {
          return Object.assign({ band_id: bandId }, toSnakeObj(item));
        });
        var { error } = await sb.from('schedule').insert(rows);
        if (error) throw error;
      }
      return { success: true, message: 'บันทึกตารางงานเรียบร้อย' };
    }

    // ── Band Settings ─────────────────────────────────────────────
    // ── Dashboard Summary ─────────────────────────────────────────
    async function doGetDashboardSummary() {
      var bandId = getBandId();
      var today = new Date().toISOString().split('T')[0];
      var firstOfMonth = today.substring(0, 7) + '-01';

      var [memberRes, jobRes, upcomingRes, quotRes, finRes] = await Promise.all([
        sb.from('band_members').select('id', { count: 'exact', head: true }).eq('band_id', bandId),
        sb.from('schedule').select('id,venue_name,date,type').eq('band_id', bandId).gte('date', today).order('date', { ascending: true }).limit(5),
        sb.from('schedule').select('id', { count: 'exact', head: true }).eq('band_id', bandId).gte('date', today),
        sb.from('quotations').select('id', { count: 'exact', head: true }).eq('band_id', bandId),
        sb.from('attendance_payroll').select('total_amount').eq('band_id', bandId).gte('date', firstOfMonth)
      ]);

      var income = 0;
      (finRes.data || []).forEach(function(r) { income += (r.total_amount || 0); });

      // fund/expense: future tables; use 0 for now
      return {
        success: true,
        data: {
          memberCount:    memberRes.count  || 0,
          upcomingJobs:   upcomingRes.count || 0,
          revenueMonth:   income,
          quotationCount: quotRes.count    || 0,
          jobs: (jobRes.data || []).map(function(j) {
            return { date: j.date, venue: j.venue_name || '', band: '', type: j.type || '' };
          }),
          finance: { income: income, expense: 0, fund: 0 }
        }
      };
    }

    async function doGetBandSettings(bandId) {
      var { data } = await sb.from('band_settings').select('settings').eq('band_id', bandId || getBandId()).single();
      return { success: true, data: (data && data.settings) || {} };
    }

    async function doSaveBandSettings(d) {
      var bandId = d.bandId || getBandId();
      var settings = Object.assign({}, d);
      delete settings.bandId; delete settings.action; delete settings._token;
      var { error } = await sb.from('band_settings').upsert({ band_id: bandId, settings: settings, updated_at: new Date().toISOString() }, { onConflict: 'band_id' });
      if (error) throw error;
      // Sync band_name to profiles so dashboard shows correct name after next login
      if (d.bandName) {
        var { data: authUser } = await sb.auth.getUser();
        if (authUser && authUser.user) {
          await sb.from('profiles').update({ band_name: d.bandName }).eq('id', authUser.user.id);
        }
        localStorage.setItem('bandName', d.bandName);
      }
      return { success: true };
    }

    // ── Band Code (รหัสประจำวง) ─────────────────────────────────
    async function doGenerateInviteCode(d) {
      var bandId   = d.bandId   || getBandId();
      var bandName = d.bandName || localStorage.getItem('bandName') || '';
      var province = d.province || localStorage.getItem('bandProvince') || '';
      var { data, error } = await sb.rpc('generate_band_code', {
        p_band_id:   bandId,
        p_band_name: bandName,
        p_province:  province
      });
      if (error) throw error;
      return data;
    }

    async function doLookupInviteCode(d) {
      var code = (d.code || '').toUpperCase();
      if (!code) return { success: false, message: 'ไม่มีรหัส' };
      var { data, error } = await sb.rpc('lookup_invite_code', { p_code: code });
      if (error) return { success: false, message: error.message };
      if (!data || !data.success) return { success: false, message: (data && data.message) || 'รหัสวงไม่ถูกต้อง' };
      return { success: true, band_name: data.band_name, province: data.province, member_count: data.member_count };
    }

    // ── Pending Members (อนุมัติสมาชิก) ──────────────────────────
    async function doGetPendingMembers(d) {
      var bandId = d.bandId || getBandId();
      var { data, error } = await sb.rpc('get_pending_members', { p_band_id: bandId });
      if (error) throw error;
      return { success: true, data: data || [] };
    }

    async function doApproveMember(d) {
      var bandId = d.bandId || getBandId();
      var { data, error } = await sb.rpc('approve_member', { p_user_id: d.userId, p_band_id: bandId });
      if (error) throw error;
      return data;
    }

    async function doRejectMember(d) {
      var bandId = d.bandId || getBandId();
      var { data, error } = await sb.rpc('reject_member', { p_user_id: d.userId, p_band_id: bandId });
      if (error) throw error;
      return data;
    }

    // ── Profile ───────────────────────────────────────────────────
    async function doGetMyProfile() {
      var { data: user } = await sb.auth.getUser();
      if (!user || !user.user) return { success: false, message: 'ไม่ได้ login' };
      var { data, error } = await sb.from('profiles').select('*').eq('id', user.user.id).single();
      if (error) throw error;
      return { success: true, data: toCamel(data) };
    }

    async function doUpdateMyProfile(d) {
      var { data: user } = await sb.auth.getUser();
      if (!user || !user.user) return { success: false, message: 'ไม่ได้ login' };
      var uid = user.user.id;

      var row = {
        title:      d.title      || '',
        first_name: d.firstName  || '',
        last_name:  d.lastName   || '',
        nickname:   d.nickname   || '',
        instrument: d.instrument || '',
        updated_at: new Date().toISOString()
      };
      // อัปเดต user_name เป็นชื่อเล่น (ถ้ามี)
      if (d.nickname) row.user_name = d.nickname;

      var { data, error } = await sb.from('profiles').update(row).eq('id', uid).select().single();
      if (error) throw error;

      // อัปเดต localStorage ด้วย
      localStorage.setItem('userTitle',      row.title);
      localStorage.setItem('userFirstName',  row.first_name);
      localStorage.setItem('userLastName',   row.last_name);
      localStorage.setItem('userNickname',   row.nickname);
      localStorage.setItem('userInstrument', row.instrument);
      if (d.nickname) localStorage.setItem('userName', d.nickname);

      return { success: true, data: toCamel(data), message: 'บันทึกข้อมูลส่วนตัวเรียบร้อย' };
    }

    // ── Admin ─────────────────────────────────────────────────────
    async function doAdminGetAllUsers() {
      var { data, error } = await sb.from('profiles').select('*').order('email');
      if (error) throw error;
      return { success: true, data: toCamelList(data) };
    }

    async function doAdminDeleteUser(userId) {
      // ลบ profile (cascade ลบ auth user ด้วย)
      var { error } = await sb.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      return { success: true };
    }

    async function doGetSystemInfo() {
      var [u, m, s, sg] = await Promise.all([
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb.from('band_members').select('id', { count: 'exact', head: true }),
        sb.from('schedule').select('id', { count: 'exact', head: true }),
        sb.from('band_songs').select('id', { count: 'exact', head: true })
      ]);
      return { success: true, data: {
        userCount:     u.count || 0,
        memberCount:   m.count || 0,
        scheduleCount: s.count || 0,
        songCount:     sg.count || 0,
        serverTime:    new Date().toISOString()
      }};
    }

    // ── Restore session จาก Supabase ─────────────────────────────
    sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('auth_token', session.access_token);
      }
      if (event === 'SIGNED_OUT') {
        clearSession();
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        localStorage.setItem('auth_token', session.access_token);
      }
    });

    console.log('[SoulCiety] Supabase API พร้อมใช้งาน');
  }); // end waitForSDK

})(window);
