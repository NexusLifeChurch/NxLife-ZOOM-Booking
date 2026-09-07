/**
 * NxLife Zoom Booking System
 * Frontend Authentication
 */

const Auth = (function () {

  const STORAGE_KEYS = {
    USER_ID: 'nxZoomUserId',
    PIN: 'nxZoomPin'
  };


  let currentUser = null;


  /**
   * Build frontend-only error.
   */
  function createError(code, message) {

    const error =
      new Error(message);

    error.code =
      code;

    return error;

  }


  /**
   * PIN must be exactly 4 digits.
   */
  function isValidPin(pin) {

    return /^\d{4}$/.test(
      String(pin || '').trim()
    );

  }


  /**
   * Read saved local login.
   */
  function getStoredCredentials() {

    return {

      userId:
        localStorage.getItem(
          STORAGE_KEYS.USER_ID
        ) || '',

      pin:
        localStorage.getItem(
          STORAGE_KEYS.PIN
        ) || ''

    };

  }


  /**
   * Does this browser already have
   * UserID + PIN?
   */
  function hasStoredLogin() {

    const credentials =
      getStoredCredentials();


    return Boolean(
      credentials.userId &&
      isValidPin(credentials.pin)
    );

  }


  /**
   * Save UserID + PIN locally.
   *
   * PIN is intentionally stored as plain text
   * according to this project's requirement.
   */
  function saveLogin(userId, pin) {

    const cleanUserId =
      String(userId || '').trim();

    const cleanPin =
      String(pin || '').trim();


    if (!cleanUserId) {

      throw createError(
        'INVALID_USER_ID',
        'ไม่พบ UserID'
      );

    }


    if (!isValidPin(cleanPin)) {

      throw createError(
        'INVALID_PIN',
        'PIN ต้องเป็นตัวเลข 4 หลัก'
      );

    }


    localStorage.setItem(
      STORAGE_KEYS.USER_ID,
      cleanUserId
    );


    localStorage.setItem(
      STORAGE_KEYS.PIN,
      cleanPin
    );

  }


  /**
   * Clear this browser's saved login.
   */
  function clearStoredLogin() {

    localStorage.removeItem(
      STORAGE_KEYS.USER_ID
    );

    localStorage.removeItem(
      STORAGE_KEYS.PIN
    );


    currentUser = null;

  }


  /**
   * Verify UserID + OTP through Backend.
   */
  async function verifyOtp(userId, otp) {

    const cleanUserId =
      String(userId || '').trim();

    const cleanOtp =
      String(otp || '').trim();


    if (!cleanUserId) {

      throw createError(
        'INVALID_USER_ID',
        'กรุณากรอก UserID'
      );

    }


    if (!/^\d{4}$/.test(cleanOtp)) {

      throw createError(
        'INVALID_OTP',
        'OTP ต้องเป็นตัวเลข 4 หลัก'
      );

    }


    const result =
      await API.verifyOtp(
        cleanUserId,
        cleanOtp
      );


    currentUser =
      result.user;


    return result;

  }


  /**
   * Login using locally stored PIN.
   *
   * PIN is checked locally.
   * After PIN is correct, Backend is called
   * again to confirm User is still Active
   * and to obtain current Role.
   */
  async function loginWithPin(pin) {

    const credentials =
      getStoredCredentials();


    if (
      !credentials.userId ||
      !credentials.pin
    ) {

      throw createError(
        'LOCAL_LOGIN_NOT_FOUND',
        'ไม่พบข้อมูลเข้าสู่ระบบในเครื่องนี้'
      );

    }


    const enteredPin =
      String(pin || '').trim();


    if (!isValidPin(enteredPin)) {

      throw createError(
        'INVALID_PIN',
        'PIN ต้องเป็นตัวเลข 4 หลัก'
      );

    }


    if (
      enteredPin !==
      credentials.pin
    ) {

      throw createError(
        'PIN_MISMATCH',
        'PIN ไม่ถูกต้อง'
      );

    }


    /*
     * PIN passed locally.
     *
     * Now ask Backend for current:
     * - UserName
     * - Role
     * - Active
     */
    const result =
      await API.getUserProfile(
        credentials.userId
      );


    currentUser =
      result.user;


    return currentUser;

  }


  /**
   * Forgot PIN.
   *
   * Generate a new OTP in Backend.
   * Old local PIN is removed only after
   * Backend successfully creates OTP.
   */
  async function generateNewOtpForStoredUser() {

    const credentials =
      getStoredCredentials();


    if (!credentials.userId) {

      throw createError(
        'LOCAL_USER_NOT_FOUND',
        'ไม่พบ UserID ในเครื่องนี้'
      );

    }


    const result =
      await API.generateOtp(
        credentials.userId
      );


    /*
     * OTP was generated successfully.
     * Old PIN is now invalid for this flow.
     */
    localStorage.removeItem(
      STORAGE_KEYS.PIN
    );


    currentUser = null;


    return result;

  }


  /**
   * Current authenticated user.
   */
  function getCurrentUser() {

    return currentUser;

  }


  /**
   * Set current user after OTP verification.
   */
  function setCurrentUser(user) {

    currentUser =
      user || null;

  }


  /**
   * Lock App but keep UserID + PIN.
   */
  function lock() {

    currentUser = null;

  }


  return {

    isValidPin,

    getStoredCredentials,
    hasStoredLogin,

    saveLogin,
    clearStoredLogin,

    verifyOtp,
    loginWithPin,

    generateNewOtpForStoredUser,

    getCurrentUser,
    setCurrentUser,

    lock

  };

})();