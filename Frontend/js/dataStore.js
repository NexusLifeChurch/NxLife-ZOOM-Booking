/**
 * NxLife Zoom Booking System
 * Frontend Data Store
 *
 * Loads shared data once and keeps it
 * in browser memory until refresh.
 */

const DataStore = (function () {

  const APP_TIMEZONE =
    'Asia/Bangkok';


  const THAI_DAY_NAMES = [
    'อาทิตย์',
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสบดี',
    'ศุกร์',
    'เสาร์'
  ];


  const state = {

    loaded:
      false,

    loading:
      false,

    loadedAt:
      null,

    rooms:
      [],

    slots:
      [],

    recurring:
      [],

    bookings:
      []

  };


  let loadingPromise =
    null;


  /**
   * Initial App load.
   *
   * If data already exists,
   * do not request Backend again.
   */
  async function initialize() {

    if (state.loaded) {

      return getSnapshot();

    }


    if (state.loading && loadingPromise) {

      return loadingPromise;

    }


    return refreshAll();

  }


  /**
   * Manual full refresh.
   *
   * Loads independent APIs in parallel.
   */
  async function refreshAll() {

    state.loading =
      true;


    loadingPromise =
      Promise.all([

        API.getRooms(),

        API.getSlots(),

        API.getRecurring(),

        API.getBookings()

      ])
        .then(
          function (results) {

            const roomsResult =
              results[0] || {};

            const slotsResult =
              results[1] || {};

            const recurringResult =
              results[2] || {};

            const bookingsResult =
              results[3] || {};


            state.rooms =
              Array.isArray(
                roomsResult.rooms
              )
                ? roomsResult.rooms
                : [];


            state.slots =
              Array.isArray(
                slotsResult.slots
              )
                ? slotsResult.slots
                : [];


            state.recurring =
              Array.isArray(
                recurringResult.recurring
              )
                ? recurringResult.recurring
                : [];


            state.bookings =
              Array.isArray(
                bookingsResult.bookings
              )
                ? bookingsResult.bookings
                : [];


            state.loaded =
              true;


            state.loadedAt =
              new Date();


            return getSnapshot();

          }
        )
        .finally(
          function () {

            state.loading =
              false;

            loadingPromise =
              null;

          }
        );


    return loadingPromise;

  }


  /**
   * Refresh only ZoomBooking.
   *
   * This will be used after:
   * - Create Booking
   * - Update Booking
   * - Delete Booking
   * - Conflict detected during Save
   */
  async function refreshBookings() {

    const result =
      await API.getBookings();


    state.bookings =
      Array.isArray(result.bookings)
        ? result.bookings
        : [];


    state.loadedAt =
      new Date();


    return state.bookings;

  }


  /**
   * Refresh only recurring data.
   *
   * Admin CRUD will use this later.
   */
  async function refreshRecurring() {

    const result =
      await API.getRecurring();


    state.recurring =
      Array.isArray(result.recurring)
        ? result.recurring
        : [];


    state.loadedAt =
      new Date();


    return state.recurring;

  }


  /**
   * Refresh Rooms.
   */
  async function refreshRooms() {

    const result =
      await API.getRooms();


    state.rooms =
      Array.isArray(result.rooms)
        ? result.rooms
        : [];


    state.loadedAt =
      new Date();


    return state.rooms;

  }


  /**
   * Refresh SlotTime.
   */
  async function refreshSlots() {

    const result =
      await API.getSlots();


    state.slots =
      Array.isArray(result.slots)
        ? result.slots
        : [];


    state.loadedAt =
      new Date();


    return state.slots;

  }


  /**
   * Build selected day's Timeline
   * entirely from browser memory.
   *
   * NO API call here.
   */
  function getDaySchedule(dateString) {

    if (!state.loaded) {

      throw new Error(
        'ข้อมูลระบบยังโหลดไม่เสร็จ'
      );

    }


    if (!isValidDateString_(dateString)) {

      throw new Error(
        'รูปแบบวันที่ไม่ถูกต้อง'
      );

    }


    const today =
      getBangkokToday_();


    if (dateString < today) {

      throw new Error(
        'ไม่สามารถดูวันที่ย้อนหลังได้'
      );

    }


    const dayOfWeek =
      getThaiDayOfWeek_(
        dateString
      );


    /**
     * One-time bookings
     */
    const bookingItems =
      state.bookings
        .filter(
          function (booking) {

            return (
              booking.date ===
              dateString
            );

          }
        )
        .map(
          function (booking) {

            return {

              id:
                booking.id,

              type:
                'booking',

              activity:
                booking.activity,

              room:
                booking.room,

              startTime:
                booking.startTime,

              endTime:
                booking.endTime,

              recurring:
                false,

              createdBy:
                booking.createdBy,

              createdAt:
                booking.createdAt

            };

          }
        );


    /**
     * Recurring bookings
     */
    const recurringItems =
      state.recurring
        .filter(
          function (item) {

            if (
              item.active !== true
            ) {

              return false;

            }


            if (
              item.dayOfWeek !==
              dayOfWeek
            ) {

              return false;

            }


            if (
              item.startDate &&
              dateString < item.startDate
            ) {

              return false;

            }


            if (
              item.endDate &&
              dateString > item.endDate
            ) {

              return false;

            }


            return true;

          }
        )
        .map(
          function (item) {

            return {

              id:
                item.id,

              type:
                'recurring',

              activity:
                item.activity,

              room:
                item.room,

              startTime:
                item.startTime,

              endTime:
                item.endTime,

              recurring:
                true,

              dayOfWeek:
                item.dayOfWeek,

              startDate:
                item.startDate,

              endDate:
                item.endDate,

              createdBy:
                item.createdBy,

              createdAt:
                item.createdAt

            };

          }
        );


    /**
     * Combine both types.
     */
    const allItems =
      bookingItems.concat(
        recurringItems
      );


    /**
     * Build one block
     * for every Active room.
     */
    const roomSchedules =
      state.rooms.map(
        function (room) {

          const items =
            allItems
              .filter(
                function (item) {

                  return (
                    item.room ===
                    room.zoomId
                  );

                }
              )
              .sort(
                function (a, b) {

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


          return {

            roomId:
              room.zoomId,

            roomName:
              room.zoomName,

            zoomLink:
              room.zoomLink,

            note:
              room.note,

            count:
              items.length,

            items:
              items

          };

        }
      );


    return {

      date:
        dateString,

      dayOfWeek:
        dayOfWeek,

      roomCount:
        roomSchedules.length,

      itemCount:
        allItems.length,

      rooms:
        roomSchedules

    };

  }


  /**
   * Current in-memory data.
   *
   * Returns copies so UI does not
   * accidentally mutate Store.
   */
  function getSnapshot() {

    return {

      loaded:
        state.loaded,

      loadedAt:
        state.loadedAt,

      rooms:
        state.rooms.slice(),

      slots:
        state.slots.slice(),

      recurring:
        state.recurring.slice(),

      bookings:
        state.bookings.slice()

    };

  }


  function getRooms() {

    return state.rooms.slice();

  }


  function getSlots() {

    return state.slots.slice();

  }


  function getRecurring() {

    return state.recurring.slice();

  }


  function getBookings() {

    return state.bookings.slice();

  }


  function getLoadedAt() {

    return state.loadedAt;

  }


  /**
   * Convert HH:mm to minutes.
   */
  function timeToMinutes_(
    timeString
  ) {

    const parts =
      String(
        timeString || ''
      ).split(':');


    if (parts.length !== 2) {

      return 0;

    }


    return (
      Number(parts[0]) * 60 +
      Number(parts[1])
    );

  }


  /**
   * Get Thai day name.
   */
  function getThaiDayOfWeek_(
    dateString
  ) {

    const parts =
      dateString.split('-');


    const date =
      new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
        12,
        0,
        0
      );


    return (
      THAI_DAY_NAMES[
        date.getDay()
      ]
    );

  }


  /**
   * Bangkok today YYYY-MM-DD.
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


    const map = {};


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


  function isValidDateString_(
    value
  ) {

    return /^\d{4}-\d{2}-\d{2}$/
      .test(
        String(value || '')
      );

  }


  return {

    initialize,

    refreshAll,
    refreshBookings,
    refreshRecurring,
    refreshRooms,
    refreshSlots,

    getDaySchedule,

    getSnapshot,
    getRooms,
    getSlots,
    getRecurring,
    getBookings,
    getLoadedAt

  };

})();