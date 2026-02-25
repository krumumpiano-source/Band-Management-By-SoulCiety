/**
 * Band Settings Service
 * Band Management By SoulCiety
 */

function saveBandSettings(data) {
  try {
    if (!data.bandName || !data.bandName.trim()) return { success: false, message: 'กรุณากรอกชื่อวง' };
    if (!data.bandId) {
      data.bandId = 'BAND_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    var now = new Date().toISOString();

    // Save band
    var bandSheet = getOrCreateSheet(CONFIG.SHEETS.BANDS, ['bandId','bandName','managerId','managerEmail','description','status','createdAt','updatedAt']);
    var bandData = bandSheet.getDataRange().getValues();
    var bandRow = -1;
    for (var i = 1; i < bandData.length; i++) {
      if (bandData[i][0] === data.bandId) { bandRow = i + 1; break; }
    }
    if (bandRow === -1) {
      bandSheet.appendRow([data.bandId, data.bandName, data.managerId || '', data.managerEmail || '', data.description || '', 'active', now, now]);
    } else {
      bandSheet.getRange(bandRow, 2).setValue(data.bandName);
      bandSheet.getRange(bandRow, 8).setValue(now);
    }

    // Save venues
    if (data.venues && data.venues.length > 0) {
      var venueSheet = getOrCreateSheet(CONFIG.SHEETS.VENUES, ['venueId','bandId','venueName','address','phone','contactPerson','defaultPay','notes','status','createdAt','updatedAt']);
      var venueData = venueSheet.getDataRange().getValues();
      for (var i = venueData.length - 1; i >= 1; i--) {
        if (venueData[i][1] === data.bandId) venueSheet.deleteRow(i + 1);
      }
      data.venues.forEach(function(v) {
        if (v.name && v.name.trim()) {
          var vid = v.id || ('VENUE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
          venueSheet.appendRow([vid, data.bandId, v.name.trim(), v.address || '', v.phone || '', v.contactPerson || '', v.defaultPay || 0, v.notes || '', 'active', now, now]);
        }
      });
    }

    // Save hourly rates
    if (data.hourlyRates && data.hourlyRates.length > 0) {
      var rateSheet = getOrCreateSheet(CONFIG.SHEETS.HOURLY_RATES, ['rateId','bandId','memberId','venueId','startTime','endTime','hourlyRate','createdAt','updatedAt']);
      var rateData = rateSheet.getDataRange().getValues();
      for (var i = rateData.length - 1; i >= 1; i--) {
        if (rateData[i][1] === data.bandId) rateSheet.deleteRow(i + 1);
      }
      data.hourlyRates.forEach(function(r) {
        if (r.memberId && r.hourlyRate > 0) {
          var rid = r.id || ('RATE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
          rateSheet.appendRow([rid, data.bandId, r.memberId, r.venueId || '', r.startTime || '', r.endTime || '', r.hourlyRate, now, now]);
        }
      });
    }

    return { success: true, data: { bandId: data.bandId } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getBandSettings(bandId) {
  try {
    var result = { bandId: bandId, bandName: '', venues: [], members: [], hourlyRates: [] };

    var bandSheet = getOrCreateSheet(CONFIG.SHEETS.BANDS, ['bandId','bandName','managerId','managerEmail','description','status','createdAt','updatedAt']);
    var bandData = bandSheet.getDataRange().getValues();
    for (var i = 1; i < bandData.length; i++) {
      if (bandData[i][0] === bandId) { result.bandName = bandData[i][1] || ''; break; }
    }

    var venueSheet = getOrCreateSheet(CONFIG.SHEETS.VENUES, ['venueId','bandId','venueName','address','phone','contactPerson','defaultPay','notes','status','createdAt','updatedAt']);
    var venueData = venueSheet.getDataRange().getValues();
    var venueHdrs = venueData[0];
    for (var i = 1; i < venueData.length; i++) {
      if (venueData[i][1] === bandId) {
        var v = {}; for (var j = 0; j < venueHdrs.length; j++) v[venueHdrs[j]] = venueData[i][j];
        result.venues.push(v);
      }
    }

    var memberResult = getAllBandMembers();
    if (memberResult.success) result.members = memberResult.data.filter(function(m) { return m.bandId === bandId; });

    // Load active invite code for this band
    try {
      // schema ต้องตรงกับ Code.gs:generateInviteCode (และ Setup.gs)
      var inviteSheet = getOrCreateSheet(CONFIG.SHEETS.INVITE_CODES, ['code','bandId','bandName','createdAt','expiresAt','status','usedBy']);
      var inviteData = inviteSheet.getDataRange().getValues();
      var invHdrs = inviteData[0];
      var invCi = {};
      invHdrs.forEach(function(h, idx) { invCi[h] = idx; });
      var now = new Date();
      var activeCode = null;
      for (var i = inviteData.length - 1; i >= 1; i--) {
        var row = inviteData[i];
        if (String(row[invCi['bandId']]) !== bandId) continue;
        if (row[invCi['status']] !== 'active') continue;
        var exp = new Date(row[invCi['expiresAt']]);
        if (exp > now) {
          activeCode = { code: row[invCi['code']], expiresAt: row[invCi['expiresAt']] };
          break;
        }
      }
      if (activeCode) {
        result.inviteCode = activeCode.code;
        result.inviteExpires = activeCode.expiresAt;
      }
    } catch(e) {
      // Invite codes are optional — don't fail getBandSettings because of this
      Logger.log('getBandSettings invite code error: ' + e);
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
