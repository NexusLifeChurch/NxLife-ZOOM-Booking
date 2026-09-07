/**
 * NxLife Zoom Booking System
 * My Booking
 *
 * Reads Booking from DataStore memory.
 *
 * Backend remains Source of Truth
 * for Update / Delete / Conflict.
 */

const MyBookings = (function () {

  const APP_TIMEZONE =
    'Asia/Bangkok';


  let initialized =
    false;


  let currentUser =
    null;


  let editingBooking =
    null;


  const elements =
    {};


  /* =======================================================
     INIT
  ======================================================= */


  function init() {

    if (initialized) {
      return;
    }


    cacheElements_();

    bindEvents_();


    initialized =
      true;

  }


  function cacheElements_() {

    elements.loading =
      document.getElementById(
        'myBookingsLoading'
      );


    elements.error =
      document.getElementById(
        'myBookingsError'
      );


    elements.empty =
      document.getElementById(
        'myBookingsEmpty'
      );


    elements.groups =
      document.getElementById(
        'myBookingGroups'
      );


    elements.count =
      document.getElementById(
        'myBookingCountNumber'
      );


    /*
     * Edit Modal
     */
    elements.modal =
      document.getElementById(
        'myBookingModal'
      );


    elements.closeButton =
      document.getElementById(
        'myBookingModalClose'
      );


    elements.cancelButton =
      document.getElementById(
        'myBookingEditCancel'
      );


    elements.form =
      document.getElementById(
        'myBookingEditForm'
      );


    elements.activity =
      document.getElementById(
        'myBookingEditActivity'
      );


    elements.date =
      document.getElementById(
        'myBookingEditDate'
      );


    elements.room =
      document.getElementById(
        'myBookingEditRoom'
      );


    elements.startTime =
      document.getElementById(
        'myBookingEditStartTime'
      );


    elements.endTime =
      document.getElementById(
        'myBookingEditEndTime'
      );


    elements.message =
      document.getElementById(
        'myBookingEditMessage'
      );


    elements.saveButton =
      document.getElementById(
        'myBookingEditSave'
      );

  }


  function bindEvents_() {

    elements.closeButton
      .addEventListener(
        'click',
        closeEditModal_
      );


    elements.cancelButton
      .addEventListener(
        'click',
        closeEditModal_
      );


    elements.modal
      .addEventListener(
        'click',
        function(event) {

          if (
            event.target ===
            elements.modal
          ) {

            closeEditModal_();

          }

        }
      );


    elements.form
      .addEventListener(
        'submit',
        handleUpdate_
      );


    elements.date
      .addEventListener(
        'change',
        handleScheduleContextChange_
      );


    elements.room
      .addEventListener(
        'change',
        handleScheduleContextChange_
      );


    elements.startTime
      .addEventListener(
        'change',
        function() {

          clearEditMessage_();

          populateEndTimes_(
            elements.startTime.value,
            ''
          );

        }
      );


    document.addEventListener(
      'keydown',
      function(event) {

        if (
          event.key ===
            'Escape' &&
          !elements.modal
            .classList
            .contains(
              'hidden'
            )
        ) {

          closeEditModal_();

        }

      }
    );

  }


  /* =======================================================
     OPEN VIEW
  ======================================================= */


  async function open(
    user
  ) {

    init();


    currentUser =
      user ||
      Auth.getCurrentUser();


    if (!currentUser) {

      showError_(
        'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่'
      );

      return;

    }


    showLoading_();


    try {

      /*
       * If Timeline already loaded DataStore,
       * this does NOT call Backend again.
       *
       * If still loading, DataStore itself
       * handles the shared loadingPromise.
       */
      await DataStore.initialize();


      render_();


    } catch (error) {

      console.error(
        error
      );


      showError_(
        error.message ||
        'ไม่สามารถโหลดรายการจองได้'
      );

    }

  }


  /* =======================================================
     RENDER
  ======================================================= */


  function render_() {

    hideStatus_();


    const bookings =
      getMyBookings_();


    elements.groups.innerHTML =
      '';


    elements.count.textContent =
      bookings.length;


    if (
      bookings.length ===
      0
    ) {

      elements.empty
        .classList
        .remove(
          'hidden'
        );

      return;

    }


    const grouped =
      groupBookingsByDate_(
        bookings
      );


    Object.keys(
      grouped
    )
      .sort()
      .forEach(
        function(date) {

          elements.groups
            .appendChild(
              createDateGroup_(
                date,
                grouped[date]
              )
            );

        }
      );

  }


  /**
   * My Booking means own Booking only.
   *
   * Supports:
   * New CreatedBy = UserName
   * Old CreatedBy = UserLogin
   */
  function getMyBookings_() {

    const ownerKeys =
      [
        currentUser.userName,
        currentUser.userId,
        currentUser.userLogin
      ]
        .map(
          normalize_
        )
        .filter(
          Boolean
        );


    return DataStore
      .getBookings()
      .filter(
        function(booking) {

          return (
            ownerKeys.indexOf(
              normalize_(
                booking.createdBy
              )
            ) !==
            -1
          );

        }
      )
      .sort(
        function(a, b) {

          if (
            a.date !==
            b.date
          ) {

            return (
              a.date.localeCompare(
                b.date
              )
            );

          }


          return (
            timeToMinutes_(
              a.startTime
            ) -
            timeToMinutes_(
              b.startTime
            )
          );

        }
      );

  }


  function groupBookingsByDate_(
    bookings
  ) {

    const grouped =
      {};


    bookings.forEach(
      function(booking) {

        if (
          !grouped[
            booking.date
          ]
        ) {

          grouped[
            booking.date
          ] =
            [];

        }


        grouped[
          booking.date
        ].push(
          booking
        );

      }
    );


    return grouped;

  }


  function createDateGroup_(
    date,
    bookings
  ) {

    const section =
      document.createElement(
        'section'
      );


    section.className =
      'my-booking-group';


    const dateHeader =
      document.createElement(
        'div'
      );


    dateHeader.className =
      'my-booking-date';


    const strong =
      document.createElement(
        'strong'
      );


    strong.textContent =
      formatThaiDate_(
        date
      );


    const count =
      document.createElement(
        'span'
      );


    count.textContent =
      bookings.length +
      ' รายการ';


    dateHeader.appendChild(
      strong
    );


    dateHeader.appendChild(
      count
    );


    section.appendChild(
      dateHeader
    );


    bookings.forEach(
      function(booking) {

        section.appendChild(
          createBookingCard_(
            booking
          )
        );

      }
    );


    return section;

  }


  function createBookingCard_(
    booking
  ) {

    const card =
      document.createElement(
        'article'
      );


    card.className =
      'my-booking-card';


    const time =
      document.createElement(
        'div'
      );


    time.className =
      'my-booking-time';


    time.textContent =
      booking.startTime +
      '–' +
      booking.endTime;


    const main =
      document.createElement(
        'div'
      );


    main.className =
      'my-booking-main';


    const activity =
      document.createElement(
        'div'
      );


    activity.className =
      'my-booking-activity';


    activity.textContent =
      booking.activity ||
      'ไม่ระบุชื่อกิจกรรม';


    const meta =
      document.createElement(
        'div'
      );


    meta.className =
      'my-booking-meta';


    const room =
      document.createElement(
        'span'
      );


    room.className =
      'my-booking-room';


    room.textContent =
      getRoomDisplayName_(
        booking.room
      );


    const created =
      document.createElement(
        'span'
      );


    created.textContent =
      'ผู้จอง: ' +
      (
        booking.createdBy ||
        '-'
      );


    meta.appendChild(
      room
    );


    meta.appendChild(
      created
    );


    main.appendChild(
      activity
    );


    main.appendChild(
      meta
    );


    const actions =
      document.createElement(
        'div'
      );


    actions.className =
      'my-booking-actions';


    const editButton =
      document.createElement(
        'button'
      );


    editButton.type =
      'button';


    editButton.className =
      'my-booking-action';


    editButton.textContent =
      'แก้ไข';


    editButton.addEventListener(
      'click',
      function() {

        openEditModal_(
          booking
        );

      }
    );


    const deleteButton =
      document.createElement(
        'button'
      );


    deleteButton.type =
      'button';


    deleteButton.className =
      'my-booking-action delete';


    deleteButton.textContent =
      'ลบ';


    deleteButton.addEventListener(
      'click',
      function() {

        handleDelete_(
          booking
        );

      }
    );


    actions.appendChild(
      editButton
    );


    actions.appendChild(
      deleteButton
    );


    card.appendChild(
      time
    );


    card.appendChild(
      main
    );


    card.appendChild(
      actions
    );


    return card;

  }


  /* =======================================================
     EDIT MODAL
  ======================================================= */


  function openEditModal_(
    booking
  ) {

    editingBooking =
      booking;


    clearEditMessage_();


    elements.activity.value =
      booking.activity ||
      '';


    elements.date.min =
      getBangkokToday_();


    elements.date.value =
      booking.date;


    populateRoomOptions_(
      booking.room
    );


    populateStartTimes_(
      booking.startTime
    );


    if (
      elements.startTime.value
    ) {

      populateEndTimes_(
        elements.startTime.value,
        booking.endTime
      );

    }


    elements.modal
      .classList
      .remove(
        'hidden'
      );


    elements.modal.setAttribute(
      'aria-hidden',
      'false'
    );


    document.body
      .classList
      .add(
        'modal-open'
      );


    setTimeout(
      function() {

        elements.activity.focus();

      },
      50
    );

  }


  function closeEditModal_() {

    if (
      elements.saveButton.disabled
    ) {

      return;

    }


    elements.modal
      .classList
      .add(
        'hidden'
      );


    elements.modal.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body
      .classList
      .remove(
        'modal-open'
      );


    editingBooking =
      null;

  }


  function populateRoomOptions_(
    selectedRoom
  ) {

    elements.room.innerHTML =
      '';


    DataStore
      .getRooms()
      .forEach(
        function(room) {

          const option =
            document.createElement(
              'option'
            );


          option.value =
            room.zoomId;


          option.textContent =
            room.zoomName ||
            room.zoomId;


          if (
            room.zoomId ===
            selectedRoom
          ) {

            option.selected =
              true;

          }


          elements.room
            .appendChild(
              option
            );

        }
      );

  }


  function handleScheduleContextChange_() {

    clearEditMessage_();


    populateStartTimes_(
      ''
    );


    resetEndTimes_();

  }


  /**
   * StartTime:
   *
   * - Uses SlotTime from memory
   * - Excludes occupied intervals
   * - Excludes the Booking currently edited
   */
  function populateStartTimes_(
    preferredTime
  ) {

    if (!editingBooking) {
      return;
    }


    const date =
      elements.date.value;


    const room =
      elements.room.value;


    if (
      !date ||
      !room
    ) {

      fillSelect_(
        elements.startTime,
        [],
        'เลือกวันที่และห้องก่อน'
      );


      elements.startTime.disabled =
        true;


      resetEndTimes_();

      return;

    }


    const intervals =
      getOccupiedIntervals_(
        date,
        room,
        editingBooking.id
      );


    const validStarts =
      DataStore
        .getSlots()
        .filter(
          function(time) {

            const minutes =
              timeToMinutes_(
                time
              );


            if (
              isPointOccupied_(
                minutes,
                intervals
              )
            ) {

              return false;

            }


            return (
              getValidEndTimes_(
                time,
                intervals
              ).length >
              0
            );

          }
        );


    fillSelect_(
      elements.startTime,
      validStarts,
      'เลือกเวลาเริ่ม'
    );


    elements.startTime.disabled =
      validStarts.length ===
      0;


    if (
      preferredTime &&
      validStarts.indexOf(
        preferredTime
      ) !==
      -1
    ) {

      elements.startTime.value =
        preferredTime;

    }


    if (
      validStarts.length ===
      0
    ) {

      showEditMessage_(
        'ไม่มีช่วงเวลาที่สามารถเริ่มการจองในห้องนี้ได้',
        'warning'
      );

    }

  }


  function populateEndTimes_(
    startTime,
    preferredTime
  ) {

    if (!startTime) {

      resetEndTimes_();

      return;

    }


    const intervals =
      getOccupiedIntervals_(
        elements.date.value,
        elements.room.value,
        editingBooking.id
      );


    const validEnds =
      getValidEndTimes_(
        startTime,
        intervals
      );


    fillSelect_(
      elements.endTime,
      validEnds,
      'เลือกเวลาสิ้นสุด'
    );


    elements.endTime.disabled =
      validEnds.length ===
      0;


    if (
      preferredTime &&
      validEnds.indexOf(
        preferredTime
      ) !==
      -1
    ) {

      elements.endTime.value =
        preferredTime;

    }

  }


  function resetEndTimes_() {

    fillSelect_(
      elements.endTime,
      [],
      'เลือกเวลาเริ่มก่อน'
    );


    elements.endTime.disabled =
      true;

  }


  /**
   * Returns Booking + Recurring
   * currently occupying selected Room/Date.
   *
   * Current Booking is ignored.
   */
  function getOccupiedIntervals_(
    date,
    roomId,
    excludeBookingId
  ) {

    const schedule =
      DataStore.getDaySchedule(
        date
      );


    const room =
      schedule.rooms.find(
        function(item) {

          return (
            item.roomId ===
            roomId
          );

        }
      );


    if (
      !room ||
      !Array.isArray(
        room.items
      )
    ) {

      return [];

    }


    return room.items
      .filter(
        function(item) {

          const isCurrentBooking =
            (
              item.type ===
                'booking' &&
              String(
                item.id
              ) ===
              String(
                excludeBookingId
              )
            );


          return !isCurrentBooking;

        }
      )
      .map(
        function(item) {

          return {

            start:
              timeToMinutes_(
                item.startTime
              ),

            end:
              timeToMinutes_(
                item.endTime
              ),

            item:
              item

          };

        }
      )
      .sort(
        function(a, b) {

          return (
            a.start -
            b.start
          );

        }
      );

  }


  function getValidEndTimes_(
    startTime,
    intervals
  ) {

    const startMinutes =
      timeToMinutes_(
        startTime
      );


    let nextOccupiedStart =
      null;


    intervals.forEach(
      function(interval) {

        if (
          interval.start >
          startMinutes
        ) {

          if (
            nextOccupiedStart ===
              null ||
            interval.start <
              nextOccupiedStart
          ) {

            nextOccupiedStart =
              interval.start;

          }

        }

      }
    );


    return DataStore
      .getSlots()
      .filter(
        function(time) {

          const minutes =
            timeToMinutes_(
              time
            );


          if (
            minutes <=
            startMinutes
          ) {

            return false;

          }


          if (
            nextOccupiedStart !==
              null &&
            minutes >
              nextOccupiedStart
          ) {

            return false;

          }


          return true;

        }
      );

  }


  function isPointOccupied_(
    minutes,
    intervals
  ) {

    return intervals.some(
      function(interval) {

        return (
          minutes >=
            interval.start &&
          minutes <
            interval.end
        );

      }
    );

  }


  /* =======================================================
     UPDATE
  ======================================================= */


  async function handleUpdate_(
    event
  ) {

    event.preventDefault();


    if (!editingBooking) {
      return;
    }


    clearEditMessage_();


    const activity =
      elements.activity.value.trim();


    const date =
      elements.date.value;


    const room =
      elements.room.value;


    const startTime =
      elements.startTime.value;


    const endTime =
      elements.endTime.value;


    if (!activity) {

      showEditMessage_(
        'กรุณาระบุชื่อกิจกรรม',
        'warning'
      );

      return;

    }


    if (
      !date ||
      date <
        getBangkokToday_()
    ) {

      showEditMessage_(
        'กรุณาเลือกวันที่ตั้งแต่วันนี้เป็นต้นไป',
        'warning'
      );

      return;

    }


    if (!room) {

      showEditMessage_(
        'กรุณาเลือกห้อง Zoom',
        'warning'
      );

      return;

    }


    if (!startTime) {

      showEditMessage_(
        'กรุณาเลือกเวลาเริ่ม',
        'warning'
      );

      return;

    }


    if (!endTime) {

      showEditMessage_(
        'กรุณาเลือกเวลาสิ้นสุด',
        'warning'
      );

      return;

    }


    setSaving_(
      true
    );


    try {

      await API.updateBooking({

        userId:
          getCurrentUserId_(),

        id:
          editingBooking.id,

        activity:
          activity,

        room:
          room,

        date:
          date,

        startTime:
          startTime,

        endTime:
          endTime

      });


      /*
       * Exactly one Booking reload.
       *
       * Timeline.refreshBookings()
       * calls DataStore.refreshBookings()
       * then redraws Home from the same cache.
       */
      await Timeline
        .refreshBookings();


      setSaving_(
        false
      );


      closeEditModal_();


      render_();


      showToast_(
        'แก้ไขการจองเรียบร้อยแล้ว',
        'success'
      );


    } catch (error) {

      console.error(
        error
      );


      /*
       * Someone else may have created
       * a conflicting Booking.
       */
      if (
        error.code ===
        'BOOKING_CONFLICT'
      ) {

        try {

          await Timeline
            .refreshBookings();


          populateStartTimes_(
            ''
          );


          resetEndTimes_();


        } catch (
          refreshError
        ) {

          console.error(
            refreshError
          );

        }


        showEditMessage_(
          error.message,
          'warning'
        );


      } else {

        showEditMessage_(
          error.message ||
          'ไม่สามารถแก้ไขการจองได้',
          'error'
        );

      }


      setSaving_(
        false
      );

    }

  }


  /* =======================================================
     DELETE
  ======================================================= */


  async function handleDelete_(
    booking
  ) {

    const accepted =
      window.confirm(
        'ต้องการลบการจอง "' +
        booking.activity +
        '"\n' +
        booking.startTime +
        '–' +
        booking.endTime +
        ' ใช่หรือไม่?'
      );


    if (!accepted) {
      return;
    }


    try {

      await API.deleteBooking(
        getCurrentUserId_(),
        booking.id
      );


      /*
       * Refresh only Booking once,
       * then update both Home + My Booking.
       */
      await Timeline
        .refreshBookings();


      render_();


      showToast_(
        'ลบการจองแล้ว',
        'success'
      );


    } catch (error) {

      console.error(
        error
      );


      showToast_(
        error.message ||
        'ไม่สามารถลบการจองได้',
        'error'
      );

    }

  }


  /* =======================================================
     HELPERS
  ======================================================= */


  function getCurrentUserId_() {

    return (
      currentUser.userId ||
      currentUser.userLogin ||
      ''
    );

  }


  function getRoomDisplayName_(
    roomId
  ) {

    const room =
      DataStore
        .getRooms()
        .find(
          function(item) {

            return (
              item.zoomId ===
              roomId
            );

          }
        );


    if (!room) {

      return roomId;

    }


    return (
      room.zoomName ||
      room.zoomId
    );

  }


  function fillSelect_(
    select,
    values,
    placeholder
  ) {

    select.innerHTML =
      '';


    const first =
      document.createElement(
        'option'
      );


    first.value =
      '';


    first.textContent =
      placeholder;


    select.appendChild(
      first
    );


    values.forEach(
      function(value) {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          value;


        option.textContent =
          value;


        select.appendChild(
          option
        );

      }
    );

  }


  function setSaving_(
    saving
  ) {

    elements.saveButton.disabled =
      saving;


    elements.cancelButton.disabled =
      saving;


    elements.closeButton.disabled =
      saving;


    elements.saveButton.textContent =
      saving
        ? 'กำลังบันทึก...'
        : 'บันทึกการแก้ไข';

  }


  function showEditMessage_(
    message,
    type
  ) {

    elements.message.textContent =
      message;


    elements.message.className =
      'my-booking-edit-message ' +
      (
        type ||
        'warning'
      );

  }


  function clearEditMessage_() {

    elements.message.textContent =
      '';


    elements.message.className =
      'my-booking-edit-message hidden';

  }


  function showLoading_() {

    elements.loading
      .classList
      .remove(
        'hidden'
      );


    elements.error
      .classList
      .add(
        'hidden'
      );


    elements.empty
      .classList
      .add(
        'hidden'
      );


    elements.groups.innerHTML =
      '';

  }


  function hideStatus_() {

    elements.loading
      .classList
      .add(
        'hidden'
      );


    elements.error
      .classList
      .add(
        'hidden'
      );


    elements.empty
      .classList
      .add(
        'hidden'
      );

  }


  function showError_(
    message
  ) {

    elements.loading
      .classList
      .add(
        'hidden'
      );


    elements.empty
      .classList
      .add(
        'hidden'
      );


    elements.error.textContent =
      message;


    elements.error
      .classList
      .remove(
        'hidden'
      );

  }


  function showToast_(
    message,
    type
  ) {

    const toast =
      document.getElementById(
        'toast'
      );


    if (!toast) {
      return;
    }


    toast.textContent =
      message;


    toast.className =
      'toast ' +
      (
        type ||
        'info'
      );


    setTimeout(
      function() {

        toast.classList.add(
          'hidden'
        );

      },
      3200
    );

  }


  function normalize_(
    value
  ) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

  }


  function timeToMinutes_(
    time
  ) {

    const parts =
      String(
        time || ''
      )
        .split(':');


    return (
      Number(parts[0]) *
        60 +
      Number(parts[1])
    );

  }


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
      function(part) {

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


  function formatThaiDate_(
    dateString
  ) {

    const parts =
      dateString.split('-');


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


  return {

    init,
    open,

    reload:
      render_

  };

})();


document.addEventListener(
  'DOMContentLoaded',
  MyBookings.init
);