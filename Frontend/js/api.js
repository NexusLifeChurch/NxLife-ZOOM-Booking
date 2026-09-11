/**
 * NxLife Zoom Booking System
 * Central API Client
 */

const API = (function () {

  const API_URL =
    'https://script.google.com/macros/s/AKfycbyWGa6jIRX8gP69HLMMB_5hoyh7lWVgzjt5C4vEuFEfJ2DB2y0M3u2vc-jJK7kjlJ8Z/exec';


  /**
   * Standard API error
   */
  class ApiError extends Error {

    constructor(
      code,
      message,
      payload = null
    ) {

      super(
        message
      );


      this.name =
        'ApiError';


      this.code =
        code;


      this.payload =
        payload;

    }

  }


  /**
   * Send request to GAS.
   */
  async function request(
    action,
    data = {}
  ) {

    let response;


    try {

      response =
        await fetch(
          API_URL,
          {

            method:
              'POST',

            headers: {

              'Content-Type':
                'text/plain;charset=utf-8'

            },

            body:
              JSON.stringify({

                action:
                  action,

                data:
                  data

              }),

            cache:
              'no-store',

            redirect:
              'follow'

          }
        );

    } catch (error) {

      throw new ApiError(
        'NETWORK_ERROR',
        'ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบอินเทอร์เน็ต'
      );

    }


    let payload;


    try {

      const text =
        await response.text();


      payload =
        JSON.parse(
          text
        );

    } catch (error) {

      throw new ApiError(
        'INVALID_RESPONSE',
        'ระบบได้รับข้อมูลตอบกลับที่ไม่ถูกต้อง'
      );

    }


    if (
      !payload.success
    ) {

      const apiError =
        payload.error || {};


      throw new ApiError(
        apiError.code ||
          'API_ERROR',

        apiError.message ||
          'เกิดข้อผิดพลาดในการทำรายการ',

        payload
      );

    }


    return payload.data;

  }


  /* =======================================================
     AUTHENTICATION
  ======================================================= */


  function getUserProfile(
    userId
  ) {

    return request(
      'getUserProfile',
      {

        userId:
          userId

      }
    );

  }


  function verifyOtp(
    userId,
    otp
  ) {

    return request(
      'verifyOtp',
      {

        userId:
          userId,

        otp:
          otp

      }
    );

  }


  function generateOtp(
    userId
  ) {

    return request(
      'generateOtp',
      {

        userId:
          userId

      }
    );

  }


  /* =======================================================
     ROOMS / SLOTS
  ======================================================= */


  function getRooms() {

    return request(
      'getRooms'
    );

  }


  function getSlots() {

    return request(
      'getSlots'
    );

  }


  /* =======================================================
     RECURRING
  ======================================================= */


  /**
   * Normal App read.
   *
   * Active recurring only.
   */
  function getRecurring() {

    return request(
      'getRecurring'
    );

  }


  /**
   * Admin:
   * Read Active + Inactive recurring.
   */
  function getRecurringAdmin(
    userId
  ) {

    return request(
      'getRecurring',
      {

        userId:
          userId,

        includeInactive:
          true

      }
    );

  }


  /**
   * Admin:
   * Create recurring.
   *
   * Phase 7B-2 UI will use this.
   */
  function createRecurring(
    recurring
  ) {

    return request(
      'createRecurring',
      recurring
    );

  }


  /**
   * Admin:
   * Update recurring.
   */
  function updateRecurring(
    recurring
  ) {

    return request(
      'updateRecurring',
      recurring
    );

  }


  /**
   * Admin:
   * Permanently delete recurring.
   */
  function deleteRecurring(
    userId,
    recurringId
  ) {

    return request(
      'deleteRecurring',
      {

        userId:
          userId,

        id:
          recurringId

      }
    );

  }


  /* =======================================================
     BOOKING
  ======================================================= */


  function getBookings(
    date = ''
  ) {

    const data =
      {};


    if (date) {

      data.date =
        date;

    }


    return request(
      'getBookings',
      data
    );

  }


  /**
   * Create one-time Booking.
   */
  function createBooking(
    booking
  ) {

    return request(
      'createBooking',
      booking
    );

  }


  /**
   * Update one-time Booking.
   */
  function updateBooking(
    booking
  ) {

    return request(
      'updateBooking',
      booking
    );

  }


  /**
   * Delete one-time Booking.
   */
  function deleteBooking(
    userId,
    bookingId
  ) {

    return request(
      'deleteBooking',
      {

        userId:
          userId,

        id:
          bookingId

      }
    );

  }


  /* =======================================================
     DAILY SCHEDULE
  ======================================================= */


  function getDaySchedule(
    date = ''
  ) {

    const data =
      {};


    if (date) {

      data.date =
        date;

    }


    return request(
      'getDaySchedule',
      data
    );

  }


  /* =======================================================
     ADMIN USER CRUD
  ======================================================= */


  /**
   * Admin:
   * Get all Users including OTP.
   */
  function getUsersAdmin(
    userId
  ) {

    return request(
      'getUsersAdmin',
      {

        userId:
          userId

      }
    );

  }


  /**
   * Admin:
   * Create User.
   */
  function createUserAdmin(
    user
  ) {

    return request(
      'createUserAdmin',
      user
    );

  }


  /**
   * Admin:
   * Update User.
   */
  function updateUserAdmin(
    user
  ) {

    return request(
      'updateUserAdmin',
      user
    );

  }


  /**
   * Admin:
   * Delete User.
   */
  function deleteUserAdmin(
    userId,
    targetUserLogin
  ) {

    return request(
      'deleteUserAdmin',
      {

        userId:
          userId,

        targetUserLogin:
          targetUserLogin

      }
    );

  }


  return {

    request,

    getUserProfile,
    verifyOtp,
    generateOtp,

    getRooms,
    getSlots,

    getRecurring,
    getRecurringAdmin,
    createRecurring,
    updateRecurring,
    deleteRecurring,

    getBookings,
    createBooking,
    updateBooking,
    deleteBooking,

    getUsersAdmin,
    createUserAdmin,
    updateUserAdmin,
    deleteUserAdmin,

    getDaySchedule

  };

})();

