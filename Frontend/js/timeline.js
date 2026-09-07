/**
 * NxLife Zoom Booking System
 * Home Daily Timeline
 *
 * Timeline reads from DataStore.
 * Date navigation does NOT call Backend.
 */

const Timeline = (function () {

  const APP_TIMEZONE =
    'Asia/Bangkok';


  let selectedDate =
    '';


  let currentUser =
    null;


  let showToast =
    function () {};


  let initialized =
    false;


  let eventsBound =
    false;


  let scrollFrame =
    null;


  const elements =
    {};


  /**
   * Initialize Home Timeline.
   */
  async function init(
    options = {}
  ) {

    currentUser =
      options.user || null;


    showToast =
      options.showToast ||
      function () {};


    if (!initialized) {

      cacheElements();

      initialized =
        true;

    }


    if (!eventsBound) {

      bindEvents();

      eventsBound =
        true;

    }


    renderUserMini();


    selectedDate =
      getBangkokToday_();


    configureDatePicker();


    updateSelectedDateUI();


    await initializeData_();

  }


  /**
   * Cache DOM.
   */
  function cacheElements() {

    elements.dateTitle =
      document.getElementById(
        'dateTitle'
      );


    elements.prevDayButton =
      document.getElementById(
        'prevDayButton'
      );


    elements.todayButton =
      document.getElementById(
        'todayButton'
      );


    elements.nextDayButton =
      document.getElementById(
        'nextDayButton'
      );


    elements.calendarButton =
      document.getElementById(
        'calendarButton'
      );


    elements.datePicker =
      document.getElementById(
        'datePicker'
      );


    elements.refreshDataButton =
      document.getElementById(
        'refreshDataButton'
      );


    elements.currentRoomName =
      document.getElementById(
        'currentRoomName'
      );


    elements.userMiniName =
      document.getElementById(
        'userMiniName'
      );


    elements.userMiniRole =
      document.getElementById(
        'userMiniRole'
      );


    elements.timelineLoading =
      document.getElementById(
        'timelineLoading'
      );


    elements.timelineError =
      document.getElementById(
        'timelineError'
      );


    elements.timelineErrorMessage =
      document.getElementById(
        'timelineErrorMessage'
      );


    elements.retryTimelineButton =
      document.getElementById(
        'retryTimelineButton'
      );


    elements.roomsGrid =
      document.getElementById(
        'roomsGrid'
      );

  }


  /**
   * Bind UI events once.
   */
  function bindEvents() {

    elements.prevDayButton
      .addEventListener(
        'click',
        goPreviousDay
      );


    elements.todayButton
      .addEventListener(
        'click',
        goToday
      );


    elements.nextDayButton
      .addEventListener(
        'click',
        goNextDay
      );


    /*
     * Real Calendar Button.
     *
     * No transparent input overlay anymore.
     */
    elements.calendarButton
      .addEventListener(
        'click',
        openDatePicker
      );


    elements.datePicker
      .addEventListener(
        'change',
        handleDatePicker
      );


    elements.refreshDataButton
      .addEventListener(
        'click',
        handleManualRefresh
      );


    elements.retryTimelineButton
      .addEventListener(
        'click',
        function () {

          initializeData_(
            true
          );

        }
      );


    window.addEventListener(
      'scroll',
      scheduleRoomIndicatorUpdate,
      {
        passive: true
      }
    );


    window.addEventListener(
      'resize',
      scheduleRoomIndicatorUpdate
    );

  }


  /**
   * Open native Date Picker
   * from a real button click.
   */
  function openDatePicker() {

    syncDatePicker_();


    try {

      /*
       * Modern Chrome / Edge / Android
       */
      if (
        typeof
          elements.datePicker.showPicker ===
        'function'
      ) {

        elements.datePicker.showPicker();

        return;

      }

    } catch (error) {

      console.warn(
        'showPicker fallback:',
        error
      );

    }


    /*
     * Browser fallback.
     */
    try {

      elements.datePicker.focus();

      elements.datePicker.click();

    } catch (error) {

      console.error(
        error
      );


      showToast(
        'ไม่สามารถเปิดปฏิทินได้ กรุณาลองใหม่',
        'error'
      );

    }

  }


  /**
   * Initial / Full data load.
   */
  async function initializeData_(
    forceRefresh = false
  ) {

    showLoading();


    try {

      if (forceRefresh) {

        await DataStore.refreshAll();

      } else {

        await DataStore.initialize();

      }


      renderSelectedDate_();


      hideLoading();


    } catch (error) {

      console.error(
        error
      );


      showTimelineError(
        error.message ||
        'ไม่สามารถโหลดข้อมูลได้'
      );

    }

  }


  /**
   * Manual Refresh.
   */
  async function handleManualRefresh() {

    const button =
      elements.refreshDataButton;


    const oldText =
      button.textContent;


    button.disabled =
      true;


    button.textContent =
      '…';


    try {

      await DataStore.refreshAll();


      renderSelectedDate_();


      showToast(
        'อัปเดตข้อมูลล่าสุดแล้ว',
        'success'
      );


    } catch (error) {

      console.error(
        error
      );


      showToast(
        error.message ||
        'อัปเดตข้อมูลไม่สำเร็จ',
        'error'
      );


    } finally {

      button.disabled =
        false;


      button.textContent =
        oldText;

    }

  }


  /**
   * Render selected day
   * entirely from browser memory.
   */
  function renderSelectedDate_() {

    try {

      const schedule =
        DataStore.getDaySchedule(
          selectedDate
        );


      renderSchedule(
        schedule
      );


    } catch (error) {

      showTimelineError(
        error.message
      );

    }

  }


  /**
   * User / Role.
   */
  function renderUserMini() {

    if (!currentUser) {
      return;
    }


    elements.userMiniName.textContent =
      currentUser.userName ||
      currentUser.userId ||
      'NxLife User';


    elements.userMiniRole.textContent =
      currentUser.role || '';

  }


  /**
   * Date Picker Setup.
   */
  function configureDatePicker() {

    const today =
      getBangkokToday_();


    elements.datePicker.min =
      today;


    syncDatePicker_();

  }


  /**
   * Synchronize native picker
   * with selectedDate.
   *
   * This is the ONLY helper responsible
   * for writing datePicker.value.
   */
  function syncDatePicker_() {

    if (
      elements.datePicker.value !==
      selectedDate
    ) {

      elements.datePicker.value =
        selectedDate;

    }

  }


  /**
   * Render Schedule.
   */
  function renderSchedule(
    schedule
  ) {

    if (schedule.date) {

      selectedDate =
        schedule.date;

    }


    updateSelectedDateUI();


    elements.roomsGrid.innerHTML =
      '';


    const rooms =
      Array.isArray(
        schedule.rooms
      )
        ? schedule.rooms
        : [];


    rooms.forEach(
      function (
        room,
        index
      ) {

        elements.roomsGrid
          .appendChild(
            createRoomSection(
              room,
              index
            )
          );

      }
    );


    if (rooms.length > 0) {

      setCurrentRoom(
        rooms[0].roomName ||
        rooms[0].roomId
      );

    } else {

      setCurrentRoom(
        'ไม่มีห้องที่เปิดใช้งาน'
      );

    }


    requestAnimationFrame(
      updateCurrentRoomFromScroll
    );

  }


  /**
   * Create Room Block.
   */
  function createRoomSection(
    room,
    index
  ) {

    const section =
      document.createElement(
        'section'
      );


    section.className =
      'room-section';


    section.dataset.roomId =
      room.roomId || '';


    section.dataset.roomName =
      room.roomName ||
      room.roomId ||
      'ZOOM';


    section.style.setProperty(
      '--room-index',
      index
    );


    const header =
      document.createElement(
        'div'
      );


    header.className =
      'room-section-header';


    const titleWrap =
      document.createElement(
        'div'
      );


    titleWrap.className =
      'room-title-wrap';


    const eyebrow =
      document.createElement(
        'span'
      );


    eyebrow.className =
      'room-eyebrow';


    eyebrow.textContent =
      room.roomId || 'ZOOM';


    const title =
      document.createElement(
        'h2'
      );


    title.className =
      'room-title';


    title.textContent =
      room.roomName ||
      room.roomId ||
      'Zoom Room';


    titleWrap.appendChild(
      eyebrow
    );


    titleWrap.appendChild(
      title
    );


    const addButton =
      document.createElement(
        'button'
      );


    addButton.type =
      'button';


    addButton.className =
      'add-booking-button';


    addButton.textContent =
      '+ เพิ่มการจอง';


    header.appendChild(
      titleWrap
    );


    header.appendChild(
      addButton
    );


    section.appendChild(
      header
    );


    const timeline =
      document.createElement(
        'div'
      );


    timeline.className =
      'room-timeline';


    const items =
      Array.isArray(
        room.items
      )
        ? room.items
        : [];


    if (
      items.length === 0
    ) {

      timeline.appendChild(
        createEmptyState()
      );

    } else {

      items.forEach(
        function (item) {

          timeline.appendChild(
            createTimelineItem(
              item
            )
          );

        }
      );

    }


    section.appendChild(
      timeline
    );


    return section;

  }


  /**
   * Create Timeline Item.
   *
   * ZoomBooking:
   * Activity / CreatedBy
   *
   * ZoomRecurring:
   * Activity + Recurring tag
   */
  function createTimelineItem(
    item
  ) {

    const article =
      document.createElement(
        'article'
      );


    const isRecurring =
      item.type ===
        'recurring' ||
      item.recurring ===
        true;


    article.className =
      'timeline-item ' +
      (
        isRecurring
          ? 'timeline-recurring'
          : 'timeline-booking'
      );


    const rail =
      document.createElement(
        'div'
      );


    rail.className =
      'timeline-rail';


    const dot =
      document.createElement(
        'span'
      );


    dot.className =
      'timeline-dot';


    rail.appendChild(
      dot
    );


    const content =
      document.createElement(
        'div'
      );


    content.className =
      'timeline-content';


    const topRow =
      document.createElement(
        'div'
      );


    topRow.className =
      'timeline-top-row';


    const time =
      document.createElement(
        'div'
      );


    time.className =
      'timeline-time';


    time.textContent =
      (
        item.startTime ||
        '--:--'
      ) +
      '–' +
      (
        item.endTime ||
        '--:--'
      );


    topRow.appendChild(
      time
    );


    if (isRecurring) {

      const tag =
        document.createElement(
          'span'
        );


      tag.className =
        'recurring-tag';


      tag.textContent =
        'ประจำ';


      topRow.appendChild(
        tag
      );

    }


    const activity =
      document.createElement(
        'div'
      );


    activity.className =
      'timeline-activity';


    const activityName =
      item.activity ||
      'ไม่ระบุชื่อกิจกรรม';


    if (
      !isRecurring &&
      item.createdBy
    ) {

      activity.textContent =
        activityName +
        ' / ' +
        item.createdBy;

    } else {

      activity.textContent =
        activityName;

    }


    content.appendChild(
      topRow
    );


    content.appendChild(
      activity
    );


    article.appendChild(
      rail
    );


    article.appendChild(
      content
    );


    return article;

  }


  /**
   * Empty Room.
   */
  function createEmptyState() {

    const empty =
      document.createElement(
        'div'
      );


    empty.className =
      'room-empty-state';


    const icon =
      document.createElement(
        'div'
      );


    icon.className =
      'room-empty-icon';


    icon.textContent =
      '○';


    const text =
      document.createElement(
        'div'
      );


    text.className =
      'room-empty-text';


    text.innerHTML =
      '<strong>วันนี้ไม่มีการจองใช้งาน</strong>' +
      '<span>ห้องนี้ยังว่างตลอดวัน</span>';


    empty.appendChild(
      icon
    );


    empty.appendChild(
      text
    );


    return empty;

  }


  /**
   * Previous Day.
   */
  function goPreviousDay() {

    const today =
      getBangkokToday_();


    if (
      selectedDate <=
      today
    ) {

      showToast(
        'ไม่สามารถดูวันที่ย้อนหลังได้',
        'info'
      );

      return;

    }


    selectedDate =
      addDays_(
        selectedDate,
        -1
      );


    updateSelectedDateUI();


    renderSelectedDate_();

  }


  /**
   * Today.
   */
  function goToday() {

    selectedDate =
      getBangkokToday_();


    updateSelectedDateUI();


    renderSelectedDate_();

  }


  /**
   * Next Day.
   */
  function goNextDay() {

    selectedDate =
      addDays_(
        selectedDate,
        1
      );


    updateSelectedDateUI();


    renderSelectedDate_();

  }


  /**
   * Native Date Picker Change.
   */
  function handleDatePicker(
    event
  ) {

    const value =
      event.target.value;


    if (!value) {
      return;
    }


    const today =
      getBangkokToday_();


    if (
      value <
      today
    ) {

      showToast(
        'ไม่สามารถดูวันที่ย้อนหลังได้',
        'info'
      );


      syncDatePicker_();


      return;

    }


    selectedDate =
      value;


    updateSelectedDateUI();


    renderSelectedDate_();

  }


  /**
   * Date Header + Navigator State.
   */
  function updateSelectedDateUI() {

  /*
   * Desktop main date.
   */
  elements.dateTitle.textContent =
    formatThaiDate_(
      selectedDate
    );


  /*
   * Mobile Navigator date.
   */
  const dateNavLabel =
    document.getElementById(
      'dateNavLabel'
    );


  if (dateNavLabel) {

    dateNavLabel.textContent =
      formatThaiNavigatorDate_(
        selectedDate
      );

  }


  const today =
    getBangkokToday_();


  elements.prevDayButton.disabled =
    selectedDate <=
    today;


  elements.todayButton
    .classList.toggle(
      'active',
      selectedDate ===
        today
    );


  syncDatePicker_();

}


  /**
   * Loading.
   */
  function showLoading() {

    elements.timelineLoading
      .classList.remove(
        'hidden'
      );


    elements.timelineError
      .classList.add(
        'hidden'
      );


    elements.roomsGrid
      .classList.add(
        'is-loading'
      );

  }


  function hideLoading() {

    elements.timelineLoading
      .classList.add(
        'hidden'
      );


    elements.timelineError
      .classList.add(
        'hidden'
      );


    elements.roomsGrid
      .classList.remove(
        'is-loading'
      );

  }


  /**
   * Error.
   */
  function showTimelineError(
    message
  ) {

    elements.timelineLoading
      .classList.add(
        'hidden'
      );


    elements.roomsGrid
      .classList.remove(
        'is-loading'
      );


    elements.timelineErrorMessage
      .textContent =
        message;


    elements.timelineError
      .classList.remove(
        'hidden'
      );

  }


  /**
   * Mobile Current Room Indicator.
   */
  function scheduleRoomIndicatorUpdate() {

    if (scrollFrame) {
      return;
    }


    scrollFrame =
      requestAnimationFrame(
        function () {

          scrollFrame =
            null;


          updateCurrentRoomFromScroll();

        }
      );

  }


  function updateCurrentRoomFromScroll() {

    const sections =
      Array.from(
        document.querySelectorAll(
          '.room-section'
        )
      );


    if (
      sections.length === 0
    ) {

      return;

    }


    const stickyHeader =
      document.querySelector(
        '.home-sticky-header'
      );


    const stickyBottom =
      stickyHeader
        ? stickyHeader
            .getBoundingClientRect()
            .bottom
        : 0;


    const markerLine =
      stickyBottom +
      24;


    let currentSection =
      sections[0];


    for (
      let index = 0;
      index <
      sections.length;
      index++
    ) {

      const section =
        sections[index];


      const rect =
        section
          .getBoundingClientRect();


      if (
        rect.top <=
          markerLine &&
        rect.bottom >
          markerLine
      ) {

        currentSection =
          section;

        break;

      }


      if (
        rect.top <
        markerLine
      ) {

        currentSection =
          section;

      }

    }


    setCurrentRoom(
      currentSection
        .dataset
        .roomName ||
      currentSection
        .dataset
        .roomId ||
      'ZOOM'
    );

  }


function setCurrentRoom(
  roomName
) {

  /*
   * Current Room Indicator
   * is optional on the new Mobile UI.
   */
  if (
    !elements.currentRoomName
  ) {

    return;

  }


  elements.currentRoomName
    .textContent =
      roomName;

}


  /**
   * Bangkok Today.
   */
  function getBangkokToday_() {

    const parts =
      new Intl.DateTimeFormat(
        'en-US',
        {
          timeZone:
            APP_TIMEZONE,

          year:
            'numeric',

          month:
            '2-digit',

          day:
            '2-digit'
        }
      )
        .formatToParts(
          new Date()
        );


    const map =
      {};


    parts.forEach(
      function (part) {

        map[part.type] =
          part.value;

      }
    );


    return (
      map.year +
      '-' +
      map.month +
      '-' +
      map.day
    );

  }


  /**
   * Date +/- Days.
   */
  function addDays_(
    dateString,
    amount
  ) {

    const parts =
      dateString.split('-');


    const date =
      new Date(
        Date.UTC(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]) +
            amount
        )
      );


    return (
      date.getUTCFullYear() +
      '-' +
      pad2_(
        date.getUTCMonth() +
        1
      ) +
      '-' +
      pad2_(
        date.getUTCDate()
      )
    );

  }


  /**
   * Thai Gregorian Date.
   */
  function formatThaiDate_(
    dateString
  ) {

    const parts =
      dateString.split('-');


    if (
      parts.length !==
      3
    ) {

      return dateString;

    }


    const date =
      new Date(
        Date.UTC(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
          12
        )
      );


    return (
      new Intl.DateTimeFormat(
        'th-TH-u-ca-gregory',
        {
          weekday:
            'long',

          day:
            'numeric',

          month:
            'long',

          year:
            'numeric',

          timeZone:
            'UTC'
        }
      )
        .format(
          date
        )
    );

  }

/**
 * Short Thai date
 * for Mobile Navigator.
 *
 * Example:
 * วันจันทร์ที่ 7 กันยายน
 */
function formatThaiNavigatorDate_(
  dateString
) {

  const parts =
    String(
      dateString || ''
    )
      .split('-');


  if (
    parts.length !==
    3
  ) {

    return dateString;

  }


  const date =
    new Date(
      Date.UTC(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
        12
      )
    );


  return (
    new Intl.DateTimeFormat(
      'th-TH-u-ca-gregory',
      {
        weekday:
          'long',

        day:
          'numeric',

        month:
          'long',

        timeZone:
          'UTC'
      }
    )
      .format(
        date
      )
  );

}

  function pad2_(
    value
  ) {

    return String(
      value
    )
      .padStart(
        2,
        '0'
      );

  }


return {

  init,


  /**
   * Called after Booking Save,
   * Delete or Conflict.
   */
  async refreshBookings() {

    await DataStore
      .refreshBookings();


    renderSelectedDate_();

  },


  /**
   * Called after Recurring
   * Create / Update / Pause / Activate / Delete.
   */
  async refreshRecurring() {

    await DataStore
      .refreshRecurring();


    renderSelectedDate_();

  }

};

})();