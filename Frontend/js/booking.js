/**
 * NxLife Zoom Booking System
 * One-time Booking Popup
 */

const Booking = (function () {

  let context =
    null;


  let initialized =
    false;


  let toastTimer =
    null;


  const elements =
    {};


  /**
   * Initialize once.
   */
  function init() {

    if (initialized) {
      return;
    }


    cacheElements();

    bindEvents();


    initialized =
      true;

  }


  /**
   * DOM references.
   */
  function cacheElements() {

    elements.modal =
      document.getElementById(
        'bookingModal'
      );


    elements.card =
      document.getElementById(
        'bookingModalCard'
      );


    elements.closeButton =
      document.getElementById(
        'bookingCloseButton'
      );


    elements.cancelButton =
      document.getElementById(
        'bookingCancelButton'
      );


    elements.form =
      document.getElementById(
        'bookingForm'
      );


    elements.activity =
      document.getElementById(
        'bookingActivity'
      );


    elements.startTime =
      document.getElementById(
        'bookingStartTime'
      );


    elements.endTime =
      document.getElementById(
        'bookingEndTime'
      );


    elements.room =
      document.getElementById(
        'bookingRoomDisplay'
      );


    elements.date =
      document.getElementById(
        'bookingDateDisplay'
      );


    elements.user =
      document.getElementById(
        'bookingUserDisplay'
      );


    elements.message =
      document.getElementById(
        'bookingMessage'
      );


    elements.submitButton =
      document.getElementById(
        'bookingSubmitButton'
      );

  }


  /**
   * Bind Booking events.
   */
  function bindEvents() {

    /*
     * Capture phase intentionally intercepts
     * the temporary Phase 4 button handler.
     */
    document.addEventListener(
      'click',
      handleGlobalClick,
      true
    );


    elements.closeButton
      .addEventListener(
        'click',
        close
      );


    elements.cancelButton
      .addEventListener(
        'click',
        close
      );


    elements.modal
      .addEventListener(
        'click',
        handleBackdropClick
      );


    elements.startTime
      .addEventListener(
        'change',
        handleStartTimeChange
      );


    elements.endTime
      .addEventListener(
        'change',
        clearMessage
      );


    elements.form
      .addEventListener(
        'submit',
        handleSubmit
      );


    document.addEventListener(
      'keydown',
      handleKeydown
    );

  }


  /**
   * Intercept "+ เพิ่มการจอง".
   */
  function handleGlobalClick(
    event
  ) {

    const button =
      event.target.closest(
        '.add-booking-button'
      );


    if (!button) {
      return;
    }


    /*
     * Prevent old temporary
     * Timeline click handler.
     */
    event.preventDefault();
    event.stopImmediatePropagation();


    const roomSection =
      button.closest(
        '.room-section'
      );


    if (!roomSection) {

      showGlobalToast(
        'ไม่พบข้อมูลห้อง Zoom',
        'error'
      );

      return;
    }


    const datePicker =
      document.getElementById(
        'datePicker'
      );


    const user =
      Auth.getCurrentUser();


    if (!user) {

      showGlobalToast(
        'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่',
        'error'
      );

      return;
    }


    open({

      roomId:
        roomSection.dataset.roomId,

      roomName:
        roomSection.dataset.roomName,

      date:
        datePicker
          ? datePicker.value
          : '',

      user:
        user

    });

  }


  /**
   * Open Create Booking modal.
   */
  function open(
    options
  ) {

    context = {

      roomId:
        options.roomId,

      roomName:
        options.roomName,

      date:
        options.date,

      user:
        options.user

    };


    elements.room.textContent =
      context.roomName ||
      context.roomId;


    elements.date.textContent =
      formatThaiDate_(
        context.date
      );


    elements.user.textContent =
      context.user.userName ||
      context.user.userId;


    elements.activity.value =
      '';


    clearMessage();


    populateStartTimes();


    resetEndTimes();


    elements.modal.classList.remove(
      'hidden'
    );


    elements.modal.setAttribute(
      'aria-hidden',
      'false'
    );


    document.body.classList.add(
      'modal-open'
    );


    setTimeout(
      function () {

        elements.activity.focus();

      },
      50
    );

  }


  /**
   * Close modal.
   */
  function close() {

    if (
      elements.submitButton.disabled
    ) {

      return;
    }


    elements.modal.classList.add(
      'hidden'
    );


    elements.modal.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body.classList.remove(
      'modal-open'
    );


    context =
      null;

  }


  /**
   * Backdrop click.
   */
  function handleBackdropClick(
    event
  ) {

    if (
      event.target ===
      elements.modal
    ) {

      close();

    }

  }


  /**
   * Escape closes popup.
   */
  function handleKeydown(
    event
  ) {

    if (
      event.key ===
      'Escape' &&
      !elements.modal.classList.contains(
        'hidden'
      )
    ) {

      close();

    }

  }


  /**
   * StartTime options:
   *
   * - From SlotTime
   * - Remove any slot currently occupied
   * - Must have at least one valid EndTime
   */
  function populateStartTimes() {

    const slots =
      DataStore.getSlots();


    const intervals =
      getOccupiedIntervals_();


    const validStarts =
      slots.filter(
        function (time) {

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
      validStarts.length === 0;


    if (
      validStarts.length === 0
    ) {

      showMessage(
        'วันนี้ไม่มีช่วงเวลาที่สามารถเริ่มการจองในห้องนี้ได้',
        'warning'
      );

    }

  }


  /**
   * StartTime changed.
   */
  function handleStartTimeChange() {

    clearMessage();


    const startTime =
      elements.startTime.value;


    if (!startTime) {

      resetEndTimes();

      return;

    }


    const intervals =
      getOccupiedIntervals_();


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
      validEnds.length === 0;

  }


  /**
   * Reset EndTime.
   */
  function resetEndTimes() {

    fillSelect_(
      elements.endTime,
      [],
      'เลือกเวลาเริ่มก่อน'
    );


    elements.endTime.disabled =
      true;

  }


  /**
   * EndTime rules:
   *
   * - End > Start
   * - If another Booking begins later,
   *   End cannot pass beyond that Start.
   *
   * End may equal next Booking Start
   * because End is exclusive.
   */
  function getValidEndTimes_(
    startTime,
    intervals
  ) {

    const startMinutes =
      timeToMinutes_(
        startTime
      );


    const slots =
      DataStore.getSlots();


    let nextOccupiedStart =
      null;


    intervals.forEach(
      function (interval) {

        if (
          interval.start >
          startMinutes
        ) {

          if (
            nextOccupiedStart === null ||
            interval.start <
              nextOccupiedStart
          ) {

            nextOccupiedStart =
              interval.start;

          }

        }

      }
    );


    return slots.filter(
      function (time) {

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
          nextOccupiedStart !== null &&
          minutes >
            nextOccupiedStart
        ) {

          return false;

        }


        return true;

      }
    );

  }


  /**
   * Current room/day occupied intervals
   * from Browser Cache.
   */
  function getOccupiedIntervals_() {

    if (!context) {
      return [];
    }


    const schedule =
      DataStore.getDaySchedule(
        context.date
      );


    const room =
      schedule.rooms.find(
        function (item) {

          return (
            item.roomId ===
            context.roomId
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
      .map(
        function (item) {

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
        function (a, b) {

          return (
            a.start -
            b.start
          );

        }
      );

  }


  /**
   * Start inclusive / End exclusive.
   */
  function isPointOccupied_(
    minutes,
    intervals
  ) {

    return intervals.some(
      function (interval) {

        return (
          minutes >=
            interval.start &&
          minutes <
            interval.end
        );

      }
    );

  }


  /**
   * Local Conflict UX check.
   *
   * Backend will still perform
   * Final Conflict Check.
   */
  function findLocalConflict_(
    startTime,
    endTime
  ) {

    const newStart =
      timeToMinutes_(
        startTime
      );


    const newEnd =
      timeToMinutes_(
        endTime
      );


    const intervals =
      getOccupiedIntervals_();


    for (
      let index = 0;
      index < intervals.length;
      index++
    ) {

      const interval =
        intervals[index];


      if (
        newStart <
          interval.end &&
        newEnd >
          interval.start
      ) {

        return interval.item;

      }

    }


    return null;

  }


  /**
   * Submit Booking.
   */
  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (!context) {
      return;
    }


    clearMessage();


    const activity =
      elements.activity.value.trim();


    const startTime =
      elements.startTime.value;


    const endTime =
      elements.endTime.value;


    if (!activity) {

      showMessage(
        'กรุณาระบุชื่อกิจกรรม',
        'warning'
      );


      elements.activity.focus();

      return;

    }


    if (!startTime) {

      showMessage(
        'กรุณาเลือกเวลาเริ่ม',
        'warning'
      );

      return;

    }


    if (!endTime) {

      showMessage(
        'กรุณาเลือกเวลาสิ้นสุด',
        'warning'
      );

      return;

    }


    /*
     * Frontend Conflict Check.
     */
    const localConflict =
      findLocalConflict_(
        startTime,
        endTime
      );


    if (localConflict) {

      showMessage(
        buildLocalConflictMessage_(
          localConflict
        ),
        'warning'
      );

      return;

    }


    setSubmitting_(
      true
    );


    try {

      await API.createBooking({

        userId:
          context.user.userId,

        activity:
          activity,

        room:
          context.roomId,

        date:
          context.date,

        startTime:
          startTime,

        endTime:
          endTime

      });


      /*
       * Reload only ZoomBooking,
       * then render Timeline from cache.
       */
      await Timeline.refreshBookings();


      showGlobalToast(
        'จองห้องเรียบร้อยแล้ว',
        'success'
      );


      setSubmitting_(
        false
      );


      close();


    } catch (error) {

      console.error(
        error
      );


      /*
       * Someone else may have booked
       * while this Popup was open.
       */
      if (
        error.code ===
        'BOOKING_CONFLICT'
      ) {

        showMessage(
          error.message,
          'warning'
        );


        /*
         * Canon:
         * Backend is Source of Truth.
         * Refresh Booking after conflict.
         */
        try {

          await Timeline
            .refreshBookings();


          populateStartTimes();

          resetEndTimes();


        } catch (
          refreshError
        ) {

          console.error(
            refreshError
          );

        }

      } else {

        showMessage(
          error.message ||
          'ไม่สามารถบันทึกการจองได้',
          'error'
        );

      }


      setSubmitting_(
        false
      );

    }

  }


  /**
   * Local conflict message.
   */
  function buildLocalConflictMessage_(
    item
  ) {

    let text =
      'ไม่สามารถจองช่วงเวลานี้ได้\n' +
      'ชนกับ ' +
      (
        item.activity ||
        'กิจกรรมอื่น'
      ) +
      '\n' +
      item.startTime +
      '–' +
      item.endTime;


    if (
      item.type ===
        'recurring' ||
      item.recurring ===
        true
    ) {

      text +=
        '\nกิจกรรมประจำ';

    } else if (
      item.createdBy
    ) {

      text +=
        '\nผู้จอง: ' +
        item.createdBy;

    }


    return text;

  }


  /**
   * Select helper.
   */
  function fillSelect_(
    select,
    values,
    placeholder
  ) {

    select.innerHTML =
      '';


    const placeholderOption =
      document.createElement(
        'option'
      );


    placeholderOption.value =
      '';


    placeholderOption.textContent =
      placeholder;


    placeholderOption.selected =
      true;


    select.appendChild(
      placeholderOption
    );


    values.forEach(
      function (value) {

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


  /**
   * Modal message.
   */
  function showMessage(
    message,
    type
  ) {

    elements.message.textContent =
      message;


    elements.message.className =
      'booking-message ' +
      type;

  }


  function clearMessage() {

    elements.message.textContent =
      '';


    elements.message.className =
      'booking-message hidden';

  }


  /**
   * Save state.
   */
  function setSubmitting_(
    busy
  ) {

    elements.submitButton.disabled =
      busy;


    elements.cancelButton.disabled =
      busy;


    elements.closeButton.disabled =
      busy;


    elements.submitButton.textContent =
      busy
        ? 'กำลังบันทึก...'
        : 'ยืนยันการจอง';

  }


  /**
   * Global existing Toast.
   */
  function showGlobalToast(
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


    if (toastTimer) {

      clearTimeout(
        toastTimer
      );

    }


    toast.textContent =
      message;


    toast.className =
      'toast ' +
      (
        type ||
        'info'
      );


    toastTimer =
      setTimeout(
        function () {

          toast.classList.add(
            'hidden'
          );

        },
        3500
      );

  }


  /**
   * HH:mm → minutes.
   */
  function timeToMinutes_(
    time
  ) {

    const parts =
      String(
        time || ''
      ).split(':');


    return (
      Number(parts[0]) *
        60 +
      Number(parts[1])
    );

  }


  /**
   * Thai date display.
   */
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

    init

  };

})();


document.addEventListener(
  'DOMContentLoaded',
  Booking.init
);