/**
 * Band Management By SoulCiety â€” i18n (Thai / English)
 * à¸—à¸¸à¸ text à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡à¸œà¸¥à¸•à¹‰à¸­à¸‡à¸¡à¸²à¸ˆà¸²à¸ dictionary à¸™à¸µà¹‰à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™
 */
(function(global){
  'use strict';
  const LANG_KEY = 'soulciety_lang';

  const i18n = {
    th: {
      appTitle: 'Band Management By SoulCiety',
      langTh: 'à¹„à¸—à¸¢', langEn: 'English',
      login: 'à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š', logout: 'à¸­à¸­à¸à¸ˆà¸²à¸à¸£à¸°à¸šà¸š', register: 'à¸ªà¸¡à¸±à¸„à¸£à¸ªà¸¡à¸²à¸Šà¸´à¸',
      email: 'à¸­à¸µà¹€à¸¡à¸¥', password: 'à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™', rememberMe: 'à¸ˆà¸”à¸ˆà¸³à¸à¸²à¸£à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š', forgotPassword: 'à¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™?',
      enterEmail: 'à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸­à¸µà¹€à¸¡à¸¥', enterPassword: 'à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™',
      noAccount: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸±à¸à¸Šà¸µ?', registerNew: 'à¸ªà¸¡à¸±à¸„à¸£à¸ªà¸¡à¸²à¸Šà¸´à¸à¹ƒà¸«à¸¡à¹ˆ', or: 'à¸«à¸£à¸·à¸­',
      demoLogin: 'à¹€à¸‚à¹‰à¸²à¹‚à¸«à¸¡à¸”à¸—à¸”à¸ªà¸­à¸šà¸—à¸±à¸™à¸—à¸µ (à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸¥à¹‡à¸­à¸à¸­à¸´à¸™)',
      errInvalidEmail: 'à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸­à¸µà¹€à¸¡à¸¥à¹ƒà¸«à¹‰à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡', errEnterPassword: 'à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™',
      save: 'à¸šà¸±à¸™à¸—à¸¶à¸', cancel: 'à¸¢à¸à¹€à¸¥à¸´à¸', delete: 'à¸¥à¸š', edit: 'à¹à¸à¹‰à¹„à¸‚', add: 'à¹€à¸žà¸´à¹ˆà¸¡', search: 'à¸„à¹‰à¸™à¸«à¸²',
      loading: 'à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”...', yes: 'à¹ƒà¸Šà¹ˆ', no: 'à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆ', ok: 'à¸•à¸à¸¥à¸‡', close: 'à¸›à¸´à¸”', back: 'à¸à¸¥à¸±à¸š', next: 'à¸–à¸±à¸”à¹„à¸›', submit: 'à¸ªà¹ˆà¸‡', required: 'à¸ˆà¸³à¹€à¸›à¹‡à¸™', confirm: 'à¸¢à¸·à¸™à¸¢à¸±à¸™',
      confirmDeleteTitle: 'à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸¥à¸š', confirmDeleteMsg: 'à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸¥à¸šà¸£à¸²à¸¢à¸à¸²à¸£à¸™à¸µà¹‰à¹ƒà¸Šà¹ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ? à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸à¸¹à¹‰à¸„à¸·à¸™à¹„à¸”à¹‰',
      // Nav
      nav_dashboard: 'à¹à¸”à¸Šà¸šà¸­à¸£à¹Œà¸”', nav_songs: 'à¸„à¸¥à¸±à¸‡à¹€à¸žà¸¥à¸‡ & à¸¥à¸´à¸ªà¹€à¸žà¸¥à¸‡', nav_attendance: 'à¸¥à¸‡à¹€à¸§à¸¥à¸²-à¹€à¸šà¸´à¸à¸ˆà¹ˆà¸²à¸¢',
      nav_externalPayout: 'à¹€à¸šà¸´à¸à¸ˆà¹ˆà¸²à¸¢à¸‡à¸²à¸™à¸™à¸­à¸', nav_schedule: 'à¸•à¸²à¸£à¸²à¸‡à¸‡à¸²à¸™', nav_jobCalculator: 'à¸„à¸³à¸™à¸§à¸“à¸‡à¸²à¸™à¸™à¸­à¸',
      nav_quotation: 'à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²', nav_contract: 'à¸ªà¸±à¸à¸à¸²à¸§à¹ˆà¸²à¸ˆà¹‰à¸²à¸‡', nav_statistics: 'à¸ªà¸–à¸´à¸•à¸´',
      nav_songInsights: 'à¸ªà¸–à¸´à¸•à¸´à¹€à¸žà¸¥à¸‡', nav_bandFund: 'à¹€à¸‡à¸´à¸™à¸à¸­à¸‡à¸à¸¥à¸²à¸‡', nav_settings: 'à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²',
      nav_bandInfo: 'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸§à¸‡', nav_userManual: 'à¸„à¸¹à¹ˆà¸¡à¸·à¸­', nav_admin: 'à¹à¸­à¸”à¸¡à¸´à¸™',
      nav_equipment: 'à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ', nav_clients: 'à¸¥à¸¹à¸à¸„à¹‰à¸²',
      // Dashboard
      dash_title: 'à¹à¸”à¸Šà¸šà¸­à¸£à¹Œà¸”', dash_subtitle: 'à¸ à¸²à¸žà¸£à¸§à¸¡à¸§à¸‡à¸”à¸™à¸•à¸£à¸µà¹à¸¥à¸°à¸ªà¸´à¹ˆà¸‡à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸—à¸³',
      dash_todaySummary: 'à¸ªà¸£à¸¸à¸›à¸”à¹ˆà¸§à¸™à¸§à¸±à¸™à¸™à¸µà¹‰', dash_date: 'à¸§à¸±à¸™à¸—à¸µà¹ˆ', dash_todayGigs: 'à¸‡à¸²à¸™à¸§à¸±à¸™à¸™à¸µà¹‰',
      dash_todayMembers: 'à¸ªà¸¡à¸²à¸Šà¸´à¸à¸—à¸³à¸‡à¸²à¸™à¸§à¸±à¸™à¸™à¸µà¹‰', dash_nextGig: 'à¸‡à¸²à¸™à¸–à¸±à¸”à¹„à¸›', dash_noJobs: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‡à¸²à¸™',
      dash_viewAllSchedule: 'à¸”à¸¹à¸•à¸²à¸£à¸²à¸‡à¸‡à¸²à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”', dash_finance: 'à¸à¸²à¸£à¹€à¸‡à¸´à¸™',
      dash_monthlyIncome: 'à¸£à¸²à¸¢à¸£à¸±à¸šà¹€à¸”à¸·à¸­à¸™à¸™à¸µà¹‰', dash_pendingFromVenues: 'à¹€à¸‡à¸´à¸™à¸„à¹‰à¸²à¸‡à¸ˆà¸²à¸à¸£à¹‰à¸²à¸™', dash_payToMembers: 'à¹€à¸‡à¸´à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸ˆà¹ˆà¸²à¸¢à¸ªà¸¡à¸²à¸Šà¸´à¸',
      dash_quickActions: 'à¸à¸²à¸£à¸à¸£à¸°à¸—à¸³à¸”à¹ˆà¸§à¸™', dash_createSetlist: 'à¸ªà¸£à¹‰à¸²à¸‡à¸¥à¸´à¸ªà¹€à¸žà¸¥à¸‡', dash_logTime: 'à¸¥à¸‡à¹€à¸§à¸¥à¸²à¸‡à¸²à¸™',
      dash_createReceipt: 'à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹€à¸šà¸´à¸', dash_createQuotation: 'à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²', dash_manual: 'à¸„à¸¹à¹ˆà¸¡à¸·à¸­à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™',
      dash_jobsStatus: 'à¸‡à¸²à¸™ & à¸ªà¸–à¸²à¸™à¸°à¸‡à¸²à¸™', dash_equipment_alert: 'à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸‹à¹ˆà¸­à¸¡',
      // Songs
      songs_title: 'à¸„à¸¥à¸±à¸‡à¹€à¸žà¸¥à¸‡ & à¸¥à¸´à¸ªà¹€à¸žà¸¥à¸‡', songs_subtitle: 'à¹€à¸¥à¸·à¸­à¸à¹€à¸žà¸¥à¸‡à¸ˆà¸²à¸à¸„à¸¥à¸±à¸‡ à¸ªà¸£à¹‰à¸²à¸‡à¸¥à¸´à¸ª à¸„à¸±à¸”à¸¥à¸­à¸à¸«à¸£à¸·à¸­à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸›à¹‡à¸™à¸£à¸¹à¸›',
      songs_addSong: 'à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸žà¸¥à¸‡', songs_createSetlist: 'à¸ªà¸£à¹‰à¸²à¸‡à¸¥à¸´à¸ª', songs_filter: 'à¸à¸£à¸­à¸‡',
      songs_noSongs: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹€à¸žà¸¥à¸‡', songs_selectAll: 'à¹€à¸¥à¸·à¸­à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”', songs_clearAll: 'à¸¥à¹‰à¸²à¸‡à¸à¸²à¸£à¹€à¸¥à¸·à¸­à¸',
      songs_copy: 'à¸„à¸±à¸”à¸¥à¸­à¸', songs_saveAsImage: 'à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸›à¹‡à¸™à¸£à¸¹à¸›', songs_transpose: 'à¸—à¸£à¸²à¸™à¸ªà¹‚à¸žà¸ª',
      songs_name: 'à¸Šà¸·à¹ˆà¸­à¹€à¸žà¸¥à¸‡', songs_key: 'à¸„à¸µà¸¢à¹Œ', songs_bpm: 'BPM', songs_era: 'à¸¢à¸¸à¸„', songs_singer: 'à¸™à¸±à¸à¸£à¹‰à¸­à¸‡', songs_mood: 'à¸­à¸²à¸£à¸¡à¸“à¹Œ',
      // Attendance
      att_title: 'à¸¥à¸‡à¹€à¸§à¸¥à¸²à¹à¸¥à¸°à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™ (à¸£à¹‰à¸²à¸™à¸›à¸£à¸°à¸ˆà¸³)', att_subtitle: 'à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸§à¸¥à¸²à¸—à¸³à¸‡à¸²à¸™à¹à¸¥à¸°à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸ˆà¸²à¸à¸£à¹‰à¸²à¸™',
      ext_title: 'à¹€à¸šà¸´à¸à¸ˆà¹ˆà¸²à¸¢à¸‡à¸²à¸™à¸™à¸­à¸', ext_subtitle: 'à¸„à¸³à¸™à¸§à¸“à¹à¸¥à¸°à¹€à¸šà¸´à¸à¸ˆà¹ˆà¸²à¸¢à¸£à¸²à¸¢à¸„à¸™à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸™à¸­à¸/à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ',
      // Schedule
      sched_title: 'à¸•à¸²à¸£à¸²à¸‡à¸‡à¸²à¸™', sched_subtitle: 'à¸”à¸¹à¸•à¸²à¸£à¸²à¸‡à¸‡à¸²à¸™à¸—à¸±à¹‰à¸‡à¸£à¸²à¸¢à¸„à¸™à¹à¸¥à¸°à¸—à¸±à¹‰à¸‡à¸§à¸‡ à¹€à¸žà¸´à¹ˆà¸¡à¸‡à¸²à¸™à¸™à¸­à¸ à¹à¸¥à¸°à¸”à¸¹à¸¢à¹‰à¸­à¸™à¸«à¸¥à¸±à¸‡',
      sched_add: 'à¹€à¸žà¸´à¹ˆà¸¡à¸‡à¸²à¸™', sched_venue: 'à¸£à¹‰à¸²à¸™/à¸ªà¸–à¸²à¸™à¸—à¸µà¹ˆ', sched_date: 'à¸§à¸±à¸™à¸—à¸µà¹ˆ', sched_time: 'à¹€à¸§à¸¥à¸²',
      sched_type: 'à¸›à¸£à¸°à¹€à¸ à¸—', sched_pay: 'à¸„à¹ˆà¸²à¸•à¸­à¸šà¹à¸—à¸™', sched_status: 'à¸ªà¸–à¸²à¸™à¸°',
      // Job Calculator
      calc_title: 'à¸„à¸³à¸™à¸§à¸“à¸‡à¸²à¸™à¸™à¸­à¸', calc_subtitle: 'à¸„à¸³à¸™à¸§à¸“à¸•à¹‰à¸™à¸—à¸¸à¸™à¸à¹ˆà¸­à¸™à¸—à¸³à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²',
      // Quotation
      quot_title: 'à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²', quot_subtitle: 'à¸ªà¸£à¹‰à¸²à¸‡à¹à¸¥à¸°à¸ˆà¸±à¸”à¸à¸²à¸£à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²',
      quot_add: 'à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²', quot_clientName: 'à¸Šà¸·à¹ˆà¸­à¸¥à¸¹à¸à¸„à¹‰à¸²/à¸œà¸¹à¹‰à¸§à¹ˆà¸²à¸ˆà¹‰à¸²à¸‡', quot_jobDetail: 'à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‡à¸²à¸™',
      quot_eventDate: 'à¸§à¸±à¸™à¸ˆà¸±à¸”à¸‡à¸²à¸™', quot_eventType: 'à¸›à¸£à¸°à¹€à¸ à¸—à¸‡à¸²à¸™', quot_venue: 'à¸ªà¸–à¸²à¸™à¸—à¸µà¹ˆ',
      quot_items: 'à¸£à¸²à¸¢à¸à¸²à¸£', quot_subtotal: 'à¸£à¸²à¸„à¸²à¸à¹ˆà¸­à¸™ VAT', quot_vat: 'VAT (%)', quot_total: 'à¸£à¸§à¸¡à¸—à¸±à¹‰à¸‡à¸ªà¸´à¹‰à¸™',
      quot_status_draft: 'à¸£à¹ˆà¸²à¸‡', quot_status_sent: 'à¸ªà¹ˆà¸‡à¹à¸¥à¹‰à¸§', quot_status_approved: 'à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´', quot_status_rejected: 'à¸›à¸à¸´à¹€à¸ªà¸˜',
      quot_generatePdf: 'à¸ªà¸£à¹‰à¸²à¸‡ PDF', quot_list: 'à¸£à¸²à¸¢à¸à¸²à¸£à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²', quot_noData: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²',
      // Contract
      cont_title: 'à¸ªà¸±à¸à¸à¸²à¸§à¹ˆà¸²à¸ˆà¹‰à¸²à¸‡à¸§à¸‡à¸”à¸™à¸•à¸£à¸µ', cont_subtitle: 'à¸”à¸¹à¸ªà¸±à¸à¸à¸² à¸ªà¸£à¹‰à¸²à¸‡à¸ªà¸±à¸à¸à¸²à¹ƒà¸«à¸¡à¹ˆ à¸«à¸£à¸·à¸­à¸ªà¸£à¹‰à¸²à¸‡à¸ˆà¸²à¸à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²',
      // Statistics
      stat_title: 'à¸ªà¸–à¸´à¸•à¸´', stat_subtitle: 'à¸ à¸²à¸žà¸£à¸§à¸¡à¸§à¸‡ à¸£à¸²à¸¢à¸„à¸™ à¸£à¸²à¸¢à¸£à¹‰à¸²à¸™ à¹à¸¥à¸°à¸ªà¸–à¸´à¸•à¸´à¹€à¸žà¸¥à¸‡',
      // Band Fund
      fund_title: 'à¹€à¸‡à¸´à¸™à¸à¸­à¸‡à¸à¸¥à¸²à¸‡à¸§à¸‡', fund_subtitle: 'à¸ˆà¸±à¸”à¸à¸²à¸£à¹€à¸‡à¸´à¸™à¸—à¸´à¸› à¹€à¸‡à¸´à¸™à¸ªà¸°à¸ªà¸¡ à¹à¸¥à¸°à¹€à¸‡à¸´à¸™à¸Šà¹ˆà¸§à¸¢à¹€à¸«à¸¥à¸·à¸­à¸ªà¸¡à¸²à¸Šà¸´à¸',
      // Settings
      set_title: 'à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²à¸§à¸‡', set_subtitle: 'à¸ˆà¸±à¸”à¸à¸²à¸£à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸§à¸‡ à¸£à¹‰à¸²à¸™ à¸ªà¸¡à¸²à¸Šà¸´à¸ à¹à¸¥à¸°à¸à¸²à¸£à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²',
      // Band Info
      bandinfo_title: 'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸§à¸‡', bandinfo_subtitle: 'à¸”à¸¹à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸§à¸‡à¹à¸¥à¸°à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¸ªà¸¡à¸²à¸Šà¸´à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”',
      // Equipment
      equip_title: 'à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¹à¸¥à¸°à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸”à¸™à¸•à¸£à¸µ', equip_subtitle: 'à¸ˆà¸±à¸”à¸à¸²à¸£à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸”à¸™à¸•à¸£à¸µ à¹à¸¥à¸°à¸•à¸´à¸”à¸•à¸²à¸¡à¸ªà¸–à¸²à¸™à¸°',
      equip_add: 'à¹€à¸žà¸´à¹ˆà¸¡à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ', equip_name: 'à¸Šà¸·à¹ˆà¸­à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ', equip_type: 'à¸›à¸£à¸°à¹€à¸ à¸—', equip_owner: 'à¹€à¸ˆà¹‰à¸²à¸‚à¸­à¸‡',
      equip_serial: 'Serial No.', equip_purchaseDate: 'à¸§à¸±à¸™à¸—à¸µà¹ˆà¸‹à¸·à¹‰à¸­', equip_price: 'à¸£à¸²à¸„à¸²',
      equip_status: 'à¸ªà¸–à¸²à¸™à¸°', equip_notes: 'à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸', equip_noData: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸­à¸¸à¸›à¸à¸£à¸“à¹Œ',
      equip_status_normal: 'à¸›à¸à¸•à¸´', equip_status_repair: 'à¸‹à¹ˆà¸­à¸¡', equip_status_broken: 'à¹€à¸ªà¸µà¸¢',
      equip_type_instrument: 'à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸”à¸™à¸•à¸£à¸µ', equip_type_audio: 'à¸£à¸°à¸šà¸šà¹€à¸ªà¸µà¸¢à¸‡', equip_type_lighting: 'à¹„à¸Ÿ/à¹à¸ªà¸‡',
      equip_type_accessory: 'à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¹€à¸ªà¸£à¸´à¸¡', equip_type_other: 'à¸­à¸·à¹ˆà¸™à¹†',
      // Clients
      client_title: 'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¥à¸¹à¸à¸„à¹‰à¸²', client_subtitle: 'à¸ˆà¸±à¸”à¸à¸²à¸£à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸œà¸¹à¹‰à¸§à¹ˆà¸²à¸ˆà¹‰à¸²à¸‡à¹à¸¥à¸°à¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸à¸²à¸£à¸ˆà¹‰à¸²à¸‡',
      client_add: 'à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸¹à¸à¸„à¹‰à¸²', client_name: 'à¸Šà¸·à¹ˆà¸­à¸¥à¸¹à¸à¸„à¹‰à¸²', client_company: 'à¸šà¸£à¸´à¸©à¸±à¸—/à¸­à¸‡à¸„à¹Œà¸à¸£',
      client_contact: 'à¸œà¸¹à¹‰à¸•à¸´à¸”à¸•à¹ˆà¸­', client_phone: 'à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£', client_email: 'à¸­à¸µà¹€à¸¡à¸¥',
      client_lineId: 'LINE ID', client_address: 'à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ', client_notes: 'à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸',
      client_totalGigs: 'à¸‡à¸²à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”', client_totalRevenue: 'à¸£à¸²à¸¢à¸£à¸±à¸šà¸£à¸§à¸¡', client_noData: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¥à¸¹à¸à¸„à¹‰à¸²',
      // User Manual
      nav_userManual: 'à¸„à¸¹à¹ˆà¸¡à¸·à¸­', manual_title: 'à¸„à¸¹à¹ˆà¸¡à¸·à¸­à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™', manual_subtitle: 'à¸§à¸´à¸˜à¸µà¹ƒà¸Šà¹‰à¸‡à¸²à¸™ Band Management By SoulCiety',
      // Admin
      admin_title: 'à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²à¹à¸­à¸”à¸¡à¸´à¸™à¸£à¸°à¸šà¸š', admin_denied: 'à¸„à¸¸à¸“à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸´à¸—à¸˜à¸´à¹Œà¹€à¸‚à¹‰à¸²à¸«à¸™à¹‰à¸²à¸™à¸µà¹‰',
      // Terms
      terms_title: 'à¸‚à¹‰à¸­à¸à¸³à¸«à¸™à¸”à¹à¸¥à¸°à¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚', terms_link: 'à¸‚à¹‰à¸­à¸à¸³à¸«à¸™à¸”à¹à¸¥à¸°à¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™',
      // Messages
      msg_saveSuccess: 'à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§ âœ“', msg_error: 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸” à¸à¸£à¸¸à¸“à¸²à¸¥à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆ',
      msg_deleteSuccess: 'à¸¥à¸šà¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§', msg_loading: 'à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”...', msg_noData: 'à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥',
      msg_confirmDelete: 'à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸¥à¸šà¸£à¸²à¸¢à¸à¸²à¸£à¸™à¸µà¹‰à¹ƒà¸Šà¹ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?',
      // Units
      unit_baht: 'à¸šà¸²à¸—', unit_people: 'à¸„à¸™', unit_gigs: 'à¸‡à¸²à¸™', unit_items: 'à¸£à¸²à¸¢à¸à¸²à¸£',
      yourBand: 'à¸§à¸‡à¸‚à¸­à¸‡à¸„à¸¸à¸“', user: 'à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰',
      placeholderSearch: 'à¸„à¹‰à¸™à¸«à¸²...', placeholderSelect: 'à¹€à¸¥à¸·à¸­à¸...',
    },
    en: {
      appTitle: 'Band Management By SoulCiety',
      langTh: 'Thai', langEn: 'English',
      login: 'Login', logout: 'Logout', register: 'Register',
      email: 'Email', password: 'Password', rememberMe: 'Remember me', forgotPassword: 'Forgot password?',
      enterEmail: 'Enter your email', enterPassword: 'Enter your password',
      noAccount: "Don't have an account?", registerNew: 'Register now', or: 'or',
      demoLogin: 'Enter Demo Mode (no login required)',
      errInvalidEmail: 'Please enter a valid email', errEnterPassword: 'Please enter your password',
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', search: 'Search',
      loading: 'Loading...', yes: 'Yes', no: 'No', ok: 'OK', close: 'Close', back: 'Back', next: 'Next', submit: 'Submit', required: 'Required', confirm: 'Confirm',
      confirmDeleteTitle: 'Confirm Delete', confirmDeleteMsg: 'Are you sure you want to delete this item? This cannot be undone.',
      nav_dashboard: 'Dashboard', nav_songs: 'Songs & Setlist', nav_attendance: 'Attendance & Payroll',
      nav_externalPayout: 'External Payout', nav_schedule: 'Schedule', nav_jobCalculator: 'Job Calculator',
      nav_quotation: 'Quotation', nav_contract: 'Contract', nav_statistics: 'Statistics',
      nav_songInsights: 'Song Insights', nav_bandFund: 'Band Fund', nav_settings: 'Settings',
      nav_bandInfo: 'Band Info', nav_userManual: 'User Manual', nav_admin: 'Admin',
      nav_equipment: 'Equipment', nav_clients: 'Clients',
      dash_title: 'Dashboard', dash_subtitle: 'Band overview and tasks',
      dash_todaySummary: "Today's Summary", dash_date: 'Date', dash_todayGigs: "Today's Gigs",
      dash_todayMembers: 'Members Today', dash_nextGig: 'Next Gig', dash_noJobs: 'No jobs yet',
      dash_viewAllSchedule: 'View full schedule', dash_finance: 'Finance',
      dash_monthlyIncome: 'Monthly Income', dash_pendingFromVenues: 'Pending from venues', dash_payToMembers: 'Pay to members',
      dash_quickActions: 'Quick Actions', dash_createSetlist: 'Create Setlist', dash_logTime: 'Log Time',
      dash_createReceipt: 'Create Receipt', dash_createQuotation: 'Create Quotation', dash_manual: 'User Manual',
      dash_jobsStatus: 'Jobs & Status', dash_equipment_alert: 'Equipment needs repair',
      songs_title: 'Songs & Setlist', songs_subtitle: 'Select from library, create setlist, copy or save as image',
      songs_addSong: 'Add Song', songs_createSetlist: 'Create Setlist', songs_filter: 'Filter',
      songs_noSongs: 'No songs yet', songs_selectAll: 'Select All', songs_clearAll: 'Clear All',
      songs_copy: 'Copy', songs_saveAsImage: 'Save as Image', songs_transpose: 'Transpose',
      songs_name: 'Song Name', songs_key: 'Key', songs_bpm: 'BPM', songs_era: 'Era', songs_singer: 'Singer', songs_mood: 'Mood',
      att_title: 'Attendance & Payroll', att_subtitle: 'Log work hours and claim pay from venues',
      ext_title: 'External Payout', ext_subtitle: 'Calculate and pay per member for external/event gigs',
      sched_title: 'Schedule', sched_subtitle: 'View schedule by person or band, add gigs, view history',
      sched_add: 'Add Gig', sched_venue: 'Venue', sched_date: 'Date', sched_time: 'Time',
      sched_type: 'Type', sched_pay: 'Pay', sched_status: 'Status',
      calc_title: 'Job Calculator', calc_subtitle: 'Calculate cost before creating quotation',
      quot_title: 'Quotation', quot_subtitle: 'Create and manage quotations',
      quot_add: 'Create Quotation', quot_clientName: 'Client/Venue Name', quot_jobDetail: 'Job Details',
      quot_eventDate: 'Event Date', quot_eventType: 'Event Type', quot_venue: 'Venue',
      quot_items: 'Items', quot_subtotal: 'Subtotal', quot_vat: 'VAT (%)', quot_total: 'Total',
      quot_status_draft: 'Draft', quot_status_sent: 'Sent', quot_status_approved: 'Approved', quot_status_rejected: 'Rejected',
      quot_generatePdf: 'Generate PDF', quot_list: 'Quotation List', quot_noData: 'No quotations yet',
      cont_title: 'Band Contract', cont_subtitle: 'View contracts, create new, or create from quotation',
      stat_title: 'Statistics', stat_subtitle: 'Band overview, per person, per venue, song stats',
      fund_title: 'Band Fund', fund_subtitle: 'Manage tips, savings, and member loans',
      set_title: 'Band Settings', set_subtitle: 'Manage band info, venues, members, and settings',
      bandinfo_title: 'Band Info', bandinfo_subtitle: 'View band information and all members',
      equip_title: 'Equipment & Instruments', equip_subtitle: 'Manage equipment, instruments and track status',
      equip_add: 'Add Equipment', equip_name: 'Equipment Name', equip_type: 'Type', equip_owner: 'Owner',
      equip_serial: 'Serial No.', equip_purchaseDate: 'Purchase Date', equip_price: 'Price',
      equip_status: 'Status', equip_notes: 'Notes', equip_noData: 'No equipment yet',
      equip_status_normal: 'Normal', equip_status_repair: 'In Repair', equip_status_broken: 'Broken',
      equip_type_instrument: 'Instrument', equip_type_audio: 'Audio System', equip_type_lighting: 'Lighting',
      equip_type_accessory: 'Accessory', equip_type_other: 'Other',
      client_title: 'Clients', client_subtitle: 'Manage client information and booking history',
      client_add: 'Add Client', client_name: 'Client Name', client_company: 'Company/Organization',
      client_contact: 'Contact Person', client_phone: 'Phone', client_email: 'Email',
      client_lineId: 'LINE ID', client_address: 'Address', client_notes: 'Notes',
      client_totalGigs: 'Total Gigs', client_totalRevenue: 'Total Revenue', client_noData: 'No clients yet',
      nav_userManual: 'User Manual', manual_title: 'User Manual', manual_subtitle: 'How to use Band Management By SoulCiety',
      admin_title: 'Admin Settings', admin_denied: 'You do not have permission to access this page',
      terms_title: 'Terms and Conditions', terms_link: 'Terms and Conditions',
      msg_saveSuccess: 'Saved successfully âœ“', msg_error: 'An error occurred. Please try again.',
      msg_deleteSuccess: 'Deleted successfully', msg_loading: 'Loading...', msg_noData: 'No data available',
      msg_confirmDelete: 'Are you sure you want to delete this item?',
      unit_baht: 'THB', unit_people: 'people', unit_gigs: 'gigs', unit_items: 'items',
      yourBand: 'Your Band', user: 'User',
      placeholderSearch: 'Search...', placeholderSelect: 'Select...',
    }
  };

  function getLang() {
    try { return localStorage.getItem(LANG_KEY) || 'th'; } catch(e) { return 'th'; }
  }
  function setLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang === 'en' ? 'en' : 'th');
      if (typeof window.applyTranslations === 'function') window.applyTranslations();
    } catch(e) {}
  }
  function t(key) {
    var lang = getLang();
    var dict = i18n[lang] || i18n.th;
    return dict[key] !== undefined ? dict[key] : (i18n.th[key] || key);
  }
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  global.i18n = i18n;
  global.getLang = getLang;
  global.setLang = setLang;
  global.t = t;
  global.escapeHtml = escapeHtml;
})(typeof window !== 'undefined' ? window : this);
