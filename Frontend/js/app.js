/**
 * NxLife Zoom Booking System
 * Frontend App Controller
 */

const App = (function () {

  let verifiedUser = null;

  let toastTimer = null;


  const elements = {};


  /**
   * Cache DOM elements.
   */
  function cacheElements() {

    elements.brandHeader =
      document.getElementById(
        'brandHeader'
      );


    elements.otpScreen =
      document.getElementById(
        'otpScreen'
      );

    elements.pinLoginScreen =
      document.getElementById(
        'pinLoginScreen'
      );

    elements.setPinScreen =
      document.getElementById(
        'setPinScreen'
      );

    elements.appScreen =
      document.getElementById(
        'appScreen'
      );


    elements.otpForm =
      document.getElementById(
        'otpForm'
      );

    elements.userIdInput =
      document.getElementById(
        'userIdInput'
      );

    elements.otpInput =
      document.getElementById(
        'otpInput'
      );

    elements.otpHint =
      document.getElementById(
        'otpHint'
      );


    elements.pinLoginForm =
      document.getElementById(
        'pinLoginForm'
      );

    elements.pinLoginInput =
      document.getElementById(
        'pinLoginInput'
      );

    elements.savedUserId =
      document.getElementById(
        'savedUserId'
      );


    elements.forgotPinButton =
      document.getElementById(
        'forgotPinButton'
      );

    elements.changeUserButton =
      document.getElementById(
        'changeUserButton'
      );


    elements.setPinForm =
      document.getElementById(
        'setPinForm'
      );

    elements.newPinInput =
      document.getElementById(
        'newPinInput'
      );

    elements.confirmPinInput =
      document.getElementById(
        'confirmPinInput'
      );

    elements.verifiedUserName =
      document.getElementById(
        'verifiedUserName'
      );

    elements.verifiedUserId =
      document.getElementById(
        'verifiedUserId'
      );


    elements.lockButton =
      document.getElementById(
        'lockButton'
      );


    elements.toast =
      document.getElementById(
        'toast'
      );

  }


  /**
   * Bind events.
   */
  function bindEvents() {

    elements.otpForm.addEventListener(
      'submit',
      handleOtpSubmit
    );


    elements.pinLoginForm.addEventListener(
      'submit',
      handlePinLogin
    );


    elements.setPinForm.addEventListener(
      'submit',
      handleSetPin
    );


    elements.forgotPinButton.addEventListener(
      'click',
      handleForgotPin
    );


    elements.changeUserButton.addEventListener(
      'click',
      handleChangeUser
    );


    elements.lockButton.addEventListener(
      'click',
      handleLock
    );

  }


  /**
   * Initialize App.
   */
  function init() {

    cacheElements();

    bindEvents();


    if (Auth.hasStoredLogin()) {

      showPinLogin();

    } else {

      showOtpLogin();

    }

  }


  /**
   * Show only one main screen.
   */
  function showScreen(screen) {

    const screens = [
      elements.otpScreen,
      elements.pinLoginScreen,
      elements.setPinScreen,
      elements.appScreen
    ];


    screens.forEach(
      function (item) {

        item.classList.add(
          'hidden'
        );

      }
    );


    screen.classList.remove(
      'hidden'
    );

  }


  /**
   * Change shell mode.
   */
  function setHomeMode(isHome) {

    document.body.classList.toggle(
      'home-mode',
      isHome
    );


    if (elements.brandHeader) {

      elements.brandHeader.classList.toggle(
        'hidden',
        isHome
      );

    }

  }


  /**
   * First login / OTP screen.
   */
  function showOtpLogin(userId = '') {

    setHomeMode(
      false
    );


    showScreen(
      elements.otpScreen
    );


    elements.userIdInput.value =
      userId;


    elements.otpInput.value =
      '';


    setTimeout(
      function () {

        if (userId) {

          elements.otpInput.focus();

        } else {

          elements.userIdInput.focus();

        }

      },
      50
    );

  }


  /**
   * Existing PIN screen.
   */
  function showPinLogin() {

    setHomeMode(
      false
    );


    const credentials =
      Auth.getStoredCredentials();


    elements.savedUserId.textContent =
      credentials.userId;


    elements.pinLoginInput.value =
      '';


    showScreen(
      elements.pinLoginScreen
    );


    setTimeout(
      function () {

        elements.pinLoginInput.focus();

      },
      50
    );

  }


  /**
   * Set new PIN screen.
   */
  function showSetPin(user) {

    setHomeMode(
      false
    );


    verifiedUser =
      user;


    elements.verifiedUserName.textContent =
      user.userName ||
      'NxLife User';


    elements.verifiedUserId.textContent =
      user.userId;


    elements.newPinInput.value =
      '';

    elements.confirmPinInput.value =
      '';


    showScreen(
      elements.setPinScreen
    );


    setTimeout(
      function () {

        elements.newPinInput.focus();

      },
      50
    );

  }


  /**
   * Real App Home.
   */
  function showApp(user) {

    Auth.setCurrentUser(
      user
    );


    setHomeMode(
      true
    );


    showScreen(
      elements.appScreen
    );


    /*
     * Initialize Timeline only after
     * Home DOM becomes visible.
     */
    Timeline.init({
      user: user,
      showToast: showToast
    });


    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });

  }


  /**
   * User submits UserID + OTP.
   */
  async function handleOtpSubmit(event) {

    event.preventDefault();


    const submitButton =
      elements.otpForm.querySelector(
        'button[type="submit"]'
      );


    setButtonBusy(
      submitButton,
      true,
      'กำลังตรวจสอบ...'
    );


    try {

      const userId =
        elements.userIdInput.value.trim();


      const otp =
        elements.otpInput.value.trim();


      const result =
        await Auth.verifyOtp(
          userId,
          otp
        );


      showToast(
        'ยืนยัน OTP สำเร็จ',
        'success'
      );


      showSetPin(
        result.user
      );


    } catch (error) {

      showError(
        error
      );


    } finally {

      setButtonBusy(
        submitButton,
        false
      );

    }

  }


  /**
   * Existing user submits PIN.
   */
  async function handlePinLogin(event) {

    event.preventDefault();


    const submitButton =
      elements.pinLoginForm.querySelector(
        'button[type="submit"]'
      );


    setButtonBusy(
      submitButton,
      true,
      'กำลังเข้าสู่ระบบ...'
    );


    try {

      const pin =
        elements.pinLoginInput.value.trim();


      const user =
        await Auth.loginWithPin(
          pin
        );


      showToast(
        'เข้าสู่ระบบสำเร็จ',
        'success'
      );


      showApp(
        user
      );


    } catch (error) {

      elements.pinLoginInput.value =
        '';


      showError(
        error
      );


    } finally {

      setButtonBusy(
        submitButton,
        false
      );

    }

  }


  /**
   * Save new local PIN.
   */
  function handleSetPin(event) {

    event.preventDefault();


    try {

      if (!verifiedUser) {

        throw new Error(
          'ไม่พบข้อมูลผู้ใช้งานที่ยืนยันแล้ว'
        );

      }


      const pin =
        elements.newPinInput.value.trim();


      const confirmPin =
        elements.confirmPinInput.value.trim();


      if (!Auth.isValidPin(pin)) {

        throw new Error(
          'PIN ต้องเป็นตัวเลข 4 หลัก'
        );

      }


      if (pin !== confirmPin) {

        throw new Error(
          'PIN ที่กรอกทั้งสองครั้งไม่ตรงกัน'
        );

      }


      Auth.saveLogin(
        verifiedUser.userId,
        pin
      );


      Auth.setCurrentUser(
        verifiedUser
      );


      showToast(
        'บันทึก PIN เรียบร้อย',
        'success'
      );


      const user =
        verifiedUser;


      verifiedUser =
        null;


      showApp(
        user
      );


    } catch (error) {

      showError(
        error
      );

    }

  }


  /**
   * Forgot PIN.
   */
  async function handleForgotPin() {

    const button =
      elements.forgotPinButton;


    setButtonBusy(
      button,
      true,
      'กำลังสร้าง OTP...'
    );


    try {

      const credentials =
        Auth.getStoredCredentials();


      const userId =
        credentials.userId;


      const result =
        await Auth.generateNewOtpForStoredUser();


      elements.otpHint.textContent =
        result.message;


      showToast(
        'สร้าง OTP ใหม่แล้ว',
        'success'
      );


      showOtpLogin(
        userId
      );


    } catch (error) {

      showError(
        error
      );


    } finally {

      setButtonBusy(
        button,
        false
      );

    }

  }


  /**
   * Use another UserID.
   */
  function handleChangeUser() {

    Auth.clearStoredLogin();

    verifiedUser =
      null;


    elements.otpHint.textContent =
      'กรุณากรอก UserID และ OTP';


    showOtpLogin();

  }


  /**
   * Lock App but preserve
   * UserID + PIN.
   */
  function handleLock() {

    Auth.lock();

    verifiedUser =
      null;


    if (Auth.hasStoredLogin()) {

      showPinLogin();

    } else {

      showOtpLogin();

    }

  }


  /**
   * Busy button.
   */
  function setButtonBusy(
    button,
    busy,
    busyText = 'กำลังดำเนินการ...'
  ) {

    if (!button) {
      return;
    }


    if (busy) {

      button.dataset.originalText =
        button.textContent;


      button.disabled =
        true;


      button.textContent =
        busyText;

    } else {

      button.disabled =
        false;


      if (
        button.dataset.originalText
      ) {

        button.textContent =
          button.dataset.originalText;

      }

    }

  }


  /**
   * Display user-friendly error.
   */
  function showError(error) {

    console.error(
      error
    );


    const message =
      error &&
      error.message
        ? error.message
        : 'เกิดข้อผิดพลาด กรุณาลองใหม่';


    showToast(
      message,
      'error'
    );

  }


  /**
   * Toast.
   */
  function showToast(
    message,
    type = 'info'
  ) {

    if (toastTimer) {

      clearTimeout(
        toastTimer
      );

    }


    elements.toast.textContent =
      message;


    elements.toast.className =
      'toast ' + type;


    toastTimer =
      setTimeout(
        function () {

          elements.toast.classList.add(
            'hidden'
          );

        },
        3500
      );

  }


  return {
    init
  };

})();


document.addEventListener(
  'DOMContentLoaded',
  App.init
);

