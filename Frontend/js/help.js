/**
 * NxLife Zoom Booking System
 * Help
 *
 * Help content is stored separately in:
 * Frontend/help.txt
 */

const Help = (function () {

  let initialized =
    false;

  let loaded =
    false;


  const elements =
    {};


  /* =========================================
     INIT
  ========================================= */

  function init() {

    if (initialized) {

      return;

    }


    cacheElements_();


    if (!elements.modal) {

      return;

    }


    bindEvents_();


    initialized =
      true;

  }


  function cacheElements_() {

    elements.modal =
      document.getElementById(
        'helpModal'
      );


    elements.headerButton =
      document.getElementById(
        'helpButton'
      );


    elements.navButton =
      document.getElementById(
        'navHelpButton'
      );


    elements.closeButton =
      document.getElementById(
        'helpCloseButton'
      );


    elements.loading =
      document.getElementById(
        'helpLoading'
      );


    elements.error =
      document.getElementById(
        'helpError'
      );


    elements.errorMessage =
      document.getElementById(
        'helpErrorMessage'
      );


    elements.retryButton =
      document.getElementById(
        'helpRetryButton'
      );


    elements.content =
      document.getElementById(
        'helpContent'
      );

  }


  function bindEvents_() {

    if (elements.headerButton) {

      elements.headerButton
        .addEventListener(
          'click',
          open
        );

    }


    if (elements.navButton) {

      elements.navButton
        .addEventListener(
          'click',
          open
        );

    }


    elements.closeButton
      .addEventListener(
        'click',
        close
      );


    elements.retryButton
      .addEventListener(
        'click',
        function () {

          loadHelp_(
            true
          );

        }
      );


    elements.modal
      .addEventListener(
        'click',
        function (event) {

          if (
            event.target ===
            elements.modal
          ) {

            close();

          }

        }
      );


    document.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key ===
            'Escape' &&
          !elements.modal
            .classList
            .contains(
              'hidden'
            )
        ) {

          close();

        }

      }
    );

  }


  /* =========================================
     OPEN / CLOSE
  ========================================= */

  async function open() {

    elements.modal
      .classList
      .remove(
        'hidden'
      );


    elements.modal
      .setAttribute(
        'aria-hidden',
        'false'
      );


    document.body
      .classList
      .add(
        'help-open'
      );


    if (!loaded) {

      await loadHelp_();

    }

  }


  function close() {

    elements.modal
      .classList
      .add(
        'hidden'
      );


    elements.modal
      .setAttribute(
        'aria-hidden',
        'true'
      );


    document.body
      .classList
      .remove(
        'help-open'
      );

  }


  /* =========================================
     LOAD TEXT FILE
  ========================================= */

  async function loadHelp_(
    forceReload
  ) {

    if (
      loaded &&
      !forceReload
    ) {

      return;

    }


    showLoading_();


    try {

      const response =
        await fetch(
          'help.txt',
          {
            cache:
              'no-store'
          }
        );


      if (!response.ok) {

        throw new Error(
          'ไม่สามารถโหลดไฟล์คู่มือได้'
        );

      }


      const text =
        await response.text();


      elements.content
        .textContent =
          text.trim() ||
          'ยังไม่มีเนื้อหาคู่มือ';


      loaded =
        true;


      showContent_();

    } catch (error) {

      console.error(
        'Help load error:',
        error
      );


      showError_(
        error.message ||
        'ไม่สามารถโหลดคู่มือได้'
      );

    }

  }


  /* =========================================
     STATUS
  ========================================= */

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


    elements.content
      .classList
      .add(
        'hidden'
      );

  }


  function showContent_() {

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


    elements.content
      .classList
      .remove(
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


    elements.content
      .classList
      .add(
        'hidden'
      );


    elements.errorMessage
      .textContent =
        message;


    elements.error
      .classList
      .remove(
        'hidden'
      );

  }


  document.addEventListener(
    'DOMContentLoaded',
    init
  );


  return {

    init:
      init,

    open:
      open,

    close:
      close

  };

})();